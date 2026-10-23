'use strict';
(()=>{
 const gate=document.querySelector('#extensionGate'),study=document.querySelector('#studyApp'),status=document.querySelector('#extensionCheckStatus'),retry=document.querySelector('#extensionCheck');
 let requestId='',interval,timer,loading=false;
 function stop(){clearInterval(interval);clearTimeout(timer);}
 function openStudy(){
  if(loading)return;loading=true;stop();retry.disabled=true;status.textContent='Đã kết nối tiện ích · Đang mở bài học…';
  const script=document.createElement('script');script.src=study.dataset.appSrc;
  script.onload=()=>{study.hidden=false;study.inert=false;gate.hidden=true;};
  script.onerror=()=>{script.remove();loading=false;retry.disabled=false;status.textContent='Đã nhận diện tiện ích nhưng chưa tải được trang học. Bấm Kiểm tra lại hoặc tải lại trang nhé.';};
  document.head.append(script);
 }
 function check(){
  if(loading)return;stop();requestId=crypto.randomUUID();retry.disabled=true;status.textContent='Đang kiểm tra tiện ích…';
  const ping=()=>window.postMessage({source:'tuanbong-app',type:'extension-ping',requestId},location.origin);
  ping();interval=setInterval(ping,250);
  timer=setTimeout(()=>{stop();retry.disabled=false;status.textContent='Chưa kết nối được tiện ích. Bạn cài theo hướng dẫn bên dưới, hoặc bấm Kiểm tra lại nếu đã cài.';},4000);
 }
 window.addEventListener('message',e=>{
  if(e.source!==window||e.origin!==location.origin||e.data?.source!=='tuanbong-extension')return;
  const data=e.data;
  if(data.type==='extension-ready'&&data.protocol===1&&data.requestId===requestId&&/^\d+\.\d+\.\d+$/.test(data.version||'')){openStudy();return;}
  // Older installed versions prove their presence by a valid one-click transfer.
  // They keep delivering until the study app is ready to acknowledge the import.
  const expected=new URL(location.href).searchParams.get('transfer');
  if(expected&&data.payload){try{TBTransfer.decode(data.payload,expected);openStudy();}catch{}}
 });
 retry.addEventListener('click',check);
 window.addEventListener('focus',()=>{if(!loading)check();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!loading)check();});
 document.querySelector('#copyExtensionsAddress').addEventListener('click',async()=>{
  const note=document.querySelector('#copyExtensionsStatus');
  try{await navigator.clipboard.writeText('chrome://extensions');note.textContent='Đã sao chép. Dán vào thanh địa chỉ Chrome rồi nhấn Enter.';}
  catch{note.textContent='Bạn gõ chrome://extensions vào thanh địa chỉ Chrome rồi nhấn Enter nhé.';}
 });
 check();
})();
