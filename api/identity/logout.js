import {db,guard,clearCookie} from '../../lib/academy-auth.js';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 const s=await guard(req,res,[],true);if(!s)return;
 await db.query('DELETE FROM academy_sessions_v2 WHERE id=$1 AND account_id=$2',[s.sessionId,s.user.id]);
 clearCookie(res);res.json({ok:true});
}