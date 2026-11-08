import {db,makePassword,validPassword,normalizeUsername,preventCache,originAllowed,audit} from 'lib/academy-auth.js';
export const access='admin';
export const methods=['POST'];
// Owner-only emergency recovery. Hatchable's platform checks project admin/owner
// BEFORE running this route. Ordinary academy Student/Parent/Usthad sessions
// cannot access it, even if they know the URL.
export default async function(req,res){
 preventCache(res);
 if(!originAllowed(req))return res.status(403).json({error:'Cross-site request rejected.'});
 const requested=normalizeUsername(req.body?.username);
 const password=req.body?.new_password;
 if(!validPassword(password))return res.status(400).json({error:'Use a strong password of 12–128 characters with letters and numbers.'});
 const found=await db.query("SELECT id,username FROM academy_accounts_v2 WHERE role='admin' AND active=true LIMIT 1");
 if(!found.rows.length)return res.status(409).json({error:'Administrator account is not initialized. Use owner setup instead.'});
 const admin=found.rows[0];
 if(requested!==admin.username)return res.status(400).json({error:'Administrator username does not match.'});
 const p=await makePassword(password);
 await db.transaction([
 {sql:"UPDATE academy_accounts_v2 SET password_salt=$1,password_hash=$2,password_iterations=$3,must_change_password=false,failed_attempts=0,locked_until=null,updated_at=now() WHERE id=$4 AND role='admin'",params:[p.salt,p.hash,p.iterations,admin.id]},
 {sql:"DELETE FROM academy_sessions_v2 WHERE account_id=$1",params:[admin.id]},
 {sql:"DELETE FROM academy_login_throttle_v2 WHERE username=$1",params:[admin.username]}
 ]);
 await audit(admin.id,'admin.owner_recovery','account',admin.id);
 return res.json({ok:true,username:admin.username,message:'Administrator password changed and old sessions revoked. Sign in with your new private password.'});
}
