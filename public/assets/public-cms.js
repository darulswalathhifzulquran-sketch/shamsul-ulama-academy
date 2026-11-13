(()=>{'use strict';
const $=id=>document.getElementById(id);
let settings=null,cacheAt=0;
window.__academyHeroRequestSequence=0;
async function getSettings(){
 if(settings&&Date.now()-cacheAt<3500)return settings;
 const r=await fetch('/api/academy/settings',{credentials:'same-origin',cache:'no-store'});
 if(!r.ok)throw Error('Public settings could not be loaded.');
 const data=await r.json();settings=data.settings;cacheAt=Date.now();return settings;
}
function safeMedia(value){try{const u=new URL(value,location.origin);return (u.protocol==='https:'||u.origin===location.origin)&&!u.username&&!u.password;}catch{return false;}}
function setLink(el,href,text){if(!el)return;el.href=href;if(text)el.textContent=text;}
function applySettings(s){
 if(!s)return;
 document.documentElement.dataset.academyTheme=s.theme_style||'classic';
 const heroVideo=document.getElementById('academyHomeVideo'),heroPhoto=document.getElementById('academyHomeFallback'),heroEmbed=document.getElementById('academyHomeEmbed');
 if(heroPhoto){
   const photo=String(s.home_photo_url||'').trim();
   if(photo&&safeMedia(photo))heroPhoto.src=photo;
   heroPhoto.onerror=()=>{heroPhoto.onerror=null;heroPhoto.src='/assets/courtyard-photo.jpg';};
 }
 if(heroVideo&&heroEmbed){
   const requestId=++window.__academyHeroRequestSequence;
   const isCurrent=()=>requestId===window.__academyHeroRequestSequence&&heroVideo.isConnected;
   const playButton=$('academyHeroPlayButton');
   const report=(state,detail='')=>{
     window.__academyHeroState={state,detail,time:new Date().toISOString(),selectedId:Number(s.home_video_gallery_id||0)};
     const el=$('academyHomePlaybackStatus');
     if(el){el.textContent=state==='error'?'VIDEO ERROR: '+(detail||'Video unavailable; showing Academy photo.'):state==='blocked'?'AUTOPLAY BLOCKED: click Play Academy Video.':state==='stalled'?'VIDEO STALLED: waiting for network.':state==='buffering'?'VIDEO BUFFERING: waiting for media data.':'';el.hidden=!['error','blocked','stalled','buffering'].includes(state);}
   };
   const hideControl=()=>{if(playButton)playButton.hidden=true;};
   const showControl=()=>{if(playButton)playButton.hidden=false;};
   const fallback=(reason='')=>{
     if(!isCurrent())return;
     heroVideo.style.opacity='0';heroVideo.hidden=true;heroEmbed.hidden=true;
     if(heroPhoto)heroPhoto.hidden=false;
     hideControl();
     if(reason)report('error',reason);
   };
   const playing=()=>{
     if(!isCurrent())return;
     heroVideo.hidden=false;heroVideo.style.opacity='1';heroEmbed.hidden=true;
     if(heroPhoto)heroPhoto.hidden=true;
     hideControl();report('playing');
   };
   function play(){
     if(!isCurrent())return;
     heroVideo.muted=true;heroVideo.defaultMuted=true;
     heroVideo.setAttribute('muted','');
     try{
       const result=heroVideo.play();
       if(result&&typeof result.catch==='function')result.catch(err=>{
         if(!isCurrent()||err?.name==='AbortError')return;
         if(err?.name==='NotAllowedError'){report('blocked',err.message||'Autoplay blocked');showControl();}
         else {report('error',err?.message||'Video playback failed');showControl();}
       });
     }catch(err){report('error',err?.message||'Playback unavailable');showControl();}
   }
   if(playButton)playButton.onclick=()=>{play();};
   heroVideo.pause();
   heroVideo.onplaying=playing;
   heroVideo.onloadeddata=()=>{if(isCurrent())play();};
   heroVideo.onerror=()=>{
     if(!isCurrent())return;
     const e=heroVideo.error;
     fallback('HTML5 media error '+(e?.code||'unknown')+': '+(e?.message||'Network, format or decoding failure'));
   };
   heroVideo.onstalled=()=>{if(isCurrent())report('stalled','Waiting for video network data');};
   heroVideo.onwaiting=()=>{if(isCurrent()&&heroVideo.readyState<3)report('buffering','Waiting for media data');};
   if(heroPhoto)heroPhoto.hidden=false;
   heroEmbed.hidden=true;heroEmbed.removeAttribute('src');
   const selected=Number(s.home_video_gallery_id||0);
   const direct=String(s.home_video_url||'').trim();
   const applyDirectVideo=url=>{
     if(!isCurrent())return;
     if(!url||!safeMedia(url)){fallback('Approved video URL is unavailable.');return;}
     let parsed;
     try{parsed=new URL(url,location.origin);}catch{fallback('Invalid video address.');return;}
     if(!/\.(mp4|webm)$/i.test(parsed.pathname)){fallback('Unsupported video file extension. Upload MP4 or WebM.');return;}
     heroVideo.hidden=false;
     heroVideo.style.opacity='0';
     heroVideo.preload='auto';
     // Native browser video succeeds with a fresh S3 signed URL. A 302 from
     // a first-party endpoint stalls in some browsers; avoid that redirect.
     heroVideo.src=url;
     report('loading','Loading selected MP4 / WebM');
     play();
   };
   if(selected){
     report('checking','Checking selected Gallery video '+selected);
     fetch('/api/academy/gallery',{cache:'no-store',credentials:'same-origin'}).then(async r=>{
       if(!r.ok)throw Error('Gallery returned HTTP '+r.status);
       return await r.json();
     }).then(data=>{
       if(!isCurrent())return;
       const item=(data.gallery||[]).find(m=>Number(m.id)===selected&&m.media_type==='video');
       if(!item)throw Error('The selected video #'+selected+' is unpublished or missing from Gallery.');
       const url=item.image_url;
       if(!url)throw Error('No playable video URL was returned from Gallery.');
       const u=new URL(url,location.origin);
       const yt=u.hostname==='www.youtube-nocookie.com'&&u.pathname.startsWith('/embed/');
       const vm=u.hostname==='player.vimeo.com'&&u.pathname.startsWith('/video/');
       if(yt||vm){
         heroEmbed.src=yt?url+'?autoplay=1&mute=1&playsinline=1&loop=1&playlist='+u.pathname.split('/').pop():url+'?autoplay=1&muted=1&loop=1&background=1';
         heroEmbed.onload=()=>{if(!isCurrent())return;heroEmbed.hidden=false;heroVideo.hidden=true;if(heroPhoto)heroPhoto.hidden=true;report('playing','Embedded video opened');};
         heroEmbed.onerror=()=>fallback('Embedded video could not be loaded.');
       }else applyDirectVideo(url);
     }).catch(err=>{if(isCurrent())fallback('Selected video #'+selected+' could not load: '+(err?.message||String(err)));});
   }else if(direct){applyDirectVideo(direct);}
   else{heroVideo.pause();heroVideo.removeAttribute('src');fallback();}
 }
 const photo=document.getElementById('v17HeroApproved'),placeholder=document.getElementById('v17HeroPlaceholder'),caption=document.getElementById('v17HeroCaption');
 if(photo&&placeholder){
  const candidate=String(s.home_photo_url||'');
  let safe=false;
  try{const u=new URL(candidate,location.origin);safe=!!candidate&&(u.protocol==='https:'||u.origin===location.origin)&&!u.username&&!u.password;}catch{}
  if(safe){photo.src=candidate;photo.hidden=false;placeholder.hidden=true;if(caption)caption.textContent='Official Academy photograph';}
  else{photo.hidden=true;placeholder.hidden=false;if(caption)caption.textContent='Waiting for an approved Academy photograph';}
 }

 for(const key of ['--green','--green2','--forest'])document.documentElement.style.setProperty(key,'#075333');
 const about=$('aboutIntro');if(about)about.textContent=s.about||'Qur’an memorisation and Islamic learning.';
 const vision=$('aboutVision');if(vision)vision.textContent=s.vision||'Purposeful Qur’an learning.';
 const contactAddressNode=$('contactAddress');if(contactAddressNode)contactAddressNode.textContent=s.address;
 const bodyAddress=$('aboutAddress');if(bodyAddress)bodyAddress.textContent=s.address;
 const contactInfoAddress=$('contactInfoAddress');if(contactInfoAddress)contactInfoAddress.textContent=s.address;
 const aboutAffiliation=$('aboutAffiliation');if(aboutAffiliation)aboutAffiliation.textContent=[s.affiliation,s.affiliation_place].filter(Boolean).join(' — ');
 const footerAffiliationPlace=$('footerAffiliationPlace');if(footerAffiliationPlace)footerAffiliationPlace.textContent=s.affiliation_place||'';
 const topline=$('academyTopline');if(topline)topline.textContent=[s.academy_name,s.address,s.affiliation].filter(Boolean).join(' · ');
 const map=$('academyMapLink'),aboutMap=$('aboutMapLink');
 for(const el of [map,aboutMap])if(el&&s.maps_url)setLink(el,s.maps_url,'Open Academy Location on Google Maps ↗');
 const footer=document.querySelector('footer');if(footer){
 const group=footer.querySelector('.footer-grid > div:last-child');
 if(group){const ps=group.querySelectorAll('p');for(const p of ps){if(p.textContent.trim().startsWith('⌖'))p.textContent='⌖ '+s.address;if(p.textContent.trim().startsWith('◷'))p.textContent='◷ '+s.office_hours;}}
 const affiliationLink=footer.querySelector('.affiliation-link');if(affiliationLink){affiliationLink.textContent=s.affiliation;affiliationLink.href=s.affiliation_url;}
 }
 const addrFooter=$('footerAcademyAddress'),hoursFooter=$('footerAcademyHours');
 if(addrFooter&&s.address)addrFooter.textContent=s.address;
 if(hoursFooter&&s.office_hours)hoursFooter.textContent=s.office_hours;
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
  const address=String(s.address||'Perighala, Ernakulam, Kerala, India').trim();
  if(address){
   const frame=document.createElement('iframe');
   frame.src='https://maps.google.com/maps?q=10.0051171%2C76.4025429&z=17&output=embed';
   frame.title='Map search for Shamsul Ulama Islamic Academy location';
   frame.loading='lazy';frame.referrerPolicy='no-referrer-when-downgrade';frame.style.width='100%';frame.style.height='280px';frame.style.border='0';frame.style.borderRadius='11px';mapFrame.append(frame);
  }
 }
}
async function gallery(){
 const root=$('publicGallery'),notice=$('galleryStatus');if(!root)return;
 try{
  const r=await fetch('/api/academy/gallery',{credentials:'same-origin',cache:'no-store'});
  if(!r.ok)throw Error('Gallery unavailable.');
  const data=await r.json();root.replaceChildren();
  if(!data.gallery?.length){notice.hidden=false;notice.textContent='Approved academy photos and videos will appear here when published by the Usthad.';return;}
  notice.hidden=true;
  for(const media of data.gallery){
   const fig=document.createElement('figure');let element;
   if(media.media_type==='video'){
    if(media.image_url.startsWith('https://www.youtube-nocookie.com/embed/')||media.image_url.startsWith('https://player.vimeo.com/video/')){
     element=document.createElement('iframe');element.src=media.image_url;element.title=media.alt_text||media.caption||'Academy video';element.loading='lazy';element.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';element.allowFullscreen=true;element.referrerPolicy='strict-origin-when-cross-origin';
    }else{
     element=document.createElement('video');element.src=media.image_url;element.controls=true;element.preload='metadata';element.playsInline=true;
    }
   }else{
    element=document.createElement('img');element.src=media.image_url;element.alt=media.alt_text||media.caption||'Academy photo';element.loading='lazy';
   }
   const caption=document.createElement('figcaption');caption.textContent=media.caption||'Shamsul Ulama Islamic Academy';
   fig.append(element,caption);root.append(fig);
  }
 }catch(e){notice.hidden=false;notice.textContent='Unable to load the official gallery right now.';}
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
async function applySitePhotos(){
 const imgs=[...document.querySelectorAll('img[data-academy-photo]')];
 if(!imgs.length)return;
 try{
  const r=await fetch('/api/academy/site-photos',{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)return;
  const photos=(await r.json()).photos||{};
  for(const img of imgs){
   if(!img.isConnected)continue;
   const entry=photos[img.dataset.academyPhoto];
   if(!entry?.url||!safeMedia(entry.url))continue;
   const image=new Image();
   image.onload=()=>{
     if(!img.isConnected)return;
     img.src=entry.url;img.alt=entry.alt_text||img.alt;
     img.hidden=false;
     const wrap=img.closest('.academy-learning-real-photo,.academy-v21-programme-photo,.academy-v21-detail-photo');
     if(wrap){wrap.hidden=false;wrap.classList.add('has-real-programme-photo');}
   };
   image.onerror=()=>{};
   image.src=entry.url;
  }
 }catch(err){console.warn('Official Academy photo loading unavailable',err);}
}
async function applyMediaPlacements(){
 try{
  const [placementsRes,galleryRes]=await Promise.all([
   fetch('/api/academy/media-placements',{cache:'no-store'}),
   fetch('/api/academy/gallery',{cache:'no-store'})
  ]);
  if(!placementsRes.ok||!galleryRes.ok)return;
  const placements=(await placementsRes.json()).placements||{};
  const items=(await galleryRes.json()).gallery||[];
  const getImage=slot=>{
   const item=items.find(x=>Number(x.id)===Number(placements[slot])&&x.media_type==='image');
   return item&&safeMedia(item.media_url||item.image_url)?(item.media_url||item.image_url):null;
  };
  const sourceSlots={
   '/assets/academy-owner-official-logo.png':'brand_logo',
   '/assets/shamsul-ulama-portrait-main.jpg':'scholar_home',
   '/assets/shamsul-ulama-portrait-legacy.jpg':'scholar_profile',
   '/assets/quran-photo.jpg':'about_quran',
   '/assets/hifz-boy-academy.webp':'learner_illustration'
  };
  for(const img of document.querySelectorAll('img[src]')){
   const slot=sourceSlots[img.getAttribute('src')];
   const replacement=slot&&getImage(slot);
   if(replacement)img.src=replacement;
  }
  for(const img of document.querySelectorAll('img[data-media-slot]')){
   const replacement=getImage(img.dataset.mediaSlot);
   if(!replacement)continue;
   img.onload=()=>{img.hidden=false;if(img.parentElement?.classList.contains('academy-learning-real-photo'))img.parentElement.hidden=false;};
   img.onerror=()=>{img.hidden=true;if(img.parentElement?.classList.contains('academy-learning-real-photo'))img.parentElement.hidden=true;};
   img.src=replacement;
   if(img.complete&&img.naturalWidth>0)img.onload();
  }
  const hero=getImage('home_fallback');
  if(hero){
   const el=$('academyHomeFallback');if(el)el.src=hero;
  }
  const welcome=getImage('home_section');
  if(welcome){
   const img=$('v17HeroApproved'),placeholder=$('v17HeroPlaceholder'),caption=$('v17HeroCaption');
   if(img){img.src=welcome;img.hidden=false;}
   if(placeholder)placeholder.hidden=true;
   if(caption)caption.textContent='Academy photo';
  }
 }catch(err){console.warn('Optional website image placements unavailable',err);}
}
async function render(){
 const path=location.pathname;
 try{applySettings(await getSettings());}catch(e){}
 await applySitePhotos();
 await applyMediaPlacements();
 if(path==='/gallery')await gallery();
 if(path==='/admission')admission();
}
window.addEventListener('academy:render',render);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();