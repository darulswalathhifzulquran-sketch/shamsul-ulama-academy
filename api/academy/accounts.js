import {db,guard,audit,makePassword,normalizeUsername,validUsername,validPassword} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST','PUT'];
export default async function(req,res){
 const a=await guard(req,res,['admin','usthad'],req.method!=='GET');if(!a)return;
 if(req.method==='GET'){const r=await db.query("SELECT a.id,a.username,a.display_name,a.role,a.active,a.must_change_password,COALESCE((SELECT array_agg(s.admission_number) FROM academy_links_v2 l JOIN academy_students s ON s.id=l.student_id WHERE l.account_id=a.id),ARRAY[]::text[]) AS admissions FROM academy_accounts_v2 a ORDER BY a.id DESC LIMIT 500");return res.json({accounts:r.rows});}
 if(req.method==='PUT'){
 const uid=Number(req.body?.account_id),active=req.body?.active,newPassword=req.body?.new_password;
 if(!Number.isSafeInteger(uid)||(!validPassword(newPassword)&&typeof active!=='boolean'))return res.status(400).json({error:'Invalid account update.'});
 const t=await db.query('SELECT role FROM academy_accounts_v2 WHERE id=$1',[uid]);if(!t.rows.length)return res.status(404).json({error:'Account not found.'});
 if(t.rows[0].role==='admin'||(t.rows[0].role==='usthad'&&a.user.role!=='admin')||Number(a.user.id)===uid)return res.status(403).json({error:'Cannot update this account.'});
 if(newPassword!==undefined){
 if(!validPassword(newPassword))return res.status(400).json({error:'Use a new password with at least 12 characters, including letters and numbers.'});
 const h=await makePassword(newPassword);
 await db.transaction([
 {sql:"UPDATE academy_accounts_v2 SET password_salt=$1,password_hash=$2,password_iterations=$3,must_change_password=true,failed_attempts=0,locked_until=null,updated_at=now() WHERE id=$4",params:[h.salt,h.hash,h.iterations,uid]},
 {sql:'DELETE FROM academy_sessions_v2 WHERE account_id=$1',params:[uid]}
 ]);
 await audit(a.user.id,'account.password_reset','account',uid);return res.json({ok:true,reset:true});
 }
 if(typeof active!=='boolean')return res.status(400).json({error:'Active status required.'});
 await db.transaction([{sql:'UPDATE academy_accounts_v2 SET active=$1,updated_at=now() WHERE id=$2',params:[active,uid]},{sql:'DELETE FROM academy_sessions_v2 WHERE account_id=$1',params:[uid]}]);
 await audit(a.user.id,'account.status','account',uid);return res.json({ok:true});
 }
 const name=String(req.body?.display_name||'').trim(),username=normalizeUsername(req.body?.username),password=req.body?.password,role=String(req.body?.role||'');
 const ids=Array.isArray(req.body?.student_ids)?[...new Set(req.body.student_ids.map(Number))]:[];
 if(!validUsername(username)||!validPassword(password)||name.length<2||name.length>140||!['parent','usthad'].includes(role))return res.status(400).json({error:'Invalid name, role, username or password.'});
 if(role==='usthad'&&a.user.role!=='admin')return res.status(403).json({error:'Only administrator can add Usthad.'});
 if(role==='parent'&&(!ids.length||ids.length>10||ids.some(v=>!Number.isSafeInteger(v)||v<1)))return res.status(400).json({error:'Choose the parent’s linked student.'});
 if(ids.length){const valid=await db.query("SELECT id FROM academy_students WHERE id=ANY($1::bigint[]) AND status='active'",[ids]);if(valid.rows.length!==ids.length)return res.status(400).json({error:'Invalid student link.'});}
 const h=await makePassword(password);
 const statements=[{sql:"INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)",params:[username,name,role,h.salt,h.hash,h.iterations,a.user.id]}];
 for(const sid of ids)statements.push({sql:"INSERT INTO academy_links_v2(account_id,student_id,relationship) SELECT id,$2,'parent' FROM academy_accounts_v2 WHERE username=$1",params:[username,sid]});
 try{await db.transaction(statements);await audit(a.user.id,'account.create','account',username);return res.status(201).json({ok:true,username,role});}catch(e){if(e.code==='23505')return res.status(409).json({error:'Username already exists.'});throw e;}
}