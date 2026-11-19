import {db,storage} from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 res.setHeader('Referrer-Policy','no-referrer');
 const id=Number(req.query?.id);
 if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Choose a valid Gallery media ID.'});
 const q=await db.query("SELECT storage_key,media_type FROM academy_gallery WHERE id=$1 AND is_published=true LIMIT 1",[id]);
 const entry=q.rows[0];
 if(!entry?.storage_key||!['image','video'].includes(entry.media_type))return res.status(404).json({error:'Media is unavailable or unpublished.'});
 try{
   // Issue a fresh short-lived storage URL for every browser request.
   // Never persist the temporary signed S3 URL into the homepage.
   const fresh=await storage.url(entry.storage_key);
   if(!fresh||!fresh.startsWith('https://'))throw Error('Storage URL unavailable.');
   return res.redirect(302,fresh);
 }catch(e){
   console.error('Media redirect failure',id,e?.message||e);
   return res.status(503).json({error:'Media is temporarily unavailable. Please retry.'});
 }
}