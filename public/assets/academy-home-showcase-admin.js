(()=>{'use strict';
let assigned=[];
const $=id=>document.getElementById(id);
const node=(tag,value,cls='')=>{const n=document.createElement(tag);if(value!==null&&value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n;};
const maxBytes=16*1024*1024;
const typeLabels={image:'PHOTO',video:'VIDEO'};
const MIME={jpg:'image/jpeg',jpeg:'image/jpeg',jfif:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
const label=()=> 'Homepage Gallery';
const usages=id=>assigned.filter(x=>Number(x.gallery_id)===Number(id)).map(x=>label(x.section)+' #'+x.position);
function notifyHomepage(){
  // Update the Homepage immediately in other open tabs after server confirms.
  try{const channel=new BroadcastChannel('academy-home-gallery-updates');channel.postMessage({type:'refresh'});channel.close();}catch(e){}
  try{localStorage.setItem('academy-home-gallery-updated',String(Date.now()));}catch(e){}
}
function createMediaPreview(item,src){
 const preview=node('div',null,'showcase-admin-preview');
 if(!src){preview.append(node('span','Choose an existing approved file, or upload a new one'));return preview;}
 if(item?.media_type==='video'){
  let isEmbed=false;
  try{const u=new URL(src,location.href);isEmbed=u.hostname==='www.youtube-nocookie.com'||u.hostname==='player.vimeo.com';}catch{}
  if(isEmbed){
   const frame=document.createElement('iframe');
   frame.src=src;frame.title='Academy video preview';frame.loading='lazy';
   frame.allow='encrypted-media; picture-in-picture; fullscreen';
   frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.allowFullscreen=true;preview.append(frame);
  }else{
   const video=document.createElement('video');
   video.src=src;video.controls=true;video.muted=true;video.playsInline=true;video.preload='metadata';
   preview.append(video);
  }
 }else{
  const img=document.createElement('img');img.src=src;img.alt=item?.alt_text||item?.caption||'Academy photo preview';img.loading='lazy';
  preview.append(img);
 }
 return preview;
}
function namedField(labelText,input){
 const label=node('label',labelText);label.append(input);return label;
}
function mediaLabel(item){
 return '#'+item.id+' · '+(typeLabels[item.media_type]||item.media_type)+' · '+String(item.caption||item.alt_text||'Untitled Academy media').slice(0,70);
}
function nextOpenPosition(used){
 let pos=1;
 while(used.has(pos))pos++;
 if(pos>2147483647)throw Error('No available gallery position.');
 return pos;
}
function firstAvailable(section){
 const used=new Set(assigned.filter(x=>x.section===section).map(x=>Number(x.position)));
 return nextOpenPosition(used);
}
function renderCard({section,item,approved,api,status,confirmAction,refresh,optimisePhoto}){
 const isNew=!item;
 const card=node('article',null,'showcase-admin-card');
 card.dataset.section=section;
 card.dataset.position=String(item?.position||0);
 card.append(node('h4',isNew?'Add a new Gallery card':'Card '+(Number(item.sort_order||0))+' — '+String(item.title||item.caption||'Academy media')));
 const select=document.createElement('select');
 select.setAttribute('aria-label','Choose an approved photo or video');
 select.append(new Option('Choose an existing approved photo/video',''));
 for(const entry of approved)select.append(new Option(mediaLabel(entry),String(entry.id)));
 if(item){
  if(!approved.some(x=>Number(x.id)===Number(item.gallery_id)))select.append(new Option('#'+item.gallery_id+' · currently used file',String(item.gallery_id)));
  select.value=String(item.gallery_id);
 }
 card.append(namedField('Select from all approved files',select));
 const file=document.createElement('input');file.type='file';file.accept='.jpg,.jpeg,.jfif,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm';file.multiple=isNew;
 card.append(namedField(isNew?'Or upload new photos/videos (multiple allowed)':'Or upload ONE replacement photo/video',file));
 const permission=node('label','I have permission to publish these photos/videos, including consent if students or other people are visible.','showcase-admin-check');
 const rights=document.createElement('input');rights.type='checkbox';permission.prepend(rights);permission.hidden=true;
 card.append(permission);
 const previewArea=node('div',null,'showcase-admin-preview-wrapper');
 card.append(previewArea);
 let objectUrl=null;
 function showPreview(){
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  const files=[...file.files||[]];
  previewArea.replaceChildren();
  permission.hidden=!files.length;
  if(!files.length)rights.checked=false;
  if(files.length){
   objectUrl=URL.createObjectURL(files[0]);
   previewArea.append(createMediaPreview({media_type:files[0].type.startsWith('video/')||/\.(mp4|webm)$/i.test(files[0].name)?'video':'image'},objectUrl));
   if(files.length>1)previewArea.append(node('small',files.length+' files selected; each file will become its own card.'));
  }else{
   const selected=approved.find(x=>Number(x.id)===Number(select.value));
   previewArea.append(createMediaPreview(selected,selected?.image_url||selected?.media_url));
  }
 }
 file.addEventListener('change',()=>{if(file.files?.length)select.value='';showPreview();});
 select.addEventListener('change',()=>{if(select.value)file.value='';showPreview();});showPreview();

 const title=document.createElement('input');title.type='text';title.maxLength=100;title.placeholder='Title for this card';title.value=item?.title||'';
 const description=document.createElement('textarea');description.maxLength=220;description.rows=2;description.placeholder='Short description (optional)';description.value=item?.description||'';
 card.append(namedField('Card title',title),namedField('Short caption',description));
 const actions=node('div',null,'showcase-admin-actions');
 const save=node('button',isNew?'Add / Upload to Homepage':'Save / Replace Card');save.type='button';
 const up=node('button','↑ Move Up','outline'),down=node('button','↓ Move Down','outline'),remove=node('button',isNew?'Cancel':'Remove Card','outline');
 for(const b of [up,down,remove])b.type='button';
 if(isNew){up.hidden=true;down.hidden=true;}
 actions.append(save);
 if(!isNew)actions.append(up,down);
 actions.append(remove);card.append(actions);
 const feedback=node('p','','showcase-admin-status');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');card.append(feedback);
 const buttons=[save,up,down,remove];
 const busy=(value)=>{for(const b of buttons)b.disabled=value;file.disabled=value;select.disabled=value;save.textContent=value?'Saving…':isNew?'Add / Upload to Homepage':'Save / Replace Card';};
 function message(text,error){feedback.textContent=(error?'NOT SAVED — ':'✓ ')+text;status(label(section)+' — '+text,!!error);}
 async function addUpload(fileToUpload,name){
  if(!rights.checked)throw Error('Confirm publication permission for the uploaded file(s).');
  const ext=fileToUpload.name.split('.').pop().toLowerCase();
  if(!MIME[ext])throw Error('Unsupported file: '+fileToUpload.name+'. Use JPG/PNG/WebP/MP4/WebM.');
  if(fileToUpload.size>maxBytes&&!['jpg','jpeg','jfif','png','webp'].includes(ext))throw Error(fileToUpload.name+' exceeds the 16 MB video limit.');
  let prepared=fileToUpload.type?fileToUpload:new File([fileToUpload],fileToUpload.name,{type:MIME[ext]});
  if(prepared.type.startsWith('image/')&&optimisePhoto)prepared=await optimisePhoto(prepared);
  if(prepared.size>maxBytes)throw Error(fileToUpload.name+' is larger than 16 MB after optimization.');
  const fd=new FormData();
  fd.append('file',prepared,prepared.name);
  fd.set('caption',name||fileToUpload.name.slice(0,100));
  fd.set('alt_text',name||fileToUpload.name.slice(0,100));
  fd.set('is_published','true');
  fd.set('show_on_public_gallery','false');
  fd.set('rights_confirmed','on');
  fd.set('display_order','0');
  const uploaded=await api('/api/academy/gallery','POST',fd,true);
  if(!uploaded.ok||!Number.isSafeInteger(Number(uploaded.id)))throw Error('Upload was not confirmed by the server.');
  return Number(uploaded.id);
 }
 async function saveOne(position,id,name,caption){
  const result=await api('/api/academy/home-showcase','PUT',{section,position,gallery_id:id,title:name.trim(),description:caption.trim()});
  if(!result.ok||result.verified!==true)throw Error('Homepage assignment was not verified by the server.');
  return result;
 }
 save.addEventListener('click',async()=>{
  const files=[...file.files||[]];
  if(!files.length&&!select.value){message('Choose an approved file or select photos/videos to upload.',true);return;}
  if(!isNew&&files.length>1){message('Replace a card with ONE file only.',true);return;}
  if(files.length&&!rights.checked){message('Tick the publication permission checkbox.',true);return;}
  busy(true);let uploaded=[],savedCount=0;
  try{
   if(files.length){
    const selectedPositions=new Set(assigned.filter(x=>x.section===section).map(x=>Number(x.position)));
    let currentPos=isNew?null:Number(item.position);
    for(let i=0;i<files.length;i++){
     if(isNew){currentPos=nextOpenPosition(selectedPositions);selectedPositions.add(currentPos);}
     const name=(title.value.trim()&&(files.length===1||i===0))?title.value.trim():files[i].name.replace(/\.[^.]+$/,'').slice(0,100);
     const id=await addUpload(files[i],name);uploaded.push(id);
     await saveOne(currentPos,id,name,description.value.trim());
     savedCount++;
     feedback.textContent='✓ Saved '+savedCount+' of '+files.length+' files to Homepage '+section+'.';
    }
   }else{
    const slot=isNew?firstAvailable(section):Number(item.position);
    if(!slot)throw Error('No remaining card positions.');
    await saveOne(slot,Number(select.value),title.value,description.value);
    savedCount++;
   }
   notifyHomepage();
   message('Saved and verified successfully. Refreshing Homepage media list.',false);
   try{await refresh();}catch(e){status('Saved on the server, but refreshing the Dashboard failed: '+e.message,true);}
  }catch(error){
   const info=error.message+(uploaded.length?' Uploaded file ID(s): '+uploaded.join(', ')+'.':'');
   if(savedCount>0){
    feedback.textContent='PARTIALLY SAVED — '+savedCount+' card(s) confirmed saved. '+info+' Refresh this editor to see what was saved.';
    status(label(section)+' — '+savedCount+' saved, another action failed: '+info,true);
   }else message(info,true);
  }finally{busy(false);}
 });
 up.addEventListener('click',async()=>{
  busy(true);
  try{
   const res=await api('/api/academy/home-showcase','PUT',{operation:'move',section,position:Number(item.position),direction:'up'});
   if(!res.moved)throw Error('Move was not confirmed.');
   notifyHomepage();
   message('Card moved up.',false);
   try{await refresh();}catch(e){status('Move saved on the server, but refreshing the Dashboard failed: '+e.message,true);}
  }catch(e){message(e.message,true);}finally{busy(false);}
 });
 down.addEventListener('click',async()=>{
  busy(true);
  try{
   const res=await api('/api/academy/home-showcase','PUT',{operation:'move',section,position:Number(item.position),direction:'down'});
   if(!res.moved)throw Error('Move was not confirmed.');
   notifyHomepage();
   message('Card moved down.',false);
   try{await refresh();}catch(e){status('Move saved on the server, but refreshing the Dashboard failed: '+e.message,true);}
  }catch(e){message(e.message,true);}finally{busy(false);}
 });
 remove.addEventListener('click',async()=>{
  if(isNew){if(objectUrl)URL.revokeObjectURL(objectUrl);card.remove();return;}
  if(!await confirmAction('Remove Homepage Card?','This removes the card from the '+label(section)+' section, but keeps the original photo/video in your Gallery Media Library.','Remove Card Only'))return;
  busy(true);
  try{
   const r=await api('/api/academy/home-showcase','DELETE',{section,position:Number(item.position)});
   if(!r.ok||r.removed!==true)throw Error('Server did not confirm removing the card.');
   // The server confirmed deletion: never keep a stale card visible or
   // misreport this confirmed success if a subsequent GET refresh fails.
   assigned=assigned.filter(x=>!(x.section===section&&Number(x.position)===Number(item.position)));
   card.remove();
   notifyHomepage();
   status('VERIFIED — Homepage card removed. Original photo/video remains in the Media Library.');
   try{await refresh();}catch(e){status('Card removed from the server; the Dashboard could not refresh automatically. Refresh the page to see the updated list.',true);}
  }catch(e){message(e.message,true);}finally{busy(false);}
 });
 return card;
}
async function render({api,gallery,status,confirmAction,refresh,optimisePhoto}){
 const root=$('academyHomepageShowcaseManager');
 if(!root)return;
 root.replaceChildren(node('p','Loading Homepage Gallery…','showcase-admin-status'));
 let cards;
 try{
  const res=await api('/api/academy/home-showcase');
  assigned=Array.isArray(res.cards)?res.cards:[];
  cards=assigned;
 }catch(e){root.replaceChildren(node('p','Unable to load Homepage media: '+e.message,'showcase-admin-status'));return;}
 const approved=gallery.filter(x=>x.is_published===true&&(x.media_type==='video'||x.media_type==='image'));
 root.replaceChildren();
 for(const section of ['gallery']){
  const panel=node('div',null,'showcase-admin-section');
  const area=node('div',null,'showcase-admin-heading');
  const rows=cards.filter(x=>x.section===section).sort((x,y)=>Number(x.sort_order)-Number(y.sort_order)||Number(x.position)-Number(y.position));
  area.append(node('h4',label(section)+' · '+rows.length+' selected'));
  area.append(node('p','Add as many Academy photos/videos as you need. Upload, preview, replace, reorder or remove cards. Each selected item appears on the Homepage.'));
  const add=node('button','+ Add Photo / Video','showcase-admin-add');add.type='button';
  area.append(add);panel.append(area);
  const list=node('div',null,'showcase-admin-list');
  if(!rows.length)list.append(node('p','Nothing selected yet. Click + Add Photo / Video above to upload or choose a saved file.','showcase-admin-status'));
  for(let i=0;i<rows.length;i++){
   const card=renderCard({section,item:rows[i],approved,api,status,confirmAction,refresh,optimisePhoto});
   if(i===0){const up=[...card.querySelectorAll('button')].find(x=>x.textContent.includes('Move Up'));if(up)up.disabled=true;}
   if(i===rows.length-1){const down=[...card.querySelectorAll('button')].find(x=>x.textContent.includes('Move Down'));if(down)down.disabled=true;}
   list.append(card);
  }
  add.addEventListener('click',()=>{
   // Only one new draft at a time per section. Keeps card placement unambiguous.
   if(list.querySelector('[data-position="0"]')){list.querySelector('[data-position="0"]').scrollIntoView({behavior:'smooth',block:'center'});return;}
   if(list.children.length===1&&list.firstElementChild.tagName==='P')list.replaceChildren();
   const card=renderCard({section,item:null,approved,api,status,confirmAction,refresh,optimisePhoto});
   list.prepend(card);card.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  panel.append(list);root.append(panel);
 }
}
window.AcademyHomeShowcaseAdmin={render,usesForMedia:usages};
})();