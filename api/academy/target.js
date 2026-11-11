import {db,guard,audit} from '../../lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
export default async function(req,res){
 const a=await guard(req,res,[],req.method==='POST');if(!a)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Invalid student ID.'});
 const staff=['admin','usthad'].includes(a.user.role);
 const link=await db.query('SELECT relationship FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2 LIMIT 1',[a.user.id,sid]);
 if(!staff&&!link.rows.length)return res.status(404).json({error:'Student not linked to this account.'});
 if(req.method==='GET'){const r=await db.query('SELECT target_date,study_days,planning_completed_juz,planning_direction,planning_mode,planning_partial_pages,updated_at FROM academy_student_targets WHERE student_id=$1',[sid]);return res.json({target:r.rows[0]||null});}
 if(!staff&&link.rows[0].relationship!=='student')return res.status(403).json({error:'Parents have read-only access.'});
 const date=String(req.body?.target_date||''),days=req.body?.study_days;
 const n=Number(req.body?.planning_completed_juz??0),direction=String(req.body?.planning_direction||'ascending');
 const mode=String(req.body?.planning_mode||'official'),partial=Number(req.body?.planning_partial_pages??0);
 const START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
 const next=direction==='ascending'?n+1:30-n;
 const maximum=n===30?0:START[next]-START[next-1];
 if(!Number.isInteger(n)||n<0||n>30||!['ascending','descending'].includes(direction)||!['official','juz_count'].includes(mode)||!Number.isFinite(partial)||partial<0||partial>=maximum&&n!==30||n===30&&partial!==0||Math.abs(partial*2-Math.round(partial*2))>1e-8)
  return res.status(400).json({error:'Choose 0–30 Juz and a valid direction. Partial pages must be smaller than the next Juz in half-page steps.'});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(days)||!days.length||days.length>7||days.some(n=>!Number.isInteger(n)||n<0||n>6)||new Set(days).size!==days.length)return res.status(400).json({error:'Choose future target date and at least one study day.'});
 const parsed=new Date(date+'T12:00:00Z');if(Number.isNaN(+parsed)||parsed.toISOString().slice(0,10)!==date||parsed<=new Date())return res.status(400).json({error:'Choose a valid future completion date.'});
 await db.query("INSERT INTO academy_student_targets(student_id,target_date,study_days,updated_by,planning_completed_juz,planning_direction,planning_mode,planning_partial_pages) VALUES($1,$2::date,$3::int[],$4,$5,$6,$7,$8) ON CONFLICT(student_id) DO UPDATE SET target_date=EXCLUDED.target_date,study_days=EXCLUDED.study_days,updated_by=EXCLUDED.updated_by,planning_completed_juz=EXCLUDED.planning_completed_juz,planning_direction=EXCLUDED.planning_direction,planning_mode=EXCLUDED.planning_mode,planning_partial_pages=EXCLUDED.planning_partial_pages,updated_at=now()",[sid,date,days,a.user.id,n,direction,mode,partial]);
 await audit(a.user.id,'target.updated','student',sid);res.json({ok:true});
}