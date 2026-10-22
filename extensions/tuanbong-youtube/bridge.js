'use strict';
(()=>{
 const transferId=new URL(location.href).searchParams.get('transfer');if(!/^[a-f0-9-]{36}$/.test(transferId||''))return;
 let interval;
 async function deliver(){const {tuanbongTransfer:p}=await chrome.storage.local.get('tuanbongTransfer');if(p?.transferId===transferId)window.postMessage({source:'tuanbong-extension',payload:p},location.origin);else clearInterval(interval);}
 window.addEventListener('message',async e=>{
  if(e.source!==window||e.origin!==location.origin||e.data?.source!=='tuanbong-app'||e.data.transferId!==transferId)return;
  if(e.data.type==='received'){clearInterval(interval);return;}
  if(e.data.type==='finished'){
   clearInterval(interval);const {tuanbongTransfer:p}=await chrome.storage.local.get('tuanbongTransfer');if(p?.transferId===transferId)await chrome.storage.local.remove('tuanbongTransfer');
  }
 });
 deliver();interval=setInterval(deliver,1500);setTimeout(()=>clearInterval(interval),120000);
})();
