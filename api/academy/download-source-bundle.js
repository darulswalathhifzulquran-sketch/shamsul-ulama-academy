import { storage } from 'hatchable';
import { guard } from 'lib/academy-auth.js';

// Secure, on-demand ZIP download for the Academy Administrator only.
// All backup bytes are stored privately; there is no public permanent file URL.
export const access='public';
export const methods=['GET'];
const KEY='academy/private-backups/Shamsul_Ulama_Academy_FULL_WEBSITE_FRONTEND_BACKEND_v77.zip';

export default async function(req,res){
 const session=await guard(req,res,['admin']);
 if(!session)return;
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
   const file=await storage.head(KEY);
   if(!file||Number(file.size)<=0)throw Error('Backup object not found');
   // Redirect from a clean first-party URL. Do not share a presigned S3 URL
   // directly: social/chat link wrappers can append query params and break
   // AWS Signature V4, causing the SignatureDoesNotMatch error.
   const url=await storage.url(KEY,{ttl:600});
   if(!url||!/^https:\/\//.test(url))throw Error('Download link unavailable');
   return res.redirect(302,url);
 }catch(err){
   console.error('Private source backup download failed:',String(err?.message||err));
   return res.status(503).json({error:'Backup temporarily unavailable. Please try again.'});
 }
}