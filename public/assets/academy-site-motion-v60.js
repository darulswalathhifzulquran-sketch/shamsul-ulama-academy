(()=>{
'use strict';
/* Progressive scroll reveals: enter smoothly from below while scrolling down,
   from above when scrolling up; re-run on route navigation and gallery updates.
   Never hides content if IntersectionObserver / script is unavailable. */
if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const app=document.getElementById('app');if(!app)return;
const selectors=[
 '#app main > .heading > .container',
 // Only the dedicated after-Shaikhuna scroll handler owns Academy Introduction.
 // The new scholar editorial section has a dedicated, once-only scroll reveal.
 '#app .about-grid > figure',
 '#app .about-grid > div',
 '#app .verse > .container',
 '#app .home-gallery-section .home-gallery-heading',
 '#app .home-gallery-section .home-gallery-card',
 '#app .home-gallery-section .showcase-card',
 '#app .college-features-heading',
 '#app .college-feature-card',
 '#app .college-feature-essay-section',
 '#app .academy-learning-heading',
 '#app .academy-learning-card',
 '#app .academy-learning-hero > .container',
 '#app .academy-learning-essay-hero > .container',
 '#app .academy-learning-essay-section',
 '#app .academy-learning-sidebar',
 '#app .academy-learning-related',
 '#app .contact-section > .container > h2',
 '#app .contact-card',
 '#app .gallery > *',
 '#app .academy-footer-grid > *'
];
let direction='down',lastY=window.scrollY,queued=false;
window.addEventListener('scroll',()=>{
 const y=window.scrollY;
 if(Math.abs(y-lastY)>2)direction=y>lastY?'down':'up';
 lastY=y;
},{passive:true});
const observer=new IntersectionObserver(entries=>{
 for(const entry of entries){
  const el=entry.target;
  if(!el.isConnected){observer.unobserve(el);continue;}
  if(entry.isIntersecting){
   el.style.setProperty('--academy-shift',direction==='up'?'-20px':'20px');
   el.classList.add('is-visible');
  }else if(el.classList.contains('is-visible')&&!el.matches(':focus-within')){
   el.classList.remove('is-visible');
   el.style.setProperty('--academy-shift',direction==='up'?'-20px':'20px');
  }
 }
},{threshold:.08,rootMargin:'0px 0px -4% 0px'});
function register(){
 queued=false;
 let i=0;
 for(const node of document.querySelectorAll(selectors.join(','))){
  // Home sections after Gallery are now handled by the single once-only
  // editorial scroll observer v102. Prevent competing in/out reveal loops.
  const isHome=!!document.querySelector('#app main > .academy-video-hero');
  if(isHome&&node.closest('.academy-home-about-v102,section.verse,section.learning-home,section.college-features:not(.college-features-hub),section.academy-learning-home,footer.academy-footer'))continue;
  if(node.hasAttribute('data-academy-enter')||node.closest('[hidden]'))continue;
  node.setAttribute('data-academy-enter','');
  node.style.setProperty('--academy-delay',String(Math.min(i%4,3)*62)+'ms');
  node.style.setProperty('--academy-shift',direction==='up'?'-20px':'20px');
  observer.observe(node);
  i++;
 }
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(register);
}
document.documentElement.classList.add('academy-motion-on');
window.addEventListener('academy:render',()=>{
 observer.disconnect();
 schedule();
});
const mutation=new MutationObserver(schedule);
mutation.observe(app,{subtree:true,childList:true});
schedule();
})();