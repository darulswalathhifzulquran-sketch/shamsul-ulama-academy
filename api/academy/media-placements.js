import {db,guard,audit} from 'lib/academy-auth.js';
export const access='public';
export const methods=['GET','POST'];
const SLOT_TYPES={
 home_fallback:'image',home_section:'image',about_quran:'image',scholar_home:'image',
 scholar_profile:'image',brand_logo:'image',learner_illustration:'image',feature_1:'image',feature_2:'image',feature_3:'image',feature_4:'image',learning_school:'image',learning_tuition:'image',learning_balance:'image',learning_habits:'image'
};
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET'){
  const r=await db.query('SELECT slot,gallery_id FROM academy_media_placements ORDER BY slot');
  return res.json({placements:Object.fromEntries(r.rows.map(x=>[x.slot,x.gallery_id]))});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 const slot=String(req.body?.slot||'');
 if(!Object.hasOwn(SLOT_TYPES,slot))return res.status(400).json({error:'Unknown website image position.'});
 const raw=req.body?.gallery_id;
 const galleryId=raw===null?null:Number(raw);
 if(galleryId!==null&&(!Number.isSafeInteger(galleryId)||galleryId<1))return res.status(400).json({error:'Select an uploaded gallery photo or remove the existing assignment.'});
 if(galleryId!==null){
   const m=await db.query('SELECT id FROM academy_gallery WHERE id=$1 AND media_type=$2 AND is_published=true',[galleryId,SLOT_TYPES[slot]]);
   if(!m.rows.length)return res.status(400).json({error:'Choose a published Gallery photo for this website position.'});
 }
 await db.query('INSERT INTO academy_media_placements(slot,gallery_id,updated_at) VALUES($1,$2,now()) ON CONFLICT(slot) DO UPDATE SET gallery_id=excluded.gallery_id,updated_at=now()',[slot,galleryId]);
 await audit(a.user.id,'media.placement_update','media_slot',slot);
 return res.json({ok:true,slot,gallery_id:galleryId});
}