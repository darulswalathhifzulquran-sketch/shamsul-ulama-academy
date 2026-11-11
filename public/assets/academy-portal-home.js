(()=>{'use strict';const $=id=>document.getElementById(id);
async function api(url,opts={}){const r=await fetch(url,{credentials:'include',cache:'no-store',...opts});const data=await r.json();if(!r.ok)throw new Error(data.error||'Request failed');return data;}
function imageSafe(src){if(typeof src!=='string')return false;try{const u=new URL(src,location.origin);return (u.protocol==='https:'||u.origin===location.origin)&&!u.username&&!u.password;}catch{return false;}}
function heading(text){const h=$('portalHeading');h.replaceChildren();const all=String(text||'A place where the Qur’an lives in every heart.');const i=all.toLowerCase().indexOf('qur');if(i<0){h.textContent=all;return;}h.append(document.createTextNode(all.slice(0,i)));const e=document.createElement('em');e.textContent=all.slice(i,i+6).replace(/\s+$/,'');h.append(e,document.createTextNode(all.slice(i+6)));}
async function setup(){
 try{const me=await api('/api/identity/me');const user=me.account;
 if(user.must_change_password){location.replace('/change-password');return;}
 $('welcomeAccount').textContent='Assalamu Alaikum, '+(user.display_name||user.username||'');
 $('teacherLink').hidden=!['admin','usthad'].includes(user.role);
 }catch{location.replace('/login?next=/dashboard');return;}
 try{const [s,g]=await Promise.allSettled([api('/api/academy/settings'),api('/api/academy/gallery')]);
 const settings=s.status==='fulfilled'?s.value.settings||{}:{};
 if(settings.home_heading)heading(settings.home_heading);
 if(settings.home_message)$('portalMessage').textContent=settings.home_message;
 const img=$('academyHeroPhoto'),status=$('photoStatus');
 const chosen=(g.status==='fulfilled'?g.value.gallery||[]:[]).find(item=>item.media_type==='image'&&imageSafe(item.image_url));
 const photo=settings.home_photo_url&&imageSafe(settings.home_photo_url)?settings.home_photo_url:chosen?.image_url;
 if(photo){img.src=photo;img.alt=chosen?.alt_text||'Academy photograph published by the Usthad';status.textContent='Academy photograph · curated by the Usthad';}
 if(settings.academy_name)$('photoCaption').textContent=settings.academy_name;
 }catch{}
}
$('portalLogout').addEventListener('click',async()=>{try{const me=await api('/api/identity/me');await api('/api/identity/logout',{method:'POST',headers:{'X-Academy-CSRF':me.csrf,'Content-Type':'application/json'},body:'{}'});}finally{location.replace('/login');}});
for(const id of ['portalJourney','bottomJourney'])$(id).addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();document.documentElement.classList.add('page-leaving');setTimeout(()=>location.assign('/journey'),window.matchMedia('(prefers-reduced-motion:reduce)').matches?0:120);});
setup();
})();