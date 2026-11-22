(()=>{'use strict';
let renderSequence=0,observer=null,lastLoadedAt=0,lastGallerySignature=null;
let carouselCleanup=null;
const byId=id=>document.getElementById(id);
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const make=(tag,content,cls='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!=null)el.textContent=String(content);return el;};
const safeSrc=x=>{try{const u=new URL(x,location.origin);return (u.protocol==='https:'||u.origin===location.origin)&&!u.username&&!u.password?u.href:null;}catch{return null;}};
function media(card){
 const wrap=make('div',null,'showcase-media');
 const src=safeSrc(card.media_url||'');
 if(!src){wrap.append(make('span','Academy media temporarily unavailable','showcase-missing'));return wrap;}
 if(card.media_type==='video'){
  const u=new URL(src);
  const embed=u.hostname==='www.youtube-nocookie.com'||u.hostname==='player.vimeo.com';
  if(embed){const frame=document.createElement('iframe');frame.src=src;frame.title=card.title||'Academy video';frame.loading='lazy';frame.allow='encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';wrap.append(frame);}
  else {
   const v=document.createElement('video');v.src=src;v.controls=true;v.muted=true;v.preload='metadata';v.playsInline=true;v.setAttribute('aria-label',card.title||'Academy video');wrap.append(v);
   // Video plays only when explicitly selected; auto-hover playback would
   // interrupt this gallery's deliberate slide rotation.
  }
  wrap.append(make('span','VIDEO','showcase-card-media-tag'));
 }else {
  const img=document.createElement('img');img.src=src;img.loading='lazy';img.decoding='async';img.alt=card.alt_text||card.title||card.caption||'Shamsul Ulama Islamic Academy photo';wrap.append(img);
  img.addEventListener('error',()=>{if(img.isConnected)wrap.replaceChildren(make('span','Academy photo unavailable','showcase-missing'));});
 }
 return wrap;
}
function galleryCard(card,idx){
 const article=make('article',null,'home-gallery-card home-gallery-card-large');
 article.dataset.galleryIndex=String(idx);
 article.append(media(card));
 const body=make('div',null,'showcase-card-text');
 body.append(make('strong',card.title||card.caption||(card.media_type==='video'?'Academy Video':'Academy Moments')));
 if(card.description)body.append(make('p',card.description));
 article.append(body);
 return article;
}
function emptyGallery(root){
 const empty=make('div',null,'showcase-empty reveal-on-scroll');
 empty.append(make('strong','Our Academy Gallery'));
 empty.append(make('p','Official Academy photos and videos will appear here once selected by the Usthad.'));
 root.append(empty);
}
function setupReveal(){
 if(observer){observer.disconnect();observer=null;}
 const elements=[...document.querySelectorAll('.home-gallery-heading.reveal-on-scroll')];
 if(reduced()||!('IntersectionObserver' in window)){document.documentElement.classList.remove('academy-motion-ready');elements.forEach(el=>el.classList.add('is-visible'));return;}
 elements.forEach(el=>el.classList.add('reveal-on-scroll'));
 observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.08,rootMargin:'12px 0px -7% 0px'});
 document.documentElement.classList.add('academy-motion-ready');
 elements.forEach(el=>observer.observe(el));
}
// One featured image and four thumbnails. Images circulate through the big
// picture; the grid never becomes a slider. Every approved photo is reusable.
function featuredGrid(root,cards){
 if(carouselCleanup){carouselCleanup();carouselCleanup=null;}
 root.classList.remove('academy-carousel-v91');
 root.classList.add('academy-feature-rotate-v95');
 root.removeAttribute('aria-roledescription');
 root.removeAttribute('data-current-title');
 root.setAttribute('aria-label','Academy photo gallery. Select any small photo to show it larger.');
 const nodes=cards.map((card,i)=>galleryCard(card,i));
 let featured=0,timer=null,inViewport=false,disposed=false;
 const duration=5600;
 const mod=i=>(i%nodes.length+nodes.length)%nodes.length;
 const movable=(node)=>{const v=node.querySelector('video');return !v||v.paused||v.ended;};
 function clear(){if(timer!==null){clearTimeout(timer);timer=null;}}
 function canRotate(){return !disposed&&root.isConnected&&nodes.length>1&&inViewport&&document.visibilityState==='visible'&&!reduced()&&nodes.every(movable)&&!document.querySelector('dialog.academy-photo-dialog-v120[open]')&&!root.matches(':active')&&!root.querySelector(':focus-visible');}
 function arrange(animate){
  if(disposed)return;
  const order=[nodes[featured],...nodes.filter((_,i)=>i!==featured)];
  nodes.forEach((el,i)=>{
    const isMain=i===featured;
    el.classList.toggle('home-gallery-card-featured-v90',isMain);
    el.classList.toggle('academy-feature-thumb-v95',!isMain);
    if(!isMain){
     el.setAttribute('role','button');
     el.tabIndex=0;
     el.setAttribute('aria-label','Show '+(cards[i].title||cards[i].caption||'Academy photo')+' as the large photo');
    }else{
     const img=el.querySelector('img');
     if(img){img.loading='eager';el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','View full photo: '+(cards[i].title||cards[i].caption||'Academy photo'));}
     else{el.removeAttribute('role');el.removeAttribute('aria-label');el.tabIndex=-1;}
    }
  });
  root.replaceChildren(...order);
  root.dataset.featuredIndex=String(featured);
  if(animate&&!reduced()){
    const hero=order[0];
    hero.classList.remove('academy-feature-arrive-v95');
    // Restart subtle fade on the selected photo, no flashy slide animations.
    void hero.offsetWidth;
    hero.classList.add('academy-feature-arrive-v95');
  }
 }
 function schedule(){
  clear();if(!canRotate())return;
  timer=setTimeout(()=>{
   timer=null;
   if(!canRotate()){schedule();return;}
   featured=mod(featured+1);arrange(true);schedule();
  },duration);
 }
 function choose(i){
  if(i===featured)return;
  featured=mod(i);arrange(true);schedule();
 }
 nodes.forEach((el,i)=>{
  function activate(){if(i!==featured){choose(i);return;}const img=el.querySelector('.showcase-media img');if(img)window.AcademyPhotoPreview?.open(img,el);}
  el.addEventListener('click',e=>{if(!e.target.closest('a,button,video,iframe'))activate();});
  el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();activate();}});
 });
 root.addEventListener('focusin',clear);root.addEventListener('focusout',()=>setTimeout(schedule,0));
 root.addEventListener('pointerdown',clear,{passive:true});root.addEventListener('pointerup',()=>setTimeout(schedule,0),{passive:true});root.addEventListener('pointercancel',schedule,{passive:true});
 window.addEventListener('academy:photo-preview-closed',schedule);
 root.addEventListener('play',clear,true);
 root.addEventListener('pause',schedule,true);
 root.addEventListener('ended',schedule,true);
 const onVisibility=()=>schedule();
 document.addEventListener('visibilitychange',onVisibility);
 let inViewObserver=null;
 if('IntersectionObserver' in window){
  inViewObserver=new IntersectionObserver(entries=>{
   inViewport=entries[0]?.isIntersecting??false;
   schedule();
  },{rootMargin:'150px 0px 150px 0px',threshold:0});
  inViewObserver.observe(root);
 }else inViewport=true;
 function cleanup(){
  if(disposed)return;
  disposed=true;clear();inViewObserver?.disconnect();
  document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('academy:photo-preview-closed',schedule);
 }
 carouselCleanup=cleanup;
 arrange(false);schedule();
}
async function load(){
 const target=byId('academyHomeGallery'),sequence=++renderSequence;
 if(!target){
  if(carouselCleanup){carouselCleanup();carouselCleanup=null;}
  observer?.disconnect();lastGallerySignature=null;document.documentElement.classList.remove('academy-motion-ready');return;
 }
 try{
  const res=await fetch('/api/academy/home-showcase',{cache:'no-store',credentials:'same-origin'});
  if(!res.ok)throw Error('Gallery service unavailable');
  const data=await res.json();
  if(sequence!==renderSequence||!target.isConnected)return;
  const cards=(Array.isArray(data.cards)?data.cards:[]).filter(x=>x.section==='gallery'&&!(x.media_type==='video'&&([16,17].includes(Number(x.gallery_id))||/video_islamic_motions/i.test(String(x.title||x.caption||''))))).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||Number(a.position)-Number(b.position));
  lastLoadedAt=Date.now();
  const signature=JSON.stringify(cards.map(c=>[c.position,c.sort_order,c.gallery_id,c.title,c.description,c.media_type]));
  if(signature===lastGallerySignature&&target.children.length)return;
  lastGallerySignature=signature;
  if(carouselCleanup){carouselCleanup();carouselCleanup=null;}
  target.replaceChildren();
  target.classList.toggle('gallery-one-item',cards.length===1);
  target.classList.toggle('gallery-few-items',cards.length>=2&&cards.length<=3);
  if(!cards.length)emptyGallery(target);
  else featuredGrid(target,cards);
 }catch(e){
  if(sequence!==renderSequence||!target.isConnected)return;
  if(carouselCleanup){carouselCleanup();carouselCleanup=null;}
  target.replaceChildren(make('p','Academy gallery is temporarily unavailable.','showcase-loading'));
 }
 requestAnimationFrame(()=>{if(sequence===renderSequence)setupReveal();});
}
window.addEventListener('academy:render',load);
try{
 const channel=new BroadcastChannel('academy-home-gallery-updates');
 channel.addEventListener('message',event=>{if(event.data?.type==='refresh')load();});
}catch(e){}
window.addEventListener('storage',event=>{if(event.key==='academy-home-gallery-updated')load();});
const refreshWhenBack=()=>{
 if(document.visibilityState==='visible'&&byId('academyHomeGallery')&&Date.now()-lastLoadedAt>9000)load();
};
document.addEventListener('visibilitychange',refreshWhenBack);
window.addEventListener('focus',refreshWhenBack);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();