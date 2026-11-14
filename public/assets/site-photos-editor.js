(()=>{
'use strict';
const root=document.getElementById('sitePhotoForms');
if(!root)return;
const fields=[
 {slot:'hero',title:'Homepage Academy Photograph',description:'Shown beneath the Academy name on the right of the welcome section.'},
 {slot:'school',title:'School Classroom Photograph',description:'Shown in School Classes and on the Academic Programmes page.'},
 {slot:'tuition',title:'Extra Tuition Photograph',description:'Shown in Extra Tuition Classes and on the Academic Programmes page.'}
];
let csrf='',photos={},authenticatedAccountId='';
function makeLoginHelp(message){
 root.querySelector('#sitePhotoAuthBanner')?.remove();
 const banner=el('div','site-photo-message');banner.id='sitePhotoAuthBanner';banner.style.cssText='border:2px solid #075333;background:#fff;color:#075333;padding:13px;border-radius:9px;margin:10px 0;line-height:1.6';
 banner.append(el('strong','',message+' Photo NOT saved. '));
 const link=el('a','','Sign In Again');link.href='/login?next=%2Fstaff';link.target='_blank';link.rel='noopener noreferrer';link.style.cssText='display:inline-block;margin:8px 6px 2px 0;padding:7px 13px;background:#075333;color:#fff;text-decoration:none;border-radius:7px';banner.append(link);
 const retry=el('button','outline','Recheck Login');retry.type='button';retry.style.cssText='padding:7px 13px;margin:8px 0 2px 0';retry.addEventListener('click',async()=>{retry.disabled=true;try{await refreshSession();banner.remove();}catch(e){banner.firstChild.textContent='NOT SAVED — '+e.message+' ';}finally{retry.disabled=false;}});banner.append(retry);
 root.prepend(banner);
}
async function refreshSession(){
 let current;
 try{current=await json('/api/identity/me');}catch(e){throw Error('Sign in required: '+e.message);}
 if(!current.account||!['admin','usthad'].includes(current.account.role))throw Error('Usthad / Administrator access required.');
 if(authenticatedAccountId&&String(current.account.id)!==authenticatedAccountId)throw Error('A different account is signed in. Reload the Usthad Dashboard before saving.');
 authenticatedAccountId=String(current.account.id);
 if(current.account.must_change_password)throw Error('Change your password before saving photos.');
 if(!/^[a-f0-9]{64}$/.test(String(current.csrf||'')))throw Error('Security verification unavailable. Please sign in again.');
 csrf=current.csrf;root.querySelector('#sitePhotoAuthBanner')?.remove();return current;
}
function normalizePhoto(file){
 const ext=String(file?.name||'').split('.').pop().toLowerCase();
 const extMime={jpg:'image/jpeg',jpeg:'image/jpeg',jfif:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
 if(!extMime)throw Error('Choose a .jpg, .jpeg, .jfif, .png or .webp photograph.');
 if(file.type&&file.type!==extMime&&!(extMime==='image/jpeg'&&file.type==='image/jfif'))throw Error('File format and extension do not match.');
 return new File([file],ext==='jfif'?file.name.replace(/\.jfif$/i,'.jpg'):file.name,{type:extMime,lastModified:file.lastModified});
}
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
async function json(url,options={}){
 const r=await fetch(url,{credentials:'include',cache:'no-store',...options});
 const d=await r.json().catch(()=>({error:'Unexpected server reply.'}));
 if(!r.ok)throw Error((d.error||'Photo request failed')+' (HTTP '+r.status+').');
 return d;
}
async function optimize(file){
 if(file.size<=5*1024*1024)return file;
 try{
  const bitmap=await createImageBitmap(file);
  let smallest=null;
  for(const [max,quality] of [[2200,.83],[1600,.74],[1200,.66]]){
   const factor=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*factor));
   canvas.height=Math.max(1,Math.round(bitmap.height*factor));
   const context=canvas.getContext('2d',{alpha:false});
   if(!context)break;
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
   if(blob&&(!smallest||blob.size<smallest.size))smallest=blob;
   if(blob&&blob.size<8*1024*1024)break;
  }
  bitmap.close();
  if(smallest&&smallest.size<file.size)return new File([smallest],file.name.replace(/\.[^.]+$/,'')+'-web.webp',{type:'image/webp'});
 }catch(e){console.warn('Photo optimization skipped',e);}
 return file;
}
async function refresh(){
 const d=await json('/api/academy/site-photos');
 photos=d.photos||{};
 root.querySelectorAll('[data-photo-slot]').forEach(card=>{
  const slot=card.dataset.photoSlot,photo=photos[slot];
  const img=card.querySelector('.site-photo-preview'),empty=card.querySelector('.site-photo-empty'),remove=card.querySelector('.site-photo-remove');
  if(photo?.url){img.src=photo.url;img.alt=photo.alt_text||'Published Academy photograph';img.hidden=false;empty.hidden=true;remove.hidden=false;}
  else {img.removeAttribute('src');img.hidden=true;empty.hidden=false;remove.hidden=true;}
 });
}
function build(){
 root.replaceChildren();
 for(const spec of fields){
  const card=el('article','site-photo-editor');card.dataset.photoSlot=spec.slot;
  card.append(el('h3','',spec.title),el('p','site-photo-help',spec.description));
  const frame=el('div','site-photo-frame');
  const preview=el('img','site-photo-preview');preview.hidden=true;preview.alt='';
  const empty=el('p','site-photo-empty','No photograph published yet. Select a real Academy photo from your device.');
  frame.append(preview,empty);card.append(frame);
  const form=el('form','site-photo-form');
  const fileLabel=el('label','','Choose photo from Phone Gallery / Computer Files');
  const input=el('input');input.type='file';input.name='file';input.accept='.jpg,.jpeg,.jfif,.png,.webp,image/jpeg,image/png,image/webp';input.required=true;
  fileLabel.append(input);form.append(fileLabel);
  const altLabel=el('label','','Photo description (optional)');
  const alt=el('input');alt.type='text';alt.name='alt_text';alt.maxLength=200;
  alt.placeholder=spec.slot==='school'?'Students attending a school class':spec.slot==='tuition'?'Students attending extra tuition':'Academy photograph';
  altLabel.append(alt);form.append(altLabel);
  const rightsLabel=el('label','site-photo-permission');const rights=el('input');rights.type='checkbox';rights.required=true;
  const rightsText=el('span','site-photo-permission-text','I have permission to publish this photograph, including consent for students pictured.');
  rightsLabel.append(rights,rightsText);form.append(rightsLabel);
  const buttons=el('div','site-photo-controls');
  const save=el('button');save.type='submit';save.textContent='Save Photo to Website';
  const remove=el('button','outline site-photo-remove');remove.type='button';remove.textContent='Remove Published Photo';remove.hidden=true;
  buttons.append(save,remove);form.append(buttons);
  const message=el('p','site-photo-message','');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  card.append(form,message);root.append(card);
  let localObjectUrl=null;
  save.addEventListener('click',()=>{
    if(!input.files?.length){message.textContent='NOT SAVED — No photo selected. First click Choose file and select a JPG, PNG, JFIF or WebP image.';return;}
    if(!rights.checked){message.textContent='NOT SAVED — Tick the permission/consent checkbox below the photo description before saving.';return;}
    message.textContent='Checking selected photo and login…';
  });
  form.addEventListener('invalid',event=>{
    if(event.target===input)message.textContent='NOT SAVED — Choose a photo file first.';
    else if(event.target===rights)message.textContent='NOT SAVED — Permission/consent checkbox is required.';
  },true);
  input.addEventListener('change',()=>{
   if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
   const file=input.files?.[0];if(!file)return;
   try{normalizePhoto(file);}catch(e){message.textContent='Not selected: '+e.message;return;}
   localObjectUrl=URL.createObjectURL(file);preview.src=localObjectUrl;preview.alt='Selected photograph preview (not yet published)';preview.hidden=false;empty.hidden=true;
   message.textContent='Preview only. Click Save Photo to publish.';
  });
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!form.reportValidity())return;
   const selected=input.files?.[0];if(!selected)return;
   save.disabled=true;remove.disabled=true;message.textContent='Uploading and saving Academy photograph…';
   try{
    await refreshSession();
    const upload=await optimize(normalizePhoto(selected));
    if(upload.size>16*1024*1024)throw Error('Photo is over 16 MB after optimization. Select a smaller photo.');
    const fd=new FormData();fd.set('slot',spec.slot);fd.set('file',upload,upload.name);
    fd.set('alt_text',alt.value.trim());fd.set('rights_confirmed','true');
    const saved=await json('/api/academy/site-photos',{method:'POST',headers:{'X-Academy-CSRF':csrf},body:fd});
    if(!saved.ok)throw Error('Website did not confirm this photo.');
    if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
    form.reset();await refresh();
    if(!photos[spec.slot]?.url){
     message.textContent='Upload accepted, but public photo verification is pending. Please refresh before uploading again.';
    }else{
     message.textContent='Photo saved and confirmed in the published website photo list.';
    }
   }catch(e){message.textContent='NOT SAVED — '+e.message;
     if(/Sign in|required|HTTP 401|HTTP 403|verification/i.test(e.message))makeLoginHelp('Authentication expired.');}
   finally{save.disabled=false;remove.disabled=false;}
  });
  remove.addEventListener('click',async()=>{
   if(!confirm('Remove the '+spec.title+' from the public website?'))return;
   save.disabled=true;remove.disabled=true;message.textContent='Removing photo…';
   try{await refreshSession();await json('/api/academy/site-photos',{method:'DELETE',headers:{'Content-Type':'application/json','X-Academy-CSRF':csrf},body:JSON.stringify({slot:spec.slot,confirmed:true})});await refresh();message.textContent='Photo removed from the public website.';}
   catch(e){message.textContent='NOT REMOVED — '+e.message;
    if(/Sign in|required|HTTP 401|HTTP 403|verification/i.test(e.message))makeLoginHelp('Authentication expired.');}
   finally{save.disabled=false;remove.disabled=false;}
  });
 }
}
(async()=>{
 try{
  await refreshSession();
  build();await refresh();
 }catch(e){root.replaceChildren();makeLoginHelp('Authentication check failed — '+e.message);}
})();
})();