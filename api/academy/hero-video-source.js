import {db,storage} from 'hatchable';
export const access='public';
export const methods=['GET'];

// Source URL is minted just before playback, never copied from stale Gallery HTML.
// Accepts only currently selected, approved video assets.
export default async function(req,res){
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 res.setHeader('X-Content-Type-Options','nosniff');
 const device=String(req.query?.device||'desktop')==='mobile'?'mobile':'desktop';
 const row=(await db.query('SELECT home_video_gallery_id,home_mobile_video_gallery_id FROM academy_public_settings WHERE id=1 LIMIT 1')).rows[0]||{};
 const primary=device==='mobile'?Number(row.home_mobile_video_gallery_id||0):Number(row.home_video_gallery_id||0);
 const desktop=Number(row.home_video_gallery_id||0);
 const id=primary||desktop;
 if(!id)return res.status(404).json({error:'No homepage video selected.'});
 const video=(await db.query("SELECT id,storage_key FROM academy_gallery WHERE id=$1 AND is_published=true AND media_type='video' LIMIT 1",[id])).rows[0];
 if(!video?.storage_key)return res.status(404).json({error:'Selected video is not approved for website use.',selected_id:id});
 try{
   const link=await storage.url(video.storage_key,{ttl:3600});
   if(!link||!link.startsWith('https://'))throw Error('No playable storage address');
   return res.json({ok:true,id,device,source:'uploaded_mp4',url:link,content_type:'video/mp4'});
 }catch(err){
   console.error('Homepage video source unavailable',id,err?.message||err);
   return res.status(503).json({error:'Video storage temporarily unavailable.'});
 }
}