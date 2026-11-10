// Railway/Node 22 staging server for the original Academy frontend + backend.
// Required: ACADEMY_STAGING_DATABASE_URL (Neon QA), ACADEMY_STAGING_SETUP_TOKEN.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import gateway from './netlify/functions/academy.js';
const dir=resolve('public'),MAX_REQUEST=18*1024*1024;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const indexed={'/':'index.html','/login':'login.html','/change-password':'change-password.html','/setup':'setup.html'};
function noindex(res){res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('X-Content-Type-Options','nosniff');}
async function writeResponse(res,response){
 res.statusCode=response.status;
 for(const [name,value] of response.headers){if(name.toLowerCase()==='set-cookie')res.setHeader('Set-Cookie',value);else res.setHeader(name,value);}
 if(!response.body){res.end();return;}
 for await(const chunk of response.body){if(!res.write(chunk))await new Promise(done=>res.once('drain',done));}
 res.end();
}
export function createAcademyServer(){return http.createServer(async(req,res)=>{
 noindex(res);
 try{
  const host=req.headers.host||'localhost',protocol=(req.headers['x-forwarded-proto']==='https'?'https':'http');
  const url=new URL(req.url||'/',protocol+'://'+host),path=url.pathname;
  if(path.startsWith('/api/')||path==='/staff'||path==='/dashboard'){
   if(!['GET','POST','PUT','DELETE','HEAD'].includes(req.method||'')){res.writeHead(405);res.end();return;}
   let total=0;const chunks=[];
   if(req.method!=='GET'&&req.method!=='HEAD'){
    if(Number(req.headers['content-length']||0)>MAX_REQUEST){res.writeHead(413);res.end('Request too large');return;}
    for await(const chunk of req){total+=chunk.length;if(total>MAX_REQUEST){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
   }
   // The Fetch Request is only a transport adapter; original app permission and CSRF checks still run.
   const route=path==='/staff'?'staff':path==='/dashboard'?'dashboard':path.slice(1);
   url.searchParams.set('__route',route);
   const request=new Request(url.href,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
   await writeResponse(res,await gateway(request));return;
  }
  if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405);res.end();return;}
  let raw=indexed[path]||(path.startsWith('/assets/')?path.slice(1):null);
  if(!raw){res.writeHead(404);res.end('Not found');return;}
  const full=resolve(dir,raw);
  if(full!==dir&&!full.startsWith(dir+sep)){res.writeHead(403);res.end();return;}
  let bytes;try{const x=await stat(full);if(!x.isFile())throw Error('No file');bytes=await readFile(full);}catch{res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',types[extname(full)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.statusCode=200;res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){console.error('Staging server error',error.code||'INTERNAL');if(!res.headersSent){res.statusCode=500;res.setHeader('Content-Type','application/json');}res.end(JSON.stringify({error:'Staging request failed.'}));}
});}
if(process.argv.includes('--serve')){
 if(!process.env.ACADEMY_STAGING_DATABASE_URL||!process.env.ACADEMY_STAGING_SETUP_TOKEN)throw Error('QA database and setup token must be configured before launch.');
 const port=Number(process.env.PORT||3000);createAcademyServer().listen(port,'0.0.0.0',()=>console.log('Academy staging server listening on port '+port));
}
