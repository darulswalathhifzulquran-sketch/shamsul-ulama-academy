(()=>{'use strict';
const $=id=>document.getElementById(id),months=['January','February','March','April','May','June','July','August','September','October','November','December'];
const START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
let account=null,csrf='',links=[],selected=null,records=[],reports=[],target=null,days=new Set([0,1,2,3,4,5,6]);
function msg(t){$('state').textContent=t;}
function elem(tag,t,cls){const n=document.createElement(tag);if(t!==null&&t!==undefined)n.textContent=String(t);if(cls)n.className=cls;return n;}
async function api(url,method='GET',data){const headers={};if(method!=='GET')headers['X-Academy-CSRF']=csrf;if(data)headers['Content-Type']='application/json';const r=await fetch(url,{method,credentials:'include',headers,body:data?JSON.stringify(data):undefined});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d;}
const utc=(year,month,day)=>{const d=new Date(Date.UTC(year,month-1,day));return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?d:null;};
const today=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date());const v=k=>Number(p.find(x=>x.type===k).value);return utc(v('year'),v('month'),v('day'));};
const plus=(d,n)=>new Date(d.getTime()+n*86400000),countDays=(a,b)=>Math.round((b-a)/86400000);
const fmt=n=>String(Number(n.toFixed(2)));
const dateFmt=d=>d.toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric',weekday:'long'});
function studyDays(a,b){let total=0;const delta=countDays(a,b);for(let i=1;i<=delta;i++)if(days.has(plus(a,i).getUTCDay()))total++;return total;}
function validTarget(){const start=today();if($('goalType').value==='custom')return utc(Number($('goalYear').value),Number($('goalMonth').value),Number($('goalDay').value));const n=Math.round(Number($('goalType').value)*12),m=start.getUTCMonth()+n,y=start.getUTCFullYear()+Math.floor(m/12),month=m%12+1;const last=new Date(Date.UTC(y,month,0)).getUTCDate();return utc(y,month,Math.min(start.getUTCDate(),last));}
function completed(){return records.filter(j=>j.completion_verified===true&&Number(j.memorised_pages)===START[Number(j.juz_number)]-START[Number(j.juz_number)-1]);}
function verifiedPages(){
 const fromJuz=records.reduce((sum,j)=>{const n=Number(j.juz_number),p=Number(j.memorised_pages);return sum+(Number.isInteger(n)&&n>=1&&n<=30&&Number.isInteger(p)&&p>=0?Math.min(p,START[n]-START[n-1]):0);},0);
 const latest=reports.find(r=>r.status==='published'&&r.verified_total_pages!==null&&r.verified_total_pages!==undefined&&Number.isFinite(Number(r.verified_total_pages)));
 return Math.min(604,Math.max(fromJuz,latest?Number(latest.verified_total_pages):0));
}
function projectDate(remaining,monthly){if(remaining<=0)return 'Completed';if(!Number.isFinite(monthly)||monthly<=0)return 'Waiting for progress';const n=Math.ceil(remaining*30.44/monthly);return n>36525?'Beyond forecast limit':dateFmt(plus(today(),n));}
function planMemorized(){
 const mode=$('planMode').value;
 if(mode==='official')return verifiedPages();
 const math=window.AcademyHifzMath;if(!math)throw Error('Hifz calendar calculator is not loaded. Refresh the page.');
 const n=Number($('planJuzCount').value),direction=$('planDirection').value,partial=Number($('planPartial').value||0);
 const next=math.nextJuz(n,direction),max=next?math.size(next):0;
 if(!Number.isInteger(n)||n<0||n>30||!Number.isFinite(partial)||partial<0||partial>=max&&n!==30||n===30&&partial!==0||Math.abs(partial*2-Math.round(partial*2))>1e-8)
  throw Error('Choose 0–30 completed Juz and valid half-pages in the next Juz.');
 return math.sumJuz(n,direction)+partial;
}
function updatePartialLimit(){
 const math=window.AcademyHifzMath;if(!math)return;
 const count=Number($('planJuzCount').value),direction=$('planDirection').value;
 const next=math.nextJuz(count,direction),max=next?math.size(next)-.5:0;
 $('planPartial').max=String(max);$('planPartial').disabled=!next;
 if(Number($('planPartial').value)>max)$('planPartial').value='0';
 $('planCountHint').textContent='Full '+count+' Juz ('+math.sumJuz(count,direction)+' pages), then '+(next?'optional partial Juz '+next+' (up to '+max+' pages).':'all 30 Juz complete.')+' These personal estimates never change Usthad records.';
}
function renderPlanRoadmap(plan){
 const root=$('monthlySchedule');root.replaceChildren();
 const table=elem('table');const head=elem('thead');const heading=elem('tr');
 for(const c of ['Month','Until','Study days','New pages','Cumulative'])heading.append(elem('th',c));
 head.append(heading);table.append(head);
 const body=elem('tbody');
 for(const row of plan.months){const tr=elem('tr');
  [String(row.month),row.end,String(row.study_days),fmt(row.new_pages),fmt(row.cumulative_new_pages)].forEach(v=>tr.append(elem('td',v)));body.append(tr);
 }
 table.append(body);root.append(table);
}
function setTargetDisplay(){
 const end=validTarget(),start=today(),root=$('monthlySchedule');
 $('planCustom').hidden=$('planMode').value!=='juz_count';
 try{
  const current=planMemorized(),remaining=604-current;
  $('planMemo').textContent=fmt(current)+' pages';
  $('planRemain').textContent=fmt(remaining)+' pages';
  $('planPercent').textContent=fmt(current/604*100)+'%';
  if(!end||end<=start)throw Error('Choose a future target date.');
  const model=window.AcademyHifzMath.roadmap({start,end,memorized:current,weekdays:days});
  $('dailyGoal').textContent=fmt(Math.ceil(model.per_study_day*100-1e-9)/100);
  $('dateStats').textContent=dateFmt(end)+' · '+model.calendar_days+' calendar days · '+model.study_days+' study days';
  $('monthGoal').textContent='Month 1: '+fmt(model.months[0].new_pages)+' new pages in '+model.months[0].study_days+' study days.';
  $('planDailySummary').textContent='Average '+fmt(model.per_study_day)+' new pages per study day; '+fmt(model.per_week)+' per selected study week; '+model.months.length+' calendar months. Monthly totals add up to exactly '+fmt(model.remaining)+' pages.';
  $('childMessage').textContent=remaining<=0?'മാഷാ അല്ലാഹ്! നിന്റെ വ്യക്തിഗത ലക്ഷ്യം പൂർത്തിയായി.':'നിന്റെ വ്യക്തിഗത പദ്ധതിയിൽ ഇനി '+fmt(remaining)+' പേജ് ബാക്കിയുണ്ട്. ഒരോ പഠനദിവസവും ശരാശരി '+fmt(model.per_study_day)+' പേജ് പഠിക്കുക.';
  renderPlanRoadmap(model);
 }catch(e){
  $('dailyGoal').textContent='—';$('dateStats').textContent=e.message;
  $('monthGoal').textContent='';$('planDailySummary').textContent='';
  root.replaceChildren(elem('p',e.message,'muted'));
 }
}

function blessing(juz){$('duaTitle').textContent='Mā shā Allāh! · Juz '+juz.juz_number;$('duaText').textContent=juz.dua_message||'അല്ലാഹു നിന്റെ ഹിഫ്‌ളിൽ ബറകത്ത് നൽകട്ടെ. ആമീൻ.';$('duaMeta').textContent=(juz.completion_verified?'Juz completion verified · ':'')+(juz.accuracy_verified?'Accuracy verified · ':'')+'Usthad-approved';$('duaDialog').showModal();}
function renderBadges(){
 const grid=$('juzGrid'),recent=$('recentBadges');grid.replaceChildren();recent.replaceChildren();
 const byNum=new Map(records.map(r=>[Number(r.juz_number),r]));
 let full=0;
 for(let i=1;i<=30;i++){
 const r=byNum.get(i),size=START[i]-START[i-1],p=r?Number(r.memorised_pages):0,done=!!r&&r.completion_verified===true&&p===size,acc=!!r&&r.accuracy_verified===true;
 if(done)full++;
 const b=elem('button',null,'juz-card '+(done?'earned':p?'partial':'remaining'));b.type='button';b.append(elem('span',done?'🏅':acc?'★':p?'📖':'◯','badge-icon'),elem('b','Juz '+i),elem('small',done?'Completed · '+size+' pages':p?p+' / '+size+' pages':'Not yet verified'));
 if(acc)b.append(elem('small','★ Accuracy verified'+(r.accuracy_percent!=null?' · '+r.accuracy_percent+'%':'')));
 if(done||acc)b.addEventListener('click',()=>blessing(r));else b.disabled=true;grid.append(b);
 }
 $('hafizGoal').textContent=full===30?'🏆 All 30 Juz verified! Final Hafiz assessment remains under Usthad supervision.':'🏆 Hafiz Goal · '+full+' of 30 Juz fully verified.';
 const earned=records.filter(r=>r.completion_verified||r.accuracy_verified).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))).slice(0,3);
 if(!earned.length){recent.append(elem('p','No official badges published yet.','muted'));return;}
 for(const r of earned){const b=elem('button',null,'achievement');b.type='button';b.append(elem('b',(r.completion_verified?'🏅':'★')+' Juz '+r.juz_number),elem('small',r.completion_verified?'Juz Completed':'Accuracy Star'));b.addEventListener('click',()=>blessing(r));recent.append(b);}
}
function renderMonthly(){
 const published=reports.filter(r=>r.status==='published'&&Number.isFinite(Number(r.new_pages)));
 const all=published.length?published.reduce((n,r)=>n+Number(r.new_pages),0)/published.length:0,latest=published.length?Number(published[0].new_pages):0,left=604-verifiedPages();
 $('allDate').textContent=projectDate(left,all);$('allRate').textContent=all?fmt(all)+' new pages per recorded published month ('+published.length+' months).':'No published monthly history yet.';
 $('latestDate').textContent=projectDate(left,latest);$('latestRate').textContent=published.length?'Latest month ('+String(published[0].report_month).slice(0,7)+'): '+fmt(latest)+' new pages.':'No latest published month yet.';
 const root=$('passportRecords');if(!root)return;root.replaceChildren();
 if(!published.length){root.append(elem('p','No monthly passport has been published by your Usthad yet.','muted'));return;}
 for(const report of published.slice(0,12)){
  const article=elem('article',null,'passport-record');
  article.append(elem('strong',String(report.report_month).slice(0,7)+' · Published Monthly Passport'));
  const details=['New Hifz: '+report.new_pages+' pages','Revision: '+report.revision_pages+' pages','Verified total: '+(report.verified_total_pages??'—')+' / 604 pages','Recitation accuracy: '+(report.accuracy_percent==null?'Not recorded':report.accuracy_percent+'%'),'Next target: '+(report.target_pages??'Not set')+' pages'];
  article.append(elem('p',details.join(' · '),'muted'));
  if(report.comment)article.append(elem('p','Usthad comment: '+report.comment,'muted'));
  root.append(article);
 }
}
function installDateFields(){
 const d=today(),yr=d.getUTCFullYear();for(let i=1;i<=31;i++)$('goalDay').append(new Option(String(i).padStart(2,'0'),String(i)));
 months.forEach((name,i)=>$('goalMonth').append(new Option(name,String(i+1))));
 for(let y=yr;y<=yr+30;y++)$('goalYear').append(new Option(String(y),String(y)));
 $('goalDay').value=String(d.getUTCDate());$('goalMonth').value=String(d.getUTCMonth()+1);$('goalYear').value=String(yr+2);
 for(let n=0;n<=30;n++)$('planJuzCount').append(new Option(n+' completed Juz',String(n)));
 $('planMode').addEventListener('change',setTargetDisplay);
 $('planJuzCount').addEventListener('change',()=>{updatePartialLimit();setTargetDisplay();});
 $('planDirection').addEventListener('change',()=>{updatePartialLimit();setTargetDisplay();});
 $('planPartial').addEventListener('input',setTargetDisplay);
 updatePartialLimit();
 $('revisionDate').value=today().toISOString().slice(0,10);$('revisionDate').max=today().toISOString().slice(0,10);
 for(const [i,name] of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].entries()){const label=elem('label');const c=document.createElement('input');c.type='checkbox';c.checked=true;c.value=String(i);c.addEventListener('change',()=>{c.checked?days.add(i):days.delete(i);setTargetDisplay();});label.append(c,elem('span',name));$('studyDays').append(label);}
 $('goalType').addEventListener('change',()=>{$('customDate').hidden=$('goalType').value!=='custom';setTargetDisplay();});
 ['goalDay','goalMonth','goalYear'].forEach(n=>$(n).addEventListener('change',setTargetDisplay));
 $('saveTarget').addEventListener('click',async()=>{
 if(selected?.relationship==='parent'){msg('Parent accounts are read-only.');return;}
 const date=validTarget(),start=today();if(!date||date<=start||!days.size){msg('Choose a future date and study days.');return;}
 try{planMemorized();await api('/api/academy/target','POST',{student_id:Number(selected.id),target_date:date.toISOString().slice(0,10),study_days:[...days].sort(),planning_mode:$('planMode').value,planning_completed_juz:Number($('planJuzCount').value),planning_direction:$('planDirection').value,planning_partial_pages:Number($('planPartial').value||0)});$('targetStatus').textContent='Your personal Hifz target was saved to the academy database.';msg('Target updated.');}catch(e){$('targetStatus').textContent=e.message;}
 });
}
async function loadRevisionNotes(){
 if(!selected)return;
 const status=$('revisionStatus'),list=$('revisionHistory');list.replaceChildren();
 const data=await api('/api/academy/revision?student_id='+encodeURIComponent(selected.id));
 const writable=data.can_edit===true&&account?.role==='student'&&selected.relationship==='student';
 $('revisionEdit').hidden=!writable;$('revisionSave').hidden=!writable;
 status.textContent=writable?'Your private notes are stored separately from Usthad progress.':'Read-only: only the linked student may save study notes.';
 if(!data.notes?.length){list.append(elem('p','No personal revision notes saved yet.','muted'));return;}
 for(const note of data.notes){
   const article=elem('article');
   const date=String(note.note_date).slice(0,10);
   article.append(elem('strong',date+' · New '+fmt(Number(note.new_pages))+' pages · Revision '+note.revision_pages+' pages'));
   if(note.note)article.append(elem('p',note.note,'muted'));list.append(article);
 }
}
async function loadStudent(id,quiet=false){
 if(!quiet){msg('Loading verified student progress…');$('privateArea').hidden=true;}
 const data=await api('/api/academy/overview?student_id='+encodeURIComponent(id));
 if(!data.selected)throw Error('No linked student record.');
 selected=data.selected;records=data.juz||[];reports=data.reports||[];$('privateArea').hidden=false;
 $('studentTitle').textContent=selected.full_name;$('admissionInfo').textContent=selected.admission_number+' · '+(selected.batch_name||'Hifz')+' · '+selected.relationship+' view';
 const total=verifiedPages(),left=604-total;
 $('verifiedTotal').textContent=fmt(total)+' / 604';$('pagesLeft').textContent=fmt(left);$('progressPercent').textContent=fmt(total/604*100)+'%';
 $('officialExplanation').textContent='OFFICIAL USTHAD RECORD · '+completed().length+' fully verified Juz. A record showing 19 pages in one Juz is not the same as 19 completed Juz.';
 $('roadmapMeta').textContent='Now: '+fmt(total/604*100)+'% · '+total+' pages verified · '+left+' pages to go.';
 $('saveTarget').hidden=selected.relationship!=='student'||account?.role!=='student';$('targetStatus').textContent='';
 const goal=data.target;
 $('planMode').value=goal?.planning_mode==='juz_count'?'juz_count':'official';
 $('planJuzCount').value=String(goal?.planning_completed_juz??0);
 $('planDirection').value=goal?.planning_direction==='descending'?'descending':'ascending';
 $('planPartial').value=String(goal?.planning_partial_pages??0);
 updatePartialLimit();
 if(goal?.target_date){const v=String(goal.target_date).slice(0,10).split('-').map(Number);if(v.length===3){$('goalType').value='custom';$('customDate').hidden=false;$('goalYear').value=String(v[0]);$('goalMonth').value=String(v[1]);$('goalDay').value=String(v[2]);}}
 else{$('goalType').value='2';$('customDate').hidden=true;}
 if(Array.isArray(goal?.study_days)){days=new Set(goal.study_days.map(Number));document.querySelectorAll('#studyDays input').forEach(c=>c.checked=days.has(Number(c.value)));}
 else{days=new Set([0,1,2,3,4,5,6]);document.querySelectorAll('#studyDays input').forEach(c=>c.checked=true);}
 renderMonthly();renderBadges();setTargetDisplay();
 try{await loadRevisionNotes();}catch(e){$('revisionStatus').textContent='Revision Notes unavailable: '+e.message;}
 const latest=completed().filter(j=>j.dua_message).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)))[0];
 if(latest){const key='academy-last-dua-'+selected.id,version=latest.juz_number+':'+latest.published_at;try{if(sessionStorage.getItem(key)!==version){sessionStorage.setItem(key,version);blessing(latest);}}catch{}}
 $('lastSynced').textContent='Checked '+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
 msg(quiet?'Updated published Hifz progress checked.':'Private, verified academy records loaded.');
}
async function refreshPublishedProgress(){
 if(!selected||document.hidden||document.querySelector('#duaDialog')?.open)return;
 if(document.activeElement?.closest('#privateArea')&&!document.activeElement?.closest('#refreshProgress'))return;
 try{await loadStudent(Number(selected.id),true);}catch(e){msg('Could not refresh progress: '+(e.message||'Network unavailable'));}
}
(async()=>{
 $('logout').addEventListener('click',async()=>{try{await api('/api/identity/logout','POST',{});}finally{location.replace('/login');}});
 $('closeDua').addEventListener('click',()=>$('duaDialog').close());installDateFields();
 $('revisionSave').addEventListener('click',async()=>{
  const status=$('revisionStatus'),button=$('revisionSave');
  if(!selected||account?.role!=='student'||selected.relationship!=='student'){status.textContent='Only the linked student can save notes.';return;}
  const date=$('revisionDate').value,newPages=Number($('revisionNew').value),revision=Number($('revisionPages').value),note=$('revisionText').value;
  if(!date||date>today().toISOString().slice(0,10)){status.textContent='Study date cannot be in the future. Choose today or a day in the past 90 days.';return;}
  if(!Number.isFinite(newPages)||newPages<0||newPages>30||Math.abs(newPages*2-Math.round(newPages*2))>1e-8){status.textContent='Enter 0–30 new pages in 0.5-page steps.';return;}
  if(!Number.isInteger(revision)||revision<0||revision>100){status.textContent='Revision Pages must be a whole number from 0 to 100.';return;}
  button.disabled=true;status.textContent='Saving your note…';
  try{const result=await api('/api/academy/revision','POST',{student_id:Number(selected.id),note_date:date,new_pages:newPages,revision_pages:revision,note});
   if(!result.saved)throw Error('Server did not confirm saving.');
   await loadRevisionNotes();status.textContent='✓ Your revision note was saved and can be reopened.';
  }catch(e){status.textContent='Could not save: '+e.message;}finally{button.disabled=false;}
 });

 $('refreshProgress').addEventListener('click',async()=>{const b=$('refreshProgress');b.disabled=true;try{if(selected)await loadStudent(Number(selected.id),true);}catch(e){msg('Refresh failed: '+(e.message||'Network error'));}finally{b.disabled=false;}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPublishedProgress();});
 setInterval(()=>{if(!document.hidden)refreshPublishedProgress();},90000);
 try{
 const me=await api('/api/identity/me');account=me.account;csrf=me.csrf;
 if(account.must_change_password){location.replace('/change-password');return;}
 const staff=['admin','usthad'].includes(account.role);
 if(staff){const link=elem('a','← Usthad Control Centre','btn outline');link.href='/staff';document.querySelector('header').prepend(link);}
 const all=await api('/api/academy/overview');links=all.students||[];
 if(!links.length){msg('No student record has been linked to this account. Contact the academy Usthad.');$('pending').hidden=false;document.querySelector('#pending').querySelectorAll('button').forEach(b=>b.hidden=true);return;}
 const sel=$('studentSelect');sel.replaceChildren();for(const s of links)sel.append(new Option(s.full_name+' · '+s.admission_number,String(s.id)));
 $('chooseStudent').hidden=links.length===1;sel.addEventListener('change',()=>loadStudent(Number(sel.value)).catch(e=>msg(e.message)));
 const requested=Number(new URLSearchParams(location.search).get('student_id')),first=links.find(s=>Number(s.id)===requested)||links[0];sel.value=String(first.id);await loadStudent(Number(first.id));
 }catch(e){msg(e.message||'Sign in required.');if(/Sign in required/.test(e.message||''))location.replace('/login');}
})();})();