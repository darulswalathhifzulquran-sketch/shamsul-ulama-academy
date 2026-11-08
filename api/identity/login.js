import {db,verifyPassword,normalizeUsername,validUsername,shaHex,startSession,preventCache,originAllowed} from 'lib/academy-auth.js';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 preventCache(res);
 if(!originAllowed(req))return res.status(403).json({error:'Request rejected.'});
 const username=normalizeUsername(req.body?.username),password=req.body?.password;
 if(!validUsername(username)||typeof password!=='string'||password.length>256)return res.status(401).json({error:'Incorrect username or password.'});
 const throttle=await db.query("SELECT attempts,blocked_until FROM academy_login_throttle_v2 WHERE username=$1 LIMIT 1",[username]);
 if(throttle.rows[0]?.blocked_until&&new Date(throttle.rows[0].blocked_until)>new Date())return res.status(429).json({error:'Too many attempts. Try again later.'});
 const query=await db.query("SELECT id,username,display_name,role,password_salt,password_hash,password_iterations,active FROM academy_accounts_v2 WHERE username=$1 LIMIT 1",[username]);
 const row=query.rows[0];
 // Run a comparable PBKDF2 even for an unknown user to reduce timing-based discovery.
 const fake={password_salt:'6bf1a6974dd2844c3d3a8fb7b6aba5fa',password_hash:'b9'.repeat(32),password_iterations:310000};
 const correct=await verifyPassword(password,row||fake);
 if(!row||!row.active||!correct){
   await db.query("INSERT INTO academy_login_throttle_v2(username,attempts,first_failure_at,updated_at,blocked_until) VALUES($1,1,now(),now(),null) ON CONFLICT(username) DO UPDATE SET attempts=CASE WHEN academy_login_throttle_v2.first_failure_at<now()-interval '15 minutes' THEN 1 ELSE academy_login_throttle_v2.attempts+1 END,first_failure_at=CASE WHEN academy_login_throttle_v2.first_failure_at<now()-interval '15 minutes' THEN now() ELSE academy_login_throttle_v2.first_failure_at END,blocked_until=CASE WHEN academy_login_throttle_v2.first_failure_at>=now()-interval '15 minutes' AND academy_login_throttle_v2.attempts>=4 THEN now()+interval '15 minutes' ELSE null END,updated_at=now()",[username]);
   return res.status(401).json({error:'Incorrect username or password.'});
 }
 await db.query("DELETE FROM academy_login_throttle_v2 WHERE username=$1",[username]);
 const created=await startSession(res,row.id);
 res.json({ok:true,username:row.username,display_name:row.display_name,role:row.role,csrf:created.csrf});
}