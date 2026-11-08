import {db,guard,getAccount,audit} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
const keys=['academy_name','subtitle','address','affiliation','affiliation_place','affiliation_url','phone1','phone2','office_hours','email','maps_url','about','vision','huffaz_count','students_count','batches_count','service_years','theme_style'];
export default async function(req,res){
 if(req.method==='GET'){
  const r=await db.query('SELECT '+keys.join(',')+' FROM academy_public_settings WHERE id=1');
  res.setHeader('Cache-Control','public,max-age=60');return res.json({settings:r.rows[0]||null});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 const data={};
 for(const key of keys){
  const v=req.body?.[key];if(v===undefined)continue;
  if(key.endsWith('_count')||key==='service_years'){if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>1000000)return res.status(400).json({error:'Invalid achievement count.'});data[key]=Number(v);}
  else {const value=String(v??'').trim();if(value.length>(['about','vision'].includes(key)?1600:300))return res.status(400).json({error:'Field too long: '+key});data[key]=value;}
 }
 if(data.theme_style&&!['classic','heritage','minimal'].includes(data.theme_style))return res.status(400).json({error:'Choose an available theme.'});
 if(data.maps_url&&!/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|google\.com\/maps)/.test(data.maps_url))return res.status(400).json({error:'Use a valid Google Maps URL.'});
 if(data.affiliation_url&&!/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(data.affiliation_url))return res.status(400).json({error:'Affiliation URL must use HTTPS.'});
 if(!Object.keys(data).length)return res.status(400).json({error:'No changes supplied.'});
 const fields=Object.keys(data),sql='UPDATE academy_public_settings SET '+fields.map((k,i)=>k+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=1';
 await db.query(sql,fields.map(k=>data[k]));await audit(a.user.id,'settings.update','settings','1');
 res.json({ok:true});
}