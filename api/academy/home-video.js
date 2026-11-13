import {db,storage} from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
  res.setHeader('Referrer-Policy','no-referrer');
  const r=await db.query('SELECT home_video_gallery_id,home_video_url FROM academy_public_settings ORDER BY id LIMIT 1');
  const row=r.rows[0]||{};
  const mediaId=Number(row.home_video_gallery_id||0);
  if(mediaId){
    const q=await db.query("SELECT storage_key FROM academy_gallery WHERE id=$1 AND media_type='video' AND is_published=true LIMIT 1",[mediaId]);
    if(!q.rows[0]?.storage_key){
      return res.status(404).json({error:'The selected homepage video is not a published MP4/WebM stored in Gallery.'});
    }
    try{
      const destination=await storage.url(q.rows[0].storage_key);
      if(!destination||!destination.startsWith('https://'))throw Error('No signed storage URL');
      return res.redirect(302,destination);
    }catch(err){
      console.error('Homepage video storage unavailable',err?.message||err);
      return res.status(503).json({error:'Video storage is temporarily unavailable.'});
    }
  }
  const direct=String(row.home_video_url||'').trim();
  if(direct){
    try{
      const u=new URL(direct);
      if(u.protocol==='https:'&&/\.(mp4|webm)$/i.test(u.pathname)&&!u.username&&!u.password){
        return res.redirect(302,u.href);
      }
    }catch{}
  }
  return res.status(404).json({error:'No homepage MP4 or WebM video has been selected.'});
}