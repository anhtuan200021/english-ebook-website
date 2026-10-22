'use strict';
(()=>{
 if(globalThis.__tuanbongYoutubeInstalled)return;globalThis.__tuanbongYoutubeInstalled=true;
 const APP='https://english-ebook-website.pages.dev/youtube/';let busy=false,scheduled=false;
 const videoId=()=>{const url=new URL(location.href);return url.pathname==='/watch'&&/^[\w-]{11}$/.test(url.searchParams.get('v')||'')?url.searchParams.get('v'):null;};
 let host=document.createElement('div');host.id='tuanbong-youtube-launcher';
 const shadow=host.attachShadow({mode:'closed'});
 const style=document.createElement('style');style.textContent=':host{display:inline-flex;vertical-align:middle;margin:4px 6px 4px 0;max-width:100%;font:13px/1.5 Roboto,Arial,sans-serif;color:#19382e}*{box-sizing:border-box}.wrap{position:relative;max-width:100%}button{border:1px solid #c1d5c8;border-radius:20px;background:#e8f1e8;color:#174b3e;min-height:36px;padding:7px 14px;font:600 13px/1.5 Roboto,Arial,sans-serif;white-space:nowrap;cursor:pointer}button:hover{background:#d9e9dc}button:focus-visible,a:focus-visible{outline:3px solid #70a78b;outline-offset:3px}button:disabled{cursor:wait;opacity:.75}.status{position:absolute;right:0;top:calc(100% + 8px);z-index:10000;width:300px;max-width:85vw;padding:12px 14px;border:1px solid #c1d5c8;border-radius:12px;background:#f9f7f1;box-shadow:0 8px 24px #0002;white-space:normal;font-size:13px}.status[hidden],a[hidden]{display:none}p{margin:0}a{display:block;color:#174b3e;margin-top:10px;font-weight:600}';
 const wrap=document.createElement('div');wrap.className='wrap';const button=document.createElement('button');button.type='button';button.textContent='🐶 Học cùng TuanBong';
 const status=document.createElement('div');status.className='status';status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const text=document.createElement('p'),fallback=document.createElement('a');fallback.textContent='Mở bài học và nhập phụ đề thủ công ↗';fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.hidden=true;
 status.append(text,fallback);wrap.append(button,status);shadow.append(style,wrap);
 const show=(message,error=false)=>{text.textContent=message;status.hidden=false;fallback.hidden=!error;fallback.href=APP+'?video='+encodeURIComponent(videoId()||'');};
 async function start(){
  if(busy)return {ok:false,error:'Đang chuẩn bị bài học, bạn chờ một chút nhé.'};
  const id=videoId();if(!id)return {ok:false,error:'Hãy mở video YouTube dạng youtube.com/watch trước.'};
  busy=true;button.disabled=true;button.textContent='Đang chuẩn bị…';fallback.hidden=true;
  try{
   const payload=await prepareYouTubeTranscript({onProgress:message=>show(message)});
   if(videoId()!==id)throw Error('Video đã thay đổi. Bấm lại trên video mới nhé.');
   show('Đang mở bài học TuanBong…');
   const result=await chrome.runtime.sendMessage({type:'tuanbong-open-lesson',payload});
   if(!result?.ok)throw Error(result?.error||'Tiện ích vừa cập nhật. Tải lại tab YouTube rồi thử lại.');
   if(videoId()===id){const video=document.querySelector('video.html5-main-video');video?.pause();}
   show('Đã mở bài học với '+result.count+' dòng phụ đề.');setTimeout(()=>{if(!busy)status.hidden=true;},4500);return result;
  }catch(error){const message=/context invalidated/i.test(error.message||'')?'Tiện ích vừa cập nhật. Tải lại tab YouTube rồi thử lại.':error.message||'Chưa lấy được phụ đề. Bạn thử lại nhé.';show(message,true);return {ok:false,error:message};}
  finally{busy=false;button.disabled=false;button.textContent='🐶 Học cùng TuanBong';}
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
 document.addEventListener('yt-navigate-start',()=>{status.hidden=true;host.remove();});document.addEventListener('yt-navigate-finish',schedule);mount();
})();
