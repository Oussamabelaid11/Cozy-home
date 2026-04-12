/* tracker.js — Cozy Home event tracker (localStorage) */
const _t=(e,d={})=>{const s=JSON.parse(localStorage.getItem('ch_events')||'[]');s.push({event:e,data:d,ts:Date.now(),page:location.pathname});localStorage.setItem('ch_events',JSON.stringify(s.slice(-500)));};
document.addEventListener('DOMContentLoaded',()=>_t('page_view',{title:document.title,ref:document.referrer}));
window._track=_t;
