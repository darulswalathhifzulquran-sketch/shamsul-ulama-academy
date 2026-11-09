(()=>{'use strict';
const $=id=>document.getElementById(id);
let csrf='',role='',students=[],accounts=[],settings={},gallery=[],enquiries=[],applications=[],currentApplication=null;
const JUZ=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
const $form=(id)=>Object.fromEntries(new FormData($(id)).entries());
function status(msg,error=false){$('status').textContent=msg;$('status').className=error?'error':'success';}
// Every irreversible deletion requires TWO separate warnings; the second requires typing DELETE.
function confirmPermanentDelete(kind,name,detail){
 if(!window.confirm('WARNING 1 OF 2 — Delete '+kind+' "'+name+'"?\\n'+detail+'\\nThis cannot be undone.'))return false;
 return window.prompt('FINAL WARNING 2 OF 2 — Permanently delete '+kind+' "'+name+'".\\n'+detail+'\\nType DELETE exactly to confirm:')==='DELETE';
}
async function deleteStudent(student){
 if(!confirmPermanentDelete('student',student.full_name,'The student login, private journey, monthly reports, Juz verifications and linked access will be removed.'))return;
 try{await api('/api/academy/students','DELETE',{student_id:Number(student.id),confirmed:true,confirmation_text:'DELETE'});status('Student deleted from the database.');await Promise.all([refreshStudents(),refreshAccounts()]);}
 catch(e){status('Not deleted: '+e.message,true);}
}
function resetStudentForm(){
 const f=$('studentForm');f.reset();delete f.dataset.editId;
 for(const key of ['username','password']){const input=f.elements[key];input.disabled=false;input.required=true;input.closest('label').hidden=false;}
 f.elements.admission_number.disabled=false;
 $('studentSaveButton').textContent='Add Student & Create Account';
 $('cancelStudentEdit').hidden=true;
}
function editStudent(student){
 const f=$('studentEditForm');
 f.reset();
 f.elements.student_id.value=String(student.id);
 for(const key of ['full_name','username','admission_number','batch_name','contact_phone','guardian_name','guardian_phone','date_of_birth','postal_address','notes']){
  const input=f.elements[key];if(!input)continue;
  const v=student[key];
  input.value=v==null?'':key==='date_of_birth'?String(v).slice(0,10):String(v);
 }
 f.elements.active.checked=student.login_active===true;
 $('studentEditHeading').textContent='Edit Student — '+student.full_name;
 $('studentEditMessage').textContent='';
 $('studentEditDialog').showModal();
}
async function deleteAccount(account){
 if(account.role==='student'){status('Use Student Admission to delete the student and account together.',true);return;}
 if(!confirmPermanentDelete(account.role,account.display_name+' ('+account.username+')','The login will be permanently revoked, including all active sessions.'))return;
 try{await api('/api/academy/accounts','DELETE',{account_id:Number(account.id),confirmed:true,confirmation_text:'DELETE'});status('Account permanently deleted.');await refreshAccounts();}
 catch(e){status('Not deleted: '+e.message,true);}
}
function editAccount(account){
 if(account.role==='student'){
  const s=students.find(st=>(account.admissions||[]).includes(st.admission_number)||st.username===account.username);
  if(!s){status('Student details not found. Open Student Admission to manage this student.',true);return;}
  editStudent(s);return;
 }
 const f=$('accountEditForm');f.reset();
 const fields=['display_name','username','contact_phone','email','notes'];
 f.elements.account_id.value=String(account.id);
 for(const field of fields)f.elements[field].value=String(account[field]??'');
 f.elements.active.checked=account.active===true;
 $('accountEditRole').value=String(account.role||'').toUpperCase();
 $('accountEditCreated').value=account.created_at?new Date(account.created_at).toLocaleDateString('en-IN'):'—';
 $('accountEditHeading').textContent='Edit '+(account.role==='usthad'?'Usthad':'Parent')+' Account';
 $('accountParentLinks').hidden=account.role!=='parent';
 options($('accountEditStudents'),students);
 for(const opt of $('accountEditStudents').options)opt.selected=(account.student_ids||[]).some(id=>Number(id)===Number(opt.value));
 $('accountEditMessage').textContent='';
 $('accountEditDialog').showModal();
}
async function api(path,method='GET',data=null,isFile=false){
 const headers={};
 if(method!=='GET')headers['X-Academy-CSRF']=csrf;
 if(!isFile&&data!==null)headers['Content-Type']='application/json';
 const res=await fetch(path,{method,credentials:'include',headers,body:data===null?undefined:isFile?data:JSON.stringify(data)});
 let json;try{json=await res.json();}catch{throw Error('The server returned an invalid response.');}
 if(!res.ok)throw Error(json.error||'Request was not accepted ('+res.status+').');return json;
}
function empty(el,msg){el.replaceChildren();const p=document.createElement('p');p.className='hint';p.textContent=msg;el.append(p);}
function text(tag,value,cls=''){const el=document.createElement(tag);el.textContent=String(value??'');if(cls)el.className=cls;return el;}
function entry(root,title,meta,actions=[]){const row=text('div','','entry');const info=document.createElement('div');info.append(text('strong',title),text('div',meta,'hint'));row.append(info);if(actions.length){const right=text('div','','actions');for(const [caption,handler,cls='outline'] of actions){const b=text('button',caption,cls);b.type='button';b.addEventListener('click',handler);right.append(b);}row.append(right);}root.append(row);}
function options(sel,arr,key='id',label='full_name'){sel.replaceChildren();for(const x of arr)sel.append(new Option(x[label]+' · '+(x.admission_number||''),String(x[key])));}
function studentDropdowns(){document.querySelectorAll('.studentOptions').forEach(sel=>options(sel,students));options($('previewStudent'),students);options($('parentStudents'),students);}
async function refreshStudents(){const r=await api('/api/academy/students');students=r.students||[];studentDropdowns();$('statStudents').textContent=students.length;const el=$('studentsList');el.replaceChildren();if(!students.length)empty(el,'No students admitted yet.');for(const s of students)entry(el,s.full_name,s.admission_number+' · '+(s.batch_name||'No batch'),[['Edit',()=>editStudent(s)],['Delete',()=>deleteStudent(s),'danger']]);await refreshMonthly().catch(()=>{});await refreshJuz().catch(()=>{});}
async function refreshAccounts(){const r=await api('/api/academy/accounts');accounts=r.accounts||[];$('statAccounts').textContent=accounts.length;const el=$('accountsList');el.replaceChildren();$('resetAccount').replaceChildren();
 for(const a of accounts){
  if(a.role!=='admin')$('resetAccount').append(new Option(a.display_name+' · '+a.username,String(a.id)));
  const mayManage=a.role!=='admin'&&(a.role!=='usthad'||role==='admin');
  const actions=mayManage?[
    ['Edit',()=>editAccount(a)],
    [(a.active?'Deactivate':'Activate'),async()=>{if(!window.confirm('Change access for '+a.username+'?'))return;try{await api('/api/academy/accounts','PUT',{account_id:Number(a.id),active:!a.active});status('Account status updated.');await refreshAccounts();}catch(e){status(e.message,true);}},a.active?'danger':'outline']
  ]:[];
  if(mayManage)actions.push(['Delete',()=>{if(a.role==='student'){const s=students.find(st=>(a.admissions||[]).includes(st.admission_number)||st.username===a.username);if(s)deleteStudent(s);else status('Linked student not found.',true);}else deleteAccount(a);},'danger']);
  entry(el,a.display_name+' · '+a.username,a.role.toUpperCase()+' · '+(a.active?'Active':'Disabled')+' · '+(a.admissions||[]).join(', '),actions);
 }
 renderUsthads();
}
function renderUsthads(){
 const root=$('usthadsList');if(!root)return;root.replaceChildren();
 const list=accounts.filter(a=>a.role==='admin'||a.role==='usthad');
 if(!list.length)return empty(root,'No Usthad accounts yet.');
 for(const a of list)entry(root,a.display_name+' · '+a.username,a.role.toUpperCase()+' · '+(a.active?'Active':'Disabled'),a.role==='usthad'&&role==='admin'?[['Edit',()=>editAccount(a)],['Delete',()=>deleteAccount(a),'danger']]:[]);
}
async function refreshEnquiries(){const r=await api('/api/academy/enquiries');enquiries=r.enquiries||[];$('statEnquiries').textContent=enquiries.filter(e=>e.status==='new').length;const el=$('enquiriesList');el.replaceChildren();if(!enquiries.length)empty(el,'No enquiries received.');for(const e of enquiries){const actions=e.status==='closed'?[]:[['Mark Contacted',()=>changeEnquiry(e.id,'contacted')],['Close',()=>changeEnquiry(e.id,'closed')]];entry(el,e.guardian_name+' · '+e.phone,(e.student_name||'')+' · '+(e.notes||'')+' · '+e.status,actions);}}
async function changeEnquiry(id,state){try{await api('/api/academy/enquiries','PUT',{id,status:state});status('Enquiry marked '+state);await refreshEnquiries();}catch(e){status(e.message,true);}}
async function refreshSettings(){const r=await api('/api/academy/settings');settings=r.settings||{};const f=$('settingsForm');for(const el of f.elements){if(!el.name)continue;el.value=settings[el.name]??'';}}
async function refreshGallery(){
 const r=await api('/api/academy/gallery?manage=1');gallery=r.gallery||[];
 const root=$('galleryList');root.replaceChildren();
 if(!gallery.length)empty(root,'No academy photos or videos uploaded yet.');
 for(const item of gallery){
  const fig=document.createElement('figure');
  let visual;
  if(item.media_type==='video'){
   if(item.image_url.startsWith('https://www.youtube-nocookie.com/embed/')||item.image_url.startsWith('https://player.vimeo.com/video/')){
    visual=document.createElement('iframe');visual.src=item.image_url;visual.loading='lazy';visual.title=item.alt_text||item.caption||'Academy video';visual.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';visual.allowFullscreen=true;visual.referrerPolicy='strict-origin-when-cross-origin';
   }else{
    visual=document.createElement('video');visual.src=item.image_url;visual.controls=true;visual.preload='metadata';visual.playsInline=true;
   }
  }else{
   visual=document.createElement('img');visual.src=item.image_url;visual.alt=item.alt_text||item.caption||'Academy photograph';visual.loading='lazy';
  }
  const label=(item.caption|| (item.media_type==='video'?'Academy Video':'Academy Photograph'))+(item.is_published?' · Published · Visible on website':' · Draft · NOT visible on website');
  const cap=text('figcaption',label);
  const actions=document.createElement('div');actions.className='galleryActions';
  const publish=text('button',item.is_published?'Unpublish (hide)':'Publish to website',item.is_published?'outline':'');
  publish.type='button';
  publish.addEventListener('click',async()=>{
   const newState=!item.is_published;
   if(newState&&!window.confirm('Publish this '+(item.media_type==='video'?'video':'photograph')+' on the public Academy Gallery? Make sure it is academy-related and you have permission.'))return;
   publish.disabled=true;
   try{
    await api('/api/academy/gallery','PUT',{id:Number(item.id),is_published:newState});
    status(newState?'Published on the public Gallery.':'Removed from public Gallery; saved as Draft.');
    await refreshGallery();
   }catch(e){status('Could not change publication: '+e.message,true);publish.disabled=false;}
  });
  const remove=text('button','Delete Permanently','danger');remove.type='button';
  remove.title='Delete this gallery media permanently now. No typing required.';
  remove.addEventListener('click',async()=>{
   if(remove.disabled)return;
   const itemId=Number(item.id);
   remove.disabled=true;publish.disabled=true;
   remove.textContent='Deleting...';
   try{
    const result=await api('/api/academy/gallery','DELETE',{id:itemId,permanently_delete:true});
    if(!result.ok||!result.verified||!result.permanently_deleted)throw Error('Server could not verify that the item was deleted.');
    // Remove from the visible list immediately; follow up with a server refresh.
    fig.remove();
    gallery=gallery.filter(g=>Number(g.id)!==itemId);
    status('DELETED PERMANENTLY. File storage (if managed here) and Gallery database were checked. No typing required.');
    try{await refreshGallery();}catch(e){console.warn('Gallery reload after verified delete failed',e);}
   }catch(e){
    status('Unable to complete permanent deletion: '+e.message,true);
    remove.disabled=false;publish.disabled=false;remove.textContent='Delete Permanently';
   }
  });
  actions.append(publish,remove);fig.append(visual,cap,actions);root.append(fig);
 }
}
async function refreshMonthly(){const student_id=Number(document.querySelector('#monthlyForm select[name="student_id"]').value);const root=$('monthlyList');if(!student_id){empty(root,'Select a student.');return;}const r=await api('/api/academy/monthly?student_id='+student_id);root.replaceChildren();if(!r.reports?.length)empty(root,'No reports recorded for this student yet.');for(const m of r.reports||[])entry(root,String(m.report_month).slice(0,7)+' · '+m.status,'New: '+m.new_pages+' · Revision: '+m.revision_pages+' · Verified total: '+(m.verified_total_pages??'not set')+' · Accuracy: '+(m.accuracy_percent??'not set'));}
async function refreshJuz(){const sid=Number(document.querySelector('#juzForm select[name="student_id"]').value);const el=$('juzList');if(!sid){empty(el,'Select a student.');return;}const r=await api('/api/academy/juz?student_id='+sid);el.replaceChildren();if(!r.juz?.length)empty(el,'No verified Juz progress yet.');for(const j of r.juz||[])entry(el,'Juz '+j.juz_number+' · '+(j.completion_verified?'Completed':'In Progress'),j.memorised_pages+' pages memorised'+(j.accuracy_verified?' · Accuracy verified':'')+' · '+(j.dua_message||''));}

async function refreshApplications(){
 const response=await api('/api/academy/applications');applications=response.applications||[];
 const root=$('applicationsList');root.replaceChildren();
 if(!applications.length){empty(root,'No official admission applications received yet.');return;}
 for(const app of applications){
  const view=()=>openApplication(app.id);
  const actions=[['View',view],
   ['Interview',async()=>{await openApplication(app.id);$('applicationStatus').value='interview';$('applicationStatus').focus();}],
   ['Approve & Create Account',async()=>{
     try{await openApplication(app.id);$('applicationStatus').value='approved';
       if(!window.confirm('Approve this application and AUTOMATICALLY create the student record and private login?'))return;
       await saveApplicationDecision();
     }catch(e){status('Approval not saved: '+e.message,true);}
   }],
   ['Reject & Save',async()=>{
     try{await openApplication(app.id);$('applicationStatus').value='rejected';
       if(!window.confirm('Reject this application and save the decision?'))return;
       await saveApplicationDecision();
     }catch(e){status('Rejection not saved: '+e.message,true);}
   }],
   ['PDF / Print',()=>window.open('/api/academy/application-print?id='+encodeURIComponent(app.id),'_blank','noopener')]];
  entry(root,app.student_name+' · '+app.application_number,
   'Guardian: '+app.guardian_name+' · '+app.guardian_phone+' · '+String(app.status).replaceAll('_',' ').toUpperCase()+
   ' · Applied: '+String(app.created_at).slice(0,10),actions);
 }
}
async function openApplication(id){
 const response=await api('/api/academy/applications?id='+encodeURIComponent(id));
 currentApplication=response.application;
 const x=currentApplication;
 const root=$('applicationDetails');root.replaceChildren();
 const values=[
  ['Application',x.application_number],['Student Name',x.student_name],
  ['Date of Birth',x.date_of_birth?String(x.date_of_birth).slice(0,10):'—'],
  ['Class',x.current_class],['School / Madrasa',x.school_or_madrasa],
  ['Previous Hifz Learning',x.prior_hifz],
  ['Guardian',x.guardian_name],['Relationship',x.guardian_relationship],
  ['Phone',x.guardian_phone],['Additional Phone',x.alternative_phone],
  ['Email',x.email],['Full Address',x.address],
  ['Locality',x.locality],['District',x.district],['PIN',x.postal_code],['Notes',x.notes]
 ];
 for(const [label,value]of values){
  const field=document.createElement('div');field.className='application-detail';
  field.append(text('small',label),text('strong',value||'—'));root.append(field);
 }
 $('applicationHeading').textContent='Admission Form · '+x.application_number;
 $('applicationStatus').value=x.status;
 $('applicationReason').value=x.decision_reason||'';
 $('applicationStaffNote').value=x.staff_note||'';
 $('admissionInitialPassword').value='';
 syncAdmissionInitialPassword();
 $('applicationInterviewDate').value=x.interview_at?new Date(x.interview_at).toISOString().slice(0,16):'';
 $('printApplication').href='/api/academy/application-print?id='+encodeURIComponent(id);
 $('applicationFeedback').textContent='Saved application · '+String(x.status).replaceAll('_',' ')+'.';
 $('applicationViewer').hidden=false;
 const enroll=$('enrollApproved');if(enroll)enroll.hidden=true; // Auto-created on approval: no second enrollment.
 $('applicationViewer').scrollIntoView({behavior:'smooth',block:'start'});
}
function syncAdmissionInitialPassword(){
 const approved=$('applicationStatus').value==='approved';
 $('admissionInitialPasswordWrap').hidden=!approved;
 if(!approved)$('admissionInitialPassword').value='';
}
async function saveApplicationDecision(){
 if(!currentApplication)return;
 const button=$('saveApplicationDecision');button.disabled=true;
 const payload={id:Number(currentApplication.id),status:$('applicationStatus').value,
  reason:$('applicationReason').value.trim(),staff_note:$('applicationStaffNote').value.trim(),
  initial_password:$('applicationStatus').value==='approved'?$('admissionInitialPassword').value:'',
  interview_at:$('applicationStatus').value==='interview'&&$('applicationInterviewDate').value?
   new Date($('applicationInterviewDate').value).toISOString():null};
 let out;
 try{
  out=await api('/api/academy/applications','PUT',payload);
 }catch(e){
  $('applicationFeedback').textContent='NOT SAVED: '+e.message;status('Admission NOT saved: '+e.message,true);
  button.disabled=false;return;
 }
 try{await refreshApplications();}catch(e){console.warn('Application list refresh failed',e);}
 try{await openApplication(payload.id);}catch(e){console.warn('Application detail refresh failed',e);}
 $('applicationFeedback').replaceChildren();
 const message=text('strong',out.message||'Admission decision saved.');
 $('applicationFeedback').append(message);
 if(out.account_created&&out.username&&out.temporary_password){
  const credentials='Admission: '+out.admission_number+'\\nUsername: '+out.username+'\\nTemporary password: '+out.temporary_password+'\\n(Must change password on first login.)';
  const details=document.createElement('pre');details.className='oneTimeCredentials';
  details.textContent=credentials.replaceAll('\\n','\n');
  const copy=text('button','Copy one-time login details','outline');copy.type='button';
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(details.textContent);copy.textContent='Copied!';}catch{window.prompt('Copy these login details now:',details.textContent);}});
  const warning=text('p','IMPORTANT: This password is shown ONLY ONCE. Copy it now and give it privately to the student. Do not screenshot/share publicly.','hint');
  $('applicationFeedback').append(details,copy,warning);
  await Promise.allSettled([refreshStudents(),refreshAccounts()]);
 }
 status(out.account_created?'Student '+out.admission_number+' and Login '+out.username+' CREATED and SAVED. Copy the one-time password.':out.already_approved?'Student already approved. To change the login password, open Accounts & Parents and Reset Account Password.':out.status==='rejected'?'Application REJECTED and SAVED in Database.':'Application decision SAVED in Database.');
 button.disabled=false;
}

function show(tab){document.querySelectorAll('.panel').forEach(s=>s.hidden=s.id!=='tab-'+tab);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',String(b.dataset.tab===tab));});if(tab==='monthly')refreshMonthly().catch(e=>status(e.message,true));if(tab==='juz')refreshJuz().catch(e=>status(e.message,true));if(tab==='applications')refreshApplications().catch(e=>status(e.message,true));window.scrollTo(0,0);}
function hook(form,handler){
 const el=$(form);if(!el)throw Error('Missing form: '+form);
 const feedback=document.createElement('p');feedback.className='form-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');el.append(feedback);
 el.addEventListener('submit',async e=>{
   e.preventDefault();if(!el.reportValidity())return;
   const button=el.querySelector('[type="submit"]');button.disabled=true;
   feedback.className='form-feedback';feedback.textContent='Saving to the Academy database…';
   try{
     await handler();
     feedback.className='form-feedback success';feedback.textContent='Saved successfully.';
   }catch(error){
     const message=error.message||'Unable to save.';
     feedback.className='form-feedback error';feedback.textContent='Not saved: '+message;
     status('Not saved: '+message,true);
   }finally{button.disabled=false;}
 });
}
function attachEditDialogs(){
 for(const b of document.querySelectorAll('[data-close-student]'))b.addEventListener('click',()=>$('studentEditDialog').close());
 for(const b of document.querySelectorAll('[data-close-account]'))b.addEventListener('click',()=>$('accountEditDialog').close());
 $('studentEditForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;
  const message=$('studentEditMessage'),button=f.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Saving student and login details…';
  const values=Object.fromEntries(new FormData(f).entries());
  values.student_id=Number(values.student_id);
  values.active=f.elements.active.checked;
  delete values.admission_number;
  if(!values.new_password)delete values.new_password;
  try{
   const response=await api('/api/academy/students','PUT',values);
   if(!response.ok)throw Error('Database did not confirm the student update.');
   $('studentEditDialog').close();
   const refreshed=await Promise.allSettled([refreshStudents(),refreshAccounts()]);
   status(refreshed.some(x=>x.status==='rejected')?'Student saved; reload to see refreshed information.':'Student name, details and login saved successfully.');
  }catch(err){message.textContent='Not saved: '+err.message;status('Student not saved: '+err.message,true);}finally{button.disabled=false;}
 });
 $('accountEditForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;
  const message=$('accountEditMessage'),button=f.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Saving account details…';
  const values=Object.fromEntries(new FormData(f).entries());
  values.account_id=Number(values.account_id);
  values.active=f.elements.active.checked;
  if(!values.new_password)delete values.new_password;
  if(!$('accountParentLinks').hidden)values.student_ids=[...$('accountEditStudents').selectedOptions].map(o=>Number(o.value));
  try{
   const response=await api('/api/academy/accounts','PUT',values);
   if(!response.ok)throw Error('Database did not confirm the account update.');
   $('accountEditDialog').close();await refreshAccounts();
   status(response.password_reset?'Account saved. New password set; previous login sessions revoked.':'Account changes saved successfully.');
  }catch(err){message.textContent='Not saved: '+err.message;status('Account not saved: '+err.message,true);}finally{button.disabled=false;}
 });
}
async function optimizeGalleryPhoto(file){
 if(!file||!file.type.startsWith('image/')||file.size<=5*1024*1024)return file;
 try{
  const bitmap=await createImageBitmap(file);
  let candidate=null;
  // Retry smaller and lower-quality encodes instead of rejecting large phone photos.
  for(const [edge,quality] of [[2800,.87],[2400,.80],[2000,.73],[1600,.67],[1200,.63]]){
   const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext('2d',{alpha:false});
   if(!context)break;
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
   if(blob&&(!candidate||blob.size<candidate.size))candidate=blob;
   if(blob&&blob.size<8*1024*1024)break;
  }
  bitmap.close();
  if(candidate&&candidate.size<file.size)
   return new File([candidate],file.name.replace(/\.[^.]+$/,'')+'-optimized.webp',{type:'image/webp'});
 }catch(e){console.warn('Image could not be optimized in browser',e);}
 return file;
}
function connect(){
 attachEditDialogs();
 $('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab);});
 $('signout').addEventListener('click',async()=>{try{await api('/api/identity/logout','POST',{});}finally{location.replace('/login');}});
 $('openJourney').addEventListener('click',()=>{const id=$('previewStudent').value;if(id)location.href='/dashboard?student_id='+encodeURIComponent(id);});
 $('saveApplicationDecision').addEventListener('click',saveApplicationDecision);
 $('applicationStatus').addEventListener('change',syncAdmissionInitialPassword);
 $('showAdmissionInitialPassword').addEventListener('change',e=>{$('admissionInitialPassword').type=e.target.checked?'text':'password';});
 $('closeApplication').addEventListener('click',()=>{$('applicationViewer').hidden=true;currentApplication=null;});
 // Student record and login are now created atomically when an application is approved.
 $('copyUsthadDetails').addEventListener('click',async()=>{
  const details=$('usthadOneTimeDetails').textContent;
  if(!details)return;
  try{
   await navigator.clipboard.writeText(details);
   $('copyUsthadDetails').textContent='Copied! Share privately';
  }catch(e){window.prompt('Copy these private login details:',details);}
 });
 hook('usthadForm',async()=>{
  if(role!=='admin')throw Error('Only the Main Administrator can add an Usthad.');
  const data=$form('usthadForm');
  data.role='usthad';
  data.student_ids=[];
  delete data.password; // Always ask the server to generate a secure one-time password.
  const response=await api('/api/academy/accounts','POST',data);
  if(!response.ok||!response.saved||!response.username||!response.temporary_password)
   throw Error('Server did not confirm account creation and temporary credentials.');
  const details='Usthad Name: '+data.display_name+'\nUsername: '+response.username+
   '\nTemporary Password: '+response.temporary_password+
   '\nChange this password after first login.';
  $('usthadOneTimeDetails').textContent=details;
  $('usthadCredentials').hidden=false;
  $('copyUsthadDetails').textContent='Copy Login Details';
  $('usthadForm').reset();
  status('Usthad '+response.username+' CREATED AND SAVED. Copy the one-time password displayed below.');
  await refreshAccounts().catch(e=>status('Account was saved, but the list could not refresh. Please reload later.',true));
  $('usthadCredentials').scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('cancelStudentEdit').addEventListener('click',()=>{resetStudentForm();status('Student edit cancelled.');});
 hook('studentForm',async()=>{
  const form=$('studentForm'),data=$form('studentForm');
  if(form.dataset.editId){
   const student_id=Number(form.dataset.editId);
   const response=await api('/api/academy/students','PUT',{...data,student_id});
   if(!response.ok)throw Error('Student changes were not confirmed by the database.');
   resetStudentForm();status('Student details saved successfully.');
   await refreshStudents();
   return;
  }
  const response=await api('/api/academy/students','POST',data);
  if(!response.ok||!response.admission_number)throw Error('Database did not confirm the student was saved.');
  resetStudentForm();status('Student '+response.admission_number+' saved. Secure login created successfully.');
  const updates=await Promise.allSettled([refreshStudents(),refreshAccounts()]);
  if(updates.some(x=>x.status==='rejected'))status('Student saved; the list did not refresh automatically. Refresh this page to see the record.');
 });
 const accountForm=$('accountForm');
 const syncAccountRole=()=>{
  const teacher=$('accountRole').value==='usthad';
  accountForm.elements.username.required=!teacher;
  accountForm.elements.username.minLength=teacher?0:4;
  accountForm.elements.username.placeholder=teacher?'Auto-generated if left blank':'Username';
  accountForm.elements.password.required=!teacher;
  accountForm.elements.password.minLength=teacher?0:12;
  accountForm.elements.password.disabled=teacher;
  accountForm.elements.password.placeholder=teacher?'Password generated securely on save':'12+ characters, letters and numbers';
  $('parentStudents').disabled=teacher;
 };
 $('accountRole').addEventListener('change',syncAccountRole);
 syncAccountRole();
 hook('accountForm',async()=>{
  const data=$form('accountForm');
  const isUsthad=data.role==='usthad';
  data.student_ids=isUsthad?[]:[...$('parentStudents').selectedOptions].map(o=>Number(o.value));
  if(isUsthad)delete data.password;
  const response=await api('/api/academy/accounts','POST',data);
  if(!response.ok||!response.saved||!response.username)throw Error('Account was not confirmed by the database.');
  accountForm.reset();syncAccountRole();
  if(isUsthad){
   if(!response.temporary_password)throw Error('Usthad was saved, but temporary credentials were unavailable. Contact Administrator.');
   const details='Usthad Name: '+data.display_name+'\nUsername: '+response.username+
     '\nTemporary Password: '+response.temporary_password+'\nChange this password after first login.';
   $('usthadOneTimeDetails').textContent=details;
   $('usthadCredentials').hidden=false;
   $('copyUsthadDetails').textContent='Copy Login Details';
   status('Usthad '+response.username+' CREATED and SAVED. Copy the temporary password now.');
   await refreshAccounts().catch(()=>{});
   show('usthads');
   $('usthadCredentials').scrollIntoView({behavior:'smooth',block:'center'});
  }else{
   status('Parent account '+response.username+' saved. Share the password privately.');
   await refreshAccounts().catch(()=>status('Parent account saved; refresh list later.'));
  }
 });
 $('resetSubmit').addEventListener('click',async()=>{const account_id=Number($('resetAccount').value),new_password=$('resetPassword').value;try{await api('/api/academy/accounts','PUT',{account_id,new_password});$('resetPassword').value='';status('Password reset. Old sessions revoked; user must change the temporary password.');}catch(e){status(e.message,true);}});
 $('monthlyForm').querySelector('select[name="student_id"]').addEventListener('change',()=>refreshMonthly().catch(e=>status(e.message,true)));
 hook('monthlyForm',async()=>{
 const x=$form('monthlyForm');x.student_id=Number(x.student_id);
 for(const field of ['new_pages','revision_pages','verified_total_pages','accuracy_percent','target_pages'])x[field]=x[field]===''?null:Number(x[field]);
 const response=await api('/api/academy/monthly','POST',x);
 if(!response.ok)throw Error('Monthly Passport was not confirmed.');
 status('Monthly Hifz Passport '+x.status+' saved successfully.');
 await refreshMonthly().catch(()=>status('Monthly report saved; list refresh failed. Reload to view it.'));
});
 $('juzForm').querySelector('select[name="student_id"]').addEventListener('change',()=>refreshJuz().catch(e=>status(e.message,true)));
 for(let i=1;i<=30;i++)$('juzNumber').append(new Option('Juz '+i+' · '+(JUZ[i]-JUZ[i-1])+' pages',String(i)));
 const updateMax=()=>{$('juzPages').max=String(JUZ[Number($('juzNumber').value)]-JUZ[Number($('juzNumber').value)-1]);};
 $('juzNumber').addEventListener('change',updateMax);updateMax();$('juzCompleted').addEventListener('change',()=>{if($('juzCompleted').checked)$('juzPages').value=$('juzPages').max;});
 hook('juzForm',async()=>{
 const x=$form('juzForm');x.student_id=Number(x.student_id);x.juz_number=Number(x.juz_number);
 x.memorised_pages=Number(x.memorised_pages);x.accuracy_percent=x.accuracy_percent===''?null:Number(x.accuracy_percent);
 x.completion_verified=$('juzCompleted').checked;
 x.accuracy_verified=$('juzForm').querySelector('input[name="accuracy_verified"]').checked;
 const response=await api('/api/academy/juz','POST',x);
 if(!response.ok||!response.verified)throw Error('Verified Juz record was not confirmed by the server.');
 status('Juz '+x.juz_number+' progress and blessing saved successfully.');
 await refreshJuz().catch(()=>status('Juz saved; list refresh failed. Reload to see it.'));
});
 hook('galleryForm',async()=>{
 const f=$('galleryForm');
 const files=Array.from(f.elements.file.files||[]);
 const link=String(f.elements.video_url.value||'').trim();
 if((files.length>0)===Boolean(link))throw Error('Select one or more photos/videos OR paste a media link.');
 if(!f.elements.rights_confirmed.checked)throw Error('Confirm that you have permission to publish this media.');
 const wasPublished=f.elements.is_published.checked;
 let succeeded=0,failed=0;
 const errors=[];
 const submissions=files.length?files:[null];
 for(const selected of submissions){
  const fd=new FormData(f);
  if(selected){
   const file=await optimizeGalleryPhoto(selected);
   if(file.size>16*1024*1024){
    failed++;errors.push(selected.name+': exceeds the current hosting direct-upload size; use a direct HTTPS file link or video host URL.');
    continue;
   }
   fd.set('file',file,file.name);fd.delete('video_url');
  }else{fd.delete('file');}
  fd.set('is_published',wasPublished?'true':'false');
  try{
   const saved=await api('/api/academy/gallery','POST',fd,true);
   if(!saved.ok)throw Error('Database did not confirm saved media.');
   succeeded++;status('Saved '+succeeded+' of '+submissions.length+' Gallery items');
  }catch(e){failed++;errors.push((selected?.name||'Media link')+': '+e.message);}
 }
 if(succeeded>0)f.reset();
 await refreshGallery();
 if(failed>0){
  status(succeeded+' media saved, '+failed+' failed. '+errors.slice(0,2).join(' | '),true);
  return;
 }
 status('All '+succeeded+' media item(s) SAVED'+(wasPublished?' and published.':'.')+' Delete Permanently removes an item with one click.');
});
 hook('settingsForm',async()=>{const x=$form('settingsForm');for(const name of ['huffaz_count','students_count','batches_count','service_years'])x[name]=Number(x[name]||0);await api('/api/academy/settings','POST',x);status('Website settings saved. Public pages will now display your updated information.');await refreshSettings();});
}
(async()=>{try{
 const r=await api('/api/identity/me');role=r.account.role;csrf=r.csrf;
 if(!['admin','usthad'].includes(role)){location.replace('/dashboard');return;}
 if(r.account.must_change_password){location.replace('/change-password');return;}
 $('staffName').textContent=r.account.display_name+' · '+(role==='admin'?'Administrator':'Usthad');
 if(role!=='admin'){$('accountRole').querySelector('option[value="usthad"]').remove();$('usthadTab').hidden=true;}
 connect();
 const all=await Promise.allSettled([refreshStudents(),refreshAccounts(),refreshApplications(),refreshEnquiries(),refreshSettings(),refreshGallery()]);
 show('overview');
 const errors=all.filter(x=>x.status==='rejected').map(x=>x.reason?.message||'Unknown API error');
 status(errors.length?'Some data could not load: '+errors.join(' · '):'Secure management tools ready.',errors.length>0);
}catch(e){status(e.message||'Sign in required.',true);if(/Sign in|authoris/i.test(e.message||''))location.replace('/login');}})();
})();