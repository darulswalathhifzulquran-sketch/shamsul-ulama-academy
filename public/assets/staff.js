(()=>{'use strict';
const $=id=>document.getElementById(id);
let csrf='',role='',students=[],accounts=[],settings={},gallery=[],enquiries=[];
const JUZ=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
const $form=(id)=>Object.fromEntries(new FormData($(id)).entries());
function status(msg,error=false){$('status').textContent=msg;$('status').className=error?'error':'success';}
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
async function refreshStudents(){const r=await api('/api/academy/students');students=r.students||[];studentDropdowns();$('statStudents').textContent=students.length;const el=$('studentsList');el.replaceChildren();if(!students.length)empty(el,'No students admitted yet.');for(const s of students)entry(el,s.full_name,s.admission_number+' · '+(s.batch_name||'No batch'));await refreshMonthly().catch(()=>{});await refreshJuz().catch(()=>{});}
async function refreshAccounts(){const r=await api('/api/academy/accounts');accounts=r.accounts||[];$('statAccounts').textContent=accounts.length;const el=$('accountsList');el.replaceChildren();$('resetAccount').replaceChildren();
 for(const a of accounts){if(a.role!=='admin')$('resetAccount').append(new Option(a.display_name+' · '+a.username,String(a.id)));const actions=a.role==='admin'?[]:[[(a.active?'Deactivate':'Activate'),async()=>{if(!confirm('Change access for '+a.username+'?'))return;try{await api('/api/academy/accounts','PATCH',{account_id:Number(a.id),active:!a.active});status('Account status updated.');await refreshAccounts();}catch(e){status(e.message,true);}},a.active?'danger':'outline']];entry(el,a.display_name+' · '+a.username,a.role.toUpperCase()+' · '+(a.active?'Active':'Disabled')+' · '+(a.admissions||[]).join(', '),actions);}
}
async function refreshEnquiries(){const r=await api('/api/academy/enquiries');enquiries=r.enquiries||[];$('statEnquiries').textContent=enquiries.filter(e=>e.status==='new').length;const el=$('enquiriesList');el.replaceChildren();if(!enquiries.length)empty(el,'No enquiries received.');for(const e of enquiries){const actions=e.status==='closed'?[]:[['Mark Contacted',()=>changeEnquiry(e.id,'contacted')],['Close',()=>changeEnquiry(e.id,'closed')]];entry(el,e.guardian_name+' · '+e.phone,(e.student_name||'')+' · '+(e.notes||'')+' · '+e.status,actions);}}
async function changeEnquiry(id,state){try{await api('/api/academy/enquiries','PATCH',{id,status:state});status('Enquiry marked '+state);await refreshEnquiries();}catch(e){status(e.message,true);}}
async function refreshSettings(){const r=await api('/api/academy/settings');settings=r.settings||{};const f=$('settingsForm');for(const el of f.elements){if(!el.name)continue;el.value=settings[el.name]??'';}}
async function refreshGallery(){const r=await api('/api/academy/gallery?manage=1');gallery=r.gallery||[];const root=$('galleryList');root.replaceChildren();if(!gallery.length)empty(root,'No academy photographs uploaded yet.');for(const item of gallery){const fig=document.createElement('figure'),img=document.createElement('img');img.src=item.image_url;img.alt=item.alt_text||item.caption||'Academy photograph';img.loading='lazy';const cap=text('figcaption',(item.caption||'Academy Photograph')+(item.is_published?' · Published':' · Draft'));const b=text('button','Remove','danger');b.type='button';b.addEventListener('click',async()=>{if(!confirm('Delete photograph?'))return;try{await api('/api/academy/gallery','DELETE',{id:Number(item.id)});status('Photo deleted');await refreshGallery();}catch(e){status(e.message,true);}});fig.append(img,cap,b);root.append(fig);}}
async function refreshMonthly(){const student_id=Number(document.querySelector('#monthlyForm select[name="student_id"]').value);const root=$('monthlyList');if(!student_id){empty(root,'Select a student.');return;}const r=await api('/api/academy/monthly?student_id='+student_id);root.replaceChildren();if(!r.reports?.length)empty(root,'No reports recorded for this student yet.');for(const m of r.reports||[])entry(root,String(m.report_month).slice(0,7)+' · '+m.status,'New: '+m.new_pages+' · Revision: '+m.revision_pages+' · Verified total: '+(m.verified_total_pages??'not set')+' · Accuracy: '+(m.accuracy_percent??'not set'));}
async function refreshJuz(){const sid=Number(document.querySelector('#juzForm select[name="student_id"]').value);const el=$('juzList');if(!sid){empty(el,'Select a student.');return;}const r=await api('/api/academy/juz?student_id='+sid);el.replaceChildren();if(!r.juz?.length)empty(el,'No verified Juz progress yet.');for(const j of r.juz||[])entry(el,'Juz '+j.juz_number+' · '+(j.completion_verified?'Completed':'In Progress'),j.memorised_pages+' pages memorised'+(j.accuracy_verified?' · Accuracy verified':'')+' · '+(j.dua_message||''));}
function show(tab){document.querySelectorAll('.panel').forEach(s=>s.hidden=s.id!=='tab-'+tab);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',String(b.dataset.tab===tab));});if(tab==='monthly')refreshMonthly().catch(e=>status(e.message,true));if(tab==='juz')refreshJuz().catch(e=>status(e.message,true));window.scrollTo(0,0);}
function hook(form,handler){$(form).addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('[type="submit"]');button.disabled=true;try{await handler();}catch(err){status(err.message||'Unable to save.',true);}finally{button.disabled=false;}});}
function connect(){
 $('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab);});
 $('signout').addEventListener('click',async()=>{try{await api('/api/identity/logout','POST',{});}finally{location.replace('/login');}});
 $('openJourney').addEventListener('click',()=>{const id=$('previewStudent').value;if(id)location.href='/dashboard?student_id='+encodeURIComponent(id);});
 hook('studentForm',async()=>{const data=$form('studentForm');await api('/api/academy/students','POST',data);$('studentForm').reset();status('Student admitted and username/password created.');await Promise.all([refreshStudents(),refreshAccounts()]);});
 hook('accountForm',async()=>{const data=$form('accountForm');data.student_ids=[...$('parentStudents').selectedOptions].map(o=>Number(o.value));await api('/api/academy/accounts','POST',data);$('accountForm').reset();status('Account created. Share the temporary password privately.');await refreshAccounts();});
 $('resetSubmit').addEventListener('click',async()=>{const account_id=Number($('resetAccount').value),new_password=$('resetPassword').value;try{await api('/api/academy/accounts','PATCH',{account_id,new_password});$('resetPassword').value='';status('Password reset. Old sessions revoked; user must change the temporary password.');}catch(e){status(e.message,true);}});
 $('monthlyForm').querySelector('select[name="student_id"]').addEventListener('change',()=>refreshMonthly().catch(e=>status(e.message,true)));
 hook('monthlyForm',async()=>{const x=$form('monthlyForm');x.student_id=Number(x.student_id);for(const field of ['new_pages','revision_pages','verified_total_pages','accuracy_percent','target_pages'])x[field]=x[field]===''?null:Number(x[field]);await api('/api/academy/monthly','POST',x);status('Monthly Hifz Passport '+x.status+'.');await refreshMonthly();});
 $('juzForm').querySelector('select[name="student_id"]').addEventListener('change',()=>refreshJuz().catch(e=>status(e.message,true)));
 for(let i=1;i<=30;i++)$('juzNumber').append(new Option('Juz '+i+' · '+(JUZ[i]-JUZ[i-1])+' pages',String(i)));
 const updateMax=()=>{$('juzPages').max=String(JUZ[Number($('juzNumber').value)]-JUZ[Number($('juzNumber').value)-1]);};
 $('juzNumber').addEventListener('change',updateMax);updateMax();$('juzCompleted').addEventListener('change',()=>{if($('juzCompleted').checked)$('juzPages').value=$('juzPages').max;});
 hook('juzForm',async()=>{const x=$form('juzForm');x.student_id=Number(x.student_id);x.juz_number=Number(x.juz_number);x.memorised_pages=Number(x.memorised_pages);x.accuracy_percent=x.accuracy_percent===''?null:Number(x.accuracy_percent);x.completion_verified=$('juzCompleted').checked;x.accuracy_verified=$('juzForm').querySelector('input[name="accuracy_verified"]').checked;await api('/api/academy/juz','POST',x);status('Juz milestone verified, badge and dua published.');await refreshJuz();});
 hook('galleryForm',async()=>{const f=$('galleryForm');const fd=new FormData(f);if(!f.elements.rights_confirmed.checked)throw Error('Confirm rights and watermark-free image.');fd.set('is_published',f.elements.is_published.checked?'true':'false');await api('/api/academy/gallery','POST',fd,true);f.reset();status('Photo uploaded successfully.');await refreshGallery();});
 hook('settingsForm',async()=>{const x=$form('settingsForm');for(const name of ['huffaz_count','students_count','batches_count','service_years'])x[name]=Number(x[name]||0);await api('/api/academy/settings','POST',x);status('Website settings saved. Public pages will now display your updated information.');await refreshSettings();});
}
(async()=>{try{
 const r=await api('/api/identity/me');role=r.account.role;csrf=r.csrf;
 if(!['admin','usthad'].includes(role)){location.replace('/dashboard');return;}
 if(r.account.must_change_password){location.replace('/change-password');return;}
 $('staffName').textContent=r.account.display_name+' · '+(role==='admin'?'Administrator':'Usthad');
 if(role!=='admin')$('accountRole').querySelector('option[value="usthad"]').remove();
 connect();
 const all=await Promise.allSettled([refreshStudents(),refreshAccounts(),refreshEnquiries(),refreshSettings(),refreshGallery()]);
 for(const a of all)if(a.status==='rejected')throw a.reason;
 show('overview');status('Secure management tools ready.');
}catch(e){status(e.message||'Sign in required.',true);if(/Sign in|authoris/i.test(e.message||''))location.replace('/login');}})();
})();