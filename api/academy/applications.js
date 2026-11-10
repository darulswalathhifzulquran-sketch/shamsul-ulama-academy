import {db,guard,originAllowed,preventCache,audit,makePassword,validPassword} from '../../lib/academy-auth.js';
export const access='public';
export const methods=['GET','POST','PUT'];
const statuses=new Set(['submitted','under_review','interview','approved','rejected','cancelled']);
const trim=(v,n=255)=>String(v??'').trim().slice(0,n+1);
const dateOk=s=>!s||(/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s&&s<=(new Date()).toISOString().slice(0,10)&&s>='1990-01-01');
const phoneOk=s=>/^\+?[\d\s()-]{9,25}$/.test(s)&&s.replace(/\D/g,'').length>=9;
const yearNow=()=>new Date().getUTCFullYear();
const number=(row)=>'SUIA-'+row.application_year+'-'+String(row.id).padStart(5,'0');

export default async function(req,res){
 preventCache(res);
 if(req.method==='POST'){
   if(!originAllowed(req))return res.status(403).json({error:'Invalid request origin.'});
   if(trim(req.body?.website,100))return res.status(200).json({ok:true,message:'Application received.'});
   const f={
    student_name:trim(req.body?.student_name,140),
    date_of_birth:trim(req.body?.date_of_birth,10)||null,
    current_class:trim(req.body?.current_class,100)||null,
    school_or_madrasa:trim(req.body?.school_or_madrasa,160)||null,
    prior_hifz:trim(req.body?.prior_hifz,700)||null,
    guardian_name:trim(req.body?.guardian_name,140),
    guardian_relationship:trim(req.body?.guardian_relationship,60)||'Parent',
    guardian_phone:trim(req.body?.guardian_phone,25),
    alternative_phone:trim(req.body?.alternative_phone,25)||null,
    email:trim(req.body?.email,160)||null,
    address:trim(req.body?.address,1000),
    locality:trim(req.body?.locality,150)||null,
    district:trim(req.body?.district,150)||null,
    postal_code:trim(req.body?.postal_code,12)||null,
    notes:trim(req.body?.notes,1200)||null
   };
   if(f.student_name.length<2||f.student_name.length>140||f.guardian_name.length<2||f.guardian_name.length>140||!phoneOk(f.guardian_phone)||f.address.length<8||f.address.length>1000||!dateOk(f.date_of_birth)||
    f.alternative_phone!==null&&!phoneOk(f.alternative_phone)||f.email!==null&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)||
    Object.values(f).some(x=>x!==null&&x.length>1200)||req.body?.consent!==true)
      return res.status(400).json({error:'Check student name, guardian name, phone, postal address and consent. Optional details may be left blank.'});
   const prior=await db.query("SELECT count(*)::int AS n FROM academy_admission_applications WHERE guardian_phone=$1 AND created_at>now()-interval '24 hours'",[f.guardian_phone]);
   if(Number(prior.rows[0]?.n||0)>=3)return res.status(429).json({error:'Maximum of three applications per number per day. Please call the academy.'});
   const vals=[yearNow(),f.student_name,f.date_of_birth,f.current_class,f.school_or_madrasa,f.prior_hifz,f.guardian_name,f.guardian_relationship,f.guardian_phone,f.alternative_phone,f.email,f.address,f.locality,f.district,f.postal_code,f.notes];
   const sql="INSERT INTO academy_admission_applications(application_year,student_name,date_of_birth,current_class,school_or_madrasa,prior_hifz,guardian_name,guardian_relationship,guardian_phone,alternative_phone,email,address,locality,district,postal_code,notes,consent) VALUES("+vals.map((_,i)=>'$'+(i+1)).join(',')+",true) RETURNING id,application_year,student_name,status,created_at";
   const r=await db.query(sql,vals);
   const row=r.rows[0];if(!row)return res.status(500).json({error:'Could not save the application. Please retry.'});
   res.status(201).json({ok:true,application_number:number(row),student_name:row.student_name,status:row.status,message:'Application saved. Keep this number for reference.'});
   return;
 }
 const s=await guard(req,res,['admin','usthad'],req.method==='PUT');if(!s)return;
 if(req.method==='GET'){
   const id=Number(req.query?.id);
   if(req.query?.id!==undefined){
    if(!Number.isSafeInteger(id)||id<=0)return res.status(400).json({error:'Invalid application ID.'});
    const r=await db.query('SELECT * FROM academy_admission_applications WHERE id=$1 LIMIT 1',[id]);
    if(!r.rows.length)return res.status(404).json({error:'Application not found.'});
    const history=await db.query('SELECT from_status,to_status,note,actor_account_id,created_at FROM academy_application_events WHERE application_id=$1 ORDER BY created_at DESC',[id]);
    return res.json({application:{...r.rows[0],application_number:number(r.rows[0])},history:history.rows});
   }
   const r=await db.query('SELECT id,application_year,student_name,guardian_name,guardian_phone,current_class,status,interview_at,decision_reason,created_at FROM academy_admission_applications ORDER BY created_at DESC LIMIT 250');
   return res.json({applications:r.rows.map(x=>({...x,application_number:number(x)}))});
 }
 const id=Number(req.body?.id),next=trim(req.body?.status,40),reason=trim(req.body?.reason,1000)||null,staffNote=trim(req.body?.staff_note,1200)||null;
 if(!Number.isSafeInteger(id)||id<1||!statuses.has(next)||String(req.body?.reason||'').length>1000||String(req.body?.staff_note||'').length>1200)
  return res.status(400).json({error:'Invalid application, status or note.'});
 const date=trim(req.body?.interview_at,40)||null;
 if(date!==null&&(next!=='interview'||Number.isNaN(new Date(date).getTime())))
  return res.status(400).json({error:'Choose a valid interview date/time.'});
 // A password is generated server-side and returned exactly once on successful
 // account creation; only PBKDF2 salt/hash are stored in PostgreSQL.
 let oneTimePassword=null,h=null;
 if(next==='approved'){
  const requested=String(req.body?.initial_password??'');
  // Administrator may set a memorable initial password, or accept a secure
  // auto-generated temporary passphrase. All new logins must change it.
  if(requested){
   if(!validPassword(requested))return res.status(400).json({error:'Temporary password must be at least 12 characters and include letters and numbers. Try three memorable words with a few digits.'});
   oneTimePassword=requested;
  }else{
   const words=['Amber','Apple','Bamboo','Beacon','Berry','Bloom','Blue','Breeze','Brook','Cedar','Cherry','Cloud','Coral','Crown','Dawn','Dove','Dream','Eagle','Elm','Field','Flame','Forest','Garden','Ginger','Golden','Grace','Green','Harbor','Hazel','Hill','Honey','Hope','Jade','Lake','Leaf','Lemon','Light','Lily','Linen','Lotus','Mango','Maple','Meadow','Melody','Misty','Moon','Morning','Olive','Orange','Palm','Pearl','Pine','Rain','River','Rose','Sage','Silver','Sky','Snow','Spring','Star','Sun','Valley'];
   const bytes=new Uint32Array(4);crypto.getRandomValues(bytes);
   const picks=[words[bytes[0]%words.length],words[bytes[1]%words.length],words[bytes[2]%words.length]];
   oneTimePassword=picks.join('-')+'-'+String(bytes[3]%1000000).padStart(6,'0');
  }
  h=await makePassword(oneTimePassword);
 }
 try{
  const result=await db.query(
   'SELECT academy_decide_admission($1::bigint,$2::text,$3::text,$4::text,$5::timestamptz,$6::bigint,$7::text,$8::text,$9::integer) AS decision',
   [id,next,reason,staffNote,date,s.user.id,h?.salt||null,h?.hash||null,h?.iterations||null]
  );
  const raw=result.rows?.[0]?.decision;
  const decision=typeof raw==='string'?JSON.parse(raw):raw;
  if(!decision||Number(decision.id)!==id)return res.status(500).json({error:'Database did not confirm the admission decision.'});
  await audit(s.user.id,'admission.'+decision.status,'application',id);
  return res.json({ok:true,...decision,
   temporary_password:decision.account_created===true?oneTimePassword:undefined,
   message:decision.account_created===true?'Application APPROVED. Student saved and secure login created. Copy the one-time password now.':decision.status==='rejected'?'Application REJECTED and saved in the database.':decision.status==='cancelled'?'Application CANCELLED safely; no student account was deleted.':'Application '+decision.status+' saved in the database.'});
 }catch(e){
  if(e.code==='23505')return res.status(409).json({error:'Admission number or login already exists. No duplicate student was created. Contact Administrator.'});
  if(e.code==='P0002')return res.status(404).json({error:'Application not found. Refresh the list.'});
  if(e.code==='P0001')return res.status(409).json({error:'Status cannot be changed in this state. An approved student account is kept safe; refresh and check the application history.'});
  console.error('Admission decision failed',e?.code||'unknown',e?.message||'');
  return res.status(500).json({error:'Admission was NOT saved. Please refresh and retry; no partial account should have been created.'});
 }
}