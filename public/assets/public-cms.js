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
   // Never display an old or deleted Academy photo as the selected video's preview.
   // Frame 31 is taken from the current video; 13/14 are the identical earlier clip.
   const mobilePreview=window.matchMedia('(max-width: 1150px), (hover: none) and (pointer: coarse)').matches;
   const previewId=(mobilePreview&&Number(s.home_mobile_video_gallery_id||0))?Number(s.home_mobile_video_gallery_id):Number(s.home_video_gallery_id||0);
   const posters={13:'/assets/academy-video-poster-v78.jpg',14:'/assets/academy-video-poster-v78.jpg',31:'/assets/academy-video-poster-selected-31-v86.jpg'};
   const poster=posters[previewId]||'';
   const fallback=String(s.home_photo_url||'').trim();
   // Unknown/new video: show a neutral background until its own first frame, not an unrelated image.
   const next=previewId?poster:(fallback&&safeMedia(fallback)?fallback:'');
   if(next){
     if(heroPhoto.getAttribute('src')!==next)heroPhoto.src=next;
     heroPhoto.alt=previewId?'Preview frame from the selected Academy video':'Approved Academy homepage photograph';
     heroPhoto.hidden=!!(heroVideo&&heroVideo.readyState>=2&&!heroVideo.paused);
   }else{
     heroPhoto.hidden=true;
     heroPhoto.removeAttribute('src');
   }
   heroPhoto.onerror=()=>{heroPhoto.hidden=true;heroPhoto.removeAttribute('src');};
 }
 const mobileHero=window.matchMedia('(max-width: 1150px), (hover: none) and (pointer: coarse)').matches;
 const intendedId=mobileHero&&Number(s.home_mobile_video_gallery_id||0)?Number(s.home_mobile_video_gallery_id):Number(s.home_video_gallery_id||0);
 window.__academyHeroCurrentSelectedId=intendedId;
 // A video already primed from the real selected source must not be paused and restarted.
 if(heroVideo&&heroEmbed){
   const requestId=++window.__academyHeroRequestSequence;
   const isCurrent=()=>requestId===window.__academyHeroRequestSequence&&heroVideo.isConnected;
   const playButton=$('academyHeroPlayButton');
   // Keep technical diagnostics available to developers, not to visitors.
   const report=(state,detail='')=>{
     window.__academyHeroState={state,detail,time:new Date().toISOString(),selectedId:Number((window.__academyHeroDevice==='mobile-9:16'?s.home_mobile_video_gallery_id:s.home_video_gallery_id)||0)};
     const el=$('academyHomePlaybackStatus');
     if(el){el.textContent='';el.hidden=true;}
     if(state==='error')console.warn('Academy homepage video fallback:',detail);
   };
   let reloadSource=null,playbackRetryCount=0,stallTimer=null;
   const retryOrFallback=reason=>{
     if(!isCurrent())return;
     if(stallTimer){clearTimeout(stallTimer);stallTimer=null;}
     if(reloadSource&&playbackRetryCount<2){
       playbackRetryCount++;
       heroVideo.style.opacity='0';
       if(heroPhoto)heroPhoto.hidden=!heroPhoto.getAttribute('src');
       report('retry','Refreshing media source '+playbackRetryCount);
       delete heroVideo.dataset.academySelectedId;
       heroVideo.removeAttribute('src');
       heroVideo.load();
       setTimeout(()=>{if(isCurrent())reloadSource();},450*playbackRetryCount);
     }else fallback(reason);
   };
   const hideControl=()=>{if(playButton)playButton.hidden=true;};
   const showControl=()=>{if(playButton)playButton.hidden=false;};
   const fallback=(reason='')=>{
     if(!isCurrent())return;
     heroVideo.style.opacity='0';heroVideo.hidden=true;heroEmbed.hidden=true;
     if(heroPhoto)heroPhoto.hidden=!heroPhoto.getAttribute('src');
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
   if(!(intendedId>0&&heroVideo.dataset.academySelectedId===String(intendedId)&&heroVideo.getAttribute('src')&&!heroVideo.error))heroVideo.pause();
   heroVideo.onplaying=()=>{if(stallTimer){clearTimeout(stallTimer);stallTimer=null;}playing();};
   heroVideo.onloadeddata=()=>{
      if(!isCurrent())return;
      if(stallTimer){clearTimeout(stallTimer);stallTimer=null;}
      // The first decoded video frame replaces the preview immediately.
      // Playback has already been requested when src was assigned.
      heroVideo.hidden=false;heroVideo.style.opacity='1';
      if(heroPhoto)heroPhoto.hidden=true;
    };
   heroVideo.onerror=()=>{
     if(!isCurrent())return;
     const e=heroVideo.error;
     retryOrFallback('Video loading error '+(e?.code||'unknown')+': '+(e?.message||'Network or decoding unavailable'));
   };
   heroVideo.onstalled=()=>{
     if(!isCurrent()||heroVideo.readyState>=3)return;
     report('stalled','Playback temporarily stalled');
     if(stallTimer)clearTimeout(stallTimer);
     stallTimer=setTimeout(()=>{if(isCurrent()&&heroVideo.readyState<2)retryOrFallback('Video loading timed out');},8500);
   };
   heroVideo.onwaiting=()=>{if(isCurrent()&&heroVideo.readyState<3)report('buffering','Loading video');};
   if(heroPhoto)heroPhoto.hidden=!heroPhoto.getAttribute('src');
   heroEmbed.hidden=true;heroEmbed.removeAttribute('src');
   const mobileScreen=window.matchMedia('(max-width: 1150px), (hover: none) and (pointer: coarse)').matches;
   const mobileSelected=Number(s.home_mobile_video_gallery_id||0);
   const useMobile=mobileScreen&&mobileSelected>0;
   const selected=useMobile?mobileSelected:Number(s.home_video_gallery_id||0);
   const direct=useMobile?'':String(s.home_video_url||'').trim();
   window.__academyHeroDevice=useMobile?'mobile-9:16':mobileScreen?'mobile-desktop-fallback':'desktop-16:9';
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
     heroVideo.dataset.academySelectedId=String(selected);
     heroVideo.src=url;
     heroVideo.load();
     report('loading','Loading selected MP4 / WebM');
     // Request muted autoplay as soon as the source is assigned.
     // Browsers start playback automatically as media becomes ready.
     play();
   };
   if(selected){
     // Read exactly one current video from a lightweight endpoint. Do not
     // depend on the whole Gallery list or signed URLs cached by the browser.
     reloadSource=async()=>{
       if(!isCurrent())return;
       // The first-party early loader has already started the exact approved video.
       if(heroVideo.dataset.academySelectedId===String(selected)&&heroVideo.getAttribute('src')&&!heroVideo.error)return;
       try{
         report('checking','Refreshing selected video source');
         const device=mobileScreen?'mobile':'desktop';
         const early=window.__academyHeroEarlySource;
         let data=null;
         if(early&&early.device===device&&Date.now()-early.at<60000){
           window.__academyHeroEarlySource=null;
           data=await early.promise;
         }
         // If Usthad changes the selected video, always resolve a fresh source.
         if(!data||!data.ok||Number(data.id)!==selected){
           const response=await fetch('/api/academy/hero-video-source?device='+device,{cache:'no-store',credentials:'same-origin'});
           if(!response.ok)throw Error('Homepage video source HTTP '+response.status);
           data=await response.json();
         }
         if(!isCurrent())return;
         if(!data.ok||!data.url||!Number.isSafeInteger(Number(data.id)))throw Error('Video URL not returned');
         applyDirectVideo(data.url);
       }catch(err){if(isCurrent())retryOrFallback('Unable to load video source: '+String(err?.message||err));}
     };
     reloadSource();
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
 const topline=$('academyTopline');
 if(topline){
   const enabled=s.topbar_enabled!==false;
   topline.hidden=!enabled;
   const announcement=$('academyToplineMessage'),cta=$('academyToplineLink');
   if(announcement)announcement.textContent=String(s.topbar_message||'Qur’an Memorisation • Islamic & Academic Education').slice(0,120);
   const allowed=['/','/about','/college-features','/programmes','/gallery','/admission','/contact'];
   const path=String(s.topbar_link_path||'').trim(),label=String(s.topbar_link_label||'').trim();
   if(cta){cta.hidden=!(label&&allowed.includes(path));if(!cta.hidden){cta.textContent=label.slice(0,32);cta.href=path;}}
 }
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
 const prettyPhone=(input)=>{
   const raw=String(input||'').replace(/\D/g,'');
   const digits=raw.slice(-10);
   if(digits.length!==10)return String(input||'');
   return (raw.length>10?'+91 ':'')+digits.slice(0,4)+' '+digits.slice(4,7)+' '+digits.slice(7);
 };
 for(const a of document.querySelectorAll('a[href^="tel:"]')){
  const old=a.getAttribute('href'),idx=old.includes('9496845773')?0:old.includes('9562962762')?1:-1;
  if(idx>=0&&numbers[idx]){
    a.href='tel:'+numbers[idx].replace(/[^+0-9]/g,'');
    const numberText=a.querySelector('.academy-phone-text-v93');
    if(numberText)numberText.textContent=prettyPhone(numbers[idx]);
    else a.textContent=prettyPhone(numbers[idx]);
  }
 }
 const contactAddress=$('academyContactAddressDisplay');
 if(contactAddress&&s.address)contactAddress.textContent=s.address;
 const contactHours=$('academyContactHoursDisplay');
 if(contactHours&&s.office_hours)contactHours.textContent=s.office_hours;
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
  const chosen=(data.gallery||[]).filter(media=>media.show_on_public_gallery===true);
  if(!chosen.length){notice.hidden=false;notice.textContent='The Usthad has not selected any photos or videos for this public Gallery yet.';return;}
  notice.hidden=true;
  for(const media of chosen){
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
     const wrap=img.closest('.academy-learning-real-photo,.academy-v21-programme-photo,.academy-v21-detail-photo,.academy-approved-about-photo');
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
   // Direct, fresh signed image links avoid an additional proxy request.
   const source=item&&(item.image_url||item.media_url);
   return source&&safeMedia(source)?source:null;
  };
  const sourceSlots={
   '/assets/academy-owner-official-logo.png':'brand_logo',
   '/assets/shamsul-ulama-portrait-main.jpg':'scholar_home',
   '/assets/shamsul-ulama-portrait-legacy.jpg':'scholar_profile',
   '/assets/quran-photo.jpg':'about_quran',
   '/assets/hifz-boy-academy.webp':'learner_illustration'
  };
  for(const img of document.querySelectorAll('img[src]')){
   if(img.hasAttribute('data-media-slot'))continue; // each article photo uses its own selected slot
   const slot=sourceSlots[img.getAttribute('src')];
   const replacement=slot&&getImage(slot);
   if(replacement)img.src=replacement;
  }
  for(const img of document.querySelectorAll('img[data-media-slot]')){
   const replacement=getImage(img.dataset.mediaSlot);
   if(!replacement){
     img.hidden=true;img.removeAttribute('src');
     const frame=img.closest('.academy-learning-real-photo,.academy-approved-about-photo');
     if(frame)frame.hidden=true;
     continue;
   }
   // Load the approved image off-screen. A lazy image inside a hidden frame
   // never downloads in Chrome, so prefetch it with a dedicated Image first.
   const preload=new Image();
   preload.decoding='async';
   preload.onload=()=>{
     if(!img.isConnected)return;
     img.loading='eager';
     img.src=replacement;
     img.hidden=false;
     const frame=img.closest('.academy-learning-real-photo,.academy-approved-about-photo');
     if(frame)frame.hidden=false;
   };
   preload.onerror=()=>{
     if(!img.isConnected)return;
     img.hidden=true;img.removeAttribute('src');
     const frame=img.closest('.academy-learning-real-photo,.academy-approved-about-photo');
     if(frame)frame.hidden=true;
   };
   preload.src=replacement;
  }
  const hero=getImage('home_fallback');
  if(hero&&!Number(window.__academyHeroCurrentSelectedId||0)){
   const el=$('academyHomeFallback');if(el){el.src=hero;el.hidden=false;}
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
// Begin the actually selected video before the remaining CMS settings and galleries
// have loaded. The source endpoint already validates that the media is published.
function primeHomepageVideo(){
 const video=$('academyHomeVideo'),early=window.__academyHeroEarlySource;
 if(!video||!early||video.getAttribute('src'))return;
 early.promise.then(data=>{
  if(!video.isConnected||location.pathname!=='/'||!data?.ok||!Number.isSafeInteger(Number(data.id)))return;
  if(!data.url||!safeMedia(data.url)||!['.mp4','.webm'].some(ext=>new URL(data.url,location.origin).pathname.toLowerCase().endsWith(ext)))return;
  if(video.getAttribute('src')||video.dataset.academySelectedId)return;
  const photo=$('academyHomeFallback');
  video.dataset.academySelectedId=String(data.id);
  video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
  video.playsInline=true;video.preload='auto';
  video.hidden=false;video.style.opacity='0';
  video.addEventListener('loadeddata',()=>{if(video.isConnected&&video.readyState>=2){video.style.opacity='1';if(photo)photo.hidden=true;}},{once:true});
  video.addEventListener('playing',()=>{if(video.isConnected){video.style.opacity='1';if(photo)photo.hidden=true;window.__academyHeroState={state:'playing',selectedId:Number(data.id)};}},{once:true});
  video.src=data.url;video.load();
  video.play().catch(()=>{
    const button=$('academyHeroPlayButton');
    if(button){
      button.hidden=false;
      button.onclick=()=>{video.muted=true;video.play().catch(()=>{});};
    }
  });
 }).catch(()=>{});
}
async function render(){
 const path=location.pathname;
 if(path==='/')primeHomepageVideo();
 try{applySettings(await getSettings());}catch(e){console.warn('Academy settings unavailable',e);}
 // Load verified images concurrently rather than displaying placeholder stock photos.
 await Promise.allSettled([applySitePhotos(),applyMediaPlacements()]);
 if(path==='/gallery')await gallery();
 if(path==='/admission')admission();
}
window.addEventListener('academy:render',render);
// Switch desktop/mobile videos when the viewport changes (including phone rotation).
const academyPhoneQuery=window.matchMedia('(max-width: 1150px), (hover: none) and (pointer: coarse)');
academyPhoneQuery.addEventListener('change',()=>{if(location.pathname==='/')render().catch(e=>console.warn('Academy video display refresh',e));});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();