(()=>{'use strict';
async function updateLearnerMascot(){
 const images=[...document.querySelectorAll('.hifz-boy-animated')];if(!images.length)return;
 try{
  const [positionsRes,galleryRes]=await Promise.all([
    fetch('/api/academy/media-placements',{cache:'no-store',credentials:'same-origin'}),
    fetch('/api/academy/gallery',{cache:'no-store',credentials:'same-origin'})
  ]);
  if(!positionsRes.ok||!galleryRes.ok)return;
  const position=(await positionsRes.json()).placements||{};
  const gallery=(await galleryRes.json()).gallery||[];
  const item=gallery.find(x=>x.media_type==='image'&&Number(x.id)===Number(position.learner_illustration));
  if(!item?.image_url)return;
  const url=new URL(item.image_url,location.origin);
  if(url.protocol!=='https:'&&url.origin!==location.origin)return;
  if(url.username||url.password)return;
  for(const img of images){img.src=url.href;img.onerror=()=>{img.onerror=null;img.src='/assets/hifz-boy-academy.webp';};}
 }catch(err){console.warn('Mascot gallery override unavailable; using Academy default.');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateLearnerMascot);else updateLearnerMascot();
})();