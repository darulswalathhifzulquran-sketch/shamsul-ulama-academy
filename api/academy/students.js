import {db,guard,audit,makePassword,validPassword,validUsername,normalizeUsername} from '../../lib/academy-auth.js';
const optional=(v,max)=>{const s=String(v??'').trim();if(s.length>max)throw Error('Optional field exceeds '+max+' characters.');return s||null;};
function details(body){
 const d={};
 for(const [key,max] of Object.entries({batch_name:80,contact_phone:35,guardian_name:140,guardian_phone:35,postal_address:1000,notes:1200})){
  if(body?.[key]!==undefined)d[key]=optional(body[key],max);
 }
 if(body?.date_of_birth!==undefined){
  const s=String(body.date_of_birth??'').trim();
  if(s&&(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s||s>new Date().toISOString().slice(0,10)))throw Error('Enter a valid past date of birth.');
  d.date_of_birth=s||null;
 }
 return d;
}
export const access='public';export const methods=['GET','POST','PUT','DELETE'];
export default async function(req,res){
 const a=await guard(req,res,['admin','usthad'],req.method!=='GET');if(!a)return;
 if(req.method==='GET'){
  const r=await db.query("SELECT s.id,s.admission_number,s.full_name,s.batch_name,s.contact_phone,s.guardian_name,s.guardian_phone,s.date_of_birth,s.postal_address,s.notes,s.status,(SELECT a.username FROM academy_accounts_v2 a JOIN academy_links_v2 l ON l.account_id=a.id WHERE l.student_id=s.id AND l.relationship='student' AND a.role='student' LIMIT 1) AS username,(SELECT a.active FROM academy_accounts_v2 a JOIN academy_links_v2 l ON l.account_id=a.id WHERE l.student_id=s.id AND l.relationship='student' AND a.role='student' LIMIT 1) AS login_active FROM academy_students s WHERE s.status='active' ORDER BY s.id DESC");
  const count=await db.query('SELECT count(*)::integer AS total_all FROM academy_students');
  return res.json({students:r.rows,total_all:Number(count.rows[0]?.total_all||0)});
 }
 if(req.method==='DELETE'){
  if(req.body?.confirmed!==true||req.body?.confirmation_text!=='DELETE')return res.status(400).json({error:'Two-step deletion confirmation required.'});
  const sid=Number(req.body?.student_id);
  if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Valid student required.'});
  const found=await db.query('SELECT id,admission_number FROM academy_students WHERE id=$1',[sid]);
  if(!found.rows.length)return res.status(404).json({error:'Student not found.'});
  const linked=await db.query("SELECT a.id FROM academy_links_v2 l JOIN academy_accounts_v2 a ON a.id=l.account_id WHERE l.student_id=$1 AND l.relationship='student' AND a.role='student'",[sid]);
  const ids=linked.rows.map(x=>Number(x.id));
  await db.transaction([
   {sql:'UPDATE academy_accounts_v2 SET created_by=NULL WHERE created_by=ANY($1::bigint[])',params:[ids]},
   {sql:'UPDATE academy_student_targets SET updated_by=NULL WHERE updated_by=ANY($1::bigint[])',params:[ids]},
   {sql:'DELETE FROM academy_students WHERE id=$1',params:[sid]},
   {sql:"DELETE FROM academy_accounts_v2 a WHERE a.id=ANY($1::bigint[]) AND a.role='student' AND NOT EXISTS(SELECT 1 FROM academy_links_v2 l WHERE l.account_id=a.id)",params:[ids]}
  ]);
  await audit(a.user.id,'student.delete','student',found.rows[0].admission_number);
  return res.json({ok:true,deleted_student_id:sid});
 }
 if(req.method==='PUT'){
  const body=req.body||{},sid=Number(body.student_id),name=String(body.full_name||'').trim();
  if(!Number.isSafeInteger(sid)||sid<1||name.length<2||name.length>140)return res.status(400).json({error:'Student name must be 2–140 characters.'});
  let d;try{d=details(body);}catch(e){return res.status(400).json({error:e.message});}
  const found=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active'",[sid]);
  if(!found.rows.length)return res.status(404).json({error:'Student not found.'});
  const studentLogin=await db.query("SELECT a.id,a.username FROM academy_accounts_v2 a JOIN academy_links_v2 l ON l.account_id=a.id WHERE l.student_id=$1 AND l.relationship='student' AND a.role='student' ORDER BY a.id LIMIT 1",[sid]);
  const login=studentLogin.rows[0];
  if(!login)return res.status(409).json({error:'The student login is not linked; please contact the Academy Administrator.'});
  const username=body.username!==undefined?normalizeUsername(body.username):login.username;
  if(!validUsername(username))return res.status(400).json({error:'Username must be 4–32 valid characters.'});
  const reset=body.new_password!==undefined&&body.new_password!=='';
  if(reset&&!validPassword(body.new_password))return res.status(400).json({error:'New password must be 12–128 characters, including letters and numbers.'});
  const col=['full_name',...Object.keys(d)],values=[name,...Object.values(d)];
  const studentSql='UPDATE academy_students SET '+col.map((key,i)=>key+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=$'+(col.length+1)+" AND status='active'";
  const accCols=['display_name','username'],accVals=[name,username];
  if(body.active!==undefined){if(typeof body.active!=='boolean')return res.status(400).json({error:'Invalid student login status.'});accCols.push('active');accVals.push(body.active);}
  if(reset){
    const h=await makePassword(body.new_password);
    accCols.push('password_salt','password_hash','password_iterations','must_change_password','failed_attempts','locked_until');
    accVals.push(h.salt,h.hash,h.iterations,true,0,null);
  }
  const accountSql='UPDATE academy_accounts_v2 SET '+accCols.map((key,i)=>key+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=$'+(accCols.length+1)+" AND role='student'";
  const statements=[{sql:studentSql,params:[...values,sid]},{sql:accountSql,params:[...accVals,login.id]}];
  if(reset||username!==login.username||body.active!==undefined)statements.push({sql:'DELETE FROM academy_sessions_v2 WHERE account_id=$1',params:[login.id]});
  try{await db.transaction(statements);}
  catch(e){if(e.code==='23505')return res.status(409).json({error:'Username already exists.'});throw e;}
  await audit(a.user.id,'student.update','student',sid);
  return res.json({ok:true,student_id:sid,password_reset:reset});
 }
 const givenAdmission=String(req.body?.admission_number||'').trim().toUpperCase(),name=String(req.body?.full_name||'').trim(),batch=String(req.body?.batch_name||'').trim(),username=normalizeUsername(req.body?.username),password=req.body?.password;
 if(name.length<2||name.length>140||batch.length>80||!validUsername(username)||!validPassword(password)||(givenAdmission&&!/^HIFZ-[0-9]{4}-[0-9]{3,5}$/.test(givenAdmission)))return res.status(400).json({error:'Student name (2+ letters), username (4+ characters), and password (12+ characters including letters and numbers) are required. Admission number and batch are optional.'});
 let d;try{d=details(req.body);}catch(e){return res.status(400).json({error:e.message});}
 const h=await makePassword(password);
 // A dedicated sequence reservation prevents concurrent automatic admissions from receiving the same number.
 const reservation=await db.query("SELECT nextval('academy_students_id_seq') AS id");
 const next=Number(reservation.rows[0].id);
 const admission=givenAdmission||('HIFZ-'+new Date().getUTCFullYear()+'-'+String(next).padStart(5,'0'));
 try{
  await db.transaction([
   {sql:"INSERT INTO academy_students(id,admission_number,full_name,batch_name,contact_phone,guardian_name,guardian_phone,date_of_birth,postal_address,notes,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active')",params:[next,admission,name,batch||null,d.contact_phone??null,d.guardian_name??null,d.guardian_phone??null,d.date_of_birth??null,d.postal_address??null,d.notes??null]},
   {sql:"INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,created_by) VALUES($1,$2,'student',$3,$4,$5,$6)",params:[username,name,h.salt,h.hash,h.iterations,a.user.id]},
   {sql:"INSERT INTO academy_links_v2(account_id,student_id,relationship) SELECT a.id,s.id,'student' FROM academy_accounts_v2 a CROSS JOIN academy_students s WHERE a.username=$1 AND s.admission_number=$2",params:[username,admission]}
  ]);
  await audit(a.user.id,'student.create','student',admission);
  return res.status(201).json({ok:true,admission_number:admission,username});
 }catch(e){if(e.code==='23505')return res.status(409).json({error:'Admission number or username already exists.'});throw e;}
}