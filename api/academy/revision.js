// Student-only daily self-study journal, separate from official published Hifz records.
import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public',methods=['GET','POST'];
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const parseDay=s=>{const day=String(s||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;const d=new Date(day+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===day?day:null;};
export default async function(req,res){
 const a=await guard(req,res,[],req.method==='POST');if(!a)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Select a student.'});
 const relationship=await db.query("SELECT relationship FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2 AND relationship IN ('student','parent') LIMIT 1",[a.user.id,sid]);
 const isStaff=['admin','usthad'].includes(a.user.role);
 if(!relationship.rows.length&&!isStaff)return res.status(404).json({error:'You are not linked to this student.'});
 if(isStaff){const valid=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active'",[sid]);if(!valid.rows.length)return res.status(404).json({error:'Student not found.'});}
 if(req.method==='GET'){
  const r=await db.query('SELECT note_date,new_pages,revision_pages,note,updated_at FROM academy_student_revision_notes WHERE student_id=$1 ORDER BY note_date DESC LIMIT 45',[sid]);
  return res.json({notes:r.rows,can_edit:relationship.rows[0]?.relationship==='student'&&a.user.role==='student'});
 }
 if(a.user.role!=='student'||relationship.rows[0]?.relationship!=='student')return res.status(403).json({error:'Only the linked student can edit personal revision notes.'});
 const day=parseDay(req.body?.note_date),newPages=Number(req.body?.new_pages),revision=Number(req.body?.revision_pages),note=String(req.body?.note||'').trim();
 const now=today();
 if(!day||day>now||day<new Date(Date.now()-90*86400000).toISOString().slice(0,10)||
  !Number.isInteger(newPages)||newPages<0||newPages>30||!Number.isInteger(revision)||revision<0||revision>100||note.length>800)
  return res.status(400).json({error:'Choose a valid recent date, 0–30 new pages, 0–100 revision pages and up to 800 note characters.'});
 const r=await db.query("INSERT INTO academy_student_revision_notes(student_id,note_date,new_pages,revision_pages,note) VALUES($1,$2,$3,$4,$5) ON CONFLICT(student_id,note_date) DO UPDATE SET new_pages=EXCLUDED.new_pages,revision_pages=EXCLUDED.revision_pages,note=EXCLUDED.note,updated_at=now() RETURNING note_date",[sid,day,newPages,revision,note]);
 if(!r.rows[0])return res.status(500).json({error:'Revision note save was not confirmed.'});
 await audit(a.user.id,'student.revision_note.save','student',sid);
 return res.json({ok:true,saved:true,note_date:String(r.rows[0].note_date).slice(0,10),message:'Your personal revision note was saved.'});
}
