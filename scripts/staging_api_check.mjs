#!/usr/bin/env node
// Synthetic in-memory database integration tests. No Hatchable data or remote APIs.
import assert from 'node:assert/strict';
import { NetlifyDB } from '@netlify/database-dev';
const local=new NetlifyDB();
const connection=await local.start();
process.env.NETLIFY_DB_URL=connection;
process.env.ACADEMY_STAGING_SETUP_TOKEN='QA_ISOLATED_SETUP_ONLY_NOT_A_PRODUCTION_SECRET';
const origin='https://academy-staging.invalid';
const expect=(x,n,label)=>assert.equal(x.status,n,label+' wanted '+n+' got '+x.status+' '+JSON.stringify(x.data));
const send=async (route,method='GET',body=null,session=null,extra={})=>{
  const headers={Origin:origin,...extra};
  if(body!==null)headers['Content-Type']='application/json';
  if(session){headers.Cookie=session.cookie;if(method!=='GET')headers['X-Academy-CSRF']=session.csrf;}
  const response=await gateway(new Request(origin+'/.netlify/functions/academy?__route='+encodeURIComponent(route),{
    method,headers,body:body===null?undefined:JSON.stringify(body)
  }));
  let data;try{data=await response.json();}catch{data={};}
  return {status:response.status,data,headers:response.headers};
};
const newSession=x=>({cookie:(x.headers.get('set-cookie')||'').split(';')[0],csrf:x.data.csrf});
const withStudentId=async (route,studentId,session)=>{
  const response=await gateway(new Request(origin+'/.netlify/functions/academy?__route='+encodeURIComponent(route)+'&student_id='+studentId,{
    headers:{Origin:origin,Cookie:session.cookie}
  }));
  return {status:response.status,data:await response.json()};
};
let gateway;
try{
 await local.applyMigrations('./netlify/database/migrations');
 ({default:gateway}=await import('../netlify/functions/academy.js'));
 let x=await send('api/identity/bootstrap','POST',{username:'qaadmin',display_name:'QA Test Admin',password:'ExampleSyntheticAdminPass2026'},null,{
  'x-academy-setup-token':process.env.ACADEMY_STAGING_SETUP_TOKEN
 });
 expect(x,201,'Staging admin bootstrap');
 x=await send('api/identity/login','POST',{username:'qaadmin',password:'ExampleSyntheticAdminPass2026'});
 expect(x,200,'Admin login');
 const admin=newSession(x);assert(admin.cookie.startsWith('academy_sid='));
 x=await send('api/identity/me','GET',null,admin);expect(x,200,'Admin session validation');
 x=await send('api/academy/accounts','POST',{role:'usthad',display_name:'QA Teacher'},admin);
 expect(x,201,'Create Usthad');assert(x.data.temporary_password&&x.data.username);
 const teacherUsername=x.data.username,firstPassword=x.data.temporary_password;
 x=await send('api/identity/login','POST',{username:teacherUsername,password:firstPassword});
 expect(x,200,'Usthad login');assert.equal(x.data.must_change_password,true);
 const teacher=newSession(x);
 x=await send('api/identity/change-password','POST',{current_password:firstPassword,new_password:'ExampleSyntheticTeacherPass2026'},teacher);
 expect(x,200,'Usthad first login password change');
 x=await send('api/identity/login','POST',{username:teacherUsername,password:'ExampleSyntheticTeacherPass2026'});
 expect(x,200,'Usthad login with new password');
 const freshTeacher=newSession(x);
 x=await send('api/academy/students','POST',{full_name:'QA Student',username:'qastudent1',password:'ExampleSyntheticStudentPass2026'},admin);
 expect(x,201,'Student registration');
 const admissionNumber=x.data.admission_number;
 x=await send('api/academy/students','GET',null,admin);expect(x,200,'Student list');
 const record=x.data.students.find(s=>s.admission_number===admissionNumber);
 assert(record?.id,'Created Student record missing');
 const id=Number(record.id);
 x=await send('api/identity/login','POST',{username:'qastudent1',password:'ExampleSyntheticStudentPass2026'});
 expect(x,200,'Student login');const student=newSession(x);
 x=await send('api/academy/overview','GET',null,student);expect(x,200,'Student dashboard');
 assert.equal(x.data.students.length,1);
 x=await send('api/academy/accounts','POST',{
   display_name:'QA Parent',role:'parent',username:'qaparent1',
   password:'ExampleSyntheticParentPass2026',student_ids:[id]
 },admin);
 expect(x,201,'Parent account creation');
 x=await send('api/identity/login','POST',{username:'qaparent1',password:'ExampleSyntheticParentPass2026'});
 expect(x,200,'Parent login');const parent=newSession(x);
 x=await send('api/academy/overview','GET',null,parent);expect(x,200,'Parent dashboard');
 assert.equal(x.data.students.length,1);
 x=await send('api/academy/accounts','GET',null,parent);expect(x,403,'Parent forbidden from Accounts API');
 x=await send('api/academy/students','POST',{full_name:'QA Invalid'}, {...admin,csrf:'invalid'});
 expect(x,403,'Bad CSRF must be rejected');
 x=await send('api/academy/monthly','POST',{
    student_id:id,month:'2026-11',new_pages:5,revision_pages:10,verified_total_pages:5,status:'published'
 },freshTeacher);
 expect(x,200,'Usthad monthly report publish');
 x=await withStudentId('api/academy/monthly',id,parent);
 expect(x,200,'Parent published monthly read');assert.equal(x.data.reports.length,1);
 x=await send('api/academy/gallery','POST',{
   video_url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   caption:'QA Video',rights_confirmed:'true',is_published:'true'
 },admin);
 expect(x,201,'Gallery video link save');
 x=await send('api/academy/gallery');expect(x,200,'Public Gallery');
 const item=x.data.gallery.find(t=>t.caption==='QA Video');assert(item?.id);
 x=await send('api/academy/gallery','DELETE',{id:Number(item.id),permanently_delete:true},admin);
 expect(x,200,'Gallery permanent deletion');
 x=await send('api/academy/gallery');expect(x,200,'Gallery after delete');
 assert(!x.data.gallery.some(t=>t.caption==='QA Video'));
 x=await send('api/identity/logout','POST',{},student);expect(x,200,'Student logout');
 x=await send('api/identity/me','GET',null,student);expect(x,401,'Student logout invalidates session');
 console.log(JSON.stringify({
  result:'EPHEMERAL_ACADEMY_API_PASS',
  admin_login:true,add_usthad:true,usthad_password_change:true,student_login:true,
  parent_login_scoping:true,monthly_report:true,csrf_access:true,
  gallery_link_publish_delete:true,logout:true,
  gallery_binary_upload:'NOT TESTED',hosted_staging:'NOT DEPLOYED',
  production_database_access:false
 },null,2));
}finally{await (await import('../lib/academy-runtime.js')).db.close();await local.stop();console.log('Disposable staging database destroyed.');}
