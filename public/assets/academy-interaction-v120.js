(()=>{'use strict';
let dialog=null,photo=null,heading=null,trigger=null,pressed=null,pointerId=null,oldOverflow='';
function ensure(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='academy-photo-dialog-v120';dialog.setAttribute('aria-labelledby','academy-photo-title-v120');
 const bar=document.createElement('header');heading=document.createElement('h2');heading.id='academy-photo-title-v120';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close photo preview');close.addEventListener('click',()=>dialog.close());
 bar.append(heading,close);photo=document.createElement('img');dialog.append(bar,photo);document.body.append(dialog);
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;photo.removeAttribute('src');if(trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;window.dispatchEvent(new Event('academy:photo-preview-closed'));});
}
window.AcademyPhotoPreview={open(img,from){
 const src=img.currentSrc||img.src;if(!src||!img.complete||!img.naturalWidth)return;
 ensure();if(dialog.open)return;trigger=from;heading.textContent=img.alt||'Academy photo';photo.alt=img.alt||'Academy photo';photo.src=src;oldOverflow=document.body.style.overflow;
 if(typeof dialog.showModal==='function'){dialog.showModal();document.body.style.overflow='hidden';dialog.querySelector('button').focus({preventScroll:true});}
 else{window.open(src,'_blank','noopener,noreferrer');}
}};
function clear(){if(pressed)pressed.classList.remove('v120-pressed');pressed=null;pointerId=null;}
document.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0)return;
 const card=e.target.closest('#app .college-feature-card,#app .academy-learning-card,#app .home-gallery-card[role="button"],#app #publicGallery img[role="button"]');
 if(!card||e.target.closest('video,iframe,button'))return;clear();pressed=card;pointerId=e.pointerId;card.classList.add('v120-pressed');
},{passive:true,capture:true});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,e=>{if(e.pointerId===pointerId)clear();},{passive:true,capture:true});
window.addEventListener('blur',clear);window.addEventListener('academy:render',()=>{clear();if(dialog?.open)dialog.close();});
})();