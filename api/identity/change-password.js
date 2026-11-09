import {db,guard,verifyPassword,makePassword,validPassword,audit} from '../../lib/academy-auth.js';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 const s=await guard(req,res,[],true);if(!s)return;
 const before=String(req.body?.current_password||''),after=req.body?.new_password;
 if(!validPassword(after)||after===before)return res.status(400).json({error:'Choose a different password of 12–128 characters, with letters and numbers.'});
 const account=await db.query('SELECT password_salt,password_hash,password_iterations FROM academy_accounts_v2 WHERE id=$1',[s.user.id]);
 if(!account.rows.length||!await verifyPassword(before,account.rows[0]))return res.status(401).json({error:'Current password is incorrect.'});
 const {salt,hash,iterations}=await makePassword(after);
 await db.transaction([
 {sql:'UPDATE academy_accounts_v2 SET password_salt=$1,password_hash=$2,password_iterations=$3,must_change_password=false,updated_at=now() WHERE id=$4',params:[salt,hash,iterations,s.user.id]},
 {sql:'DELETE FROM academy_sessions_v2 WHERE account_id=$1 AND id<>$2',params:[s.user.id,s.sessionId]},
 ]);
 await audit(s.user.id,'account.password_change','account',s.user.id);
 res.json({ok:true});
}