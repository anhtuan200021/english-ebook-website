'use strict';
(()=>{
 if(globalThis.__tuanbongYoutubeInstalled)return;globalThis.__tuanbongYoutubeInstalled=true;
 const APP='https://english-ebook-website.pages.dev/youtube/';let busy=false,scheduled=false,operation=null,lastError='';
 const videoId=()=>{const url=new URL(location.href);return url.pathname==='/watch'&&/^[\w-]{11}$/.test(url.searchParams.get('v')||'')?url.searchParams.get('v'):null;};
 let host=document.createElement('div');host.id='tuanbong-youtube-launcher';
 const shadow=host.attachShadow({mode:'closed'});
 const style=document.createElement('style');style.textContent=':host{display:inline-flex;vertical-align:middle;margin:4px 6px 4px 0;max-width:100%;font:13px/1.5 Roboto,Arial,sans-serif;color:#19382e}*{box-sizing:border-box}.wrap{position:relative;max-width:100%}button{border:1px solid #c1d5c8;border-radius:20px;background:#e8f1e8;color:#174b3e;min-height:36px;padding:7px 14px;font:600 13px/1.5 Roboto,Arial,sans-serif;white-space:nowrap;cursor:pointer}button:hover{background:#d9e9dc}button:focus-visible,a:focus-visible{outline:3px solid #70a78b;outline-offset:3px}button:disabled{cursor:wait;opacity:.75}.status{position:absolute;right:0;top:calc(100% + 8px);z-index:10000;width:300px;max-width:85vw;padding:12px 14px;border:1px solid #c1d5c8;border-radius:12px;background:#f9f7f1;box-shadow:0 8px 24px #0002;white-space:normal;font-size:13px}.status[hidden],a[hidden]{display:none}p{margin:0}a{display:block;color:#174b3e;margin-top:10px;font-weight:600}';
 const wrap=document.createElement('div');wrap.className='wrap';const button=document.createElement('button');button.type='button';button.textContent='🐶 Học cùng TuanBong';
 const status=document.createElement('div');status.className='status';status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.setAttribute('popover','manual');
 style.textContent+=' .status{position:fixed;inset:auto 16px auto auto;top:80px;margin:0;z-index:2147483647}';
 const text=document.createElement('p'),fallback=document.createElement('a');fallback.textContent='Mở bài học và nhập phụ đề thủ công ↗';fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.hidden=true;
 status.append(text,fallback);wrap.append(button,status);shadow.append(style,wrap);
 const hideStatus=()=>{try{status.hidePopover?.();}catch{}status.hidden=true;};
 const show=(message,error=false)=>{
  text.textContent=message;button.title=message;status.hidden=false;fallback.hidden=!error;fallback.href=APP+'?video='+encodeURIComponent(videoId()||'');
  const rect=button.getBoundingClientRect?.();
  if(rect&&status.style){status.style.top=Math.max(12,Math.min(rect.bottom+8,(globalThis.innerHeight||800)-160))+'px';status.style.left=Math.max(12,Math.min(rect.left,(globalThis.innerWidth||1024)-324))+'px';status.style.right='auto';}
  // The top layer escapes YouTube's clipped action toolbar.
  try{status.showPopover?.();}catch{}
 };
 function bounded(task,ms,signal){
  return new Promise((resolve,reject)=>{
   let timer;const finish=(fn,value)=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);fn(value);};
   const cancel=()=>finish(reject,Error('Đã hủy yêu cầu. Bấm học lại ở video hiện tại nhé.'));
   timer=setTimeout(()=>finish(reject,Error('Chờ quá lâu. Bạn tải lại tab YouTube rồi bấm học lại nhé.')),ms);
   if(signal.aborted){cancel();return;}
   signal.addEventListener('abort',cancel,{once:true});Promise.resolve(task).then(v=>finish(resolve,v),e=>finish(reject,e));
  });
 }
 function reset(){busy=false;button.disabled=false;button.textContent=lastError?'Thử lại · Học cùng TuanBong':'🐶 Học cùng TuanBong';}
 async function start(){
  if(busy)return {ok:false,error:'Đang chuẩn bị bài học, bạn chờ một chút nhé.'};
  const id=videoId();if(!id)return {ok:false,error:'Hãy mở video YouTube dạng youtube.com/watch trước.'};
  lastError='';busy=true;button.disabled=true;button.textContent='Đang chuẩn bị…';fallback.hidden=true;
  const current={controller:new AbortController()};operation=current;
  try{
   const payload=await bounded(prepareYouTubeTranscript({signal:current.controller.signal,onProgress:message=>{if(operation===current)show(message);}}),22000,current.controller.signal);
   if(videoId()!==id)throw Error('Video đã thay đổi. Bấm lại trên video mới nhé.');
   show('Đang mở bài học TuanBong…');
   const result=await bounded(chrome.runtime.sendMessage({type:'tuanbong-open-lesson',payload}),8000,current.controller.signal);
   if(operation!==current||videoId()!==id)return {ok:false,error:'Video đã thay đổi.'};
   if(!result?.ok)throw Error(result?.error||'Tiện ích vừa cập nhật. Tải lại tab YouTube rồi thử lại.');
   if(videoId()===id){const video=document.querySelector('video.html5-main-video');video?.pause();}
   show('Đã mở bài học với '+result.count+' dòng phụ đề.');setTimeout(()=>{if(!busy)hideStatus();},4500);return result;
  }catch(error){const message=/context invalidated/i.test(error.message||'')?'Tiện ích vừa cập nhật. Tải lại tab YouTube rồi thử lại.':error.message||'Chưa lấy được phụ đề. Bạn thử lại nhé.';if(operation===current){lastError=message;show(message,true);}return {ok:false,error:message};}
  finally{current.controller.abort();if(operation===current){operation=null;reset();}}
 }
 button.addEventListener('click',()=>start());
 chrome.runtime.onMessage.addListener((message,sender,respond)=>{if(message?.type!=='tuanbong-start')return;start().then(respond);return true;});
 function mount(){
  scheduled=false;
  if(!videoId()){host.remove();return;}
  const area=document.querySelector('ytd-watch-metadata #top-level-buttons-computed')||document.querySelector('ytd-watch-metadata #actions-inner')||document.querySelector('ytd-watch-metadata #below');
  if(area&&host.parentElement!==area)area.append(host);
 }
 const schedule=()=>{if(!scheduled){scheduled=true;setTimeout(mount,180);}};
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('yt-navigate-start',()=>{const old=operation;operation=null;old?.controller.abort();lastError='';reset();hideStatus();host.remove();});document.addEventListener('yt-navigate-finish',schedule);mount();
})();
