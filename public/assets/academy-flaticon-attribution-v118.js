/* Attribution for Flaticon icon artwork supplied in reference screenshots. Mobile public footer only. */
(function () {
 'use strict';
 function applyCredits() {
  if(!window.matchMedia('(max-width:767px)').matches) return;
  const footer=document.querySelector('#app footer.academy-footer .academy-footer-bottom');
  if(!footer || footer.querySelector('.academy-flaticon-credit-v118')) return;
  const link=document.createElement('a');
  link.className='academy-flaticon-credit-v118';
  link.href='https://www.flaticon.com/';
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.textContent='Menu icons: Flaticon contributors';
  link.setAttribute('aria-label','Flaticon icon artist attribution');
  footer.appendChild(link);
 }
 window.addEventListener('academy:render',applyCredits);
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyCredits);
 else applyCredits();
})();