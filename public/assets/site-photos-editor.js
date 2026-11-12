(()=>{
'use strict';
const root=document.getElementById('sitePhotoForms');
if(!root)return;
const fields=[
 {slot:'hero',title:'Homepage Academy Photograph',description:'Shown beneath the Academy name on the right of the welcome section.'},
 {slot:'school',title:'School Classroom Photograph',description:'Shown in School Classes and on the Academic Programmes page.'},
 {slot:'tuition',title:'Extra Tuition Photograph',description:'Shown in Extra Tuition Classes and on the Academic Programmes page.'}
];
let csrf='',photos={};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
async function json(url,options={}){
 const r=await fetch(url,{credentials:'include',cache:'no-store',...options});
 const d=await r.json().catch(()=>({error:'Unexpected server reply.'}));
 if(!r.ok)throw Error(d.error||'Photo request failed ('+r.status+').');
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
  const input=el('input');input.type='file';input.name='file';input.accept='.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';input.required=true;
  fileLabel.append(input);form.append(fileLabel);
  const altLabel=el('label','','Photo description (optional)');
  const alt=el('input');alt.type='text';alt.name='alt_text';alt.maxLength=200;
  alt.placeholder=spec.slot==='school'?'Students attending a school class':spec.slot==='tuition'?'Students attending extra tuition':'Academy photograph';
  altLabel.append(alt);form.append(altLabel);
  const rightsLabel=el('label','site-photo-permission');const rights=el('input');rights.type='checkbox';rights.required=true;
  rightsLabel.append(rights,document.createTextNode('I confirm permission to publish this photograph, including permission for students pictured.'));form.append(rightsLabel);
  const buttons=el('div','site-photo-controls');
  const save=el('button');save.type='submit';save.textContent='Save Photo to Website';
  const remove=el('button','outline site-photo-remove');remove.type='button';remove.textContent='Remove Published Photo';remove.hidden=true;
  buttons.append(save,remove);form.append(buttons);
  const message=el('p','site-photo-message','');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  card.append(form,message);root.append(card);
  let localObjectUrl=null;
  input.addEventListener('change',()=>{
   if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
   const file=input.files?.[0];if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)){message.textContent='Choose JPG, PNG or WebP.';return;}
   localObjectUrl=URL.createObjectURL(file);preview.src=localObjectUrl;preview.alt='Selected photograph preview (not yet published)';preview.hidden=false;empty.hidden=true;
   message.textContent='Preview only. Click Save Photo to publish.';
  });
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!form.reportValidity())return;
   const selected=input.files?.[0];if(!selected)return;
   save.disabled=true;remove.disabled=true;message.textContent='Uploading and saving Academy photograph…';
   try{
    const upload=await optimize(selected);
    if(upload.size>16*1024*1024)throw Error('Photo is over 16 MB after optimization. Select a smaller photo.');
    const fd=new FormData();fd.set('slot',spec.slot);fd.set('file',upload,upload.name);
    fd.set('alt_text',alt.value.trim());fd.set('rights_confirmed','true');
    const saved=await json('/api/academy/site-photos',{method:'POST',headers:{'X-Academy-CSRF':csrf},body:fd});
    if(!saved.ok)throw Error('Website did not confirm this photo.');
    if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
    form.reset();await refresh();message.textContent='Saved. This photo is now published on the public website.';
   }catch(e){message.textContent='Not saved: '+e.message;}
   finally{save.disabled=false;remove.disabled=false;}
  });
  remove.addEventListener('click',async()=>{
   if(!confirm('Remove the '+spec.title+' from the public website?'))return;
   save.disabled=true;remove.disabled=true;message.textContent='Removing photo…';
   try{await json('/api/academy/site-photos',{method:'DELETE',headers:{'Content-Type':'application/json','X-Academy-CSRF':csrf},body:JSON.stringify({slot:spec.slot,confirmed:true})});await refresh();message.textContent='Photo removed from the public website.';}
   catch(e){message.textContent='Could not remove photo: '+e.message;}
   finally{save.disabled=false;remove.disabled=false;}
  });
 }
}
(async()=>{
 try{
  const r=await json('/api/identity/me');csrf=r.csrf;
  if(!r.account||!['admin','usthad'].includes(r.account.role))return;
  build();await refresh();
 }catch(e){root.replaceChildren(el('p','site-photo-message','Photos could not be loaded: '+e.message));}
})();
})();