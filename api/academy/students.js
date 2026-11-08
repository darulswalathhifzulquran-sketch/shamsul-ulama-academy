import {db,guard,audit,makePassword,validPassword,validUsername,normalizeUsername} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
export default async function(req,res){
 const a=await guard(req,res,['admin','usthad'],req.method==='POST');if(!a)return;
 if(req.method==='GET'){
 const r=await db.query("SELECT id,admission_number,full_name,batch_name,status FROM academy_students ORDER BY id DESC LIMIT 500");
 return res.json({students:r.rows});
 }
 const admission=String(req.body?.admission_number||'').trim().toUpperCase(),name=String(req.body?.full_name||'').trim(),batch=String(req.body?.batch_name||'').trim(),username=normalizeUsername(req.body?.username),password=req.body?.password;
 if(!/^HIFZ-[0-9]{4}-[0-9]{3,5}$/.test(admission)||name.length<2||name.length>140||batch.length>80||!validUsername(username)||!validPassword(password))return res.status(400).json({error:'Provide admission number HIFZ-YYYY-NNN, student name, username and strong password (12+ characters).'});
 const h=await makePassword(password);
 try{
 await db.transaction([
 {sql:"INSERT INTO academy_students(admission_number,full_name,batch_name,status) VALUES($1,$2,$3,'active')",params:[admission,name,batch||null]},
 {sql:"INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,created_by) VALUES($1,$2,'student',$3,$4,$5,$6)",params:[username,name,h.salt,h.hash,h.iterations,a.user.id]},
 {sql:"INSERT INTO academy_links_v2(account_id,student_id,relationship) SELECT a.id,s.id,'student' FROM academy_accounts_v2 a CROSS JOIN academy_students s WHERE a.username=$1 AND s.admission_number=$2",params:[username,admission]}
 ]);
 await audit(a.user.id,'student.create','student',admission);
 return res.status(201).json({ok:true,admission_number:admission,username});
 }catch(e){if(e.code==='23505')return res.status(409).json({error:'Admission number or username already exists.'});throw e;}
}