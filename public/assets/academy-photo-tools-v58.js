/* Safe client-side image preparation for Academy photo upload forms.
 * The server still validates image signatures, authenticates and enforces its 16MB limit.
 */
(()=>{
 'use strict';
 const MAX=16*1024*1024;
 const ACCEPTED=new Set(['jpg','jpeg','jfif','png','webp','bmp','gif','avif','heic','heif','tif','tiff']);
 function extension(file){return String(file?.name||'').split('.').pop().toLowerCase();}
 function imageCandidate(file){return !!file&&ACCEPTED.has(extension(file))&&(!file.type||file.type.startsWith('image/')||file.type==='application/octet-stream');}
 function message(e){return String(e?.message||e||'Unknown error');}
 function loadViaImage(file){
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file),img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('This image could not be decoded by the browser.'));};
   img.src=url;
  });
 }
 async function decode(file){
  if(typeof createImageBitmap==='function'){
   try{return await createImageBitmap(file,{imageOrientation:'from-image'});}
   catch(e){/* Older browsers may still decode through Image below. */}
  }
  return loadViaImage(file);
 }
 function encode(canvas,type,quality){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
 }
 async function prepare(file,{onProgress}={}){
  if(!imageCandidate(file))throw Error('Select a photo: JPG, PNG, WebP, GIF, BMP, AVIF, HEIC or HEIF. Documents and executables cannot be used as website photos.');
  if(file.size===0)throw Error('The selected image is empty.');
  if(file.size>70*1024*1024)throw Error('This image is too large to process in a browser (70 MB maximum source). Choose a smaller original.');
  onProgress?.('Reading and checking '+file.name+'…');
  let bitmap;
  try{bitmap=await decode(file);}
  catch(e){
   const ext=extension(file);
   if(['heic','heif','tif','tiff'].includes(ext))throw Error('Your browser cannot read this '+ext.toUpperCase()+' photo. Export it as JPG or PNG, then select it again.');
   throw Error('Could not read this image. Check that it opens normally in Photos, then export a fresh JPG or PNG. '+message(e));
  }
  try{
   const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight;
   if(!width||!height||width*height>85000000)throw Error('Photo dimensions are unsupported; resize the image first.');
   const base=String(file.name||'academy-photo').replace(/\.[^.]*$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,65)||'academy-photo';
   let best=null;
   onProgress?.('Optimising the photo for website display…');
   for(const [maxEdge,quality] of [[2800,.88],[2300,.81],[1800,.75],[1400,.68],[1000,.62]]){
    const scale=Math.min(1,maxEdge/Math.max(width,height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)throw Error('Browser image processing is not available.');
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let blob=await encode(canvas,'image/webp',quality);
    if(!blob||blob.type!=='image/webp')blob=await encode(canvas,'image/png');
    if(blob&&(!best||blob.size<best.size))best=blob;
    canvas.width=1;canvas.height=1;
    if(blob&&blob.size<Math.min(MAX,6*1024*1024))break;
   }
   if(!best||!best.size)throw Error('The browser could not create a website-compatible image.');
   if(best.size>MAX)throw Error('The converted photo is still over 16 MB. Please resize it before uploading.');
   const outputType=best.type==='image/webp'?'image/webp':'image/png';
   const outputExtension=outputType==='image/webp'?'webp':'png';
   return new File([best],base+'-academy.'+outputExtension,{type:outputType,lastModified:Date.now()});
  }finally{if(bitmap&&typeof bitmap.close==='function')bitmap.close();}
 }
 window.AcademyPhotoTools={prepare,imageCandidate,maxBytes:MAX};
})();