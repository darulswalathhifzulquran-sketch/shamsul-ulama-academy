import {getAccount} from '../lib/academy-auth.js';
import {documentHtml} from '../lib/academy-dashboard-document.js';
export const access='public';export const methods=['GET'];
export default async function(req,res){
 const session=await getAccount(req);
 if(!session)return res.redirect('/login?next=/dashboard');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('X-Frame-Options','DENY');
 return res.send(documentHtml);
}