// Runs only in the YouTube tab selected by the user; no private APIs or network requests.
function extractYouTubeTranscript(){
 const url=new URL(location.href),id=url.searchParams.get('v');
 if(!['www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname)||url.pathname!=='/watch'||!/^[\w-]{11}$/.test(id||''))throw Error('Hãy mở trang video YouTube dạng youtube.com/watch trước.');
 const panel=document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]')||document.querySelector('ytd-transcript-renderer');
 if(!panel||!panel.getClientRects().length||panel.getAttribute?.('visibility')==='ENGAGEMENT_PANEL_VISIBILITY_HIDDEN')throw Error('Bạn mở phần mô tả video → Hiện bản chép lời, rồi bấm tiện ích lại nhé.');
 const segments=[...panel.querySelectorAll('ytd-transcript-segment-renderer,yt-transcript-segment-view-model')],rows=[],seen=new Set();
 for(const segment of segments){
  const time=(segment.querySelector('.segment-timestamp,.ytTranscriptSegmentViewModelTimestamp,[class*="Timestamp"]')?.textContent||'').trim();
  const text=(segment.querySelector('.segment-text,.ytTranscriptSegmentViewModelText,[class*="SegmentText"]')?.textContent||'').replace(/\s+/g,' ').trim();
  if(!/^\d+(?::\d{2}){1,2}$/.test(time)||!text)continue;
  const key=time+'|'+text;if(!seen.has(key)){rows.push({time,text});seen.add(key);}
 }
 if(!rows.length)throw Error('Chưa đọc được dòng có mốc giờ. Hãy bật mốc thời gian trong bản chép lời. Nếu vẫn lỗi, dùng cách dán thủ công.');
 if(rows.length>12000)throw Error('Video quá dài. Hãy dùng tệp phụ đề chia nhỏ.');
 const transcript=rows.map(r=>r.time+' '+r.text).join('\n');if(transcript.length>1500000)throw Error('Bản chép lời quá lớn. Hãy chia nhỏ.');
 const title=(document.querySelector('ytd-watch-metadata h1')?.textContent||document.title.replace(/ - YouTube$/,'')).trim().slice(0,300);
 return {version:1,url:'https://www.youtube.com/watch?v='+id,title,transcript,count:rows.length};
}
if(typeof module!=='undefined')module.exports=extractYouTubeTranscript;


// Uses only visible YouTube controls. Never requests an unofficial captions API.
async function prepareYouTubeTranscript(options={}){
 const started=Date.now(),limit=Math.min(22000,Math.max(1000,options.timeoutMs||18000));
 const original=new URL(location.href).searchParams.get('v');
 const progress=text=>options.onProgress?.(text);
 const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const visible=node=>node&&node.getClientRects().length&&node.getAttribute('aria-hidden')!=='true'&&node.getAttribute('visibility')!=='ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';
 const panel=()=>document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]')||document.querySelector('ytd-transcript-renderer');
 const check=()=>{
  if(new URL(location.href).searchParams.get('v')!==original)throw Error('Video đã thay đổi. Hãy bấm Học cùng TuanBong ở video mới.');
  const flex=document.querySelector('ytd-watch-flexy[video-id]');
  if(flex&&flex.getAttribute('video-id')!==original)throw Error('YouTube đang đổi video. Đợi video tải xong rồi thử lại nhé.');
 };
 const wait=()=>new Promise(resolve=>setTimeout(resolve,250));
 const accumulated=new Map();let opened=false,expanded=false,stable='',stableAt=0,scrollNode=null,originalScroll=0,scrollStep=0,lastScrollAt=0,languageTried=false;
 progress('Đang mở phụ đề trên YouTube…');
 try{
  while(Date.now()-started<limit){
   check();const root=panel();
   if(visible(root)){
    // If YouTube exposes a language chooser, prefer an available English track.
    const chooser=root.querySelector('ytd-transcript-footer-renderer #trigger,ytd-transcript-footer-renderer button,ytd-transcript-footer-renderer #label');
    if(!languageTried&&visible(chooser)){
     languageTried=true;
     if(!/english|tieng anh/.test(normalize(chooser.textContent))){
      chooser.click();await wait();check();
      const english=[...document.querySelectorAll('tp-yt-paper-listbox [role="option"],tp-yt-paper-item,ytd-menu-service-item-renderer')].find(node=>visible(node)&&/^(english|tieng anh)(\b|\s|\()/.test(normalize(node.textContent)));
      if(english){english.click();await wait();continue;}
      // Close only the chooser we opened, leaving the current track intact.
      chooser.click();
     }
    }
    try{
     const result=extractYouTubeTranscript();
     for(const line of result.transcript.split('\n')){
      const match=line.match(/^(\d+(?::\d{2}){1,2}) (.+)$/);if(match)accumulated.set(match[1]+'|'+match[2],{time:match[1],text:match[2]});
     }
     if(accumulated.size>12000)throw Error('Video quá dài. Hãy dùng tệp phụ đề chia nhỏ.');
     if(!scrollNode){
      const candidates=[root,...root.querySelectorAll('#segments-container,ytd-transcript-segment-list-renderer,yt-transcript-segment-list-renderer,div')];
      scrollNode=candidates.find(node=>node.clientHeight>80&&node.scrollHeight>node.clientHeight+20&&/auto|scroll/.test(getComputedStyle(node).overflowY));
      if(scrollNode){originalScroll=scrollNode.scrollTop;if(originalScroll>0){scrollNode.scrollTop=0;lastScrollAt=Date.now();await wait();continue;}}
     }
     const signature=accumulated.size+'|'+result.transcript;
     if(signature!==stable){stable=signature;stableAt=Date.now();}
     const canScroll=scrollNode&&scrollNode.scrollTop+scrollNode.clientHeight<scrollNode.scrollHeight-4;
     // Collect virtualized rows progressively instead of jumping over unseen rows.
     if(canScroll&&Date.now()-lastScrollAt>300){scrollNode.scrollTop+=Math.max(80,scrollNode.clientHeight*.75);lastScrollAt=Date.now();scrollStep++;stableAt=Date.now();}
     if(!canScroll&&Date.now()-stableAt>=900){
      check();
      const seconds=t=>t.split(':').reduce((sum,n)=>sum*60+Number(n),0);
      const rows=[...accumulated.values()].sort((a,b)=>seconds(a.time)-seconds(b.time));
      const transcript=rows.map(row=>row.time+' '+row.text).join('\n');
      if(transcript.length>1500000)throw Error('Bản chép lời quá lớn. Hãy dùng tệp phụ đề chia nhỏ.');
      return {...result,transcript,count:rows.length,autoOpen:true};
     }
     progress('Đang lấy phụ đề · '+accumulated.size+' dòng…');
    }catch(error){
     if(/quá dài|quá lớn/.test(error.message))throw error;
     // A visible panel can still be loading or have hidden timestamps.
    }
   }else if(!opened){
    const known=[...document.querySelectorAll('ytd-video-description-transcript-section-renderer button,ytd-transcript-section-renderer button')].find(visible);
    const control=known||[...document.querySelectorAll('ytd-watch-metadata button,ytd-watch-metadata [role="button"],ytd-button-renderer')].find(node=>visible(node)&&/show (the )?transcript|hien (thi )?ban chep loi|ban phien am/.test(normalize((node.getAttribute('aria-label')||'')+' '+node.textContent)));
    if(control){control.click();opened=true;}
    else if(!expanded){const expand=document.querySelector('ytd-watch-metadata #description-inline-expander #expand,ytd-watch-metadata #description #expand,ytd-watch-metadata ytd-text-inline-expander #expand');if(visible(expand)){expand.click();expanded=true;}}
   }
   await wait();
  }
  check();
  throw Error(accumulated.size?'Phụ đề chưa tải đủ trong thời gian chờ. Giữ bản chép lời mở rồi bấm thử lại.':'Chưa lấy được phụ đề tự động. Hãy mở mô tả → Hiện bản chép lời, chọn tiếng Anh và bật mốc giờ, rồi thử lại. Video không có phụ đề có thể nhập SRT/VTT thủ công.');
 }finally{if(scrollNode)scrollNode.scrollTop=originalScroll;}
}
if(typeof module!=='undefined')module.exports.prepare=prepareYouTubeTranscript;
