// STAGING ONLY: dedicated Neon Postgres for app and media — no Hatchable or production services.
import pg from 'pg';
const { Pool } = pg;
let pool;
function getPool(){
 if(pool)return pool;
 const url=process.env.ACADEMY_STAGING_DATABASE_URL;
 if(!url)throw Error('The isolated QA database is not configured.');
 const parsed=new URL(url);
 const host=parsed.hostname;
 if(parsed.protocol!=='postgres:'&&parsed.protocol!=='postgresql:')throw Error('PostgreSQL connection required.');
 if(!(host.endsWith('.neon.tech')||host==='localhost'||host==='127.0.0.1'))throw Error('Only the staging Neon or local QA database is allowed.');
 pool=new Pool({connectionString:url,max:4,idleTimeoutMillis:15000,connectionTimeoutMillis:10000});
 pool.on('error',e=>console.error('Staging DB idle connection failure',e.code||'DATABASE_UNAVAILABLE'));
 return pool;
}
export const db={
 async close(){if(pool){const current=pool;pool=null;await current.end();}},
 async query(sql,params=[]){const result=await getPool().query(sql,params);return {...result,rows:result.rows||[],count:result.rowCount||0,changes:result.rowCount||0};},
 async transaction(operations){const client=await getPool().connect(),results=[];try{await client.query('BEGIN');for(const operation of operations)results.push(await client.query(operation.sql,operation.params||[]));await client.query('COMMIT');return results;}catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}finally{client.release();}}
};
const link=key=>'/api/academy/media?key='+encodeURIComponent(key);
export const storage={
 async put(key,data,mime){
  const bytes=data instanceof Uint8Array?Buffer.from(data.buffer,data.byteOffset,data.byteLength):Buffer.from(data);
  await db.query('INSERT INTO academy_media_objects(storage_key,content_type,bytes) VALUES($1,$2,$3)',[key,String(mime||'application/octet-stream'),bytes]);
  return link(key);
 },
 async url(key){return link(key);},
 async head(key){const x=await db.query('SELECT storage_key,octet_length(bytes)::int AS length FROM academy_media_objects WHERE storage_key=$1',[key]);return x.rows[0]||null;},
 async del(key){await db.query('DELETE FROM academy_media_objects WHERE storage_key=$1',[key]);},
 async getStream(key){
  const x=await db.query('SELECT content_type,bytes FROM academy_media_objects WHERE storage_key=$1',[key]);
  if(!x.rows[0])return null;
  const row=x.rows[0],bytes=new Uint8Array(row.bytes);
  return {contentType:row.content_type,bytes,length:bytes.length,stream:new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}})};
 }
};
