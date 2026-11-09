import {db,guard} from '../../lib/academy-auth.js';
export const access='public';
export const methods=['DELETE'];

export default async function(req,res){
 const admin=await guard(req,res,['admin'],true);
 if(!admin)return;
 // This is a separate destructive operation; a normal student DELETE must
 // never implicitly delete every student.
 if(req.method!=='DELETE'||req.body?.scope!=='ALL_STUDENTS'||req.body?.confirmed!==true)
  return res.status(400).json({error:'Explicit administrator bulk deletion confirmation is required.'});
 const expected=Number(req.body?.expected_count);
 if(!Number.isSafeInteger(expected)||expected<=0)
  return res.status(400).json({error:'Refresh the student count and confirm again.'});
 try{
  const result=await db.query(
   'SELECT academy_admin_delete_all_students($1::bigint,$2::bigint) AS result',
   [admin.user.id,expected]
  );
  const payload=result.rows?.[0]?.result;
  const outcome=typeof payload==='string'?JSON.parse(payload):payload;
  if(!outcome?.verified||outcome.removed_students!==expected)
   return res.status(500).json({error:'Database could not verify permanent student deletion.'});
  res.setHeader('Cache-Control','no-store');
  return res.json(outcome);
 }catch(e){
  if(e.code==='P0001')return res.status(409).json({error:'Student total changed or could not be safely deleted. Refresh the page and confirm again. Nothing was removed.'});
  if(e.code==='42501')return res.status(403).json({error:'Main Administrator permission is required.'});
  console.error('Bulk student delete failed',e?.code||'unknown',e?.message||'');
  return res.status(500).json({error:'Bulk deletion was not completed. Database changes were rolled back; reload to verify.'});
 }
}