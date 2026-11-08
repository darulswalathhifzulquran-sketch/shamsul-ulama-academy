import {db,guard,audit} from 'lib/academy-auth.js';
export const access='public';export const methods=['GET','POST'];
const START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
export default async function(req,res){
 const a=await guard(req,res,[],req.method==='POST');if(!a)return;
 const sid=Number(req.method==='GET'?req.query?.student_id:req.body?.student_id);
 if(!Number.isSafeInteger(sid)||sid<1)return res.status(400).json({error:'Valid student ID required.'});
 const staff=['admin','usthad'].includes(a.user.role);
 if(!staff){const v=await db.query('SELECT 1 FROM academy_links_v2 WHERE account_id=$1 AND student_id=$2',[a.user.id,sid]);if(!v.rows.length)return res.status(404).json({error:'Student not linked to this account.'});}
 if(req.method==='GET'){
 const query=staff?"SELECT juz_number,memorised_pages,completion_verified,accuracy_verified,accuracy_percent,dua_message,published_at FROM academy_juz_verifications WHERE student_id=$1 ORDER BY juz_number":"SELECT juz_number,memorised_pages,completion_verified,accuracy_verified,accuracy_percent,dua_message,published_at FROM academy_juz_verifications WHERE student_id=$1 AND published_at IS NOT NULL ORDER BY juz_number";
 const r=await db.query(query,[sid]);return res.json({juz:r.rows,sizes:START.slice(1).map((v,i)=>v-START[i])});
 }
 if(!staff)return res.status(403).json({error:'Only Usthad can verify Juz.'});
 const number=Number(req.body?.juz_number),pages=Number(req.body?.memorised_pages),complete=req.body?.completion_verified===true,accVerified=req.body?.accuracy_verified===true;
 const accuracy=req.body?.accuracy_percent==null||req.body?.accuracy_percent===''?null:Number(req.body.accuracy_percent);
 let dua=String(req.body?.dua_message||'').trim();
 if(!Number.isInteger(number)||number<1||number>30)return res.status(400).json({error:'Invalid Juz number.'});
 const size=START[number]-START[number-1];
 if(!Number.isInteger(pages)||pages<0||pages>size||complete&&pages!==size||accVerified&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>100)||dua.length>1600)return res.status(400).json({error:'Verify pages within Juz boundaries and accuracy between 0–100.'});
 const found=await db.query("SELECT id FROM academy_students WHERE id=$1 AND status='active'",[sid]);if(!found.rows.length)return res.status(404).json({error:'Student not found.'});
 if(complete&&!dua)dua='മാഷാ അല്ലാഹ്! അല്ലാഹു നിന്റെ ഹിഫ്‌ളിൽ ബറകത്ത് നൽകട്ടെ. അടുത്ത ജുസ്ഇലേക്ക് പ്രവേശിക്കുന്ന നിനക്കായി ഉസ്താദുമാരുടെ പ്രത്യേക പ്രാർത്ഥനകൾ. ആമീൻ.';
 const r=await db.query("INSERT INTO academy_juz_verifications(student_id,juz_number,memorised_pages,completion_verified,accuracy_verified,accuracy_percent,dua_message,verified_by_user_id,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()) ON CONFLICT(student_id,juz_number) DO UPDATE SET memorised_pages=EXCLUDED.memorised_pages,completion_verified=EXCLUDED.completion_verified,accuracy_verified=EXCLUDED.accuracy_verified,accuracy_percent=EXCLUDED.accuracy_percent,dua_message=EXCLUDED.dua_message,verified_by_user_id=EXCLUDED.verified_by_user_id,verified_at=now(),published_at=now(),updated_at=now() RETURNING juz_number,memorised_pages,completion_verified,accuracy_verified,published_at",
 [sid,number,pages,complete,accVerified,accuracy,dua||null,String(a.user.id)]);
 await audit(a.user.id,complete?'juz.completed':'juz.updated','juz',sid+'/'+number);return res.json({ok:true,verified:r.rows[0]});
}