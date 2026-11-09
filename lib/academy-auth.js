import { db } from './academy-runtime.js';

const ITERATIONS=310000;
const enc=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
const unhex=str=>new Uint8Array((str.match(/.{2}/g)||[]).map(h=>parseInt(h,16)));
function randomHex(bytes=32){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return hex(b);}
async function shaHex(input){const digest=await crypto.subtle.digest('SHA-256',typeof input==='string'?enc.encode(input):input);return hex(digest);}
async function passwordHash(password,salt,iterations=ITERATIONS){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations,hash:'SHA-256'},key,256);
 return hex(bits);
}
export function normalizeUsername(s){return String(s||'').trim().toLowerCase();}
export function validUsername(s){return /^[a-z][a-z0-9._-]{3,31}$/.test(s);}
export function validPassword(s){return typeof s==='string'&&s.length>=12&&s.length<=128&&/[A-Za-z]/.test(s)&&/[0-9]/.test(s);}
export async function makePassword(password){if(!validPassword(password))throw Error('Password must contain 12–128 characters, including letters and numbers.');const salt=randomHex(16);return {salt,hash:await passwordHash(password,salt),iterations:ITERATIONS};}
export async function verifyPassword(password,row){const given=await passwordHash(typeof password==='string'?password:'',row.password_salt,Number(row.password_iterations)||ITERATIONS);return constantHex(given,row.password_hash);}
function constantHex(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function cookieValue(req,name){const raw=String(req.headers?.cookie||'');const entry=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='));return entry?entry.slice(name.length+1):null;}
function setCookie(res,token,maxAge=604800){res.setHeader('Set-Cookie','academy_sid='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+maxAge);}
export function clearCookie(res){setCookie(res,'',0);}
export function preventCache(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');}
export function originAllowed(req){
 const origin=String(req.headers?.origin||'');
 if(!origin)return true;
 try{const h=String(req.headers?.host||'');const o=new URL(origin);return o.protocol==='https:'&&o.host===h;}catch{return false;}
}
export function csrfFromToken(token){return shaHex('academy-csrf:'+token);}
export async function checkCsrf(req,auth){
 const provided=String(req.headers?.['x-academy-csrf']||'');
 return /^[a-f0-9]{64}$/.test(provided)&&constantHex(provided,await csrfFromToken(auth.token))&&originAllowed(req);
}
export async function startSession(res,accountId){
 const raw=randomHex(32),hash=await shaHex(raw);
 await db.query("INSERT INTO academy_sessions_v2(account_id,token_hash,expires_at) VALUES($1,$2,now()+interval '7 days')",[accountId,hash]);
 setCookie(res,raw);preventCache(res);
 return {csrf:await csrfFromToken(raw)};
}
export async function getAccount(req){
 const token=cookieValue(req,'academy_sid');
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await shaHex(token);
 const found=await db.query("SELECT a.id,a.username,a.display_name,a.role,a.active,a.must_change_password,s.id AS session_id,s.expires_at FROM academy_sessions_v2 s JOIN academy_accounts_v2 a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active=true LIMIT 1",[hash]);
 if(!found.rows.length)return null;
 return {user:found.rows[0],token,sessionId:found.rows[0].session_id};
}
export async function guard(req,res,roles=[],mutate=false){
 preventCache(res);
 const session=await getAccount(req);
 if(!session){res.status(401).json({error:'Sign in required.'});return null;}
 if(roles.length&&!roles.includes(session.user.role)){res.status(403).json({error:'Not authorised.'});return null;}
 if(mutate&&!await checkCsrf(req,session)){res.status(403).json({error:'Request verification failed.'});return null;}
 return session;
}
export async function audit(actor,action,kind=null,target=null){
 await db.query("INSERT INTO academy_audit_v2(actor_account_id,action,target_kind,target_id) VALUES($1,$2,$3,$4)",[actor,action,kind,target==null?null:String(target)]);
}
export {db,ITERATIONS,randomHex,shaHex,constantHex};