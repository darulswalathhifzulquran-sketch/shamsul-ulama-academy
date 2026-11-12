import {db,guard,audit,makePassword,normalizeUsername,validUsername,validPassword} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST','PUT','DELETE'];
export default async function(req,res){
 const a=await guard(req,res,['admin','usthad'],req.method!=='GET');if(!a)return;
 if(req.method==='GET'){const r=await db.query("SELECT a.id,a.username,a.display_name,a.role,a.active,a.must_change_password,a.contact_phone,a.email,a.notes,a.created_at,COALESCE((SELECT array_agg(s.admission_number ORDER BY s.admission_number) FROM academy_links_v2 l JOIN academy_students s ON s.id=l.student_id WHERE l.account_id=a.id),ARRAY[]::text[]) AS admissions,COALESCE((SELECT array_agg(l.student_id ORDER BY l.student_id) FROM academy_links_v2 l WHERE l.account_id=a.id AND l.relationship='parent'),ARRAY[]::bigint[]) AS student_ids FROM academy_accounts_v2 a ORDER BY a.id DESC");return res.json({accounts:r.rows});}
 if(req.method==='DELETE'){
  if(req.body?.confirmed!==true||req.body?.confirmation_text!=='DELETE')return res.status(400).json({error:'Two-step deletion confirmation required.'});
  const uid=Number(req.body?.account_id);
  if(!Number.isSafeInteger(uid)||uid<1)return res.status(400).json({error:'Valid account required.'});
  const found=await db.query('SELECT id,role,username FROM academy_accounts_v2 WHERE id=$1',[uid]);
  if(!found.rows.length)return res.status(404).json({error:'Account not found.'});
  const target=found.rows[0];
  if(target.role==='admin'||Number(a.user.id)===uid)return res.status(403).json({error:'Administrator and your own account cannot be deleted.'});
  if(target.role==='usthad'&&a.user.role!=='admin')return res.status(403).json({error:'Only Main Administrator can delete an Usthad.'});
  if(target.role==='student')return res.status(400).json({error:'Delete the student from Student Admission to remove their record and login together.'});
  if(!['usthad','parent'].includes(target.role))return res.status(403).json({error:'This account cannot be deleted here.'});
  await db.transaction([
   {sql:'UPDATE academy_accounts_v2 SET created_by=NULL WHERE created_by=$1',params:[uid]},
   {sql:'UPDATE academy_student_targets SET updated_by=NULL WHERE updated_by=$1',params:[uid]},
   {sql:"DELETE FROM academy_accounts_v2 WHERE id=$1 AND role IN ('usthad','parent')",params:[uid]}
  ]);
  await audit(a.user.id,'account.delete','account',uid);
  return res.json({ok:true,deleted_account_id:uid});
 }
 if(req.method==='PUT'){
  const body=req.body||{},uid=Number(body.account_id);
  if(!Number.isSafeInteger(uid)||uid<1)return res.status(400).json({error:'Choose a valid account.'});
  const r=await db.query('SELECT id,role,username FROM academy_accounts_v2 WHERE id=$1',[uid]);
  if(!r.rows.length)return res.status(404).json({error:'Account not found.'});
  const target=r.rows[0];
  if(target.role==='admin'||Number(a.user.id)===uid||(target.role==='usthad'&&a.user.role!=='admin'))return res.status(403).json({error:'Cannot edit this account.'});
  const cols=[],vals=[],set=(key,value)=>{cols.push(key);vals.push(value);};
  if(body.display_name!==undefined){
    if(target.role==='student')return res.status(400).json({error:'Edit student names from Student Admission.'});
    const name=String(body.display_name||'').trim();
    if(name.length<2||name.length>140)return res.status(400).json({error:'Name must be 2–140 characters.'});
    set('display_name',name);
  }
  if(body.username!==undefined){
    if(target.role==='student')return res.status(400).json({error:'Edit student usernames from Student Admission.'});
    const name=normalizeUsername(body.username);
    if(!validUsername(name))return res.status(400).json({error:'Enter a valid username of 4–32 characters.'});
    set('username',name);
  }
  for(const [key,max] of Object.entries({contact_phone:35,email:160,notes:1200})){
    if(body[key]===undefined)continue;
    const v=String(body[key]??'').trim();
    if(v.length>max)return res.status(400).json({error:'Optional field too long: '+key});
    if(key==='email'&&v&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return res.status(400).json({error:'Invalid email address.'});
    set(key,v||null);
  }
  if(body.active!==undefined){
    if(typeof body.active!=='boolean')return res.status(400).json({error:'Invalid active status.'});
    set('active',body.active);
  }
  const reset=body.new_password!==undefined&&body.new_password!=='';
  if(reset){
    if(!validPassword(body.new_password))return res.status(400).json({error:'Password must have 12–128 characters, including letters and numbers.'});
    const h=await makePassword(body.new_password);
    set('password_salt',h.salt);set('password_hash',h.hash);set('password_iterations',h.iterations);
    set('must_change_password',true);set('failed_attempts',0);set('locked_until',null);
  }
  let ids=null;
  if(body.student_ids!==undefined){
    if(target.role!=='parent'||!Array.isArray(body.student_ids))return res.status(400).json({error:'Only parent accounts can update linked students.'});
    ids=[...new Set(body.student_ids.map(Number))];
    if(!ids.length||ids.length>10||ids.some(id=>!Number.isSafeInteger(id)||id<1))return res.status(400).json({error:'Select 1–10 students.'});
    const valid=await db.query("SELECT id FROM academy_students WHERE id=ANY($1::bigint[]) AND status='active'",[ids]);
    if(valid.rows.length!==ids.length)return res.status(400).json({error:'Invalid student link.'});
  }
  if(!cols.length&&ids===null)return res.status(400).json({error:'Nothing to save.'});
  const jobs=[];
  if(cols.length)jobs.push({sql:'UPDATE academy_accounts_v2 SET '+cols.map((key,i)=>key+'=$'+(i+1)).join(',')+',updated_at=now() WHERE id=$'+(cols.length+1),params:[...vals,uid]});
  if(ids!==null){
    jobs.push({sql:"DELETE FROM academy_links_v2 WHERE account_id=$1 AND relationship='parent'",params:[uid]});
    for(const sid of ids)jobs.push({sql:"INSERT INTO academy_links_v2(account_id,student_id,relationship) VALUES($1,$2,'parent')",params:[uid,sid]});
  }
  if(reset||body.active!==undefined||(body.username!==undefined&&normalizeUsername(body.username)!==target.username))jobs.push({sql:'DELETE FROM academy_sessions_v2 WHERE account_id=$1',params:[uid]});
  try{await db.transaction(jobs);}catch(e){if(e.code==='23505')return res.status(409).json({error:'Username already exists.'});throw e;}
  await audit(a.user.id,'account.update','account',uid);
  return res.json({ok:true,updated:true,password_reset:reset});
 }
 // Create Usthads without asking the administrator to invent a secure password
 // or guess an unused username. Passwords are never stored or logged in plaintext.
 const name=String(req.body?.display_name||'').trim(),role=String(req.body?.role||'');
 let username=normalizeUsername(req.body?.username);
 let password=req.body?.password;
 const ids=role==='parent'&&Array.isArray(req.body?.student_ids)?[...new Set(req.body.student_ids.map(Number))]:[];
 if(!['parent','usthad'].includes(role)||name.length<2||name.length>140)
  return res.status(400).json({error:'Enter the Usthad/Parent full name (at least 2 characters).'});
 if(role==='usthad'&&a.user.role!=='admin')
  return res.status(403).json({error:'Only the Main Administrator can add an Usthad.'});
 if(role==='parent'&&(!validUsername(username)||!validPassword(password)))
  return res.status(400).json({error:'Parent login requires a unique username and a strong password (12+ characters with letters and numbers).'});
 if(role==='parent'&&(!ids.length||ids.length>10||ids.some(v=>!Number.isSafeInteger(v)||v<1)))
  return res.status(400).json({error:'Choose the parent’s linked student.'});
 if(ids.length){const valid=await db.query("SELECT id FROM academy_students WHERE id=ANY($1::bigint[]) AND status='active'",[ids]);if(valid.rows.length!==ids.length)return res.status(400).json({error:'Invalid student link.'});}
 const phone=String(req.body?.contact_phone??'').trim(),email=String(req.body?.email??'').trim(),notes=String(req.body?.notes??'').trim();
 if(phone.length>35||email.length>160||notes.length>1200||(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))return res.status(400).json({error:'Check optional contact details.'});
 let reservedId=null,oneTimePassword=null;
 if(role==='usthad'){
  const reservation=await db.query("SELECT nextval('academy_accounts_v2_id_seq') AS id");
  reservedId=Number(reservation.rows?.[0]?.id);
  if(!Number.isSafeInteger(reservedId)||reservedId<1)return res.status(503).json({error:'Could not reserve an Usthad account ID. Please try again.'});
  let base=validUsername(username)?username:normalizeUsername(name)
    .replace(/[^a-z0-9._-]+/g,'.').replace(/^[^a-z]+/,'').replace(/[._-]+$/,'').slice(0,28);
  if(!validUsername(base))base='usthad';
  const existing=await db.query("SELECT id FROM academy_accounts_v2 WHERE username=$1 LIMIT 1",[base]);
  // Reserve a distinct ID in advance: reused names become usthad.3, usthad.4, etc.
  // The username constraint remains unique, so two teachers never share a login.
  username=existing.rows.length?base.slice(0,Math.max(4,31-String(reservedId).length))+'.'+reservedId:base;
  const words=['Amber','Apple','Bamboo','Beacon','Berry','Bloom','Blue','Breeze','Brook','Cedar','Cherry','Cloud','Coral','Crown','Dawn','Dove','Dream','Eagle','Elm','Field','Flame','Forest','Garden','Ginger','Golden','Grace','Green','Harbor','Hazel','Hill','Honey','Hope','Jade','Lake','Leaf','Lemon','Light','Lily','Linen','Lotus','Mango','Maple','Meadow','Melody','Misty','Moon','Morning','Olive','Orange','Palm','Pearl','Pine','Rain','River','Rose','Sage','Silver','Sky','Snow','Spring','Star','Sun','Valley'];
  const entropy=new Uint32Array(4);crypto.getRandomValues(entropy);
  oneTimePassword='Usthad-'+[words[entropy[0]%words.length],words[entropy[1]%words.length],words[entropy[2]%words.length]].join('-')+'-'+String(entropy[3]%1000000).padStart(6,'0');
  password=oneTimePassword;
 }
 const h=await makePassword(password);
 const statements=[{sql:reservedId===null?
  "INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,created_by,contact_phone,email,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)":
  "INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,created_by,contact_phone,email,notes,id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
  params:reservedId===null?
   [username,name,role,h.salt,h.hash,h.iterations,a.user.id,phone||null,email||null,notes||null]:
   [username,name,role,h.salt,h.hash,h.iterations,a.user.id,phone||null,email||null,notes||null,reservedId]}];
 for(const sid of ids)statements.push({sql:"INSERT INTO academy_links_v2(account_id,student_id,relationship) SELECT id,$2,'parent' FROM academy_accounts_v2 WHERE username=$1",params:[username,sid]});
 try{
  await db.transaction(statements);
  const verified=await db.query('SELECT id,username,role,active FROM academy_accounts_v2 WHERE username=$1 AND role=$2 LIMIT 1',[username,role]);
  if(!verified.rows.length)return res.status(503).json({error:'Account could not be verified after saving. Please check the list before retrying.'});
  try{await audit(a.user.id,'account.create','account',username);}catch(e){console.warn('Account creation audit failed',e?.message||e);}
  res.setHeader('Cache-Control','no-store');
  return res.status(201).json({ok:true,saved:true,username,role,account_id:verified.rows[0].id,
    temporary_password:role==='usthad'?oneTimePassword:undefined,
    must_change_password:true,
    message:'Account created, verified and saved. Copy the temporary password now; it is shown only once.'});
 }catch(e){
  if(e.code==='23505')return res.status(409).json({error:'This username is already taken. Leave Username empty to generate a unique one.'});
  console.error('Account creation failed',e?.code||'unknown',e?.message||'');
  return res.status(500).json({error:'Account could not be saved. Please try again or contact the Academy Administrator.'});
 }
}