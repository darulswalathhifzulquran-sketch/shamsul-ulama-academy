import {db,makePassword,normalizeUsername,validUsername,validPassword,audit} from '../../lib/academy-auth.js';
export const access='admin';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const count=await db.query("SELECT COUNT(*)::int AS n FROM academy_accounts_v2 WHERE role='admin'");
 if(req.method==='GET')return res.json({setupRequired:Number(count.rows[0].n)===0});
 if(Number(count.rows[0].n)>0)return res.status(409).json({error:'Administrator already configured. Please use the ordinary login.'});
 const username=normalizeUsername(req.body?.username),password=req.body?.password,display=String(req.body?.display_name||'').trim();
 if(!validUsername(username)||!validPassword(password)||display.length<2||display.length>90)return res.status(400).json({error:'Use a username of 4–32 characters and a password of at least 12 characters containing letters and numbers.'});
 const {salt,hash,iterations}=await makePassword(password);
 try{const result=await db.query("INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash,password_iterations,must_change_password) SELECT $1,$2,'admin',$3,$4,$5,false WHERE NOT EXISTS(SELECT 1 FROM academy_accounts_v2 WHERE role='admin') RETURNING id,username",[username,display,salt,hash,iterations]);
 if(!result.rows.length)return res.status(409).json({error:'Administrator has already been configured.'});
 await audit(result.rows[0].id,'admin.bootstrap','account',result.rows[0].id);
 return res.status(201).json({ok:true,username:result.rows[0].username});}catch(e){if(e.code==='23505')return res.status(409).json({error:'Administrator already configured.'});throw e;}
}