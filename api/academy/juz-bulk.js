// Explicit staff-only, additive, atomic completion of a consecutive series of Juz.
import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public',methods=['POST'];
const START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
export default async function(req,res){
 const a=await guard(req,res,['admin','usthad'],true);if(!a)return;
 const sid=Number(req.body?.student_id),count=Number(req.body?.completed_juz),direction=String(req.body?.direction||'ascending');
 if(!Number.isSafeInteger(sid)||sid<1||!Number.isInteger(count)||count<1||count>30||!['ascending','descending'].includes(direction)||req.body?.confirmed!==true)
   return res.status(400).json({error:'Select a student, 1–30 completed Juz, direction, and confirm teacher verification.'});
 const student=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active' LIMIT 1",[sid]);
 if(!student.rows.length)return res.status(404).json({error:'Active student not found.'});
 const numbers=Array.from({length:count},(_,i)=>direction==='ascending'?i+1:30-i);
 const sizes=numbers.map(n=>START[n]-START[n-1]);
 const total=sizes.reduce((n,x)=>n+x,0);
 const saved=await db.query(`
INSERT INTO academy_juz_verifications(
 student_id,juz_number,memorised_pages,completion_verified,accuracy_verified,verified_by_user_id,verified_at,published_at
)
SELECT $1,v.juz_number,v.pages,true,false,$4,now(),now()
FROM unnest($2::smallint[],$3::smallint[]) AS v(juz_number,pages)
ON CONFLICT(student_id,juz_number) DO UPDATE SET
 memorised_pages=EXCLUDED.memorised_pages,completion_verified=true,
 verified_by_user_id=EXCLUDED.verified_by_user_id,verified_at=now(),published_at=now(),updated_at=now()
RETURNING juz_number,memorised_pages`,[sid,numbers,sizes,String(a.user.id)]);
 if(saved.rows.length!==count)return res.status(500).json({error:'Expected full batch was not saved.'});
 await audit(a.user.id,'juz.bulk_completed','student',sid);
 res.json({ok:true,completed_juz:count,pages_in_selected_juz:total,direction,saved:saved.rows.length,notice:'Only selected Juz updated. Other verified records preserved.'});
}
