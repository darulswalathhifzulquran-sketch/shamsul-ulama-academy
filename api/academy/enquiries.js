import {db,guard,originAllowed,audit,preventCache} from '../../lib/academy-auth.js';
export const access='public';export const methods=['GET','POST','PUT'];
export default async function(req,res){
 if(req.method==='POST'){
   preventCache(res);
   if(!originAllowed(req))return res.status(403).json({error:'Request rejected.'});
   const guardian=String(req.body?.guardian_name||'').trim(),phone=String(req.body?.phone||'').replace(/[^\d+ -]/g,'').trim(),student=String(req.body?.student_name||'').trim(),notes=String(req.body?.notes||'').trim(),consent=req.body?.consent===true;
   if(guardian.length<2||guardian.length>120||phone.length<9||phone.length>20||student.length>120||notes.length>600||!consent)return res.status(400).json({error:'Guardian name, phone and consent are required.'});
   const q=await db.query("SELECT count(*)::int AS n FROM academy_admission_enquiries WHERE phone=$1 AND created_at>now()-interval '24 hours'",[phone]);
   if(Number(q.rows[0].n)>=3)return res.status(429).json({error:'Too many enquiries from this number today. Please call the academy.'});
   await db.query('INSERT INTO academy_admission_enquiries(guardian_name,phone,student_name,notes,consent) VALUES($1,$2,$3,$4,true)',[guardian,phone,student||null,notes||null]);
   return res.status(201).json({ok:true,message:'Your admission enquiry has been received.'});
 }
 const a=await guard(req,res,['admin','usthad'],req.method==='PUT');if(!a)return;
 if(req.method==='GET'){const r=await db.query('SELECT id,guardian_name,phone,student_name,notes,status,created_at FROM academy_admission_enquiries ORDER BY created_at DESC LIMIT 250');return res.json({enquiries:r.rows});}
 const n=Number(req.body?.id),status=String(req.body?.status||'');
 if(!Number.isSafeInteger(n)||!['new','contacted','closed'].includes(status))return res.status(400).json({error:'Invalid update.'});
 await db.query('UPDATE academy_admission_enquiries SET status=$1 WHERE id=$2',[status,n]);await audit(a.user.id,'enquiry.'+status,'enquiry',n);res.json({ok:true});
}