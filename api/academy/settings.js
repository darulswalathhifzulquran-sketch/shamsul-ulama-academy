import {db,guard,getAccount,audit} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
const keys=['academy_name','subtitle','address','affiliation','affiliation_place','affiliation_url','phone1','phone2','office_hours','email','maps_url','about','vision','huffaz_count','students_count','batches_count','service_years','theme_style','home_heading','home_message','home_photo_url','home_video_url','home_video_gallery_id'];
export default async function(req,res){
 if(req.method==='GET'){
  const r=await db.query('SELECT '+keys.join(',')+' FROM academy_public_settings WHERE id=1');
  res.setHeader('Cache-Control','no-store');return res.json({settings:r.rows[0]||null});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 const data={};
 for(const key of keys){
  const v=req.body?.[key];if(v===undefined)continue;
  if(key==='home_video_gallery_id'){const id=v===''||v===null?null:Number(v);if(id!==null&&(!Number.isSafeInteger(id)||id<1))return res.status(400).json({error:'Select a valid homepage gallery video.'});data[key]=id;}
  else if(key.endsWith('_count')||key==='service_years'){if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000000)return res.status(400).json({error:'Invalid achievement count.'});data[key]=Number(v);}
  else {const value=String(v??'').trim();if(value.length>(['about','vision','home_message'].includes(key)?1600:300))return res.status(400).json({error:'Field too long: '+key});data[key]=value;}
 }
 if(data.home_photo_url && !(/^(https:\/\/[^\s"'<>]+|\/assets\/[a-zA-Z0-9._/-]+)$/.test(data.home_photo_url)))return res.status(400).json({error:'Home image must be a secure HTTPS URL or approved academy asset.'});
 if(data.home_video_url && !(/^https:\/\/[^\s\"'<>]+$/i.test(data.home_video_url)))return res.status(400).json({error:'Use a direct HTTPS MP4/WebM video URL.'});
 if(data.home_video_url && !/\.(mp4|webm)(\?.*)?$/i.test(data.home_video_url))return res.status(400).json({error:'Homepage video must be a direct MP4 or WebM link, not a YouTube watch page.'});
 if(data.theme_style&&!['classic','heritage','minimal'].includes(data.theme_style))return res.status(400).json({error:'Choose an available theme.'});
 if(data.maps_url&&!/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|google\.com\/maps)/.test(data.maps_url))return res.status(400).json({error:'Use a valid Google Maps URL.'});
 if(data.affiliation_url&&!/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(data.affiliation_url))return res.status(400).json({error:'Affiliation URL must use HTTPS.'});
 if(data.home_video_gallery_id){const m=await db.query("SELECT id FROM academy_gallery WHERE id=$1 AND media_type='video' AND is_published=true",[data.home_video_gallery_id]);if(!m.rows.length)return res.status(400).json({error:'Publish the chosen video in Gallery before using it on the homepage.'});}
 if(!Object.keys(data).length)return res.status(400).json({error:'No changes supplied.'});
 const fields=Object.keys(data),sql='UPDATE academy_public_settings SET '+fields.map((k,i)=>k+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=1';
 await db.query(sql,fields.map(k=>data[k]));await audit(a.user.id,'settings.update','settings','1');
 res.json({ok:true});
}