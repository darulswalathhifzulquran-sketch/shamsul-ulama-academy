// STAGING ONLY: authenticated 2MiB chunks persisted in Neon QA PostgreSQL.
// Final assembly uses original Academy gallery backend, file sniffing and audit.
import {db} from './academy-runtime.js';
import {getAccount,checkCsrf} from './academy-auth.js';
import galleryHandler from '../api/academy/gallery.js';
const SIZE=2*1024*1024,MAX=16*1024*1024;
const reply=(code,data)=>Response.json(data,{status:code,headers:{'Cache-Control':'no-store'}});
async function sessionFor(req){
 const account=await getAccount(req);
 if(!account)return {error:reply(401,{error:'Sign in required.'})};
 if(!['admin','usthad'].includes(account.user.role))return {error:reply(403,{error:'Not authorised.'})};
 if(!await checkCsrf(req,account))return {error:reply(403,{error:'Request verification failed.'})};
 return {account};
}
async function manifest(id,accountId){
 if(!/^[a-f0-9-]{36}$/.test(id))return null;
 const r=await db.query("SELECT metadata FROM academy_media_upload_sessions WHERE upload_id=$1::uuid AND account_id=$2 AND created_at>now()-interval '20 minutes'",[id,accountId]);
 return r.rows[0]?.metadata||null;
}
export async function handleChunkUpload(request,req,url,makeResponse){
 const {account,error}=await sessionFor(req);if(error)return error;
 if(req.method==='POST'&&req.body?.action==='start'){
  const size=Number(req.body?.size),mime=String(req.body?.mime||''),name=String(req.body?.filename||'').slice(0,200);
  if(!Number.isSafeInteger(size)||size<1||size>MAX)return reply(400,{error:'Media must not exceed 16 MiB.'});
  if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(mime))return reply(415,{error:'Unsupported file format.'});
  if(!name||req.body?.rights_confirmed!==true)return reply(400,{error:'Name and publishing rights confirmation required.'});
  const meta={size,chunks:Math.ceil(size/SIZE),mime,filename:name,form:{caption:String(req.body?.caption||'').slice(0,251),alt_text:String(req.body?.alt_text||'').slice(0,251),display_order:String(req.body?.display_order||0),is_published:req.body?.is_published==='true'?'true':'false',rights_confirmed:'true',video_url:''}};
  const id=crypto.randomUUID();
  // Lazily clean up abandoned uploads. Cascades remove orphan chunks.
  await db.query("DELETE FROM academy_media_upload_sessions WHERE created_at<now()-interval '30 minutes'");
  await db.query('INSERT INTO academy_media_upload_sessions(upload_id,account_id,metadata) VALUES($1,$2,$3::jsonb)',[id,account.user.id,JSON.stringify(meta)]);
  return reply(201,{ok:true,upload_id:id,chunk_size:SIZE,chunks:meta.chunks});
 }
 const id=String(req.method==='PUT'?url.searchParams.get('upload_id'):req.body?.upload_id||'');
 const meta=await manifest(id,account.user.id);
 if(!meta)return reply(404,{error:'Upload expired or inaccessible.'});
 if(req.method==='PUT'){
  const index=Number(url.searchParams.get('index'));
  if(!Number.isSafeInteger(index)||index<0||index>=meta.chunks)return reply(400,{error:'Invalid chunk index.'});
  const bytes=new Uint8Array(await request.arrayBuffer());
  if(bytes.length!==Math.min(SIZE,meta.size-index*SIZE))return reply(400,{error:'Chunk length mismatch.'});
  await db.query('INSERT INTO academy_media_upload_parts(upload_id,part_index,bytes) VALUES($1,$2,$3) ON CONFLICT(upload_id,part_index) DO UPDATE SET bytes=EXCLUDED.bytes',[id,index,Buffer.from(bytes)]);
  return reply(200,{ok:true,index,received:bytes.length});
 }
 if(req.method==='POST'&&req.body?.action==='cancel'){
  await db.query('DELETE FROM academy_media_upload_sessions WHERE upload_id=$1 AND account_id=$2',[id,account.user.id]);
  return reply(200,{ok:true,cancelled:true});
 }
 if(req.method==='POST'&&req.body?.action==='finish'){
  const r=await db.query('SELECT part_index,bytes FROM academy_media_upload_parts WHERE upload_id=$1 ORDER BY part_index',[id]);
  if(r.rows.length!==meta.chunks)return reply(409,{error:'Upload missing chunks.'});
  let total=0;for(let i=0;i<r.rows.length;i++){const part=r.rows[i];if(Number(part.part_index)!==i||part.bytes.length!==Math.min(SIZE,meta.size-i*SIZE))return reply(409,{error:'Incomplete file part.'});total+=part.bytes.length;}
  if(total!==meta.size)return reply(409,{error:'Upload length mismatch.'});
  const combined=new Uint8Array(total);let pos=0;
  for(const part of r.rows){combined.set(part.bytes,pos);pos+=part.bytes.length;}
  const virtualReq={...req,method:'POST',body:meta.form,files:[{field:'file',filename:meta.filename,contentType:meta.mime,buffer:combined}]};
  const output=makeResponse();await galleryHandler(virtualReq,output);const result=output.finalize();
  if(result.status>=200&&result.status<300){try{await db.query('DELETE FROM academy_media_upload_sessions WHERE upload_id=$1 AND account_id=$2',[id,account.user.id]);}catch{console.warn('QA media cleanup deferred.');}}
  return result;
 }
 return reply(400,{error:'Invalid upload action.'});
}
