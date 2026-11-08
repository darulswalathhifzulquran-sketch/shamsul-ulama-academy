(()=>{'use strict';
const $=id=>document.getElementById(id);
let settings=null,cacheAt=0;
async function getSettings(){
 if(settings&&Date.now()-cacheAt<30000)return settings;
 const r=await fetch('/api/academy/settings',{credentials:'same-origin'});
 if(!r.ok)throw Error('Public settings could not be loaded.');
 const data=await r.json();settings=data.settings;cacheAt=Date.now();return settings;
}
function setLink(el,href,text){if(!el)return;el.href=href;if(text)el.textContent=text;}
function applySettings(s){
 if(!s)return;
 document.documentElement.dataset.academyTheme=s.theme_style||'classic';
 if(s.theme_style==='heritage'){document.documentElement.style.setProperty('--green','#07572f');document.documentElement.style.setProperty('--forest','#063f28');}
 else if(s.theme_style==='minimal'){document.documentElement.style.setProperty('--green','#086d41');document.documentElement.style.setProperty('--forest','#084a31');}
 else{document.documentElement.style.setProperty('--green','#08743f');document.documentElement.style.setProperty('--forest','#06452f');}
 const about=$('aboutIntro');if(about)about.textContent=s.about||'Qur’an memorisation and Islamic learning.';
 const vision=$('aboutVision');if(vision)vision.textContent=s.vision||'Purposeful Qur’an learning.';
 const location=$('contactAddress');if(location)location.textContent=s.address;
 const bodyAddress=$('aboutAddress');if(bodyAddress)bodyAddress.textContent=s.address;
 const map=$('academyMapLink'),aboutMap=$('aboutMapLink');
 for(const el of [map,aboutMap])if(el&&s.maps_url)setLink(el,s.maps_url,'Open Academy Location on Google Maps ↗');
 const footer=document.querySelector('footer');if(footer){
 const group=footer.querySelector('.footer-grid > div:last-child');
 if(group){const ps=group.querySelectorAll('p');for(const p of ps){if(p.textContent.trim().startsWith('⌖'))p.textContent='⌖ '+s.address;if(p.textContent.trim().startsWith('◷'))p.textContent='◷ '+s.office_hours;}}
 const affiliationLink=footer.querySelector('.affiliation-link');if(affiliationLink){affiliationLink.textContent=s.affiliation;affiliationLink.href=s.affiliation_url;}
 }
 const numbers=[s.phone1,s.phone2].filter(Boolean);
 for(const a of document.querySelectorAll('a[href^="tel:"]')){
  const old=a.getAttribute('href'),idx=old.includes('9496845773')?0:old.includes('9562962762')?1:-1;
  if(idx>=0&&numbers[idx]){a.href='tel:'+numbers[idx].replace(/[^+0-9]/g,'');a.textContent=numbers[idx];}
 }
 const cards=[...document.querySelectorAll('.contact-card')];
 for(const card of cards){if(card.textContent.includes('Our Address')){const strong=card.querySelector('strong');if(strong)strong.textContent=s.address;}}
 const hoursText=document.querySelector('.office');
 if(hoursText){const x=hoursText.querySelector('p');if(x)x.textContent=s.office_hours;}
 const achievement=$('publicAchievements'),fig=$('achievementFigures');
 if(achievement&&fig){
  const stats=[['Huffaz',s.huffaz_count],['Students',s.students_count],['Batches',s.batches_count],['Years of Service',s.service_years]].filter(([_,n])=>Number(n)>0);
  achievement.hidden=stats.length===0;fig.replaceChildren();
  for(const [label,n] of stats){const item=document.createElement('article');item.className='achievement-figure';const number=document.createElement('strong');number.textContent=String(n)+'+';const desc=document.createElement('span');desc.textContent=label;item.append(number,desc);fig.append(item);}
 }
 const mapFrame=$('academyMap');
 if(mapFrame){
  mapFrame.replaceChildren();
  const url=String(s.maps_url||'');let lat=10.0051171,lng=76.4025429;
  const at=url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/),bang=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const pair=bang||at;if(pair){lat=Number(pair[1]);lng=Number(pair[2]);}
  if(Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180){
   const frame=document.createElement('iframe');frame.src='https://maps.google.com/maps?q='+encodeURIComponent(lat+','+lng)+'&z=17&output=embed';
   frame.title='Shamsul Ulama Islamic Academy location map';frame.loading='lazy';frame.referrerPolicy='no-referrer-when-downgrade';frame.style.width='100%';frame.style.height='280px';frame.style.border='0';frame.style.borderRadius='11px';mapFrame.append(frame);
  }
 }
}
async function gallery(){
 const root=$('publicGallery'),notice=$('galleryStatus');if(!root)return;
 try{const r=await fetch('/api/academy/gallery',{credentials:'same-origin'});if(!r.ok)throw Error('Gallery unavailable.');const data=await r.json();root.replaceChildren();
 if(!data.gallery?.length){notice.textContent='Approved academy photographs will appear here when published by the Usthad.';return;}
 notice.hidden=true;for(const photo of data.gallery){const fig=document.createElement('figure');const img=document.createElement('img');img.src=photo.image_url;img.alt=photo.alt_text||photo.caption||'Academy photo';img.loading='lazy';const caption=document.createElement('figcaption');caption.textContent=photo.caption||'Shamsul Ulama Islamic Academy';fig.append(img,caption);root.append(fig);}
 }catch(e){notice.textContent='Unable to load the official gallery right now.';}
}
function admission(){
 const form=$('admissionEnquiry');if(!form||form.dataset.bound)return;form.dataset.bound='true';
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('button[type="submit"]'),message=$('enquiryMessage'),receipt=$('applicationReceipt');
  if(!form.reportValidity())return;
  button.disabled=true;message.textContent='Saving your application…';receipt.hidden=true;
  const data=Object.fromEntries(new FormData(form).entries());data.consent=form.querySelector('input[name="consent"]').checked;
  try{
   const r=await fetch('/api/academy/applications',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
   const json=await r.json();if(!r.ok)throw Error(json.error||'Unable to save your application.');
   if(!json.application_number)throw Error('Application was not confirmed by the database.');
   message.textContent='Application saved successfully.';
   receipt.replaceChildren();
   const heading=document.createElement('strong');heading.textContent='Application Saved · '+json.application_number;
   const help=document.createElement('p');help.textContent='Keep this reference number. The Usthad will review your application. You can contact the Academy with this number.';
   receipt.append(heading,help);receipt.hidden=false;form.reset();
  }catch(error){message.textContent=error.message||'Application was not saved; please try again.';}finally{button.disabled=false;}
 });
}
async function render(){
 const path=location.pathname;
 try{applySettings(await getSettings());}catch(e){}
 if(path==='/gallery')await gallery();
 if(path==='/admission')admission();
}
window.addEventListener('academy:render',render);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();