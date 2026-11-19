import {guard,audit} from 'lib/academy-auth.js';
import {db,storage} from 'hatchable';
export const access='public';
export const methods=['GET','PUT','DELETE'];
const sections=new Set(['gallery']);
const validSlot=value=>Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=5?Number(value):null;

export default async function(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');

 if(req.method==='GET'){
  const result=await db.query(
   "SELECT c.section,c.position,c.sort_order,c.gallery_id,c.title,c.description,g.media_type,g.caption,g.alt_text,g.image_url,g.storage_key FROM academy_home_showcase c JOIN academy_gallery g ON g.id=c.gallery_id AND g.is_published=true WHERE c.section='gallery' ORDER BY c.sort_order,c.position");
  const cards=await Promise.all(result.rows.map(async row=>{
    let src=row.image_url||'';
    if(row.storage_key){try{src=await storage.url(row.storage_key,{ttl:3600});}catch(e){src='';console.warn('Academy showcase media unavailable',row.gallery_id)}}
    const {storage_key,image_url,...safe}=row;
    return {...safe,media_url:src};
  }));
  return res.json({cards,limit_per_section:5});
 }

 const a=await guard(req,res,['admin','usthad'],true);
 if(!a)return;
 const section=String(req.body?.section||'');
 const position=validSlot(req.body?.position);
 if(!sections.has(section)||!position)return res.status(400).json({error:'Choose Homepage Gallery and a card position from 1 to 5.'});

 if(req.method==='DELETE'||req.body?.gallery_id===null){
  const del=await db.query('DELETE FROM academy_home_showcase WHERE section=$1 AND position=$2 RETURNING position',[section,position]);
  await audit(a.user.id,'homepage.showcase_remove','home_showcase',section+':'+position);
  return res.json({ok:true,section,position,removed:true,existed:del.rows.length>0});
 }

 const operation=String(req.body?.operation||'');
 if(operation==='move'){
  const direction=String(req.body?.direction||'');
  if(!['up','down'].includes(direction))return res.status(400).json({error:'Move direction must be up or down.'});
  const rows=(await db.query('SELECT position,sort_order FROM academy_home_showcase WHERE section=$1 ORDER BY sort_order,position',[section])).rows;
  const index=rows.findIndex(x=>Number(x.position)===position);
  const target=index+(direction==='up'?-1:1);
  if(index<0||target<0||target>=rows.length)return res.status(400).json({error:'No card to move in that direction.'});
  const one=rows[index],two=rows[target];
  // Reassign unique ordering in ONE statement, no primary key changes.
  await db.query('UPDATE academy_home_showcase SET sort_order=CASE WHEN position=$2::integer THEN $4::integer WHEN position=$3::integer THEN $5::integer ELSE sort_order END,updated_at=NOW() WHERE section=$1 AND position IN ($2::integer,$3::integer)',[section,Number(one.position),Number(two.position),Number(two.sort_order),Number(one.sort_order)]);
  await audit(a.user.id,'homepage.showcase_move','home_showcase',section+':'+position);
  return res.json({ok:true,moved:true,section,position,other_position:Number(two.position)});
 }
 if(operation) return res.status(400).json({error:'Unknown Homepage card action.'});

 const mediaId=Number(req.body?.gallery_id);
 if(!Number.isSafeInteger(mediaId)||mediaId<1)return res.status(400).json({error:'Choose an approved Academy photo/video first.'});
 const title=String(req.body?.title||'').trim(),description=String(req.body?.description||'').trim();
 if(title.length>100||description.length>220)return res.status(400).json({error:'Title must be 100 characters or less; description 220 or less.'});
 const found=(await db.query("SELECT id FROM academy_gallery WHERE id=$1 AND is_published=true AND media_type IN ('image','video')",[mediaId])).rows[0];
 if(!found)return res.status(400).json({error:'This photo/video has not been approved. Approve it in Media Library first.'});
 const saved=await db.query(
  "INSERT INTO academy_home_showcase(section,position,gallery_id,title,description,sort_order,updated_at) VALUES($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(sort_order),0)+1 FROM academy_home_showcase WHERE section=$1),NOW()) ON CONFLICT(section,position) DO UPDATE SET gallery_id=EXCLUDED.gallery_id,title=EXCLUDED.title,description=EXCLUDED.description,updated_at=NOW() RETURNING gallery_id,title,description,sort_order",
  [section,position,mediaId,title,description]);
 const verified=saved.rows[0];
 await audit(a.user.id,'homepage.showcase_save','home_showcase',section+':'+position);
 return res.json({ok:true,verified:!!verified&&Number(verified.gallery_id)===mediaId&&verified.title===title&&verified.description===description,section,position,gallery_id:mediaId,sort_order:verified?.sort_order});
}