/* SHAMSUL ULAMA | v102: scroll reveal for visible homepage sections
   AFTER Gallery only. Reveals once; never changes wheel/scroll behaviour.
   No hidden content if JS/IntersectionObserver is unsupported. */
(()=>{
 'use strict';
 let observer=null, queued=false;
 const groupSelectors=[
  '.academy-home-about-v102 .academy-about-lead-v102',
  '.academy-home-about-v102 .academy-about-description-v102',
  'main > section.verse > .container',
  'main > section.learning-home .learning-home-grid > *',
  'main > section.college-features:not(.college-features-hub) .college-features-intro',
  'main > section.college-features:not(.college-features-hub) .college-feature-card',
  'main > section.academy-learning-home .academy-learning-heading',
  'main > section.academy-learning-home .academy-learning-card',
  'footer.academy-footer .academy-footer-grid > *',
  'footer.academy-footer .academy-footer-bottom'
 ];
 function stop(){if(observer){observer.disconnect();observer=null;}}
 function setup(){
  stop();
  if(!document.querySelector('#app main > .academy-video-hero'))return;
  const elements=groupSelectors.flatMap(s=>[...document.querySelectorAll('#app '+s)]);
  if(!elements.length)return;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    elements.forEach(el=>el.classList.add('is-in-view-v102'));
    return;
  }
  observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.target.isConnected){observer?.unobserve(entry.target);continue;}
    if(entry.isIntersecting){
      entry.target.classList.add('is-in-view-v102');
      observer?.unobserve(entry.target);
    }
   }
  },{rootMargin:'0px 0px -7% 0px',threshold:.06});
  let priorParent=null,i=0;
  elements.forEach(el=>{
   if(el.closest('[hidden]'))return;
   const parent=el.parentElement;
   if(parent!==priorParent)i=0;
   el.style.setProperty('--v102-delay',Math.min(i,3)*95+'ms');
   // Leave already revealed nodes revealed on SPA re-render checks.
   if(!el.classList.contains('is-in-view-v102')){
     el.classList.add('academy-reveal-v102');
     observer.observe(el);
   }
   priorParent=parent;i++;
  });
 }
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;setup();});
 }
 window.addEventListener('academy:render',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
})();