// Runs only in the YouTube tab selected by the user; no private APIs or network requests.
function extractYouTubeTranscript(){
 const url=new URL(location.href),id=url.searchParams.get('v');
 if(!['www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname)||url.pathname!=='/watch'||!/^[\w-]{11}$/.test(id||''))throw Error('Hãy mở trang video YouTube dạng youtube.com/watch trước.');
 const panel=document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]')||document.querySelector('ytd-transcript-renderer');
 if(!panel||!panel.getClientRects().length)throw Error('Bạn mở phần mô tả video → Hiện bản chép lời, rồi bấm tiện ích lại nhé.');
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
