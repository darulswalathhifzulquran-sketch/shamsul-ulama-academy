import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
export default async function(req,res){
 const a=await guard(req,res,[],req.method==='POST');if(!a)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Select a valid student.'});
 const staff=['admin','usthad'].includes(a.user.role);
 if(!staff){
 const link=await db.query('SELECT 1 FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2',[a.user.id,sid]);
 if(!link.rows.length)return res.status(404).json({error:'Student not linked to account.'});
 }
 if(req.method==='GET'){
 const sql=staff?
 "SELECT id,report_month,new_pages,revision_pages,verified_total_pages,accuracy_percent,target_pages,comment,status,published_at FROM academy_hifz_monthly WHERE student_id=$1 ORDER BY report_month DESC LIMIT 60":
 "SELECT id,report_month,new_pages,revision_pages,verified_total_pages,accuracy_percent,target_pages,comment,status,published_at FROM academy_hifz_monthly WHERE student_id=$1 AND status='published' ORDER BY report_month DESC LIMIT 60";
 const r=await db.query(sql,[sid]);return res.json({reports:r.rows});
 }
 if(!staff)return res.status(403).json({error:'Only authorised Usthad may publish reports.'});
 const month=String(req.body?.month||''),state=String(req.body?.status||'draft');
 const pages=Number(req.body?.new_pages),revision=Number(req.body?.revision_pages);
 const verified=req.body?.verified_total_pages==null||req.body?.verified_total_pages===''?null:Number(req.body.verified_total_pages);
 const accuracy=req.body?.accuracy_percent==null||req.body?.accuracy_percent===''?null:Number(req.body.accuracy_percent);
 const target=req.body?.target_pages==null||req.body?.target_pages===''?null:Number(req.body.target_pages);
 const comment=String(req.body?.comment||'').trim();
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!['draft','confirmed','published'].includes(state)||!Number.isFinite(pages)||pages<0||pages>604||!Number.isFinite(revision)||revision<0||revision>10000||(verified!==null&&(!Number.isFinite(verified)||verified<0||verified>604))||(accuracy!==null&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>100))||(target!==null&&(!Number.isFinite(target)||target<0||target>604))||comment.length>2000||(state==='published'&&verified===null))return res.status(400).json({error:'Invalid report: publishing requires verified pages; check month, pages and accuracy.'});
 const exists=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active'",[sid]);if(!exists.rows.length)return res.status(404).json({error:'Student not found.'});
 const r=await db.query("INSERT INTO academy_hifz_monthly(student_id,report_month,new_pages,revision_pages,verified_total_pages,accuracy_percent,target_pages,comment,status,recorded_by_user_id,verified_by_user_id,published_at) VALUES($1,$2::date,$3,$4,$5,$6,$7,$8,$9,$10,$10,CASE WHEN $9='published' THEN now() ELSE null END) ON CONFLICT(student_id,report_month) DO UPDATE SET new_pages=EXCLUDED.new_pages,revision_pages=EXCLUDED.revision_pages,verified_total_pages=EXCLUDED.verified_total_pages,accuracy_percent=EXCLUDED.accuracy_percent,target_pages=EXCLUDED.target_pages,comment=EXCLUDED.comment,status=EXCLUDED.status,verified_by_user_id=EXCLUDED.verified_by_user_id,published_at=EXCLUDED.published_at,updated_at=now() RETURNING id,student_id,report_month,status",[sid,month+'-01',pages,revision,verified,accuracy,target,comment,state,String(a.user.id)]);
 await audit(a.user.id,'monthly.'+state,'monthly',r.rows[0].id);return res.json({ok:true,record:r.rows[0]});
}