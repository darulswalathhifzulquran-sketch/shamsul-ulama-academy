import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
export default async function(req,res){
 const a=await guard(req,res,[],req.method==='POST');if(!a)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Invalid student ID.'});
 const staff=['admin','usthad'].includes(a.user.role);
 const link=await db.query('SELECT relationship FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2 LIMIT 1',[a.user.id,sid]);
 if(!staff&&!link.rows.length)return res.status(404).json({error:'Student not linked to this account.'});
 if(req.method==='GET'){const r=await db.query('SELECT target_date,study_days,updated_at FROM academy_student_targets WHERE student_id=$1',[sid]);return res.json({target:r.rows[0]||null});}
 if(!staff&&link.rows[0].relationship!=='student')return res.status(403).json({error:'Parents have read-only access.'});
 const date=String(req.body?.target_date||''),days=req.body?.study_days;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(days)||!days.length||days.length>7||days.some(n=>!Number.isInteger(n)||n<0||n>6)||new Set(days).size!==days.length)return res.status(400).json({error:'Choose future target date and at least one study day.'});
 const parsed=new Date(date+'T12:00:00Z');if(Number.isNaN(+parsed)||parsed.toISOString().slice(0,10)!==date||parsed<=new Date())return res.status(400).json({error:'Choose a valid future completion date.'});
 await db.query("INSERT INTO academy_student_targets(student_id,target_date,study_days,updated_by) VALUES($1,$2::date,$3::int[],$4) ON CONFLICT(student_id) DO UPDATE SET target_date=EXCLUDED.target_date,study_days=EXCLUDED.study_days,updated_by=EXCLUDED.updated_by,updated_at=now()",[sid,date,days,a.user.id]);
 await audit(a.user.id,'target.updated','student',sid);res.json({ok:true});
}