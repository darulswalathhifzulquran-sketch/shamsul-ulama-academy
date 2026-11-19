import {getAccount,csrfFromToken,preventCache,refreshSessionCookie} from 'lib/academy-auth.js';
export const access='public';
export const methods=['GET'];
export default async function(req,res){preventCache(res);const s=await getAccount(req);if(!s)return res.status(401).json({error:'Sign in required.'});refreshSessionCookie(res,s.token);res.json({authenticated:true,account:{id:s.user.id,username:s.user.username,display_name:s.user.display_name,role:s.user.role,must_change_password:s.user.must_change_password},csrf:await csrfFromToken(s.token)});}