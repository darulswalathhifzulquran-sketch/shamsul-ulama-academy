/* v97 - Single, restrained scroll illumination for the authentic scholar portrait. */
(()=>{
 'use strict';
 const visited=new WeakSet();
 let currentObserver=null;
 function reveal(){
  if(currentObserver){currentObserver.disconnect();currentObserver=null;}
  const sections=[...document.querySelectorAll('#app .scholar-editorial-v97')];
  const motionOK=typeof IntersectionObserver==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!motionOK){sections.forEach(section=>section.classList.add('is-illuminated-v97'));return;}
  currentObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting){
     entry.target.classList.add('is-illuminated-v97');
     currentObserver?.unobserve(entry.target);
    }
   }
  },{threshold:.09,rootMargin:'0px 0px -8% 0px'});
  for(const section of sections){
   if(section.classList.contains('is-illuminated-v97'))continue;
   section.classList.add('scholar-reveal-ready-v97');
   currentObserver.observe(section);
  }
 }
 let pending=false;
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;reveal();});
 }
 window.addEventListener('academy:render',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();