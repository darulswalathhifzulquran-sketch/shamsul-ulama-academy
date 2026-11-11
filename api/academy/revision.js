// Daily revision diary, explicitly separate from verified Usthad records.
import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public',methods=['GET','POST'];
function indiaToday(){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const val=k=>p.find(x=>x.type===k).value;return val('year')+'-'+val('month')+'-'+val('day');
}
function validDate(v){const s=String(v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s?s:null;}
export default async function(req,res){
 const auth=await guard(req,res,[],req.method==='POST');if(!auth)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Select a valid student.'});
 const staff=['admin','usthad'].includes(auth.user.role);
 const access=await db.query("SELECT relationship FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2 AND relationship IN ('student','parent') LIMIT 1",[auth.user.id,sid]);
 if(!staff&&!access.rows.length)return res.status(404).json({error:'Student not linked to this account.'});
 if(staff){const found=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active' LIMIT 1",[sid]);if(!found.rows.length)return res.status(404).json({error:'Student not found.'});}
 if(req.method==='GET'){
   const result=await db.query("SELECT note_date,new_pages,revision_pages,note,updated_at FROM academy_student_revision_notes WHERE student_id=$1 ORDER BY note_date DESC LIMIT 45",[sid]);
   return res.json({notes:result.rows,can_edit:auth.user.role==='student'&&access.rows[0]?.relationship==='student'});
 }
 if(auth.user.role!=='student'||access.rows[0]?.relationship!=='student')return res.status(403).json({error:'Only the linked student may save personal revision notes.'});
 const date=validDate(req.body?.note_date),newPages=Number(req.body?.new_pages),revisionPages=Number(req.body?.revision_pages),note=String(req.body?.note||'').trim();
 const today=indiaToday(),oldest=new Date(Date.parse(today+'T00:00:00Z')-90*86400000).toISOString().slice(0,10);
 if(!date||date>today||date<oldest)return res.status(400).json({error:'Study Date must be today or within the past 90 days. Future dates cannot be saved.'});
 if(!Number.isFinite(newPages)||newPages<0||newPages>30||Math.abs(newPages*2-Math.round(newPages*2))>1e-8)
   return res.status(400).json({error:'New Pages Practiced must be 0–30 pages in half-page steps (for example 1.5).'});
 if(!Number.isInteger(revisionPages)||revisionPages<0||revisionPages>100||note.length>800)
   return res.status(400).json({error:'Revision Pages must be 0–100 whole pages; private note up to 800 characters.'});
 const saved=await db.query("INSERT INTO academy_student_revision_notes(student_id,note_date,new_pages,revision_pages,note) VALUES($1,$2::date,$3,$4,$5) ON CONFLICT(student_id,note_date) DO UPDATE SET new_pages=EXCLUDED.new_pages,revision_pages=EXCLUDED.revision_pages,note=EXCLUDED.note,updated_at=now() RETURNING note_date",[sid,date,newPages,revisionPages,note]);
 if(!saved.rows.length)return res.status(500).json({error:'Save was not confirmed. Please retry.'});
 await audit(auth.user.id,'student.revision_note.save','student',sid);
 res.json({ok:true,saved:true,note_date:String(saved.rows[0].note_date).slice(0,10),message:'Revision note saved successfully.'});
}
