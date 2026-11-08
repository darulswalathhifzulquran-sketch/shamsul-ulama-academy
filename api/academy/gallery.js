import {guard,getAccount,audit} from 'lib/academy-auth.js';
import { storage, db } from 'hatchable';
export const access='public';export const methods=['GET','POST','DELETE'];
export default async function(req,res){
 if(req.method==='GET'){
   const isAdmin=req.query?.manage==='1';
   if(isAdmin){const a=await guard(req,res,['admin','usthad']);if(!a)return;}
   const r=await db.query(isAdmin?
   "SELECT id,image_url,caption,alt_text,display_order,is_published,created_at FROM academy_gallery ORDER BY display_order,id LIMIT 120":
   "SELECT id,image_url,caption,alt_text,display_order FROM academy_gallery WHERE is_published=true ORDER BY display_order,id LIMIT 120");
   res.setHeader('Cache-Control',isAdmin?'no-store':'public,max-age=60');return res.json({gallery:r.rows});
 }
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 if(req.method==='DELETE'){
   const item=Number(req.body?.id);if(!Number.isSafeInteger(item)||item<1)return res.status(400).json({error:'Invalid image.'});
   const r=await db.query('DELETE FROM academy_gallery WHERE id=$1 RETURNING storage_key',[item]);
   if(!r.rows.length)return res.status(404).json({error:'Image not found.'});
   if(r.rows[0].storage_key)await storage.del(r.rows[0].storage_key).catch(()=>{});
   await audit(a.user.id,'gallery.remove','gallery',item);return res.json({ok:true});
 }
 const caption=String(req.body?.caption||'').trim(),alt=String(req.body?.alt_text||'').trim(),published=String(req.body?.is_published||'')==='true',order=Number(req.body?.display_order||0);
 if(String(req.body?.rights_confirmed||'')!=='on'&&String(req.body?.rights_confirmed||'')!=='true')return res.status(400).json({error:'Confirm publication rights and that the image has no watermark.'});
 if(caption.length>250||alt.length>250||!Number.isSafeInteger(order)||order<0||order>100000)return res.status(400).json({error:'Check caption, image description and order.'});
 const file=(req.files||[]).find(f=>f.field==='file');
 if(!file)return res.status(400).json({error:'Choose a JPEG, PNG or WebP image.'});
 if(file.buffer.length>4*1024*1024)return res.status(413).json({error:'Image limit is 4 MB.'});
 const b=file.buffer,mime=file.contentType;
 const valid=(mime==='image/jpeg'&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)||(mime==='image/png'&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)||(mime==='image/webp'&&b.length>12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP');
 if(!valid)return res.status(415).json({error:'Unsupported or invalid image bytes.'});
 const ext=mime==='image/jpeg'?'jpg':mime==='image/png'?'png':'webp',key='academy/gallery/'+crypto.randomUUID()+'.'+ext;
 await storage.put(key,b,mime);
 const permanent=await storage.urlPermanent(key);
 const r=await db.query('INSERT INTO academy_gallery(image_url,storage_key,caption,alt_text,display_order,is_published) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[permanent,key,caption,alt||caption,order,published]);
 await audit(a.user.id,'gallery.upload','gallery',r.rows[0].id);res.status(201).json({ok:true,id:r.rows[0].id});
}