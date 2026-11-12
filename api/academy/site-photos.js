import {storage,db} from 'hatchable';
import {guard,audit,preventCache} from 'lib/academy-auth.js';
export const access='public';
export const methods=['GET','POST','DELETE'];

const SLOTS=['hero','school','tuition'];
const MAX_BYTES=16*1024*1024;
function mediaType(file){
 const b=file.buffer||[],mime=String(file.contentType||'').toLowerCase();
 if(mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255)return 'jpg';
 if(mime==='image/png'&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'png';
 if(mime==='image/webp'&&String.fromCharCode(...Array.from(b.slice(0,4)))==='RIFF'&&String.fromCharCode(...Array.from(b.slice(8,12)))==='WEBP')return 'webp';
 return null;
}
export default async function(req,res){
 preventCache(res);
 if(req.method==='GET'){
  const results=await db.query('SELECT slot,storage_key,alt_text,updated_at FROM academy_site_photos ORDER BY slot');
  const photos={hero:null,school:null,tuition:null};
  for(const row of results.rows){
   try{photos[row.slot]={url:await storage.url(row.storage_key),alt_text:row.alt_text||'',updated_at:row.updated_at};}
   catch(e){console.warn('Site photo unavailable',row.slot);photos[row.slot]=null;}
  }
  return res.json({photos});
 }
 const a=await guard(req,res,['admin','usthad'],true);
 if(!a)return;
 const slot=String(req.body?.slot||'');
 if(!SLOTS.includes(slot))return res.status(400).json({error:'Choose an available website photo position.'});
 if(req.method==='DELETE'){
  if(req.body?.confirmed!==true)return res.status(400).json({error:'Confirm removal of the website photo.'});
  const old=await db.query('DELETE FROM academy_site_photos WHERE slot=$1 RETURNING storage_key',[slot]);
  if(old.rows[0]?.storage_key){try{await storage.del(old.rows[0].storage_key);}catch(e){console.warn('Previous photo cleanup pending',slot);}}
  await audit(a.user.id,'site_photo.remove','site_photo',slot);
  return res.json({ok:true,removed:!!old.rows.length,slot});
 }
 if(String(req.body?.rights_confirmed||'')!=='true')return res.status(400).json({error:'Confirm permission to publish this photograph.'});
 const file=(req.files||[]).find(f=>f.field==='file'&&f.buffer?.length>0);
 if(!file)return res.status(400).json({error:'Select a real Academy photograph using the Phone Gallery or Computer Files picker.'});
 if(file.buffer.length>MAX_BYTES)return res.status(413).json({error:'Photo is over 16 MB. Please choose a smaller image.'});
 const ext=mediaType(file);
 if(!ext)return res.status(415).json({error:'Choose a JPG, PNG or WebP photograph.'});
 const alt=String(req.body?.alt_text||'').trim().slice(0,200)||({hero:'Shamsul Ulama Islamic Academy campus',school:'Academy school classroom',tuition:'Academy extra tuition classroom'}[slot]);
 const key='academy/site-photos/'+slot+'/'+crypto.randomUUID()+'.'+ext;
 let url;
 try{url=await storage.put(key,file.buffer,file.contentType);}
 catch(e){console.error('Photo storage failed',e?.message||e);return res.status(503).json({error:'Photo storage is unavailable. The old website photo was not changed.'});}
 try{
  const previous=await db.query('SELECT storage_key FROM academy_site_photos WHERE slot=$1',[slot]);
  await db.query(`INSERT INTO academy_site_photos(slot,storage_key,photo_url,content_type,original_filename,file_bytes,updated_by,alt_text,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()) ON CONFLICT(slot) DO UPDATE SET
    storage_key=EXCLUDED.storage_key,photo_url=EXCLUDED.photo_url,
    content_type=EXCLUDED.content_type,original_filename=EXCLUDED.original_filename,
    file_bytes=EXCLUDED.file_bytes,updated_by=EXCLUDED.updated_by,
    alt_text=EXCLUDED.alt_text,updated_at=now()`,[slot,key,url,file.contentType,String(file.filename||'academy-photo').slice(0,180),file.buffer.length,a.user.id,alt]);
  await audit(a.user.id,'site_photo.upload','site_photo',slot);
  const oldKey=previous.rows[0]?.storage_key;
  if(oldKey&&oldKey!==key){try{await storage.del(oldKey);}catch(e){console.warn('Old site photo cleanup pending',slot);}}
  return res.status(201).json({ok:true,slot,alt_text:alt});
 }catch(e){
  try{await storage.del(key);}catch(err){console.warn('New photo cleanup pending',slot);}
  console.error('Site photo save failed',e?.message||e);
  return res.status(500).json({error:'Photo could not be saved to the Academy database. Existing photo remains unchanged.'});
 }
}