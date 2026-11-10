#!/usr/bin/env node
// Staging-only end-to-end server handlers against disposable NetlifyDB.
// No external DB, real student data, secrets, or production deployment.
import assert from 'node:assert/strict';
import {NetlifyDB} from '@netlify/database-dev';
import {createAcademyServer} from '../server.mjs';
const isolated=new NetlifyDB();
const connection=await isolated.start();
process.env.ACADEMY_STAGING_DATABASE_URL=connection;
process.env.ACADEMY_STAGING_SETUP_TOKEN='QA_TEST_ONLY_NOT_A_REAL_SECRET';
const root='https://qa-staging.invalid';
const QA_DAY=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let gateway,server;
let steps=0;
function check(result,n,why){
 assert.equal(result.status,n,`${why}: expected HTTP ${n}, got ${result.status} ${JSON.stringify(result.data||{}).slice(0,500)}`);
 steps++;
 return result;
}
async function call(route,method='GET',body=null,session=null,extra={}){
 const headers={Origin:root,...extra};
 if(session?.cookie)headers.Cookie=session.cookie;
 if(session?.csrf&&method!=='GET')headers['X-Academy-CSRF']=session.csrf;
 if(body!==null&&!(body instanceof FormData)&&!(body instanceof Uint8Array))headers['Content-Type']='application/json';
 const payload=body===null?undefined:body instanceof FormData||body instanceof Uint8Array?body:JSON.stringify(body);
 const path='/.netlify/functions/academy?__route='+encodeURIComponent(route);
 const req=new Request(root+path,{method,headers,body:payload});
 const res=await gateway(req);
 let data={};if(res.headers.get('content-type')?.includes('json')){try{data=await res.json()}catch{}}
 return {status:res.status,headers:res.headers,data,response:res};
}
const logged=r=>({cookie:(r.headers.get('set-cookie')||'').split(';')[0],csrf:r.data.csrf});
const withId=(route,id,session)=>gateway(new Request(root+'/.netlify/functions/academy?__route='+encodeURIComponent(route)+'&id='+id,{headers:{Origin:root,Cookie:session.cookie}}));
const withParams=async(route,params,session,method='GET',body=null)=>{
 const url=root+'/.netlify/functions/academy?__route='+encodeURIComponent(route)+'&'+new URLSearchParams(params);
 const headers={Origin:root,Cookie:session.cookie};if(method!=='GET'){headers['Content-Type']='application/json';headers['X-Academy-CSRF']=session.csrf;}
 const resp=await gateway(new Request(url,{method,headers,body:body?JSON.stringify(body):undefined}));
 return {status:resp.status,data:resp.headers.get('content-type')?.includes('json')?await resp.json():{},response:resp};
};
async function submitApplication(name){
 const r=await call('api/academy/applications','POST',{
   student_name:name,guardian_name:'QA Guardian',guardian_phone:'0000000000',address:'Sample test address in Kerala',consent:true
 });
 check(r,201,'Public admission form saved');assert.match(r.data.application_number,/^SUIA-\d{4}-\d{5}$/);
 return r.data.application_number;
}
async function latestApplication(admin){
 const r=check(await call('api/academy/applications','GET',null,admin),200,'List admissions');
 return r.data.applications[0];
}
async function decide(admin,appId,status,extra={}){
 return call('api/academy/applications','PUT',{id:appId,status,...extra},admin);
}
try{
 await isolated.applyMigrations('./netlify/database/migrations');
 ({default:gateway}=await import('../netlify/functions/academy.js'));
 const boot=check(await call('api/identity/bootstrap','POST',{username:'qaadmin',display_name:'QA Administrator',password:'QAAcademyAdministrator2026'},null,{'x-academy-setup-token':process.env.ACADEMY_STAGING_SETUP_TOKEN}),201,'Admin bootstrap');
 const admin=logged(check(await call('api/identity/login','POST',{username:'qaadmin',password:'QAAcademyAdministrator2026'}),200,'Admin login'));
 await submitApplication('QA Student Rejected Then Approved');
 let app=await latestApplication(admin);
 check(await decide(admin,app.id,'rejected',{reason:'QA: requires another interview'}),200,'Reject & save');
 let d=await withId('api/academy/applications',app.id,admin);
 assert.equal((await d.json()).application.status,'rejected');steps++;
 check(await decide(admin,app.id,'approved'),200,'Approve previously rejected admission');
 let r=check(await call('api/academy/students','GET',null,admin),200,'Student created in database');
 assert.equal(r.data.students.length,1);
 check(await decide(admin,app.id,'approved'),200,'Idempotent re-approval');
 r=await call('api/academy/students','GET',null,admin);assert.equal(r.data.students.length,1);steps++;
 let pdf=await withId('api/academy/application-print',app.id,admin);
 assert.equal(pdf.status,200);assert.match(pdf.headers.get('content-type')||'',/text\/html/);
 const html=await pdf.text();assert(html.includes('SHAMSUL ULAMA')&&html.includes('Print / Save as PDF')&&html.includes('QA Student Rejected Then Approved'));steps++;
 // Approved admissions must NEVER silently delete the student account.
 check(await decide(admin,app.id,'cancelled'),409,'Prevent cancellation of approved account');
 await submitApplication('QA Student Interview Then Cancel');app=await latestApplication(admin);
 check(await decide(admin,app.id,'interview',{interview_at:'2026-11-21T10:00:00.000Z'}),200,'Move to Interview');
 check(await decide(admin,app.id,'cancelled',{reason:'QA cancellation'}),200,'Cancel admission without deleting record');
 d=await withId('api/academy/applications',app.id,admin);let full=await d.json();
 assert.equal(full.application.status,'cancelled');assert(full.history.some(x=>x.to_status==='cancelled'));steps++;
 check(await decide(admin,app.id,'under_review'),200,'Reopen cancelled application');
 check(await decide(admin,app.id,'interview',{interview_at:'2026-11-23T11:30:00.000Z'}),200,'Reschedule interview');
 r=check(await decide(admin,app.id,'approved'),200,'Approve after cancellation + interview');
 assert.equal(r.data.account_created,true);assert(r.data.username&&r.data.temporary_password);
 const student=logged(check(await call('api/identity/login','POST',{username:r.data.username,password:r.data.temporary_password}),200,'Approved Student login'));
 const sid=r.data.student_id;
 r=check(await call('api/academy/revision','POST',{student_id:sid,note_date:QA_DAY,new_pages:1,revision_pages:4,note:'QA personal study notes'},student),200,'Student daily revision save');
 assert(r.data.saved===true);
 r=check(await withParams('api/academy/revision',{student_id:sid},student),200,'Student revision notes read');
 assert.equal(r.data.notes.length,1);assert.equal(r.data.can_edit,true);
 const parentInfo=check(await call('api/academy/accounts','POST',{display_name:'QA Parent',role:'parent',username:'qaparent1',password:'QAParentInitial2026',student_ids:[Number(sid)]},admin),201,'Parent linked to Student');
 const parent=logged(check(await call('api/identity/login','POST',{username:'qaparent1',password:'QAParentInitial2026'}),200,'Parent login'));
 r=check(await withParams('api/academy/revision',{student_id:sid},parent),200,'Linked Parent can read revision');assert.equal(r.data.can_edit,false);
 check(await call('api/academy/revision','POST',{student_id:sid,note_date:QA_DAY,new_pages:7,revision_pages:9,note:'Should fail'},parent),403,'Parent cannot change student notes');
 check(await call('api/academy/revision','POST',{student_id:999999,note_date:QA_DAY,new_pages:2,revision_pages:5},student),404,'Student cannot write unrelated records');
 const jpeg=new Uint8Array(10000);jpeg.set([0xff,0xd8,0xff,0xe0]);
 const form=new FormData();form.set('file',new File([jpeg],'qa.jpg',{type:'image/jpeg'}));form.set('caption','QA Photo');form.set('rights_confirmed','true');form.set('is_published','true');
 r=check(await call('api/academy/gallery','POST',form,admin),201,'Gallery direct photo upload persisted in QA database');
 const mediaId=r.data.id;
 const gallery=check(await call('api/academy/gallery'),200,'Public Gallery');assert(gallery.data.gallery.length>=1);
 const mediaURL=gallery.data.gallery.find(x=>x.id===mediaId).image_url;
 assert(mediaURL.startsWith('/api/academy/media?key='));
 const url=new URL(mediaURL,root);const key=url.searchParams.get('key');
 r=check(await withParams('api/academy/media',{key},admin),200,'Saved Gallery media served');
 const binary=await r.response.arrayBuffer();assert.equal(binary.byteLength,jpeg.length);
 const rangeResp=await gateway(new Request(root+'/.netlify/functions/academy?__route=api%2Facademy%2Fmedia&key='+encodeURIComponent(key),{headers:{Origin:root,Range:'bytes=0-3'}}));
 assert.equal(rangeResp.status,206);assert.equal((await rangeResp.arrayBuffer()).byteLength,4);steps++;
 // Chunked 5 MB video: exercise actual binary transport, DB reassembly, gallery saving.
 const video=new Uint8Array(5*1024*1024);video.set([0,0,0,20,102,116,121,112,105,115,111,109]);
 r=check(await call('api/academy/gallery-chunks','POST',{action:'start',filename:'qa.mp4',mime:'video/mp4',size:video.length,caption:'QA chunked video',rights_confirmed:true,is_published:'true'},admin),201,'Start 5MiB chunked video upload');
 const id=r.data.upload_id,size=r.data.chunk_size;
 for(let i=0;i<r.data.chunks;i++){
  const frag=video.slice(i*size,Math.min(video.length,(i+1)*size));
  const request=new Request(root+'/.netlify/functions/academy?__route=api%2Facademy%2Fgallery-chunks&upload_id='+id+'&index='+i,{method:'PUT',headers:{Origin:root,Cookie:admin.cookie,'X-Academy-CSRF':admin.csrf,'Content-Type':'application/octet-stream'},body:frag});
  const response=await gateway(request);assert.equal(response.status,200,`Video chunk ${i} HTTP ${response.status}`);steps++;
 }
 r=check(await call('api/academy/gallery-chunks','POST',{action:'finish',upload_id:id},admin),201,'Commit 5MiB video through original gallery backend');
 const videoId=r.data.id;
 check(await call('api/academy/gallery','DELETE',{id:mediaId,permanently_delete:true},admin),200,'Delete QA photo and its storage');
 check(await call('api/academy/gallery','DELETE',{id:videoId,permanently_delete:true},admin),200,'Delete QA video and its storage');
 // Test real Railway Node transport without binding any public port.
 server=createAcademyServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 let httpRes=await fetch(base+'/');assert.equal(httpRes.status,200);assert((await httpRes.text()).includes('SHAMSUL'));steps++;
 httpRes=await fetch(base+'/assets/site.js');assert.equal(httpRes.status,200);steps++;
 httpRes=await fetch(base+'/.env');assert.equal(httpRes.status,404);steps++;
 httpRes=await fetch(base+'/api/identity/me');assert.equal(httpRes.status,401);steps++;
 httpRes=await fetch(base+'/dashboard',{redirect:'manual'});assert.equal(httpRes.status,302);steps++;
 console.log(JSON.stringify({status:'ACADEMY_STAGING_ACCEPTANCE_PASS',checks:steps,admission_rejected_to_approved:true,cancel_interview_restore:true,duplicate_account_prevented:true,print_save_as_pdf_template:true,student_daily_notes_private:true,parent_readonly:true,media_photo_database_storage:true,media_5MiB_chunked_video:true,media_range_and_delete:true,node_http_frontend_backend:true,hosted_railway_or_netlify:'NOT TESTED',production_students_migrated:false},null,2));
} finally {
 if(server)await new Promise(resolve=>server.close(resolve));
 await (await import('../lib/academy-runtime.js')).db.close();
 await isolated.stop();
}
