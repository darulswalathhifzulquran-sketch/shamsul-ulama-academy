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
function verifiedPages(){return records.reduce((sum,j)=>{const n=Number(j.juz_number),p=Number(j.memorised_pages);return sum+(Number.isInteger(n)&&n>=1&&n<=30&&Number.isInteger(p)&&p>=0?Math.min(p,START[n]-START[n-1]):0);},0);}
function projectDate(remaining,monthly){if(remaining<=0)return 'Completed';if(!Number.isFinite(monthly)||monthly<=0)return 'Waiting for progress';const n=Math.ceil(remaining*30.44/monthly);return n>36525?'Beyond forecast limit':dateFmt(plus(today(),n));}
function setTargetDisplay(){const remaining=604-verifiedPages(),end=validTarget(),start=today(),calendar=end?countDays(start,end):0,selectedStudy=end&&calendar>0?studyDays(start,end):0;
 if(!selectedStudy){$('dailyGoal').textContent='—';$('dateStats').textContent='Choose a future target date and at least one study day.';$('monthGoal').textContent='';$('childMessage').textContent='നിന്റെ ലക്ഷ്യദിവസവും പഠനദിവസങ്ങളും തിരഞ്ഞെടുക്കൂ.';return;}
 const per=remaining/selectedStudy,daily=Math.ceil(per*100-1e-9)/100,monthStudy=studyDays(start,plus(start,30));
 $('dailyGoal').textContent=fmt(daily);$('dateStats').textContent=dateFmt(end)+' · '+calendar+' calendar days · '+selectedStudy+' study days';
 $('monthGoal').textContent='Next 30 days: approximately '+fmt(monthStudy*per)+' pages ('+monthStudy+' study days). Revision is separate.';
 $('childMessage').textContent=remaining<=0?'മാഷാ അല്ലാഹ്! ഖുർആൻ പാഠങ്ങൾ ഉസ്താദ് സ്ഥിരീകരിച്ചു.':'നിനക്ക് ഇനി '+remaining+' പേജ് ബാക്കിയുണ്ട്. ഓരോ പഠനദിവസവും ശരാശരി '+fmt(daily)+' പേജ് പഠിച്ചാൽ ലക്ഷ്യത്തിലെത്താം!';
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
}
function installDateFields(){
 const d=today(),yr=d.getUTCFullYear();for(let i=1;i<=31;i++)$('goalDay').append(new Option(String(i).padStart(2,'0'),String(i)));
 months.forEach((name,i)=>$('goalMonth').append(new Option(name,String(i+1))));
 for(let y=yr;y<=yr+30;y++)$('goalYear').append(new Option(String(y),String(y)));
 $('goalDay').value=String(d.getUTCDate());$('goalMonth').value=String(d.getUTCMonth()+1);$('goalYear').value=String(yr+2);
 for(const [i,name] of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].entries()){const label=elem('label');const c=document.createElement('input');c.type='checkbox';c.checked=true;c.value=String(i);c.addEventListener('change',()=>{c.checked?days.add(i):days.delete(i);setTargetDisplay();});label.append(c,elem('span',name));$('studyDays').append(label);}
 $('goalType').addEventListener('change',()=>{$('customDate').hidden=$('goalType').value!=='custom';setTargetDisplay();});
 ['goalDay','goalMonth','goalYear'].forEach(n=>$(n).addEventListener('change',setTargetDisplay));
 $('saveTarget').addEventListener('click',async()=>{
 if(selected?.relationship==='parent'){msg('Parent accounts are read-only.');return;}
 const date=validTarget(),start=today();if(!date||date<=start||!days.size){msg('Choose a future date and study days.');return;}
 try{await api('/api/academy/target','POST',{student_id:Number(selected.id),target_date:date.toISOString().slice(0,10),study_days:[...days].sort()});$('targetStatus').textContent='Your personal Hifz target was saved to the academy database.';msg('Target updated.');}catch(e){$('targetStatus').textContent=e.message;}
 });
}
async function loadStudent(id){
 msg('Loading verified student progress…');$('privateArea').hidden=true;
 const data=await api('/api/academy/overview?student_id='+encodeURIComponent(id));
 if(!data.selected)throw Error('No linked student record.');
 selected=data.selected;records=data.juz||[];reports=data.reports||[];$('privateArea').hidden=false;
 $('studentTitle').textContent=selected.full_name;$('admissionInfo').textContent=selected.admission_number+' · '+(selected.batch_name||'Hifz')+' · '+selected.relationship+' view';
 const total=verifiedPages(),left=604-total;
 $('verifiedTotal').textContent=total+' / 604';$('pagesLeft').textContent=left;$('progressPercent').textContent=fmt(total/604*100)+'%';
 $('roadmapMeta').textContent='Now: '+fmt(total/604*100)+'% · '+total+' pages verified · '+left+' pages to go.';
 $('saveTarget').hidden=selected.relationship==='parent';$('targetStatus').textContent='';
 const goal=data.target;
 if(goal?.target_date){const v=String(goal.target_date).slice(0,10).split('-').map(Number);if(v.length===3){$('goalType').value='custom';$('customDate').hidden=false;$('goalYear').value=String(v[0]);$('goalMonth').value=String(v[1]);$('goalDay').value=String(v[2]);}}
 else{$('goalType').value='2';$('customDate').hidden=true;}
 if(Array.isArray(goal?.study_days)){days=new Set(goal.study_days.map(Number));document.querySelectorAll('#studyDays input').forEach(c=>c.checked=days.has(Number(c.value)));}
 else{days=new Set([0,1,2,3,4,5,6]);document.querySelectorAll('#studyDays input').forEach(c=>c.checked=true);}
 renderMonthly();renderBadges();setTargetDisplay();
 const latest=completed().filter(j=>j.dua_message).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)))[0];
 if(latest){const key='academy-last-dua-'+selected.id,version=latest.juz_number+':'+latest.published_at;try{if(sessionStorage.getItem(key)!==version){sessionStorage.setItem(key,version);blessing(latest);}}catch{}}
 msg('Private, verified academy records loaded.');
}
(async()=>{
 $('logout').addEventListener('click',async()=>{try{await api('/api/identity/logout','POST',{});}finally{location.replace('/login');}});
 $('closeDua').addEventListener('click',()=>$('duaDialog').close());installDateFields();
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