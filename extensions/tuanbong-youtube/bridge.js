'use strict';
(()=>{
 const transferId=new URL(location.href).searchParams.get('transfer'),hasTransfer=/^[a-f0-9-]{36}$/.test(transferId||'');
 const key='tuanbongTransfer:'+transferId;let interval;
 async function getPayload(){const values=await chrome.storage.local.get([key,'tuanbongTransfer']);return values[key]?.transferId===transferId?values[key]:values.tuanbongTransfer?.transferId===transferId?values.tuanbongTransfer:null;}
 async function deliver(){try{const p=await getPayload();if(p)window.postMessage({source:'tuanbong-extension',payload:p},location.origin);else clearInterval(interval);}catch{clearInterval(interval);}}
 window.addEventListener('message',async e=>{
  if(e.source!==window||e.origin!==location.origin||e.data?.source!=='tuanbong-app')return;
  if(e.data.type==='extension-ping'){
   if(!/^[a-f0-9-]{36}$/.test(e.data.requestId||''))return;
   try{const manifest=chrome.runtime.getManifest();window.postMessage({source:'tuanbong-extension',type:'extension-ready',protocol:1,requestId:e.data.requestId,version:manifest.version},location.origin);}catch{}
   return;
  }
  if(!hasTransfer||e.data.transferId!==transferId)return;
  if(e.data.type==='received'){clearInterval(interval);return;}
  if(e.data.type==='finished'){
   clearInterval(interval);const values=await chrome.storage.local.get([key,'tuanbongTransfer']);
   if(values[key]?.transferId===transferId)await chrome.storage.local.remove(key);
   if(values.tuanbongTransfer?.transferId===transferId)await chrome.storage.local.remove('tuanbongTransfer');
  }
 });
 if(hasTransfer){deliver();interval=setInterval(deliver,250);setTimeout(()=>clearInterval(interval),120000);}
})();
