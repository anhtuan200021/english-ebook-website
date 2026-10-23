function stripCaptionTimeLabel(text,start){
 const normalized=String(text||'').normalize('NFC');
 const match=normalized.match(/^(?:(\d+)\s*giờ\s*)?(?:(\d+)\s*phút\s*)?(?:(\d+)\s*giây\s*)?/i);
 if(!match?.[0]||!/[A-Za-z]/.test(normalized.slice(match[0].length,match[0].length+1)))return text;
 const seconds=Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0);
 return Math.abs(seconds-start)<.01?normalized.slice(match[0].length):text;
}
// Pick a visible transcript, including YouTube's combined chapters/transcript panel.
function tuanbongTranscriptPanel(){
 const shown=node=>node&&node.getClientRects().length&&node.getAttribute?.('visibility')!=='ENGAGEMENT_PANEL_VISIBILITY_HIDDEN'&&node.getAttribute?.('aria-hidden')!=='true';
 const known=[document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'),document.querySelector('ytd-transcript-renderer')];
 const others=[...document.querySelectorAll('ytd-engagement-panel-section-list-renderer,ytd-transcript-search-panel-renderer,yt-transcript-renderer,transcript-view-model')];
 const candidates=[...new Set([...known,...others])].filter(shown);
 return candidates.find(node=>node.querySelectorAll('ytd-transcript-segment-renderer,yt-transcript-segment-view-model,transcript-segment-view-model').length)||known.find(shown)||null;
}
// Runs only in the YouTube tab selected by the user; no private APIs or network requests.
function tuanbongSubtitleText(node){
 if(!node)return '';
 const copy=node.cloneNode?.(true);
 if(copy){
  // textContent includes YouTube's hidden screen-reader duration labels.
  copy.querySelectorAll('[class*="timestamp" i],.yt-core-screen-reader-only,.sr-only,[hidden]').forEach(child=>child.remove());
  return (copy.textContent||'').replace(/\s+/g,' ').trim();
 }
 return (node.textContent||'').replace(/\s+/g,' ').trim();
}
function extractYouTubeTranscript(){
 const url=new URL(location.href),id=url.searchParams.get('v');
 if(!['www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname)||url.pathname!=='/watch'||!/^[\w-]{11}$/.test(id||''))throw Error('Hãy mở trang video YouTube dạng youtube.com/watch trước.');
 const panel=tuanbongTranscriptPanel();
 if(!panel||!panel.getClientRects().length||panel.getAttribute?.('visibility')==='ENGAGEMENT_PANEL_VISIBILITY_HIDDEN')throw Error('Bạn mở phần mô tả video → Hiện bản chép lời, rồi bấm tiện ích lại nhé.');
 const segments=[...panel.querySelectorAll('ytd-transcript-segment-renderer,yt-transcript-segment-view-model,transcript-segment-view-model')],rows=[],seen=new Set();
 for(const segment of segments){
  const time=(segment.querySelector('.segment-timestamp,.ytTranscriptSegmentViewModelTimestamp,[class*="Timestamp"],[class*="timestamp"],button')?.textContent||'').trim();
  let text=tuanbongSubtitleText(segment.querySelector('.segment-text,.ytTranscriptSegmentViewModelText,[class*="SegmentText"],[class*="segment-text"]'));
  if(!text){
   const pieces=[...segment.querySelectorAll('yt-formatted-string,.yt-core-attributed-string')].filter(node=>!node.closest?.('.yt-core-screen-reader-only,.sr-only,[hidden],[class*="timestamp" i]')).map(tuanbongSubtitleText).filter(value=>value&&!/^\d+(?::\d{2}){1,2}$/.test(value)&&!/^(?:\d+\s*(?:giờ|phút|giây)\s*)+$/i.test(value));
   text=pieces.sort((a,b)=>b.length-a.length)[0]||tuanbongSubtitleText(segment).replace(/^\s*\d+(?::\d{2}){1,2}\s*/,'');
   if(time&&text.startsWith(time))text=text.slice(time.length).trimStart();
  }
  if(!/^\d+(?::\d{2}){1,2}$/.test(time)||!text)continue;
  text=stripCaptionTimeLabel(text,time.split(':').reduce((sum,n)=>sum*60+Number(n),0));
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
 const panel=tuanbongTranscriptPanel;
 const check=()=>{
  if(options.signal?.aborted)throw Error('Đã hủy lấy phụ đề. Bấm học lại ở video hiện tại nhé.');
  if(new URL(location.href).searchParams.get('v')!==original)throw Error('Video đã thay đổi. Hãy bấm Học cùng TuanBong ở video mới.');
  const visiblePlayers=[...document.querySelectorAll('ytd-watch-flexy[video-id]')].filter(visible);
  const flex=visiblePlayers.find(node=>node.getAttribute('video-id')===original)||visiblePlayers[0]||document.querySelector('ytd-watch-flexy[video-id]');
  return !flex||flex.getAttribute('video-id')===original;
 };
 const wait=(ms=100)=>new Promise(resolve=>setTimeout(resolve,ms));
 // Most YouTube transcripts already have every row mounted. Check the actual
 // layout (including gaps), so a virtualized list cannot take this fast path.
 const fullyMounted=(root,scroller)=>{
  if(!scroller)return true;
  const nodes=[...root.querySelectorAll('ytd-transcript-segment-renderer,yt-transcript-segment-view-model,transcript-segment-view-model')];
  if(!nodes.length||!scroller.getBoundingClientRect)return false;
  const rects=nodes.map(node=>node.getBoundingClientRect?.()).filter(rect=>rect&&rect.height>0).sort((a,b)=>a.top-b.top);
  if(rects.length!==nodes.length)return false;
  // Measure the shared list container when headers/footers sit in the scroller.
  let list=nodes[0].parentElement;
  while(list&&list!==scroller&&!nodes.every(node=>list.contains(node)))list=list.parentElement;
  const area=list&&scroller.contains?.(list)&&list.scrollHeight>0?list:scroller;
  const top=area.getBoundingClientRect().top-(area.scrollTop||0);
  if(Math.abs(rects[0].top-top)>48||Math.abs(top+area.scrollHeight-rects.at(-1).bottom)>48)return false;
  return rects.every((rect,i)=>!i||rect.top-rects[i-1].bottom<=96);
 };
 const accumulated=new Map();let opened=false,expanded=false,stable='',stableAt=0,scrollNode=null,originalScroll=0,lastScrollAt=0,languageTried=false;
 progress('Đang mở phụ đề trên YouTube…');
 try{
  while(Date.now()-started<limit){
   if(!check()){progress('Đang chờ YouTube chuyển xong video mới…');await wait();continue;}const root=panel();
   if(visible(root)){
    // If YouTube exposes a language chooser, prefer an available English track.
    const chooser=root.querySelector('ytd-transcript-footer-renderer #trigger,ytd-transcript-footer-renderer button,ytd-transcript-footer-renderer #label');
    if(!languageTried&&visible(chooser)){
     languageTried=true;
     if(!/english|tieng anh/.test(normalize(chooser.textContent))){
      chooser.click();await wait(250);if(!check())continue;
      const english=[...document.querySelectorAll('tp-yt-paper-listbox [role="option"],tp-yt-paper-item,ytd-menu-service-item-renderer')].find(node=>visible(node)&&/^(english|tieng anh)(\b|\s|\()/.test(normalize(node.textContent)));
      if(english){english.click();await wait(250);continue;}
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
      if(scrollNode){originalScroll=scrollNode.scrollTop;if(originalScroll>0&&!fullyMounted(root,scrollNode)){scrollNode.scrollTop=0;lastScrollAt=Date.now();await wait();continue;}}
     }
     const signature=accumulated.size+'|'+result.transcript;
     if(signature!==stable){stable=signature;stableAt=Date.now();}
     const complete=fullyMounted(root,scrollNode);
     const canScroll=!complete&&scrollNode&&scrollNode.scrollTop+scrollNode.clientHeight<scrollNode.scrollHeight-4;
     // Collect virtualized rows progressively instead of jumping over unseen rows.
     if(canScroll&&Date.now()-lastScrollAt>=100){scrollNode.scrollTop+=Math.max(80,scrollNode.clientHeight*.9);lastScrollAt=Date.now();stableAt=Date.now();}
     if(!canScroll&&Date.now()-stableAt>=300){
      if(!check()){await wait();continue;}
      const seconds=t=>t.split(':').reduce((sum,n)=>sum*60+Number(n),0);
      const rows=[...accumulated.values()].sort((a,b)=>seconds(a.time)-seconds(b.time));
      const transcript=rows.map(row=>row.time+' '+row.text).join('\n');
      if(transcript.length>1500000)throw Error('Bản chép lời quá lớn. Hãy dùng tệp phụ đề chia nhỏ.');
      return {...result,transcript,count:rows.length,autoOpen:true};
     }
     progress('Đang lấy phụ đề · '+accumulated.size+' dòng…');
    }catch(error){
     if(options.signal?.aborted||/quá dài|quá lớn|Video đã thay đổi|YouTube đang đổi/.test(error.message))throw error;
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
  if(!check())throw Error('YouTube chưa chuyển xong video. Đợi video tải xong rồi bấm Thử lại nhé.');
  throw Error(accumulated.size?'Phụ đề chưa tải đủ trong thời gian chờ. Giữ bản chép lời mở rồi bấm thử lại.':'Chưa lấy được phụ đề tự động. Hãy mở mô tả → Hiện bản chép lời, chọn tiếng Anh và bật mốc giờ, rồi thử lại. Video không có phụ đề có thể nhập SRT/VTT thủ công.');
 }finally{if(scrollNode)scrollNode.scrollTop=originalScroll;}
}
if(typeof module!=='undefined')module.exports.prepare=prepareYouTubeTranscript;
