import {db,guard,originAllowed,preventCache,audit} from 'lib/academy-auth.js';
export const access='public';
export const methods=['GET','POST','PUT'];
const statuses=new Set(['submitted','under_review','interview','approved','rejected']);
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
  return res.status(400).json({error:'Invalid action or comment.'});
 const date=trim(req.body?.interview_at,40)||null;
 if(date!==null&&(next!=='interview'||Number.isNaN(new Date(date).getTime())))
  return res.status(400).json({error:'Choose a valid interview date/time.'});
 const prior=await db.query('SELECT status FROM academy_admission_applications WHERE id=$1',[id]);
 if(!prior.rows.length)return res.status(404).json({error:'Application not found.'});
 const before=prior.rows[0].status;
 if(next===before&&!staffNote&&!reason&&!date)return res.status(400).json({error:'No change to save.'});
 const allowed={
  submitted:['under_review','interview','approved','rejected'],
  under_review:['interview','approved','rejected'],
  interview:['under_review','approved','rejected'],
  approved:['under_review'],
  rejected:['under_review']
 };
 if(next!==before&&!allowed[before]?.includes(next))return res.status(409).json({error:'This status transition is not permitted.'});
 const note=next==='rejected'?reason:(staffNote||reason||null);
 const updated=await db.transaction([
  {sql:"UPDATE academy_admission_applications SET status=$1,interview_at=CASE WHEN $1='interview' THEN $2::timestamptz ELSE interview_at END,decision_reason=CASE WHEN $1='rejected' THEN $3 ELSE NULL END,staff_note=COALESCE($4,staff_note),reviewed_by=$5,reviewed_at=now(),updated_at=now() WHERE id=$6 AND status=$7 RETURNING id",params:[next,date,note,staffNote,s.user.id,id,before]},
  {sql:"INSERT INTO academy_application_events(application_id,from_status,to_status,note,actor_account_id) SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM academy_admission_applications WHERE id=$1 AND status=$3)",params:[id,before,next,note,s.user.id]}
 ]);
 if(!updated.results?.[0]?.rowCount)return res.status(409).json({error:'Application was changed by another Usthad. Refresh and retry.'});
 await audit(s.user.id,'admission.'+next,'application',id);
 return res.json({ok:true,id,status:next,message:'Application status saved successfully.'});
}