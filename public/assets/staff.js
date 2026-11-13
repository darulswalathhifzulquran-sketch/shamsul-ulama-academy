(()=>{'use strict';
const $=id=>document.getElementById(id);
let csrf='',role='',students=[],accounts=[],settings={},gallery=[],enquiries=[],applications=[],currentApplication=null,currentMediaPlacements={};
const JUZ=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
const $form=(id)=>Object.fromEntries(new FormData($(id)).entries());
function status(msg,error=false){
 const el=$('status');
 if(el){el.textContent=(error?'ERROR — ':'STATUS — ')+msg;el.className=error?'error':'success';el.hidden=false;el.style.cssText='display:block!important;padding:13px;margin:10px 0;border:2px solid #075333;border-radius:8px;background:#fff!important;color:#075333!important;font-weight:750;white-space:normal';el.setAttribute('role','status');el.setAttribute('aria-live','polite');}
 if(error)console.error('[Academy Media Manager]',msg);
}
// Centered Academy confirmation modal (one deliberate confirm click; never prompt for a word).
function confirmAction(title,description,confirmLabel='Delete Permanently'){
 const dialog=$('confirmActionDialog');
 if(!dialog||dialog.open){status('A confirmation is already open.',true);return Promise.resolve(false);}
 $('confirmActionHeading').textContent=title;
 $('confirmActionDescription').textContent=description;
 const yes=$('confirmActionYes'),no=$('confirmActionCancel');
 yes.textContent=confirmLabel;
 yes.disabled=false;
 return new Promise(resolve=>{
  const previousFocus=document.activeElement;
  let finished=false;
  const finish=result=>{
   if(finished)return;
   finished=true;
   dialog.removeEventListener('cancel',onCancel);
   yes.onclick=null;no.onclick=null;
   if(dialog.open)dialog.close(result?'confirmed':'cancelled');
   resolve(result);
   try{previousFocus?.focus?.();}catch(e){}
  };
  const onCancel=event=>{event.preventDefault();finish(false);};
  dialog.addEventListener('cancel',onCancel);
  yes.onclick=()=>finish(true);
  no.onclick=()=>finish(false);
  dialog.showModal();
  no.focus();
 });
}
const confirmPermanentDelete=(kind,name,detail)=>confirmAction(
 'Permanently Delete '+kind,
 name+'\n'+detail+'\n\nThis cannot be undone.',
 'Yes, Delete Permanently'
);
async function deleteStudent(student){
 if(!await confirmPermanentDelete('student',student.full_name,'The student login, private journey, monthly reports, Juz verifications and linked access will be removed.'))return;
 try{await api('/api/academy/students','DELETE',{student_id:Number(student.id),confirmed:true,confirmation_text:'DELETE'});status('Student deleted from the database.');await Promise.all([refreshStudents(),refreshAccounts()]);}
 catch(e){status('Not deleted: '+e.message,true);}
}
async function deleteAllStudents(){
 if(role!=='admin'){status('Only Main Administrator can delete all students.',true);return;}
 const button=$('deleteAllStudents');button.disabled=true;
 try{
  const current=await api('/api/academy/students');
  const count=Number(current.total_all);
  if(!Number.isSafeInteger(count)||count<1){status('No students to delete.',true);return;}
  const approved=await confirmAction('Delete ALL '+count+' Students?',
   'This permanently deletes ALL '+count+' students, their login accounts, private journeys, monthly Hifz reports, Juz verification records, and student access links. Parent and Usthad accounts remain. Admission application history remains.\\n\\nCancel keeps everything unchanged.',
   'Yes — Delete All '+count+' Students');
  if(!approved){status('Cancelled — all student data is unchanged.');return;}
  button.textContent='Deleting & verifying...';
  const result=await api('/api/academy/students-bulk-delete','DELETE',{scope:'ALL_STUDENTS',confirmed:true,expected_count:count});
  if(!result.ok||result.verified!==true||Number(result.removed_students)!==count||Number(result.remaining_students)!==0)throw Error('Server did not verify that every student was removed.');
  await Promise.allSettled([refreshStudents(),refreshAccounts()]);
  status('VERIFIED: All '+count+' student records and linked student logins removed from Academy database.');
 }catch(e){status('Bulk delete NOT confirmed: '+e.message,true);}
 finally{button.textContent='Delete All Students';button.disabled=(role!=='admin'||students.length===0);}
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
 if(!await confirmPermanentDelete(account.role,account.display_name+' ('+account.username+')','The login will be permanently revoked, including all active sessions.'))return;
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
let authenticatedAccountId='';
function signInWarning(reason='Session expired or you have signed out in another tab.'){
 let box=$('academySessionWarning');
 if(!box){
   box=document.createElement('section');
   box.id='academySessionWarning';
   box.setAttribute('role','alert');
   box.style.cssText='background:#fff!important;color:#075333!important;border:3px solid #075333;border-radius:10px;padding:17px 21px;margin:15px auto;max-width:1100px;position:relative;z-index:40;font:700 14px/1.6 Inter,system-ui,sans-serif';
   const label=document.createElement('strong');label.id='academySessionWarningText';box.append(label);
   const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;align-items:center';
   const login=document.createElement('a');login.href='/login?next=%2Fstaff';login.target='_blank';login.rel='noopener noreferrer';
   login.textContent='Sign In Again (New Tab)';login.style.cssText='background:#075333;color:#fff!important;padding:10px 17px;border-radius:7px;text-decoration:none;font-weight:800';
   const check=document.createElement('button');check.type='button';check.textContent='Recheck Login';check.style.cssText='background:#fff;color:#075333;border:1px solid #075333;border-radius:7px;padding:10px 15px;cursor:pointer;font-weight:800';
   check.addEventListener('click',async()=>{check.disabled=true;try{await verifyActiveSession();status('Sign in verified. You may retry the unsaved operation.');}catch(err){status('NOT SAVED — '+err.message,true);}finally{check.disabled=false;}});
   row.append(login,check);box.append(row);
   const parent=document.querySelector('main');
   if(parent?.parentNode)parent.parentNode.insertBefore(box,parent);else document.body.prepend(box);
 }
 $('academySessionWarningText').textContent='NOT SAVED — '+reason+' Sign in again, then click Recheck Login before retrying.';
 box.hidden=false;box.style.display='block';
 return box;
}
async function verifyActiveSession(){
 let response;
 try{response=await fetch('/api/identity/me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Accept':'application/json'}});}
 catch(err){throw Error('Cannot verify login. Check your connection and retry.');}
 let info={};try{info=await response.json();}catch{}
 if(response.status===401){
   signInWarning('Academy login session is missing or expired.');
   throw Error('Sign in required (HTTP 401). The selected student update or media file was NOT saved.');
 }
 if(!response.ok)throw Error(info.error||'Unable to verify Academy login (HTTP '+response.status+').');
 if(!['admin','usthad'].includes(info.account?.role)){
   signInWarning('This account is not authorised to change Academy data.');
   throw Error('Usthad or Administrator access required. Nothing saved.');
 }
 if(authenticatedAccountId&&String(info.account.id)!==authenticatedAccountId){
   signInWarning('A different account is now signed in. Reload the Dashboard to use that account safely.');
   throw Error('Account changed in another tab. Nothing saved.');
 }
 if(info.account.must_change_password){
   signInWarning('You must finish your password change before updating Academy records.');
   throw Error('Password change required. Nothing saved.');
 }
 if(!/^[a-f0-9]{64}$/.test(String(info.csrf||''))){
   throw Error('Session verification token missing. Please refresh and sign in again.');
 }
 csrf=info.csrf;
 if($('academySessionWarning')){$('academySessionWarning').hidden=true;$('academySessionWarning').style.display='none';}
 return info;
}
async function api(path,method='GET',data=null,isFile=false){
 if(method!=='GET'&&path!=='/api/identity/logout')await verifyActiveSession();
 const headers={'Accept':'application/json'};
 if(method!=='GET')headers['X-Academy-CSRF']=csrf;
 if(!isFile&&data!==null)headers['Content-Type']='application/json';
 let res;
 try{res=await fetch(path,{method,credentials:'include',cache:'no-store',headers,body:data===null?undefined:isFile?data:JSON.stringify(data)});}
 catch(err){throw Error('Network error. Nothing was confirmed saved; check your connection and retry.');}
 let json;try{json=await res.json();}catch{throw Error('The server returned an invalid response (HTTP '+res.status+'). Nothing was confirmed saved.');}
 if(res.status===401){
   if(path!=='/api/identity/logout')signInWarning('Academy session is no longer valid (HTTP 401).');
   throw Error('Sign in required (HTTP 401). Nothing was saved. Use Sign In Again and retry.');
 }
 if(res.status===403&&/verification/i.test(String(json.error||''))){
   signInWarning('Request security verification failed. Refresh login and retry.');
   throw Error('Security verification failed (HTTP 403). Nothing saved.');
 }
 if(!res.ok)throw Error((json.error||'Request was not accepted')+' (HTTP '+res.status+').');
 return json;
}
function empty(el,msg){el.replaceChildren();const p=document.createElement('p');p.className='hint';p.textContent=msg;el.append(p);}
function text(tag,value,cls=''){const el=document.createElement(tag);el.textContent=String(value??'');if(cls)el.className=cls;return el;}
function entry(root,title,meta,actions=[]){const row=text('div','','entry');const info=document.createElement('div');info.append(text('strong',title),text('div',meta,'hint'));row.append(info);if(actions.length){const right=text('div','','actions');for(const [caption,handler,cls='outline'] of actions){const b=text('button',caption,cls);b.type='button';b.addEventListener('click',handler);right.append(b);}row.append(right);}root.append(row);}
function options(sel,arr,key='id',label='full_name'){sel.replaceChildren();for(const x of arr)sel.append(new Option(x[label]+' · '+(x.admission_number||''),String(x[key])));}
function studentDropdowns(){document.querySelectorAll('.studentOptions').forEach(sel=>options(sel,students));options($('previewStudent'),students);options($('parentStudents'),students);}
async function refreshStudents(){const r=await api('/api/academy/students');students=r.students||[];studentDropdowns();$('statStudents').textContent=students.length;const all=Number(r.total_all??students.length);$('studentBulkCount').textContent=all+' student(s) would be deleted, along with their logins and Hifz reports.';$('deleteAllStudents').disabled=(role!=='admin'||all===0);const el=$('studentsList');el.replaceChildren();if(!students.length)empty(el,'No students admitted yet.');for(const s of students)entry(el,s.full_name,s.admission_number+' · '+(s.batch_name||'No batch'),[['Edit',()=>editStudent(s)],['Delete',()=>deleteStudent(s),'danger']]);await refreshMonthly().catch(()=>{});await refreshJuz().catch(()=>{});}
async function refreshAccounts(){const r=await api('/api/academy/accounts');accounts=r.accounts||[];$('statAccounts').textContent=accounts.length;const el=$('accountsList');el.replaceChildren();$('resetAccount').replaceChildren();
 for(const a of accounts){
  if(a.role!=='admin')$('resetAccount').append(new Option(a.display_name+' · '+a.username,String(a.id)));
  const mayManage=a.role!=='admin'&&(a.role!=='usthad'||role==='admin');
  const actions=mayManage?[
    ['Edit',()=>editAccount(a)],
    [(a.active?'Deactivate':'Activate'),async()=>{if(!await confirmAction('Change Account Access?', 'Change active login access for '+a.username+'? The user might be signed out.','Confirm Access Change'))return;try{await api('/api/academy/accounts','PUT',{account_id:Number(a.id),active:!a.active});status('Account status updated.');await refreshAccounts();}catch(e){status(e.message,true);}},a.active?'danger':'outline']
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
async function refreshSettings(){const r=await api('/api/academy/settings');settings=r.settings||{};const f=$('settingsForm');for(const el of f.elements){if(!el.name)continue;el.value=settings[el.name]??'';}populateHomepageVideos();}
function populateHomepageVideos(){const sel=$('homeVideoGallerySelect');if(!sel)return;sel.replaceChildren(new Option('No Gallery video selected — use photo or direct URL',''));for(const item of gallery.filter(x=>x.media_type==='video'&&x.is_published)){sel.add(new Option((item.caption||'Academy video')+' · #'+item.id,String(item.id)));}sel.value=String(settings.home_video_gallery_id||'');}
const WEBSITE_MEDIA_SLOTS=[
 ['home_video','Homepage — FIRST VIEW video','video','/assets/courtyard-photo.jpg'],
 ['home_fallback','Homepage — FIRST VIEW fallback photo','image','/assets/courtyard-photo.jpg'],
 ['home_section','Homepage — Academy welcome photo','image','/assets/academy-owner-official-logo.png'],
 ['scholar_home','Shamsul Ulama — Homepage profile','image','/assets/shamsul-ulama-portrait-main.jpg'],
 ['scholar_profile','Shamsul Ulama — Life & Legacy profile','image','/assets/shamsul-ulama-portrait-legacy.jpg'],
 ['about_quran','Qur\'an / About photo','image','/assets/quran-photo.jpg'],
 ['brand_logo','Academy website logo','image','/assets/academy-owner-official-logo.png'],
 ['learner_illustration','Hifz Boy Animation — Homepage / Students / Parents / Journey','image','/assets/hifz-boy-academy.webp'],
 ['feature_1','College Feature 01 — Islamic & Academic Education','image','/assets/quran-photo.jpg'],
 ['feature_2','College Feature 02 — Our Teaching Method','image','/assets/quran-photo.jpg'],
 ['feature_3','College Feature 03 — Dedicated Teachers & Their Service','image','/assets/quran-photo.jpg'],
 ['feature_4','College Feature 04 — Student Facilities','image','/assets/quran-photo.jpg'],
 ['learning_school','School Classes article photo','image','/assets/quran-photo.jpg'],
 ['learning_tuition','Extra Tuition article photo','image','/assets/quran-photo.jpg'],
 ['learning_balance','Hifz & Learning article photo','image','/assets/quran-photo.jpg'],
 ['learning_habits','Study Skills article photo','image','/assets/quran-photo.jpg']
];
function directPlayableVideo(item){
 if(!item||item.media_type!=='video')return false;
 try{return /\.(mp4|webm)$/i.test(new URL(item.image_url,location.origin).pathname);}catch{return false;}
}
async function assignWebsiteMedia(slot,id,title){
 if(slot==='home_video'){
   const saved=await api('/api/academy/settings','POST',{home_video_gallery_id:id,home_video_url:''});
   if(!saved.ok)throw Error('The video setting was rejected.');
   const verified=await api('/api/academy/settings');
   if(Number(verified.settings?.home_video_gallery_id||0)!==Number(id||0))
      throw Error('The Homepage video assignment was not verified.');
   settings=verified.settings;
 }else{
   const saved=await api('/api/academy/media-placements','POST',{slot,gallery_id:id});
   if(!saved.ok)throw Error('Media assignment was rejected.');
   const verified=await api('/api/academy/media-placements');
   if(Number(verified.placements?.[slot]||0)!==Number(id||0))
      throw Error('Website image assignment was not verified.');
 }
}
async function refreshMediaPlacementManager(){
 const root=$('mediaPlacementManager');if(!root)return;
 const data=await api('/api/academy/media-placements');
 const placements=data.placements||{};currentMediaPlacements=placements;
 root.replaceChildren();
 for(const [slot,title,type,original] of WEBSITE_MEDIA_SLOTS){
   const selectedId=slot==='home_video'?settings.home_video_gallery_id:placements[slot];
   const selectedItem=gallery.find(x=>Number(x.id)===Number(selectedId)&&x.media_type===type);
   const row=text('div','','media-slot-card');
   row.style.cssText='border:1px solid #d6e6d9;border-radius:12px;padding:16px;margin:12px 0;display:grid;gap:10px';
   const heading=text('strong',title);
   const current=text('div',selectedItem?'CURRENT: '+(selectedItem.caption||'Gallery '+(type==='video'?'video':'photo'))+' #'+selectedItem.id:'CURRENT: Original website '+(type==='video'?'photo fallback':'image'));
   if(type==='video'&&selectedItem&&!directPlayableVideo(selectedItem))current.textContent+=' — YouTube/embed selected; use Choose MP4/WebM from your computer below for reliable homepage playback.';
   current.className='hint';
   let source=selectedItem?.media_url||selectedItem?.image_url||original;
   const videoPreview=type==='video'&&selectedItem&&directPlayableVideo(selectedItem);
   let preview=document.createElement(videoPreview?'video':'img');
   preview.style.cssText='display:block;width:220px;max-width:100%;height:120px;object-fit:contain;border-radius:9px;background:#edf4ef';
   preview.src=videoPreview?selectedItem.image_url:(type==='video'?original:source);
   if(!selectedItem&&/^(feature_|learning_)/.test(slot)){
     preview=document.createElement('div');
     preview.textContent='NO PHOTO SELECTED — GREEN / WHITE DEFAULT';
     preview.style.cssText='height:120px;border-radius:9px;display:flex;align-items:center;justify-content:center;text-align:center;padding:15px;background:#075333;color:#fff;font:700 12px/1.5 Inter,system-ui,sans-serif';
   }
   if(videoPreview){
     preview.controls=true;preview.preload='auto';preview.playsInline=true;
     const playbackDiagnostic=text('div','CHECKING VIDEO: verifying browser playback…','hint');
     playbackDiagnostic.setAttribute('role','status');
     playbackDiagnostic.style.cssText='font-weight:700;color:#075333;background:#fff;border:1px solid #075333;border-radius:7px;padding:9px';
     const updatePlayback=(message,error=false)=>{playbackDiagnostic.textContent=(error?'VIDEO ERROR: ':'VIDEO STATUS: ')+message;playbackDiagnostic.style.borderWidth=error?'2px':'1px';};
     preview.addEventListener('loadedmetadata',()=>updatePlayback('Video loaded, duration '+(Number.isFinite(preview.duration)?preview.duration.toFixed(1)+' seconds':'unknown')+'. Press ▶ to test.'));
     preview.addEventListener('canplay',()=>updatePlayback('Ready to play. Press ▶ to preview; Homepage uses muted autoplay.'));
     preview.addEventListener('playing',()=>updatePlayback('PLAYING successfully in this browser.'));
     preview.addEventListener('waiting',()=>updatePlayback('Buffering. Waiting for video data…'));
     preview.addEventListener('stalled',()=>updatePlayback('Network stalled. Please check connection or reload.',true));
     preview.addEventListener('error',()=>updatePlayback('Media error code '+(preview.error?.code||'unknown')+': '+(preview.error?.message||'File, network, format or codec issue')+'. Upload a Chrome-compatible H.264/AAC MP4.',true));
     preview.addEventListener('abort',()=>updatePlayback('Video load was interrupted; retry preview.',true));
     preview.addEventListener('emptied',()=>updatePlayback('Video source was reset. Try refreshing the Gallery.'));
     row.append(playbackDiagnostic);
   }
   const uploadLabel=text('label','1. CHOOSE '+(type==='video'?'YOUR OWN MP4 / WEBM VIDEO':'A PHOTO FROM THIS COMPUTER'));
   uploadLabel.style.cssText='display:grid;gap:7px;font-weight:700;font-size:12px;color:#075333';
   const uploadInput=document.createElement('input');
   uploadInput.type='file';uploadInput.accept=type==='video'?'.mp4,.webm,video/mp4,video/webm':'.jpg,.jpeg,.jfif,.png,.webp,image/jpeg,image/png,image/webp';
   uploadInput.style.cssText='width:100%;padding:10px;border:1px solid #bfd4c4;border-radius:8px;background:#fff';
   uploadLabel.append(uploadInput);
   const fileHelp=text('div',type==='video'?'MP4 / WebM • maximum 16 MB per video • choose file here, not a YouTube link':'JPG / PNG / WebP • transparent images accepted','hint');
   const uploadedLabel=text('label','2. OR SELECT AN ALREADY UPLOADED '+(type==='video'?'MP4/WEBM VIDEO':'GALLERY PHOTO'));
   uploadedLabel.style.cssText='display:grid;gap:7px;font-size:12px;font-weight:700;color:#075333';
   const select=document.createElement('select');
   select.setAttribute('aria-label','Select existing media for '+title);
   select.style.cssText='width:100%;padding:11px;border:1px solid #c8d9ce;border-radius:8px';
   const base=document.createElement('option');base.value='';base.textContent='Choose an existing published '+(type==='video'?'MP4/WebM video':'photo');select.append(base);
   const valid=gallery.filter(x=>x.is_published&&x.media_type===type&&(type!=='video'||directPlayableVideo(x)));
   for(const media of valid){
     const op=document.createElement('option');op.value=String(media.id);
     op.textContent=(media.caption||'Uploaded '+(type==='video'?'video':'photo'))+' — ID '+media.id;
     if(Number(selectedId)===Number(media.id))op.selected=true;
     select.append(op);
   }
   if(type==='video'&&!valid.length){
     const none=document.createElement('option');none.disabled=true;none.textContent='No uploaded MP4/WebM yet — choose a file above';select.append(none);
   }
   uploadedLabel.append(select);
   const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
   const save=text('button','Set selected media');save.type='button';
   const remove=text('button','Remove / Restore default','outline');remove.type='button';
   const feedback=text('div','', 'hint');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   feedback.classList.add('media-test-status');
   const setFeedback=(state,message)=>{feedback.textContent=state.toUpperCase()+': '+message;feedback.dataset.state=state;};
   if(type==='video'){
     if(videoPreview){
       setFeedback('checking','Selected MP4 is in Gallery. Checking browser video metadata…');
       const mediaError=()=>{
         const code=preview.error?.code||0;
         const causes={1:'Playback cancelled',2:'Network / connection error while loading the MP4',3:'Browser could not decode the video',4:'Video format or media URL is not supported'};
         setFeedback('error','Video preview failed (code '+code+'). '+(causes[code]||'Unknown browser media error')+'. Try the Test Video button or re-upload as H.264 MP4 under 16 MB.');
       };
       preview.addEventListener('error',mediaError);
       preview.addEventListener('loadedmetadata',()=>{
         const duration=Number.isFinite(preview.duration)?Math.round(preview.duration)+' seconds':'unknown duration';
         setFeedback('ready','MP4 loaded ('+duration+', '+preview.videoWidth+'×'+preview.videoHeight+'). Click Test Video to confirm actual playback.');
       });
       preview.addEventListener('playing',()=>setFeedback('playing','Browser successfully plays this MP4. If Homepage still shows its fallback, refresh Homepage to load the latest selection.'));
       preview.addEventListener('stalled',()=>setFeedback('loading','Video download stalled. Please check your connection and try Test Video.'));
       preview.addEventListener('waiting',()=>setFeedback('loading','Buffering video data…'));
       const probe=text('button','Test video playback','outline');probe.type='button';
       probe.addEventListener('click',async()=>{
         setFeedback('checking','Testing video playback in this browser…');
         preview.muted=true;
         preview.hidden=false;
         try{await preview.play();setFeedback('playing','Playback confirmed in this browser.');}
         catch(err){setFeedback('error','Browser playback test failed: '+(err?.message||'unknown error')+'. Check the video codec or connection.');}
       });
       actions.append(probe);
     }else{
       setFeedback('not configured','No published MP4/WebM has been assigned to this position. Select a video or choose a file to upload.');
     }
   }else if(selectedItem&&preview.tagName==='IMG'){
     setFeedback('checking','Checking this selected image…');
     preview.addEventListener('load',()=>setFeedback('ready','Selected image loaded. The website section can display this photo.'));
     preview.addEventListener('error',()=>setFeedback('error','Selected image could not load. Re-upload it or use Restore Default.'));
   }else if(!selectedItem){
     setFeedback('default','No custom file assigned. Website uses its original image or the official green-and-white default.');
   }
   select.addEventListener('change',()=>{
     if(!select.value){feedback.textContent='No file selected. Choose your video/photo above or select an uploaded file.';return;}
     const found=gallery.find(item=>String(item.id)===select.value);
     feedback.textContent='SELECTED: '+(found?.caption||type+' #'+select.value)+'. NOT APPLIED YET — click "Set selected media" to save this on the public website.';
   });
   uploadInput.addEventListener('change',()=>{
     const candidate=uploadInput.files?.[0];
     if(!candidate)return;
     select.value='';
     feedback.textContent='FILE SELECTED: '+candidate.name+' ('+(candidate.size/1048576).toFixed(2)+' MB). NOT UPLOADED YET — click "Set selected media" to upload and publish here.';
   });
   let busy=false;
   const busyState=(state)=>{busy=state;save.disabled=state;remove.disabled=state;uploadInput.disabled=state;select.disabled=state;};
   async function uploadAndAssign(){
     const file=uploadInput.files?.[0];if(!file)throw Error('Please choose a file first.');
     const extension=String(file.name).split('.').pop().toLowerCase();
     const allowed=type==='video'?['mp4','webm']:['jpg','jpeg','png','webp'];
     if(!allowed.includes(extension))throw Error('Wrong file type. '+(type==='video'?'Choose MP4 or WebM.':'Choose JPG, PNG or WebP.'));
     const mime=type==='video'?(extension==='mp4'?'video/mp4':'video/webm'):(extension==='jpg'||extension==='jpeg'?'image/jpeg':extension==='png'?'image/png':'image/webp');
     if(file.size>16*1024*1024)throw Error(file.name+' is '+(file.size/1048576).toFixed(1)+' MB. Upload limit is 16 MB; compress the file first.');
     if(file.size===0)throw Error('This file is empty.');
     const verifiedFile=new File([file],file.name,{type:mime});
     const optimized=await optimizeGalleryPhoto(verifiedFile);
     const fd=new FormData();fd.set('file',optimized,optimized.name);
     fd.set('caption',file.name.slice(0,245));fd.set('alt_text',title.slice(0,245));fd.set('is_published','true');
     fd.set('rights_confirmed','on');fd.set('display_order','0');
     feedback.textContent='Uploading '+file.name+' ('+(file.size/1048576).toFixed(2)+' MB)…';
     const uploaded=await api('/api/academy/gallery','POST',fd,true);
     if(!uploaded.ok||!uploaded.id||uploaded.media_type!==type||!uploaded.is_published)
        throw Error('The uploaded file was not confirmed in Gallery storage.');
     const check=await api('/api/academy/gallery?manage=1');
     const present=(check.gallery||[]).find(g=>Number(g.id)===Number(uploaded.id)&&g.is_published&&g.media_type===type);
     if(!present)throw Error('File reached server but could not be verified in Gallery. Check Gallery before retrying.');
     feedback.textContent='File uploaded successfully. Assigning '+title+'…';
     try{await assignWebsiteMedia(slot,Number(uploaded.id),title);}
     catch(e){throw Error('Uploaded to Gallery as #'+uploaded.id+', but could not set website position: '+e.message);}
     feedback.textContent='SAVED & VERIFIED: '+file.name+' is set for '+title+'.';
     status('SAVED & VERIFIED: '+file.name+' is now assigned to '+title+'. Visit the website to test playback.');
     await refreshGallery();
   }
   save.addEventListener('click',async()=>{
     if(busy)return;
     busyState(true);
     try{
       if(uploadInput.files?.length){await uploadAndAssign();return;}
       if(!select.value)throw Error('Choose a file ABOVE or an existing published '+type+' in the dropdown.');
       const chosen=gallery.find(g=>Number(g.id)===Number(select.value));
       if(type==='video'&&!directPlayableVideo(chosen))throw Error('The selected video is not a direct MP4/WebM. Upload one from your computer.');
       feedback.textContent='Saving selected '+type+'…';
       await assignWebsiteMedia(slot,Number(select.value),title);
       status('SAVED & VERIFIED: '+title+'. Refresh the relevant website page.');
       await refreshGallery();
     }catch(e){feedback.textContent='NOT SAVED: '+e.message;status('NOT SAVED: '+e.message,true);busyState(false);}
   });
   remove.addEventListener('click',async()=>{
     if(busy)return;busyState(true);
     try{await assignWebsiteMedia(slot,null,title);status('Default media restored for '+title+'.');await refreshGallery();}
     catch(e){feedback.textContent='Could not restore default: '+e.message;status('NOT SAVED: '+e.message,true);busyState(false);}
   });
   actions.append(save,remove);
   row.append(heading,current,preview,uploadLabel,fileHelp,uploadedLabel,actions,feedback);root.append(row);
 }
}
async function refreshGallery(){
 const r=await api('/api/academy/gallery?manage=1');gallery=r.gallery||[];populateHomepageVideos();await refreshMediaPlacementManager();
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
   visual=document.createElement('img');visual.src=item.media_url||item.image_url;visual.alt=item.alt_text||item.caption||'Academy photograph';visual.loading='lazy';
  }
  const label=(item.caption|| (item.media_type==='video'?'Academy Video':'Academy Photograph'))+(item.is_published?' · Published · Visible on website':' · Draft · NOT visible on website');
  const uses=WEBSITE_MEDIA_SLOTS.filter(([slot])=>Number(slot==='home_video'?settings.home_video_gallery_id:currentMediaPlacements[slot])===Number(item.id)).map(([,title])=>title);
  const cap=text('figcaption',label+(uses.length?' · USED IN: '+uses.join(' / '):' · No special website position'));
  const actions=document.createElement('div');actions.className='galleryActions';
  const publish=text('button',item.is_published?'Unpublish (hide)':'Publish to website',item.is_published?'outline':'');
  publish.type='button';
  publish.addEventListener('click',async()=>{
   const newState=!item.is_published;
   if(newState&&!await confirmAction('Publish Gallery Media?', 'This '+(item.media_type==='video'?'video':'photo')+' will appear on the public Academy website. Publish only if you own it or have permission.','Yes — Publish'))return;
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
   const warning=uses.length?'\nIMPORTANT: Currently used at '+uses.join(', ')+'. This position will revert to its fallback/default.':'';
   const confirmed=await confirmAction('Delete Gallery Media?',(item.caption||'This gallery item')+warning+'\nThe media will be permanently removed from Gallery and managed storage. External media hosts must be managed separately.','Yes — Delete Media');
   if(!confirmed)return;
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
  if(item.is_published&&item.media_type==='video'){
    const isCurrent=Number(settings.home_video_gallery_id)===Number(item.id);
    const home=text('button',isCurrent?'✓ Homepage Video':'Use on Homepage',isCurrent?'outline':'');
    home.type='button';home.disabled=isCurrent;
    home.addEventListener('click',async()=>{
      home.disabled=true;home.textContent='Saving…';
      try{
        const result=await api('/api/academy/settings','POST',{home_video_gallery_id:Number(item.id),home_video_url:''});
        if(!result.ok)throw Error('Settings were not confirmed by the server.');
        status('Homepage video selection SAVED. Open Home to check playback. YouTube embedding can still be restricted by YouTube.');
        await refreshSettings();await refreshGallery();
      }catch(e){status('Homepage video was NOT saved: '+e.message,true);home.disabled=false;home.textContent='Use on Homepage';}
    });
    actions.append(home);
  }
  actions.append(publish,remove);fig.append(visual,cap,actions);root.append(fig);
 }
}
async function refreshMonthly(){const student_id=Number(document.querySelector('#monthlyForm select[name="student_id"]').value);const root=$('monthlyList');if(!student_id){empty(root,'Select a student.');return;}const r=await api('/api/academy/monthly?student_id='+student_id);root.replaceChildren();if(!r.reports?.length)empty(root,'No reports recorded for this student yet.');for(const m of r.reports||[])entry(root,String(m.report_month).slice(0,7)+' · '+m.status,'New: '+m.new_pages+' · Revision: '+m.revision_pages+' · Verified total: '+(m.verified_total_pages??'not set')+' · Accuracy: '+(m.accuracy_percent??'not set'));}
async function refreshJuz(){const sid=Number(document.querySelector('#juzForm select[name="student_id"]').value);const el=$('juzList');if(!sid){empty(el,'Select a student.');return;}const r=await api('/api/academy/juz?student_id='+sid);el.replaceChildren();if(!r.juz?.length)empty(el,'No verified Juz progress yet.');for(const j of r.juz||[])entry(el,'Juz '+j.juz_number+' · '+(j.completion_verified?'Completed':'In Progress'),j.memorised_pages+' pages memorised'+(j.accuracy_verified?' · Accuracy verified':'')+' · '+(j.dua_message||''));}

async function refreshApplications(){
 const response=await api('/api/academy/applications');applications=response.applications||[];
 const root=$('applicationsList');root.replaceChildren();
 if(!applications.length){empty(root,'No official admission applications received yet.');return;}
 const groups=[['submitted','New Applications'],['under_review','Under Review'],['interview','Interview'],['approved','Approved Admissions'],['rejected','Rejected Admissions']];
 for(const [groupStatus,groupLabel] of groups){
  const groupApps=applications.filter(app=>app.status===groupStatus);
  if(!groupApps.length)continue;
  const heading=document.createElement('h3');heading.textContent=groupLabel+' ('+groupApps.length+')';heading.className='admission-status-heading';root.append(heading);
  for(const app of groupApps){
  const view=()=>openApplication(app.id);
  const actions=[['View',view],
   ['Interview',async()=>{await openApplication(app.id);$('applicationStatus').value='interview';syncAdmissionInitialPassword();$('applicationStatus').focus();}],
   [app.status==='approved'&&!app.student_id?'Repair Approval & Create Login':'Approve & Create Account',async()=>{
     try{await openApplication(app.id);$('applicationStatus').value='approved';syncAdmissionInitialPassword();
       if(!await confirmAction('Approve Student Admission?', 'This creates the Student Record and a secure login account automatically.','Yes — Approve & Create'))return;
       await saveApplicationDecision();
     }catch(e){status('Approval not saved: '+e.message,true);}
   }],
   [app.status==='rejected'?'Rejected — Saved':'Reject & Save',async()=>{
     try{await openApplication(app.id);$('applicationStatus').value='rejected';syncAdmissionInitialPassword();
       if(!await confirmAction('Reject Admission?', 'This saves a Rejected decision to the database. No Student Login will be created.','Yes — Reject & Save'))return;
       await saveApplicationDecision();
     }catch(e){status('Rejection not saved: '+e.message,true);}
   }],
   ['PDF / Print',()=>window.open('/api/academy/application-print?id='+encodeURIComponent(app.id),'_blank','noopener')]].filter(([label])=>{
     // Already decided applications are status labels, not misleading duplicate save buttons.
     if(app.status==='approved'&&app.student_id&&(label==='Approve & Create Account'||label==='Reject & Save'))return false;
     if(app.status==='rejected'&&label==='Rejected — Saved')return false;
     return true;
   });
  entry(root,app.student_name+' · '+app.application_number,
   'Guardian: '+app.guardian_name+' · '+app.guardian_phone+' · '+String(app.status).replaceAll('_',' ').toUpperCase()+
   (app.status==='approved'&&!app.student_id?' · ACTION REQUIRED: LOGIN NOT CREATED':'')+' · Applied: '+String(app.created_at).slice(0,10),actions);
  }
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

function show(tab){document.querySelectorAll('.panel').forEach(s=>s.hidden=s.id!=='tab-'+tab);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',String(b.dataset.tab===tab));});if(tab==='gallery')refreshGallery().catch(e=>status('Gallery media could not refresh: '+e.message,true));if(tab==='monthly')refreshMonthly().catch(e=>status(e.message,true));if(tab==='juz')refreshJuz().catch(e=>status(e.message,true));if(tab==='applications')refreshApplications().catch(e=>status(e.message,true));window.scrollTo(0,0);}
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
 // Default to the current month in the Academy's local time; Usthad may change it.
 const monthField=$('monthlyForm')?.elements?.month;
 if(monthField&&!monthField.value){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).formatToParts(new Date());monthField.value=parts.find(v=>v.type==='year').value+'-'+parts.find(v=>v.type==='month').value;}
 $('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){show(b.dataset.tab);verifyActiveSession().catch(err=>status('SESSION CHECK — '+err.message,true));}});
 $('signout').addEventListener('click',async()=>{try{await api('/api/identity/logout','POST',{});}finally{location.replace('/login');}});
 $('bulkStudentsZone').hidden=(role!=='admin');
 $('deleteAllStudents').addEventListener('click',deleteAllStudents);
 $('openJourney').addEventListener('click',()=>{const id=$('previewStudent').value;if(id)location.href='/journey?student_id='+encodeURIComponent(id);});
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
 if(!x.student_id)throw Error('Select a student before saving Monthly Passport.');
 if(!x.month)throw Error('Choose the report month before saving.');
 if(x.status==='published'&&!String(x.verified_total_pages||'').trim())throw Error('To publish a Monthly Passport, enter Verified Total Pages. Otherwise save it as Draft.');
 for(const field of ['new_pages','revision_pages','verified_total_pages','accuracy_percent','target_pages'])x[field]=x[field]===''?null:Number(x[field]);
 const response=await api('/api/academy/monthly','POST',x);
 if(!response.ok)throw Error('Monthly Passport was not confirmed.');
 status('Monthly Hifz Passport '+x.status+' saved successfully.');
 await refreshMonthly().catch(()=>status('Monthly report saved; list refresh failed. Reload to view it.'));
});
 $('juzForm').querySelector('select[name="student_id"]').addEventListener('change',()=>refreshJuz().catch(e=>status(e.message,true)));
 for(let i=1;i<=30;i++)$('juzNumber').append(new Option('Juz '+i+' · '+(JUZ[i]-JUZ[i-1])+' pages',String(i)));
 const updateMax=()=>{const max=JUZ[Number($('juzNumber').value)]-JUZ[Number($('juzNumber').value)-1];$('juzPages').max=String(max);if($('juzCompleted').checked)$('juzPages').value=String(max);else if(Number($('juzPages').value)>max)$('juzPages').value=String(max);};
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
 for(let i=1;i<=30;i++)$('bulkJuzCount').append(new Option(i+' completed Juz',String(i)));
 const bulkPages=()=>{const n=Number($('bulkJuzCount').value),direction=$('bulkJuzDirection').value;
  let pages=0;
  for(let i=0;i<n;i++){const j=direction==='ascending'?i+1:30-i;pages+=JUZ[j]-JUZ[j-1];}
  $('bulkJuzPreview').textContent='UNSAVED PREVIEW — '+n+' FULL Juz = '+pages+' pages (out of 604). No student progress changes until Verify Selected Completed Juz succeeds and the server confirms it. This is NOT '+n+' pages.';
 };
 $('bulkJuzCount').value='1';bulkPages();
 $('bulkJuzCount').addEventListener('change',bulkPages);
 $('bulkJuzDirection').addEventListener('change',bulkPages);
 hook('juzBulkForm',async()=>{
  const x=$form('juzBulkForm');
  const student_id=Number(x.student_id),completed_juz=Number(x.completed_juz),direction=x.direction;
  if(!$('bulkJuzConfirm').checked)throw Error('Teacher confirmation checkbox required.');
  const response=await api('/api/academy/juz-bulk','POST',{student_id,completed_juz,direction,confirmed:true});
  if(!response.ok||response.saved!==completed_juz)throw Error('The full verified Juz batch was not confirmed by the server.');
  $('bulkJuzStatus').textContent='Successfully verified '+completed_juz+' Juz = '+response.pages_in_selected_juz+' full pages.';
  $('bulkJuzConfirm').checked=false;
  const mainSelect=document.querySelector('#juzForm select[name="student_id"]');mainSelect.value=String(student_id);
  await refreshJuz();status('Teacher-verified '+completed_juz+' complete Juz = '+response.pages_in_selected_juz+' pages. Other records preserved.');
 });
 hook('galleryForm',async()=>{
 const f=$('galleryForm');
 const files=Array.from(f.elements.file.files||[]);
 const link=String(f.elements.video_url.value||'').trim();
 if((files.length>0)===Boolean(link))throw Error('Select one or more photos/videos OR paste a media link.');
 if(!f.elements.rights_confirmed.checked)throw Error('Confirm that you have permission to publish this media.');
 const destination=f.elements.media_destination.value;
 const makeHomepage=destination==='home_video';
 const targetType=makeHomepage?'video':destination==='gallery'?null:'image';
 if(destination!=='gallery'&&(files.length!==1||link))throw Error('For a website position select exactly ONE file from your computer. For URL links choose Gallery only.');
 const fileExt=files[0]?.name?.split('.').pop()?.toLowerCase();
 if(targetType&&!(targetType==='video'?['mp4','webm'].includes(fileExt):['jpg','jpeg','jfif','png','webp'].includes(fileExt)))throw Error('Select the correct type: '+(targetType==='video'?'MP4/WebM video':'JPG/PNG/WebP photo')+'.');
 if(destination!=='gallery'&&!f.elements.is_published.checked)throw Error('Tick Publish on Public Gallery before assigning website media.');
 const wasPublished=f.elements.is_published.checked;
 let succeeded=0,failed=0;
 const errors=[];
 const submissions=files.length?files:[null];
 for(const selected of submissions){
  const fd=new FormData(f);
  if(selected){
   const ext=selected.name.split('.').pop().toLowerCase();
   const fallbackMime={mp4:'video/mp4',webm:'video/webm',jpg:'image/jpeg',jpeg:'image/jpeg',jfif:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
   const input=selected.type?selected:(fallbackMime?new File([selected],selected.name,{type:fallbackMime}):selected);
   const file=await optimizeGalleryPhoto(input);
   if(file.size>16*1024*1024){
    failed++;errors.push(selected.name+': '+(file.size/1048576).toFixed(1)+' MB. Maximum is 16 MB. Compress the video to 15 MB or less and retry.');
    continue;
   }
   fd.set('file',file,file.name);fd.delete('video_url');
  }else{fd.delete('file');}
  fd.set('is_published',wasPublished?'true':'false');
  try{
   const saved=await api('/api/academy/gallery','POST',fd,true);
   if(!saved.ok||!saved.id)throw Error('Database did not confirm saved media.');
   succeeded++;status('Saved '+succeeded+' of '+submissions.length+' Gallery items');
   if(destination!=='gallery'){
     try{const updated=makeHomepage?
       await api('/api/academy/settings','POST',{home_video_gallery_id:Number(saved.id),home_video_url:''}):
       await api('/api/academy/media-placements','POST',{slot:destination,gallery_id:Number(saved.id)});
       if(!updated.ok)throw Error('Website media position was not confirmed.');
       status('File uploaded, published and set for '+destination+'. Open the public page to verify.');
     }catch(e){failed++;errors.push('File uploaded to Gallery, but website position failed: '+e.message);}
   }
  }catch(e){failed++;errors.push((selected?.name||'Media link')+': '+e.message);}
 }
 if(succeeded>0)f.reset();
 await refreshGallery();
 if(failed>0){
  const message=succeeded+' media saved, '+failed+' issue(s). '+errors.slice(0,2).join(' | ');
  status(message,true);
  throw Error(message);
 }
 status(destination==='gallery'?'Gallery media saved and confirmed.': 'Media uploaded and assigned to '+destination+'. Refresh the site to check.');
});
 hook('settingsForm',async()=>{const x=$form('settingsForm');for(const name of ['huffaz_count','students_count','batches_count','service_years'])x[name]=Number(x[name]||0);await api('/api/academy/settings','POST',x);status('Website settings saved. Public pages will now display your updated information.');await refreshSettings();});
}
(async()=>{try{
 const r=await api('/api/identity/me');role=r.account.role;csrf=r.csrf;authenticatedAccountId=String(r.account.id);
 if(!['admin','usthad'].includes(role)){location.replace('/dashboard');return;}
 if(r.account.must_change_password){location.replace('/change-password');return;}
 $('staffName').textContent=role==='admin'?'Academy Administrator':'Usthad Control';
 if(role!=='admin'){$('accountRole').querySelector('option[value="usthad"]').remove();$('usthadTab').hidden=true;}
 connect();
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')verifyActiveSession().catch(err=>{status('SESSION CHECK: '+err.message,true);});});
 const all=await Promise.allSettled([refreshStudents(),refreshAccounts(),refreshApplications(),refreshEnquiries(),refreshSettings(),refreshGallery()]);
 show('overview');
 const errors=all.filter(x=>x.status==='rejected').map(x=>x.reason?.message||'Unknown API error');
 status(errors.length?'Some data could not load: '+errors.join(' · '):'Secure management tools ready.',errors.length>0);
}catch(e){status(e.message||'Sign in required.',true);if(/Sign in|authoris/i.test(e.message||''))location.replace('/login');}})();
})();