import {db,guard,getAccount,audit} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
const keys=['academy_name','subtitle','address','affiliation','affiliation_place','affiliation_url','phone1','phone2','office_hours','email','maps_url','about','vision','huffaz_count','students_count','batches_count','service_years','theme_style','home_heading','home_message','home_photo_url','home_video_url','home_video_gallery_id','home_mobile_video_gallery_id','topbar_enabled','topbar_message','topbar_link_label','topbar_link_path'];
export default async function(req,res){
 if(req.method==='GET'){
  const r=await db.query('SELECT '+keys.join(',')+' FROM academy_public_settings WHERE id=1');
  res.setHeader('Cache-Control','no-store');return res.json({settings:r.rows[0]||null});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 const data={};
 for(const key of keys){
  const v=req.body?.[key];if(v===undefined)continue;
  if(key==='topbar_enabled'){
    if(typeof v!=='boolean'&&v!=='true'&&v!=='false')return res.status(400).json({error:'Choose whether to show or hide the top announcement bar.'});
    data[key]=v===true||v==='true';
  }
  else if(key==='topbar_message'||key==='topbar_link_label'){
    const message=String(v??'').trim();
    if(message.length>(key==='topbar_message'?120:32))return res.status(400).json({error:key==='topbar_message'?'Announcement text must be 120 characters or less.':'Announcement link label must be 32 characters or less.'});
    data[key]=message;
  }
  else if(key==='topbar_link_path'){
    const path=String(v??'').trim();
    if(!['','/','/about','/college-features','/programmes','/gallery','/admission','/contact'].includes(path))return res.status(400).json({error:'Choose an approved internal Academy page for the announcement link.'});
    data[key]=path;
  }
  else if(key==='home_video_gallery_id'||key==='home_mobile_video_gallery_id'){const id=v===''||v===null?null:Number(v);if(id!==null&&(!Number.isSafeInteger(id)||id<1))return res.status(400).json({error:'Select a valid '+(key==='home_mobile_video_gallery_id'?'mobile':'desktop')+' homepage gallery video.'});data[key]=id;}
  else if(key.endsWith('_count')||key==='service_years'){if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000000)return res.status(400).json({error:'Invalid achievement count.'});data[key]=Number(v);}
  else {const value=String(v??'').trim();if(value.length>(['about','vision','home_message'].includes(key)?1600:300))return res.status(400).json({error:'Field too long: '+key});data[key]=value;}
 }
 if(data.topbar_enabled===true&&data.topbar_message==='')return res.status(400).json({error:'Enter an announcement message or hide the top bar.'});
 if(data.home_photo_url && !(/^(https:\/\/[^\s"'<>]+|\/assets\/[a-zA-Z0-9._/-]+)$/.test(data.home_photo_url)))return res.status(400).json({error:'Home image must be a secure HTTPS URL or approved academy asset.'});
 if(data.home_video_url && !(/^https:\/\/[^\s\"'<>]+$/i.test(data.home_video_url)))return res.status(400).json({error:'Use a direct HTTPS MP4/WebM video URL.'});
 if(data.home_video_url && !/\.(mp4|webm)(\?.*)?$/i.test(data.home_video_url))return res.status(400).json({error:'Homepage video must be a direct MP4 or WebM link, not a YouTube watch page.'});
 if(data.theme_style&&!['classic','heritage','minimal'].includes(data.theme_style))return res.status(400).json({error:'Choose an available theme.'});
 if(data.maps_url&&!/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|google\.com\/maps)/.test(data.maps_url))return res.status(400).json({error:'Use a valid Google Maps URL.'});
 if(data.affiliation_url&&!/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(data.affiliation_url))return res.status(400).json({error:'Affiliation URL must use HTTPS.'});
 for(const id of [data.home_video_gallery_id,data.home_mobile_video_gallery_id]){if(!id)continue;const m=await db.query("SELECT id,storage_key FROM academy_gallery WHERE id=$1 AND media_type='video' AND is_published=true",[id]);if(!m.rows.length||!m.rows[0].storage_key)return res.status(400).json({error:'Choose a published, directly uploaded MP4/WebM video for the homepage. YouTube embeds are not supported for device-specific videos.'});}
 if(!Object.keys(data).length)return res.status(400).json({error:'No changes supplied.'});
 const fields=Object.keys(data),sql='UPDATE academy_public_settings SET '+fields.map((k,i)=>k+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=1';
 await db.query(sql,fields.map(k=>data[k]));await audit(a.user.id,'settings.update','settings','1');
 res.json({ok:true});
}