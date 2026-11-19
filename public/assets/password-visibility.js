(()=>{'use strict';
const css=document.createElement('style');
css.textContent='.password-visibility-wrap{position:relative;display:block;width:100%}.password-visibility-wrap input{padding-right:92px!important}.password-visibility-button{position:absolute!important;right:6px!important;top:50%!important;transform:translateY(-50%)!important;width:auto!important;min-height:34px!important;margin:0!important;padding:5px 9px!important;border-radius:7px!important;border:1px solid #c8dfd0!important;background:#fff!important;color:#075333!important;font:700 12px system-ui,sans-serif!important;line-height:1.2!important;cursor:pointer!important;box-shadow:none!important}.password-visibility-button:hover{background:#ecf7f0!important}.password-visibility-button:focus-visible{outline:2px solid #b99145!important;outline-offset:2px!important}';
document.head.append(css);
function init(){
 document.querySelectorAll('input[type="password"],input[data-password-visibility="enabled"]').forEach(input=>{
   if(input.dataset.visibilityAdded)return;
   input.dataset.visibilityAdded='true';
   const wrap=document.createElement('span');wrap.className='password-visibility-wrap';
   input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
   const btn=document.createElement('button');btn.type='button';btn.className='password-visibility-button';btn.textContent='Show';btn.setAttribute('aria-label','Show password');btn.setAttribute('aria-pressed','false');
   btn.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'Hide':'Show';btn.setAttribute('aria-label',show?'Hide password':'Show password');btn.setAttribute('aria-pressed',String(show));});
   wrap.appendChild(btn);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();