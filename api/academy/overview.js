import {db,guard} from '../../lib/academy-auth.js';
export const access='public';export const methods=['GET'];
export default async function(req,res){
 const a=await guard(req,res);if(!a)return;
 const staff=['admin','usthad'].includes(a.user.role);
 const links=staff?
 await db.query("SELECT s.id,s.admission_number,s.full_name,s.batch_name,'usthad' AS relationship FROM academy_students s WHERE s.status='active' ORDER BY s.full_name LIMIT 500"):
 await db.query("SELECT s.id,s.admission_number,s.full_name,s.batch_name,l.relationship FROM academy_links_v2 l JOIN academy_students s ON s.id=l.student_id WHERE l.account_id=$1 AND s.status='active' ORDER BY s.full_name LIMIT 50",[a.user.id]);
 const sid=Number(req.query?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.json({students:links.rows,selected:null});
 if(!links.rows.some(r=>Number(r.id)===sid))return res.status(404).json({error:'No linked student found.'});
 const [juz,monthly,target]=await Promise.all([
 db.query(staff?"SELECT juz_number,memorised_pages,completion_verified,accuracy_verified,accuracy_percent,dua_message,published_at FROM academy_juz_verifications WHERE student_id=$1 ORDER BY juz_number":"SELECT juz_number,memorised_pages,completion_verified,accuracy_verified,accuracy_percent,dua_message,published_at FROM academy_juz_verifications WHERE student_id=$1 AND published_at IS NOT NULL ORDER BY juz_number",[sid]),
 db.query(staff?"SELECT report_month,new_pages,revision_pages,verified_total_pages,accuracy_percent,target_pages,comment,status,published_at FROM academy_hifz_monthly WHERE student_id=$1 ORDER BY report_month DESC LIMIT 36":"SELECT report_month,new_pages,revision_pages,verified_total_pages,accuracy_percent,target_pages,comment,status,published_at FROM academy_hifz_monthly WHERE student_id=$1 AND status='published' ORDER BY report_month DESC LIMIT 36",[sid]),
 db.query("SELECT target_date,study_days,planning_completed_juz,planning_direction FROM academy_student_targets WHERE student_id=$1",[sid])
 ]);
 res.json({students:links.rows,selected:links.rows.find(r=>Number(r.id)===sid),juz:juz.rows,reports:monthly.rows,target:target.rows[0]||null});
}