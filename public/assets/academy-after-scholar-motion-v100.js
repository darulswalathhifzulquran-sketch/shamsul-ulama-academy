/* Version 100: after-Shaikhuna chapter scroll. No global scrolling changes. */
(()=>{
  'use strict';
  let observer=null,pending=false;
  function render(){
    if(observer){observer.disconnect();observer=null;}
    const region=document.querySelector('#app main .academy-home-intro.academy-heritage-continuation-v98');
    if(!region)return;
    if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
      region.classList.add('is-revealed-v100');return;
    }
    // If JS fails, CSS leaves text visible: ready is applied only here.
    region.classList.add('is-motion-ready-v100');
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add('is-revealed-v100');
          observer?.unobserve(entry.target);
        }
      }
    },{rootMargin:'0px 0px -11% 0px',threshold:.1});
    observer.observe(region);
  }
  function schedule(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;render();});
  }
  window.addEventListener('academy:render',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
})();