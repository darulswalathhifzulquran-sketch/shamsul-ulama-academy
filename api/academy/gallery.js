import {guard,audit} from '../../lib/academy-auth.js';
import {storage,db} from '../../lib/academy-runtime.js';
export const access='public';
export const methods=['GET','POST','PUT','DELETE'];

const MAX_BYTES=16*1024*1024; // Runtime buffers entire upload: protect the 128 MB function heap.
const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
function embedVideo(input){
 try{
  const u=new URL(String(input||'').trim());
  if(u.protocol!=='https:')return null;
  const h=u.hostname.toLowerCase();
  let id='';
  if(h==='youtu.be')id=u.pathname.split('/')[1]||'';
  else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(h)){
   const parts=u.pathname.split('/').filter(Boolean);
   id=parts[0]==='watch'?u.searchParams.get('v')||'':(['shorts','live','embed'].includes(parts[0])?parts[1]||'':'');
  }
  if(/^[A-Za-z0-9_-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(h)){
   const v=u.pathname.split('/').filter(Boolean).find(x=>/^\d{5,15}$/.test(x));
   if(v)return 'https://player.vimeo.com/video/'+v;
  }
 }catch{}
 return null;
}
function supportedMedia(file){
 const b=file.buffer||[],mime=String(file.contentType||'').toLowerCase();
 if(mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255)return {type:'image',ext:'jpg'};
 if(mime==='image/png'&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return {type:'image',ext:'png'};
 const ascii=(start,end)=>String.fromCharCode(...Array.from(b.slice(start,end)));
 if(mime==='image/webp'&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return {type:'image',ext:'webp'};
 if(mime==='video/mp4'&&ascii(4,8)==='ftyp')return {type:'video',ext:'mp4'};
 if(mime==='video/webm'&&b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163)return {type:'video',ext:'webm'};
 return null;
}
export default async function(req,res){
 if(req.method==='GET'){
  const manage=req.query?.manage==='1';
  if(manage){const a=await guard(req,res,['admin','usthad']);if(!a)return;}
  const r=await db.query(manage?
   "SELECT id,image_url,storage_key,media_type,caption,alt_text,display_order,is_published,created_at FROM academy_gallery ORDER BY display_order,id":
   "SELECT id,image_url,storage_key,media_type,caption,alt_text,display_order FROM academy_gallery WHERE is_published=true ORDER BY display_order,id");
  const gallery=await Promise.all(r.rows.map(async row=>{
   let url=row.image_url;
   if(row.storage_key){try{url=await storage.url(row.storage_key);}catch(e){console.warn('Gallery signed URL unavailable',row.id);}}
   const {storage_key,...safe}=row;
   return {...safe,image_url:url};
  }));
  res.setHeader('Cache-Control','no-store');
  return res.json({gallery});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 if(req.method==='PUT'){
  const id=validId(req.body?.id),published=req.body?.is_published;
  if(!id||typeof published!=='boolean')return res.status(400).json({error:'Choose a valid gallery item and publication status.'});
  const r=await db.query('UPDATE academy_gallery SET is_published=$2 WHERE id=$1 RETURNING id,is_published',[id,published]);
  if(!r.rows.length)return res.status(404).json({error:'Media not found.'});
  await audit(a.user.id,published?'gallery.publish':'gallery.unpublish','gallery',id);
  return res.json({ok:true,id,is_published:published});
 }
 if(req.method==='DELETE'){
  if(req.body?.permanently_delete!==true)
   return res.status(400).json({error:'Explicit permanent deletion action is required.'});
  const id=validId(req.body?.id);if(!id)return res.status(400).json({error:'Invalid gallery item.'});
  const found=await db.query('SELECT id,storage_key FROM academy_gallery WHERE id=$1 LIMIT 1',[id]);
  if(!found.rows.length)return res.status(404).json({error:'Gallery item no longer exists.'});
  const key=found.rows[0].storage_key;
  if(key){
   // Do not remove the DB row or claim permanent deletion unless storage accepted
   // the deletion too. Keep the DB record for retry if S3 fails.
   try{
    await storage.del(key);
    try{
     const after=await storage.head(key);
     if(after)return res.status(502).json({error:'File still exists in storage; deletion not complete. Try again.'});
    }catch(e){
     if(!/404|not.found|no.such.key|does not exist/i.test(String(e?.message||'')))throw e;
    }
   }catch(e){
    console.error('Gallery object removal failed',e?.message||e);
    return res.status(502).json({error:'Permanent file removal could not be confirmed; item was NOT removed from the gallery database.'});
   }
  }
  const gone=await db.query('DELETE FROM academy_gallery WHERE id=$1 RETURNING id',[id]);
  if(!gone.rows.length)return res.status(409).json({error:'Media record changed; refresh and retry.'});
  const verify=await db.query('SELECT id FROM academy_gallery WHERE id=$1',[id]);
  if(verify.rows.length)return res.status(500).json({error:'Deletion was not verified.'});
  try{await audit(a.user.id,'gallery.permanent_delete','gallery',id);}
  catch(e){console.error('Gallery delete audit error',e?.message||e);}
  return res.json({ok:true,deleted_id:id,verified:true,storage_removed:!!key,permanently_deleted:true});
 }
 const caption=String(req.body?.caption||'').trim(),alt=String(req.body?.alt_text||'').trim(),published=String(req.body?.is_published||'')==='true',order=Number(req.body?.display_order||0);
 if(!['on','true'].includes(String(req.body?.rights_confirmed||'')))return res.status(400).json({error:'Confirm you own the media or have permission to publish it.'});
 if(caption.length>250||alt.length>250||!Number.isSafeInteger(order)||order<0||order>100000)return res.status(400).json({error:'Check caption, description and order.'});
 const file=(req.files||[]).find(f=>f.field==='file'&&f.buffer?.length>0&&f.filename);
 const linked=String(req.body?.video_url||'').trim();
 if((!!file)===(!!linked))return res.status(400).json({error:'Choose either one photo/video file OR a YouTube/Vimeo video link.'});
 let url,storageKey=null,type='image';
 if(linked){
  if(linked.length>2000)return res.status(400).json({error:'Media link is too long.'});
  const embed=embedVideo(linked);
  if(embed){url=embed;type='video';}
  else{
   try{
    const u=new URL(linked);
    if(u.protocol!=='https:'||!u.hostname||u.username||u.password)throw Error('HTTPS required');
    const extension=u.pathname.toLowerCase();
    if(/\.(jpe?g|png|webp|gif|avif)$/.test(extension))type='image';
    else if(/\.(mp4|webm)$/.test(extension))type='video';
    else throw Error('Unsupported media URL');
    url=u.href;
   }catch{return res.status(400).json({error:'Paste a secure HTTPS direct photo/video URL ending .jpg/.png/.webp/.gif/.avif/.mp4/.webm, or a YouTube/Vimeo video link.'});}
  }
 }else{
  if(!file.buffer||!file.buffer.length)return res.status(400).json({error:'The selected file is empty.'});
  if(file.buffer.length>MAX_BYTES)return res.status(413).json({error:'This hosting environment accepts direct uploads up to 16 MB. For large videos paste a YouTube/Vimeo link; large photos are automatically optimized in the browser.'});
  const format=supportedMedia(file);
  if(!format)return res.status(415).json({error:'Supported files: JPEG, PNG, WebP, MP4 or WebM. Please use MP4 for videos from iPhone.'});
  type=format.type;
  storageKey='academy/gallery/'+crypto.randomUUID()+'.'+format.ext;
  try{url=await storage.put(storageKey,file.buffer,file.contentType);}
  catch(e){console.error('Gallery storage upload failed',e?.message||e);return res.status(503).json({error:'Media storage failed. Try an optimized photo or a video link.'});}
 }
 try{
  const r=await db.query('INSERT INTO academy_gallery(image_url,storage_key,media_type,caption,alt_text,display_order,is_published) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[url,storageKey,type,caption,alt||caption,order,published]);
  await audit(a.user.id,'gallery.upload','gallery',r.rows[0].id);
  return res.status(201).json({ok:true,id:r.rows[0].id,media_type:type,is_published:published});
 }catch(e){
  if(storageKey)await storage.del(storageKey).catch(()=>{});
  throw e;
 }
}