import {db,makePassword,validPassword,shaHex,originAllowed,preventCache} from '../../lib/academy-auth.js';
export const access='public';
export const methods=['POST'];

// Restricted to one-time, owner-issued, random 256-bit QA tokens.
// Tokens are SHA-256 hashed at rest, time-limited, bound to one active Admin,
// consumed atomically and never issued through a public endpoint.
export default async function(req,res){
  preventCache(res);
  if(!originAllowed(req))return res.status(403).json({error:'Request rejected.'});
  const token=String(req.body?.token||''),password=req.body?.new_password;
  const invalid={error:'Recovery link is invalid or expired. Request a new owner-issued link.'};
  if(!/^[a-f0-9]{64}$/.test(token))return res.status(400).json(invalid);
  if(!validPassword(password))return res.status(400).json({error:'Choose 12–128 characters with letters and numbers.'});
  const {salt,hash,iterations}=await makePassword(password);
  const digest=await shaHex(token);
  const result=await db.query(`
WITH consumed AS (
  UPDATE academy_admin_recovery_tokens
     SET used_at=now()
   WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now()
   RETURNING account_id
),
changed AS (
  UPDATE academy_accounts_v2 a
     SET password_salt=$2,password_hash=$3,password_iterations=$4,
         must_change_password=false,failed_attempts=0,locked_until=NULL,updated_at=now()
    FROM consumed c
   WHERE a.id=c.account_id AND a.role='admin' AND a.active=true
   RETURNING a.id,a.username
),
revoke_sessions AS (
  DELETE FROM academy_sessions_v2
   WHERE account_id IN (SELECT id FROM changed)
   RETURNING id
),
clear_throttle AS (
  DELETE FROM academy_login_throttle_v2
   WHERE username IN (SELECT username FROM changed)
   RETURNING username
),
audit_recovery AS (
  INSERT INTO academy_audit_v2(actor_account_id,action,target_kind,target_id)
  SELECT id,'admin.password_recovered','account',id::text FROM changed
  RETURNING id
)
SELECT username FROM changed`,[digest,salt,hash,iterations]);
  if(!result.rows.length)return res.status(400).json(invalid);
  res.json({ok:true,username:result.rows[0].username});
}
