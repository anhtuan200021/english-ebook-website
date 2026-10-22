'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataReady=false;
let state={version:1,videos:[],saved:[],words:[],current:'',settings:{font:18}},video=null,player=null,playerReady=false,playerLoading=false,playerId='',mode='off',range=null,pendingSeek=null,pendingLessonJump=null,closed=false,activeIndex=-1,manualScroll=false,programmaticScroll=false,selectedText='',selectedCue=null,tab='transcript',segments=[],readingGroups=[],readingIndex=-1,spokenCueKey='',grammarRows=[],worker=null,job=0,filter='all',transcriptLimit=150,grammarLimit=100,saveTimer,toastTimer,tickId;
const TYPES={present_simple:'Hiện tại đơn',present_continuous:'Hiện tại tiếp diễn',present_perfect:'Hiện tại hoàn thành',present_perfect_continuous:'Hiện tại hoàn thành tiếp diễn',past_simple:'Quá khứ đơn',past_continuous:'Quá khứ tiếp diễn',past_perfect:'Quá khứ hoàn thành',past_perfect_continuous:'Quá khứ hoàn thành tiếp diễn',future_will:'Tương lai · will',future_going_to:'Tương lai · be going to',future_continuous:'Tương lai tiếp diễn',future_perfect:'Tương lai hoàn thành',future_perfect_continuous:'Tương lai hoàn thành tiếp diễn',modal:'Động từ khuyết thiếu',imperative:'Mệnh lệnh',other:'Mảnh câu / không có động từ chia',uncertain:'Chưa xác định'};
const DEMO=['I work from home every day.','She is learning English at the moment.','I have a bike.',"I’m tired.",'The door is closed.',"I’m leaving tomorrow.",'We have finished our work.','She has been working here for three years.','I visited my friend yesterday.','I was cooking when he arrived.','They had left before I got there.','He had been waiting for an hour.','I will call you tonight.','We are going to visit our friends.','This time tomorrow, I will be travelling.','By Friday, I will have finished the book.','By June, she will have been studying for a year.','You should take a break.','Please keep going.','A lot of interesting ideas.',"I think it’s a good idea.",'I work and study.','I read the book.','Thank you for your help.'];
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,5200);}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{await TBStore.set(state);}catch(e){toast(e.message);}},200);}
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function openDialog(id){$('#selectionBubble').hidden=true;$(id).showModal();}
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function showTab(name){tab=name;$$('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===name));b.tabIndex=b.dataset.tab===name?0:-1;});['transcript','grammar','words'].forEach(t=>$('#panel-'+t).hidden=t!==name);$('#selectionBubble').hidden=true;if(name==='grammar')renderGrammar();if(name==='transcript')requestAnimationFrame(alignTranscript);}
$$('[data-tab]').forEach(b=>{b.onclick=()=>showTab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=$$('[data-tab]'),i=(tabs.indexOf(b)+(e.key==='ArrowRight'?1:-1)+3)%3;tabs[i].click();tabs[i].focus();}};});
function tokens(text){let out='',end=0;for(const m of text.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)){out+=esc(text.slice(end,m.index))+'<span class="word-token">'+esc(m[0])+'</span>';end=m.index+m[0].length;}return out+esc(text.slice(end));}
function currentSentence(){return readingGroups[readingIndex]||video?.cues[activeIndex];}
function currentReadingCue(){
 const sentence=readingGroups[readingIndex],cue=video?.cues[activeIndex];
 const shown=cue&&sentence?.sourceCueIds.includes(cue.id)?cue:video?.cues.find(c=>c.id===sentence?.sourceCueIds[0]);
 if(!shown)return sentence;
 const span=TB.cueSpan(sentence.text,shown.text);return {...shown,text:span?sentence.text.slice(span.start,span.end):shown.text};
}
function readingMarkup(text,cueText){
 const span=TB.cueSpan(text,cueText),visible=cueText?(span?text.slice(span.start,span.end):cueText):text;
 return '<span class="phrase-line"><span class="spoken-cue">'+tokens(visible)+'</span></span>';
}
function updateSpokenCue(cue){
 const sentence=readingGroups[readingIndex],el=$('#currentText');if(!sentence||!el)return;
 const fallback=video?.cues.find(c=>c.id===sentence.sourceCueIds[0]);
 const shown=cue&&sentence.sourceCueIds.includes(cue.id)?cue:fallback;
 const key=sentence.id+'|'+(shown?.id||'');if(spokenCueKey===key)return;
 const selection=window.getSelection();if(selection&&!selection.isCollapsed&&el.contains(selection.anchorNode))return;
 spokenCueKey=key;el.innerHTML=readingMarkup(sentence.text,shown?.text);el.dataset.textCue=shown?.id||sentence.sourceCueIds[0];el.scrollTop=0;
 $('#readingHint').textContent='Đoạn đang phát · Bôi đen từ/câu để dịch hoặc lưu.';
 requestAnimationFrame(()=>{if(el.isConnected)fitCurrentReading();});
}
function fitCurrentReading(){
 const el=$('#currentText.reading-text');if(!el||!el.clientHeight)return;
 el.style.fontSize='';let size=parseFloat(getComputedStyle(el).fontSize);
 while(el.scrollHeight>el.clientHeight+1&&size>14){size=Math.max(14,size-.5);el.style.fontSize=size+'px';}
}
function renderReadingContext(cueIndex,time){
 const cue=video?.cues[cueIndex];let index=Number.isFinite(time)?TB.active(readingGroups,time):-1;
 if(index<0&&cue)index=readingGroups.findIndex(r=>r.sourceCueIds.includes(cue.id));
 if(index<0)index=readingGroups.length?Math.max(0,readingIndex):-1;
 if(readingIndex===index){updateSpokenCue(cue);return;}readingIndex=index;spokenCueKey='';
 const r=readingGroups[index];
 $('#readingStack').innerHTML=r?'<article class="reading-slot tone-current"><p id="currentText" class="reading-text" data-text-cue="'+esc(r.sourceCueIds[0])+'" tabindex="0">'+readingMarkup(r.text)+'</p></article>':'<div class="reading-slot tone-current"><p id="currentText" class="reading-text">Nhập phụ đề để bắt đầu học.</p></div>';
 $('#readingHint').textContent=r&&!r.complete?'Đoạn ghép ước lượng do phụ đề thiếu dấu câu · Bôi đen từ/câu để dịch hoặc lưu.':'Bôi đen từ/câu để dịch hoặc lưu.';
 updateSpokenCue(cue);

 updateSaved();
}
function savedId(text,start){return'b'+TB.hash((video?.id||'')+'|'+start+'|'+text);}
function isSaved(c){return state.saved.some(x=>x.id===savedId(c.text,c.start));}
function saveText(text,start=0,kind='sentence',toggle=false){if(!video||!text.trim())return;const id=savedId(text,start),old=state.saved.find(x=>x.id===id);if(old){if(toggle){state.saved=state.saved.filter(x=>x.id!==id);persist();updateSaved();toast('Đã bỏ lưu câu.');}else toast('Câu này đã có trong Kho đã lưu.');return;}state.saved.unshift({id,text,videoId:video.id,title:video.title,url:video.url||'',start,kind,note:''});persist();updateSaved();toast('Đã lưu vào Kho đã lưu.');}
function updateSaved(){$('#savedCount').textContent=state.saved.length;$$('.save').forEach(b=>{const cue=video?.cues.find(c=>c.id===b.dataset.save);if(cue){const saved=isSaved(cue);b.textContent=saved?'★':'☆';b.setAttribute('aria-label',saved?'Bỏ lưu câu':'Lưu câu');b.setAttribute('aria-pressed',String(saved));}});const c=currentReadingCue();const saved=!!c&&isSaved(c);$('#saveCurrent').textContent=saved?'★':'☆';$('#saveCurrent').setAttribute('aria-label',saved?'Bỏ lưu câu đang nghe':'Lưu câu đang nghe');$('#saveCurrent').setAttribute('aria-pressed',String(saved));}
function captureVideoProgress(force=false){
 if(!video?.url||!playerReady||playerId!==video.id||pendingSeek)return;
 try{const time=player.getCurrentTime();if(!Number.isFinite(time)||time<0||time>86400)return;
  if(force||Math.abs(time-(video.lastPosition||0))>=5){video.lastPosition=time;persist();}
 }catch{}
}
function lessonPlaybackStart(v){return pendingLessonJump?.videoId===v.id?pendingLessonJump.time:(v.lastPosition||0);}
function resumePlayer(v){
 if(!playerReady||playerId!==v?.id)return;
 const jump=pendingLessonJump?.videoId===v.id?pendingLessonJump:null,time=lessonPlaybackStart(v);
 if(time>0||jump){pendingSeek={index:TB.active(v.cues,time),time,until:Date.now()+2500};player.seekTo(time,true);$('#clock').textContent=TB.stamp(time);}
 if(jump){pendingLessonJump=null;player.playVideo();}
}
function renderVideoBookmarks(){
 const enabled=!!video?.url,saved=enabled&&video.favorite===true,b=$('#saveVideoBtn');
 b.disabled=!enabled;b.textContent=saved?'♥ Đã lưu video':'♡ Lưu video';b.setAttribute('aria-pressed',String(saved));b.setAttribute('aria-label',saved?'Bỏ lưu video hiện tại':'Lưu video hiện tại');
 $('#savedVideoCount').textContent=state.videos.filter(v=>v.favorite&&v.url).length;
}
function toggleFavoriteVideo(){
 if(!video?.url)return;captureVideoProgress(true);video.favorite=!video.favorite;persist();renderVideoBookmarks();
 toast(video.favorite?'Đã lưu video. Mở “Video đã lưu” để xem tiếp bất cứ lúc nào.':'Đã bỏ lưu video. Bài học và phụ đề vẫn được giữ.');
}
function renderSavedVideos(){
 const rows=state.videos.filter(v=>v.favorite&&v.url).sort((a,b)=>b.updated-a.updated);
 $('#savedVideosList').innerHTML=rows.length?rows.map(v=>'<article class="saved-video"><h3>'+esc(v.title)+'</h3><div class="video-address">'+esc(v.url)+'</div><p>'+(v.lastPosition>0?'Đã xem đến '+TB.stamp(v.lastPosition):'Chưa bắt đầu')+' · '+v.cues.length+' dòng phụ đề</p><div class="row"><button class="primary" data-open-video="'+esc(v.id)+'">'+(v.lastPosition>0?'▶ Xem tiếp':'▶ Mở video')+'</button><button class="text-button" data-unfavorite-video="'+esc(v.id)+'">Bỏ lưu video</button></div></article>').join(''):'<div class="empty"><h3>Giữ lại những video bạn thích</h3><p>Mở một video rồi bấm “♡ Lưu video”. Lần sau bạn có thể mở lại ở đây.</p></div>';
}
$('#saveVideoBtn').onclick=toggleFavoriteVideo;
$('#savedVideosBtn').onclick=()=>{captureVideoProgress(true);renderSavedVideos();openDialog('#savedVideosDialog');};
$('#savedVideosList').onclick=e=>{
 const open=e.target.closest('[data-open-video]'),remove=e.target.closest('[data-unfavorite-video]');
 if(open){const v=state.videos.find(v=>v.id===open.dataset.openVideo);if(v){$('#savedVideosDialog').close();useVideo(v);}return;}
 if(remove){const v=state.videos.find(v=>v.id===remove.dataset.unfavoriteVideo);if(v){v.favorite=false;persist();renderVideoBookmarks();renderSavedVideos();}}
};
async function flushVideoProgress(){if(!dataReady)return;captureVideoProgress(true);clearTimeout(saveTimer);try{await TBStore.set(state);}catch(e){toast(e.message);}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushVideoProgress();});
window.addEventListener('pagehide',flushVideoProgress);
function renderRecent(){renderVideoBookmarks();const list=[...state.videos].sort((a,b)=>b.updated-a.updated);$('#recentSelect').innerHTML='<option value="">Chọn bài đã học…</option>'+list.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===video?.id?'selected':'')+'>'+esc(v.title)+'</option>').join('');}
function renderMeta(){
 const cues=video?.cues||[];
 $('#videoUrl').value=video?.url||'';
 $('#cueCount').textContent=cues.length;
 const coverage=cues.length?`${video.partial?'Phụ đề một phần':'Phạm vi phụ đề'}: ${TB.stamp(cues[0].start)}–${TB.stamp(Math.max(...cues.map(c=>c.end)))} · ${video.format}`:'Chưa có phụ đề';
 $('#transcriptInfo').textContent=cues.length?`${cues.length} dòng · ${cues.some(c=>c.estimated)?'Có mốc kết thúc ước lượng':'Mốc từ tệp phụ đề'} · Bấm mốc giờ để nghe`:'Phụ đề của bạn, nhịp học của bạn.';
 $('#transcriptInfo').title=coverage;
 renderRecent();
}
function useVideo(v){captureVideoProgress(true);if(pendingLessonJump?.videoId!==v.id)pendingLessonJump=null;$('#selectionBubble').hidden=true;video=v;v.updated=Date.now();state.current=v.id;activeIndex=-1;range=null;pendingSeek=null;closed=false;manualScroll=false;transcriptLimit=150;$('#returnActive').hidden=true;renderMeta();renderTranscript();analyze();persist();loadPlayer();updateCurrent(-1);}
function ensureLesson(){if(video)return video;const v={id:'manual-'+Date.now(),title:'Bài học phụ đề',url:'',cues:[],labels:{},format:'',partial:false,updated:Date.now()};state.videos.push(v);useVideo(v);return v;}
$('#recentSelect').onchange=e=>{const v=state.videos.find(v=>v.id===e.target.value);if(v)useVideo(v);};
// Select the complete address for quick replacement with a new video.
['focus','click'].forEach(event=>$('#videoUrl').addEventListener(event,e=>e.currentTarget.select()));
$('#videoForm').onsubmit=e=>{e.preventDefault();try{const parsed=TB.videoURL($('#videoUrl').value);let v=state.videos.find(v=>v.id===parsed.id);if(!v){v={id:parsed.id,url:parsed.url,title:'YouTube · '+parsed.id,cues:[],labels:{},format:'',partial:false,updated:Date.now()};state.videos.push(v);}useVideo(v);toast('Đã mở bài học. Nhập phụ đề để đồng bộ nội dung.');}catch(e){toast(e.message);}};
function demo(){let v=state.videos.find(v=>v.id==='demo');if(!v){v={id:'demo',title:'Small steps, real progress · Bài mẫu',url:'',format:'Nội dung tự biên soạn',partial:true,labels:{},updated:Date.now(),cues:DEMO.map((text,i)=>({id:'demo'+i,start:i*6,end:i*6+5.8,text,estimated:false}))};state.videos.push(v);}useVideo(v);showTab('transcript');$('#videoEmpty').innerHTML='<span class="play-circle">✦</span><h2>Bài mẫu để khám phá công cụ</h2><p>24 câu tự biên soạn, không phải phụ đề của một video. Mốc giờ minh họa; không có âm thanh.</p><button id="demoGrammar" class="quiet">Khám phá các thì →</button>';$('#demoGrammar').onclick=()=>showTab('grammar');toast('Đây là bài mẫu tự biên soạn, không có video/âm thanh.');}
$('#demoBtn').onclick=demo;$('#emptyDemo').onclick=demo;
let ytPromise;
function youtubeAPI(){if(window.YT?.Player)return Promise.resolve();if(ytPromise)return ytPromise;ytPromise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ytPromise=null;reject(Error('Chưa kết nối được trình phát YouTube. Bạn vẫn có thể đọc và phân tích phụ đề.'));},18000);window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve();};const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{clearTimeout(timer);ytPromise=null;reject(Error('Không tải được YouTube. Kiểm tra kết nối rồi mở lại video.'));};document.head.append(s);});return ytPromise;}
function defaultEmpty(){return'<span class="play-circle">▶</span><h2>Bắt đầu từ một video bạn thích</h2><p>Dán link YouTube vào ô nhập, sau đó thêm phụ đề để học cùng video.</p><button id="demoBtn" class="quiet">Khám phá bằng bài mẫu →</button>';}
async function loadPlayer(){const id=video?.url?TB.videoURL(video.url).id:'';if(!id){player?.destroy?.();player=null;playerReady=false;playerId='';$('#playerMount')?.remove();const mount=document.createElement('div');mount.id='playerMount';$('.video-shell').prepend(mount);$('#videoEmpty').hidden=false;$('#videoEmpty').innerHTML=defaultEmpty();$('#demoBtn').onclick=demo;return;}$('#videoEmpty').hidden=true;if(playerReady&&playerId===id){if(pendingLessonJump?.videoId===video.id)resumePlayer(video);return;}if(playerReady){playerId=id;const startSeconds=lessonPlaybackStart(video);pendingSeek={index:TB.active(video.cues,startSeconds),time:startSeconds,until:Date.now()+2500};player.loadVideoById({videoId:id,startSeconds});if(pendingLessonJump?.videoId===video.id)pendingLessonJump=null;return;}if(playerLoading)return;playerLoading=true;try{await youtubeAPI();if(!video?.url)return;const currentId=TB.videoURL(video.url).id;playerId=currentId;player=new YT.Player('playerMount',{videoId:currentId,playerVars:{playsinline:1,rel:0,origin:location.origin},events:{onReady:()=>{playerReady=true;playerLoading=false;try{player.setPlaybackRate(Number($('#speed').value));}catch{}if(video?.id===playerId)resumePlayer(video);else loadPlayer();},onStateChange:e=>{if(e.data===1)closed=false;if(e.data===2||e.data===0)captureVideoProgress(true);try{const title=player.getVideoData()?.title;if(title&&video?.id===playerId){video.title=title.slice(0,300);renderMeta();persist();}}catch{}},onError:e=>{playerLoading=false;toast(({101:'Chủ video không cho phát nhúng. Mở video khác hoặc học bằng phụ đề.',150:'Chủ video không cho phát nhúng. Hãy chọn video khác.',100:'Video không tồn tại hoặc không khả dụng.',153:'YouTube không xác thực được trình phát ở môi trường này. Thử mở trang trực tiếp.'})[e.data]||'YouTube chưa phát được video. Bạn vẫn có thể học phần phụ đề.');}}});}catch(e){toast(e.message);$('#videoEmpty').hidden=false;$('#videoEmpty').innerHTML='<h2>Chưa tải được video</h2><p>'+esc(e.message)+'</p><button id="retryPlayer">Thử lại trình phát</button>';$('#retryPlayer').onclick=loadPlayer;}finally{playerLoading=false;}}
function seek(c,play=true){if(!c)return;range=mode==='loop'?TB.loopRange(c,video.cues):{start:c.start,end:c.end};closed=false;const i=video.cues.findIndex(x=>x.id===c.id);if(i>=0)updateCurrent(i);renderReadingContext(i,c.start);if(playerReady){pendingSeek={index:i,time:c.start,until:Date.now()+2500};player.seekTo(c.start,true);if(play)player.playVideo();}else toast(video?.id==='demo'?'Bài mẫu không có âm thanh. Hãy mở video và nhập phụ đề thật.':'Chưa có trình phát sẵn sàng. Bạn có thể đọc và phân tích câu.');}
function focusRows(cues,index){
 return [-1,0,1].map(offset=>({cue:index<0?(offset===1?cues[0]:null):cues[index+offset]||null,offset}));
}
function cueMarkup(c,extra=''){
 return '<article class="cue '+extra+'" data-cue="'+esc(c.id)+'"><div class="cue-time"><button class="seek" data-seek="'+esc(c.id)+'" aria-label="Phát từ '+TB.stamp(c.start)+'">'+TB.stamp(c.start)+'</button></div><p class="cue-text" data-text-cue="'+esc(c.id)+'">'+tokens(c.text)+'</p><button class="save" data-save="'+esc(c.id)+'" aria-pressed="'+isSaved(c)+'" aria-label="'+(isSaved(c)?'Bỏ lưu câu':'Lưu câu')+'">'+(isSaved(c)?'★':'☆')+'</button></article>';
}
function markTranscriptFocus(){
 const cues=video?.cues||[],focus=$('#transcriptFocus'),following=$('#follow').checked;
 focus.hidden=!following||!cues.length;
 if(!focus.hidden)focus.innerHTML=focusRows(cues,activeIndex).map(({cue,offset})=>cue?cueMarkup(cue,offset===0?'active':''): '<div class="cue focus-empty '+(offset===0?'active':'')+'"><p class="cue-text">'+(offset===0?'Chờ phụ đề đang phát…':offset<0?'Chưa có câu trước':'Đã hết phụ đề')+'</p></div>').join('');
 $$('#transcriptList .cue').forEach(el=>el.classList.toggle('active',!following&&el.dataset.cue===cues[activeIndex]?.id));
}
function alignTranscript(){
 const list=$('#transcriptList');
 if(!$('#follow').checked||manualScroll||tab!=='transcript'||!list.clientHeight)return;
 const index=Math.max(0,activeIndex+2),c=video?.cues[index];
 if(!c){list.scrollTop=list.scrollHeight;return;}
 const el=list.querySelector('[data-cue="'+CSS.escape(c.id)+'"]');
 if(!el){transcriptLimit=Math.ceil((index+1)/150)*150;renderTranscript();return;}
 const top=el.getBoundingClientRect().top-list.getBoundingClientRect().top-list.clientTop+list.scrollTop;
 programmaticScroll=true;list.scrollTop=Math.max(0,top);
 setTimeout(()=>programmaticScroll=false,100);
}
function updateCurrent(i,time){
 if(activeIndex===i)return;activeIndex=i;renderReadingContext(i,time);
 markTranscriptFocus();alignTranscript();updateSaved();
}
function tick(){
 try{
  if(!playerReady||!video)return;
  const t=player.getCurrentTime();
  if(pendingSeek){const arrived=Math.abs(t-pendingSeek.time)<.45||TB.active(video.cues,t)===pendingSeek.index;if(!arrived&&Date.now()<pendingSeek.until)return;pendingSeek=null;}
  captureVideoProgress();
  $('#clock').textContent=TB.stamp(t);
  const playerState=player.getPlayerState(),paused=playerState!==1&&!(playerState===0&&mode==='loop');
  const loopTime=playerState===0&&mode==='loop'&&range?Math.max(t,range.end):t;
  const action=TB.playbackAction({time:loopTime,paused,range,mode,closed});
  if(action?.type==='seek'){player.seekTo(action.time,true);if(playerState===0)player.playVideo();return;}
  const i=TB.active(video.cues,t);
  if(!closed)renderReadingContext(i,t);
  if(!closed&&i!==activeIndex){
   if(mode!=='off'&&i>=0&&(!range||t<range.start-.2||t>range.end+1.5)){const c=video.cues[i];range=TB.loopRange(c,video.cues);}
   updateCurrent(i,t);
  }
 }catch{}finally{tickId=setTimeout(tick,100);}
}
function setPlaybackMode(next){
 if(next!=='loop')return;
 const chosen=mode===next?'off':next;
 let c=currentReadingCue();
 if(pendingSeek?.index>=0)c=video.cues[pendingSeek.index];else if(playerReady){const i=TB.active(video?.cues||[],player.getCurrentTime());if(i>=0)c=video.cues[i];}
 if(chosen!=='off'&&(!c||!Number.isFinite(c.start)||c.end<=c.start)){toast('Nhập phụ đề và chọn một câu trước nhé.');return;}
 mode=chosen;closed=false;range=mode!=='off'?TB.loopRange(c,video.cues):null;
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 if(mode!=='off')toast('Lặp câu: '+TB.stamp(range.start)+'–'+TB.stamp(range.end));
}
function seekReading(index){const cues=video?.cues||[];if(cues.length)seek(cues[Math.max(0,Math.min(index,cues.length-1))]);}
function moveCaption(delta){
 const cues=video?.cues||[];if(!cues.length)return;
 if(pendingSeek){seekReading(pendingSeek.index+delta);return;}
 if(playerReady){
  const t=player.getCurrentTime(),index=TB.active(cues,t);
  if(index>=0){seekReading(index+delta);return;}
  const next=cues.findIndex(c=>c.start>t);
  seekReading(delta>0?(next<0?cues.length-1:next):(next<0?cues.length-1:next-1));return;
 }
 seekReading(activeIndex<0?0:activeIndex+delta);
}
$('#prevBtn').onclick=()=>moveCaption(-1);$('#nextBtn').onclick=()=>moveCaption(1);$('#replayBtn').onclick=()=>seek(currentReadingCue());$('#speed').onchange=e=>{if(playerReady){const rates=player.getAvailablePlaybackRates();const n=Number(e.target.value);if(rates.includes(n))player.setPlaybackRate(n);else{toast('Video này chưa hỗ trợ tốc độ đã chọn.');e.target.value=String(player.getPlaybackRate());}}};
$$('[data-mode]').forEach(b=>b.onclick=()=>setPlaybackMode(b.dataset.mode));
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>requestAnimationFrame(fitCurrentReading)).observe($('#readingStack'));
$('#saveCurrent').onclick=()=>{const c=currentReadingCue();if(c)saveText(c.text,c.start,'sentence',true);else toast('Chọn một câu trước khi lưu.');};
function renderTranscript(){
 const cues=video?.cues||[];
 if(!cues.length){markTranscriptFocus();if(video)$('#transcriptList').innerHTML='<div class="empty"><span class="empty-icon">≡</span><h3>Video đã sẵn sàng. Thêm lời để học.</h3><p>Nhập phụ đề có mốc giờ để theo dõi câu, phân loại thì và lưu từ.</p><button class="primary" data-import>Nhập phụ đề</button></div>';return;}
 const rows=cues.slice(0,transcriptLimit);
 $('#transcriptList').innerHTML=rows.map(c=>cueMarkup(c)).join('')+(rows.length<cues.length?'<button data-more class="outline full">Xem thêm '+Math.min(150,cues.length-rows.length)+' dòng · '+rows.length+'/'+cues.length+'</button>':'');
 markTranscriptFocus();requestAnimationFrame(alignTranscript);
}
$('#transcriptList').addEventListener('wheel',()=>{if(!programmaticScroll){manualScroll=true;$('#returnActive').hidden=false;}},{passive:true});$('#transcriptList').addEventListener('touchmove',()=>{manualScroll=true;$('#returnActive').hidden=false;},{passive:true});$('#transcriptList').addEventListener('keydown',e=>{if(['PageDown','PageUp','ArrowDown','ArrowUp','End','Home'].includes(e.key)){manualScroll=true;$('#returnActive').hidden=false;}});
$('#returnActive').onclick=()=>{manualScroll=false;$('#returnActive').hidden=true;alignTranscript();};
$('#follow').onchange=()=>{markTranscriptFocus();if($('#follow').checked){manualScroll=false;$('#returnActive').hidden=true;requestAnimationFrame(alignTranscript);}};
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>requestAnimationFrame(alignTranscript)).observe($('#transcriptList'));
$('#panel-transcript').onclick=e=>{const cue=id=>video?.cues.find(c=>c.id===id);if(e.target.closest('[data-import]'))return openDialog('#importDialog');let b=e.target.closest('[data-seek]');if(b)return seek(cue(b.dataset.seek));b=e.target.closest('[data-save]');if(b){const c=cue(b.dataset.save);return saveText(c.text,c.start,'sentence',true);}b=e.target.closest('[data-more]');if(b){transcriptLimit+=150;return renderTranscript();}};
$('#importBtn').onclick=$('#emptyImport').onclick=()=>openDialog('#importDialog');
$('#subtitleFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2500000){$('#importError').textContent='Tệp quá lớn. Hãy dùng tệp dưới 2,5 MB.';return;}try{$('#subtitlePaste').value=await f.text();$('#fileLabel').textContent=f.name;$('#importError').textContent='';}catch{$('#importError').textContent='Không đọc được tệp.';}};
$('#importForm').onsubmit=e=>{e.preventDefault();try{const result=TB.parse($('#subtitlePaste').value);if(result.cues.some(c=>c.end>86400))throw Error('Phụ đề tối đa 24 giờ.');ensureLesson();video.cues=result.cues;video.format=result.format;video.partial=$('#partialCheck').checked;video.labels={};video.updated=Date.now();activeIndex=-1;range=null;pendingSeek=null;transcriptLimit=150;renderMeta();renderTranscript();analyze();persist();$('#importDialog').close();showTab('transcript');toast('Đã nhập '+result.cues.length+' dòng'+(result.ignored?'; bỏ qua '+result.ignored+' dòng thời gian lỗi.':'.'));}catch(e){$('#importError').textContent=e.message;}};
function analyze(){worker?.terminate();worker=null;job++;grammarRows=[];segments=TB.group(video?.cues||[]);readingGroups=TB.sentences(video?.cues||[]);readingIndex=-2;renderReadingContext(activeIndex);filter='all';grammarLimit=100;if(!segments.length){$('#grammarProgress').textContent='Nhập phụ đề để bắt đầu phân loại.';renderGrammar();return;}const thisJob=job;$('#grammarProgress').textContent='Đang đọc cấu trúc…';try{worker=new Worker('grammar-worker.js');worker.onmessage=e=>{if(e.data.job!==job)return;for(const result of e.data.results){const s=segments.find(x=>x.id===result.id);if(s)for(const entry of result.entries)grammarRows.push({s,entry,key:s.id+'/'+entry.id});}$('#grammarProgress').textContent=e.data.done?'Đã phân loại xong.':`Đang phân loại ${e.data.count}/${e.data.total} đoạn…`;if(tab==='grammar'||e.data.done)renderGrammar();};worker.onerror=()=>{if(thisJob!==job)return;$('#grammarProgress').textContent='Chưa tải được bộ phân tích. Tải lại trang để thử lại.';toast('Bộ phân loại chưa sẵn sàng. Bản chép lời vẫn hoạt động.');};worker.postMessage({job,rows:segments.map(s=>({id:s.id,text:s.text}))});}catch{$('#grammarProgress').textContent='Trình duyệt chưa hỗ trợ bộ phân tích nền. Thử Chrome phiên bản mới.';}renderGrammar();}
function typeOf(row){return video?.labels?.[row.key]||row.entry.type;}
function marked(text,forms){let out='',pos=0;for(const f of [...forms].sort((a,b)=>a.start-b.start)){if(f.start<pos)continue;out+=esc(text.slice(pos,f.start))+'<mark>'+esc(text.slice(f.start,f.end))+'</mark>';pos=f.end;}return out+esc(text.slice(pos));}
function groupGrammarRows(rows){
 const grouped=new Map();
 for(const r of rows){if(!grouped.has(r.s.id))grouped.set(r.s.id,{s:r.s,forms:[],matches:0});const g=grouped.get(r.s.id);g.forms.push(...r.entry.forms);g.matches++;}
 return [...grouped.values()].sort((a,b)=>a.s.start-b.s.start).map(g=>{
  const forms=[];for(const f of g.forms.sort((a,b)=>a.start-b.start||b.end-a.end)){const last=forms.at(-1);if(last&&f.start<=last.end)last.end=Math.max(last.end,f.end);else forms.push({...f});}
  return {...g,forms};
 });
}
function grammarMarkup(text,forms){
 const cuts=[0],count=s=>(s.match(/\S+/g)||[]).length;
 const boundaries=/[.!?]\s+(?=[A-Z])|,\s+(?=(?:I|you|we|they|he|she|it)\b)|\b(?:so that|because|although|even though|where|when|while|but)\b/gi;
 for(const m of text.matchAll(boundaries)){const at=/^[.!?,]/.test(m[0])?m.index+m[0].length:m.index;if(count(text.slice(cuts.at(-1),at))>=6&&count(text.slice(at))>=4)cuts.push(at);}
 cuts.push(text.length);
 return cuts.slice(0,-1).map((start,i)=>{const end=cuts[i+1],local=forms.filter(f=>f.end>start&&f.start<end).map(f=>({start:Math.max(start,f.start)-start,end:Math.min(end,f.end)-start}));return '<span class="grammar-phrase">'+marked(text.slice(start,end),local)+'</span>';}).join('');
}
function renderGrammar(){const counts={};for(const row of grammarRows){const t=typeOf(row);counts[t]=(counts[t]||0)+1;}$('#tenseFilters').innerHTML=[['all','Tất cả',grammarRows.length],...Object.entries(TYPES).filter(([t])=>counts[t]).map(([t,n])=>[t,n,counts[t]])].map(([t,n,c])=>'<button data-filter="'+t+'" class="'+(filter===t?'selected':'')+'" aria-pressed="'+(filter===t)+'">'+esc(n)+' <span>'+c+'</span></button>').join('');const rows=grammarRows.filter(r=>filter==='all'||typeOf(r)===filter);const groups=groupGrammarRows(rows);$('#grammarList').innerHTML=groups.slice(0,grammarLimit).map(r=>'<article class="grammar-card"><button class="time-btn" data-grammar-seek="'+esc(r.s.id)+'" aria-label="Nghe từ '+TB.stamp(r.s.start)+'">▶ '+TB.stamp(r.s.start)+'</button><p data-text-cue="'+esc(r.s.cueIds?.[0]||'')+'">'+grammarMarkup(r.s.text,r.forms)+'</p></article>').join('')+(groups.length>grammarLimit?'<button class="outline full" data-grammar-more>Xem thêm kết quả</button>':'')+(!rows.length?'<div class="empty"><h3>'+(segments.length?'Chưa có kết quả ở bộ lọc này':'Chờ những câu đầu tiên')+'</h3><p>'+(segments.length?'Đổi bộ lọc hoặc chờ phân loại hoàn tất.':'Nhập phụ đề hoặc thử bài mẫu để xem cấu trúc thì.')+'</p></div>':'');}
$('#tenseFilters').onclick=e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;grammarLimit=100;renderGrammar();}};
$('#grammarList').onclick=e=>{let b=e.target.closest('[data-grammar-seek]');if(b){const s=segments.find(x=>x.id===b.dataset.grammarSeek);return seek({...s,id:s.cueIds[0]});}if(e.target.closest('[data-grammar-more]')){grammarLimit+=100;renderGrammar();}};
function norm(t){return t.toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,;:]+$/g,'').replace(/\s+/g,' ').trim();}
const baseForms={got:'get',getting:'get',gets:'get',obtained:'get',learning:'learn',learned:'learn',learnt:'learn',understood:'understand',understands:'understand',understanding:'understand',started:'start',starting:'start',began:'start',finished:'finish',finishing:'finish',needed:'need',needs:'need',wanted:'want',wants:'want',thought:'i think',improved:'improve',improving:'improve',improves:'improve',chose:'choose',chosen:'choose',choosing:'choose',explained:'explain',explaining:'explain',helps:'help',helped:'help',helping:'help',studying:'learn',studied:'learn',living:'live',using:'use',used:'use',remembered:'remember',remembering:'remember',continued:'continue',continuing:'continue',stopped:'stop',stopping:'stop'};
function lookup(text){const term=norm(text);$('#lookupInput').value=text.slice(0,300);const all=[...state.words,...TBLexicon];const exact=all.filter(x=>norm(x.term)===term);const lemma=baseForms[term];const results=exact.length?exact:lemma?all.filter(x=>norm(x.term)===lemma):[];$('#wordResults').innerHTML=results.length?results.map(w=>'<article class="word-card"><div class="row" style="justify-content:space-between"><h3>'+esc(w.term)+'</h3><button data-save-word="'+esc(w.id)+'" aria-label="Lưu từ '+esc(w.term)+'">☆</button></div><p class="meaning">'+esc(w.meaning)+'</p><span class="badge">'+esc(w.source||'TuanBong tự biên soạn')+'</span>'+(lemma&&!exact.length?'<p class="subtle">Tra dạng gốc: '+esc(lemma)+'. Ví dụ bên dưới dùng cấu trúc riêng; cần đổi dạng động từ khi áp dụng.</p>':'')+w.options.map(o=>'<div class="word-option"><strong>'+esc(o.text)+'</strong><p>'+esc(o.note)+'</p><blockquote>'+esc(o.example)+'</blockquote></div>').join('')+'</article>').join(''):'<div class="empty"><span class="empty-icon">↔</span><h3>'+(term?'Chưa có gợi ý cho “'+esc(text.slice(0,70))+'”':'Bắt đầu bằng một cụm quen thuộc')+'</h3><p>'+(term?'Kho hiện tại chỉ nhận các từ và mẫu đã biên soạn, chưa viết lại câu bất kỳ. Thử chọn cụm ngắn hơn hoặc tự thêm một mục.':'Thử “I think”, “a lot of”, “keep going”, “understand” hoặc “thank you”.')+'</p></div>';showTab('words');}
$('#lookupForm').onsubmit=e=>{e.preventDefault();lookup($('#lookupInput').value);};$('#wordResults').onclick=e=>{const b=e.target.closest('[data-save-word]');if(b){const w=[...state.words,...TBLexicon].find(x=>x.id===b.dataset.saveWord);if(w){ensureLesson();saveText(w.term+' — '+w.meaning,video.cues[activeIndex]?.start||0,'phrase');}}};
function selectionContext(node){const el=node?.nodeType===1?node:node?.parentElement;return el?.closest('.cue-text,.reading-text,.grammar-card p,.library-item .quote');}
function googleTranslateURL(text){
 const url=new URL('https://translate.google.com/');url.searchParams.set('sl','en');url.searchParams.set('tl','vi');url.searchParams.set('text',text);url.searchParams.set('op','translate');return url.href;
}
function researchQuery(text,topic){
 const suffix={usage:'cách dùng',synonyms:'đồng nghĩa',antonyms:'trái nghĩa',alternatives:'cách nói khác'};
 return String(text||'').trim().replace(/\s+/g,' ')+' '+(suffix[topic]||suffix.usage);
}
function googleResearchURL(query){const url=new URL('https://www.google.com/search');url.searchParams.set('q',query);url.searchParams.set('hl','vi');return url.href;}
function showSelectionTools(){
 const selection=window.getSelection(),txt=selection?.toString().trim(),context=selectionContext(selection?.anchorNode),bubble=$('#selectionBubble');
 if(!txt||!context||selectionContext(selection.focusNode)!==context||txt.length>5000||!selection.rangeCount){bubble.hidden=true;return;}
 const saved=context.dataset.savedId?state.saved.find(s=>s.id===context.dataset.savedId):null;
 selectedText=txt;selectedCue=saved?{start:saved.start}:video?.cues.find(c=>c.id===context.dataset.textCue)||video?.cues[activeIndex];
 $('#selectionSave').hidden=!!saved;
 const host=context.closest?.('dialog')||document.body;if(bubble.parentElement!==host)host.append(bubble);
 $('#selectionTranslate').href=googleTranslateURL(txt);
 const r=selection.getRangeAt(0).getBoundingClientRect();bubble.hidden=false;
 const width=bubble.offsetWidth,height=bubble.offsetHeight;
 bubble.style.left=Math.max(8,Math.min(r.left,innerWidth-width-8))+'px';
 bubble.style.top=Math.max(8,Math.min(r.top-height-8>=8?r.top-height-8:r.bottom+8,innerHeight-height-8))+'px';
}
let selectionTimer;
document.addEventListener('selectionchange',()=>{clearTimeout(selectionTimer);selectionTimer=setTimeout(showSelectionTools,80);});
document.addEventListener('mouseup',e=>{if(!e.target.closest('#selectionBubble'))showSelectionTools();});
$('#selectionTranslate').onmousedown=e=>e.preventDefault();
$('#selectionSave').onmousedown=e=>e.preventDefault();$('#selectionSave').onclick=()=>{saveText(selectedText,selectedCue?.start||0,'phrase');$('#selectionBubble').hidden=true;window.getSelection()?.removeAllRanges();};
let researchText='';
function setResearchTopic(topic){
 $$('[data-research-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.researchTopic===topic)));
 $('#researchPrompt').value=researchQuery(researchText,topic);$('#researchGoogle').href=googleResearchURL($('#researchPrompt').value);
}
$('#selectionResearch').onmousedown=e=>e.preventDefault();
function openResearch(text){if(!text?.trim())return;researchText=text;$('#researchTerm').textContent=text;setResearchTopic('usage');openDialog('#researchDialog');}
$('#selectionResearch').onclick=()=>openResearch(selectedText);
$$('[data-research-topic]').forEach(b=>b.onclick=()=>setResearchTopic(b.dataset.researchTopic));
$('#researchPrompt').oninput=()=>{$('#researchGoogle').href=googleResearchURL($('#researchPrompt').value);};
$('#researchCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#researchPrompt').value);toast('Đã sao chép câu hỏi. Bạn có thể dán vào AI Mode.');}catch{$('#researchPrompt').focus();$('#researchPrompt').select();toast('Đã chọn câu hỏi. Bấm Ctrl+C hoặc ⌘C để sao chép.');}};
function editWord(w){$('#editWordId').value=w?.id||'';$('#editTerm').value=w?.term||$('#lookupInput').value;$('#editMeaning').value=w?.meaning||'';$('#editAlternative').value=w?.options[0]?.text||'';$('#editNuance').value=w?.options[0]?.note||'';$('#editExample').value=w?.options[0]?.example||'';openDialog('#wordDialog');}
$('#addWordBtn').onclick=()=>editWord();$('#wordEditForm').onsubmit=e=>{e.preventDefault();try{const w=TBData.word({id:$('#editWordId').value||'u'+Date.now().toString(36),term:$('#editTerm').value.trim(),meaning:$('#editMeaning').value.trim(),options:[{text:$('#editAlternative').value.trim(),note:$('#editNuance').value.trim(),example:$('#editExample').value.trim()}]});const index=state.words.findIndex(x=>x.id===w.id);if(index>=0)state.words[index]=w;else state.words.push(w);persist();$('#wordDialog').close();renderCustomWords();lookup(w.term);toast('Đã lưu cách nói của bạn.');}catch(e){toast(e.message);}};
function renderCustomWords(){$('#customWordList').innerHTML=state.words.length?state.words.map(w=>'<div><span>'+esc(w.term)+'</span><span><button data-edit-word="'+esc(w.id)+'">Sửa</button> <button data-delete-word="'+esc(w.id)+'">Xóa</button></span></div>').join(''):'<p class="subtle">Bạn chưa thêm mục riêng.</p>';}
$('#customWordList').onclick=e=>{const b=e.target.closest('[data-edit-word],[data-delete-word]');if(!b)return;if(b.dataset.editWord){$('#settingsDialog').close();editWord(state.words.find(w=>w.id===b.dataset.editWord));}else{const w=state.words.find(w=>w.id===b.dataset.deleteWord);state.words=state.words.filter(x=>x!==w);renderCustomWords();persist();toast('Đã xóa mục riêng “'+w.term+'”. Bản sao lưu cũ vẫn giữ mục nếu bạn đã xuất.');}};
$('#settingsBtn').onclick=()=>{renderCustomWords();openDialog('#settingsDialog');};$('#fontSize').onchange=e=>{state.settings.font=Number(e.target.value);document.documentElement.style.setProperty('--reading',state.settings.font+'px');persist();};
$('#exportBtn').onclick=()=>download('TuanBong-backup-'+new Date().toISOString().slice(0,10)+'.json',state);$('#exportWords').onclick=()=>download('TuanBong-kho-cach-noi.json',{version:1,words:state.words});
$('#backupFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>20000000)throw Error('Tệp sao lưu tối đa 20 MB.');const incoming=TBData.validate(JSON.parse(await f.text())),merged=TBData.merge(state,incoming);clearTimeout(saveTimer);await TBStore.set(merged);state=merged;const v=state.videos.find(v=>v.id===state.current)||state.videos[0];if(v)useVideo(v);updateSaved();renderCustomWords();renderRecent();toast('Đã kiểm tra và gộp bản sao lưu an toàn.');}catch(err){toast('Không nhập tệp: '+err.message);}finally{e.target.value='';}};
$('#wordsFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3000000)throw Error('Kho nhập tối đa 3 MB.');const data=JSON.parse(await f.text());if(data.version!==1||!Array.isArray(data.words)||data.words.length>10000)throw Error('Cần tệp kho cách nói TuanBong v1.');const words=data.words.map(TBData.word);const combined=[...new Map([...state.words,...words].map(w=>[w.id,w])).values()];const next={...state,words:combined};TBData.validate(next);clearTimeout(saveTimer);await TBStore.set(next);state=next;renderCustomWords();toast('Đã nhập '+words.length+' cách nói riêng.');}catch(err){toast('Không nhập kho: '+err.message);}finally{e.target.value='';}};
let libraryLimit=300;
function renderLibrary(){
 const rows=state.saved;$('#libraryTotal').textContent='· '+rows.length;
 $('#libraryList').innerHTML=rows.slice(0,libraryLimit).map(s=>'<article class="library-item" data-saved="'+esc(s.id)+'"><p class="quote" data-saved-id="'+esc(s.id)+'">'+esc(s.text)+'</p><div class="library-meta"><span class="library-video-title">'+esc(s.title)+'</span><span class="library-time">'+TB.stamp(s.start)+'</span></div><div class="library-actions"><button data-open-saved="'+esc(s.id)+'" class="outline">▶ Về bài học</button><button data-research-saved="'+esc(s.id)+'" class="outline">Tìm hiểu ↗</button><button data-remove-saved="'+esc(s.id)+'" class="text-button">Bỏ lưu</button></div></article>').join('')+(!rows.length?'<div class="empty"><h3>Những câu đáng nhớ sẽ ở đây</h3><p>Bấm ☆ bên cạnh câu, hoặc kéo chọn một cụm để lưu.</p></div>':'')+(rows.length>libraryLimit?'<button class="outline full" data-more-saved>Xem thêm câu đã lưu</button>':'');
}
function openSavedLesson(id){
 const saved=state.saved.find(s=>s.id===id);if(!saved)return;
 let v=state.videos.find(v=>v.id===saved.videoId);
 if(!v&&saved.url){const parsed=TB.videoURL(saved.url);v=state.videos.find(v=>v.id===parsed.id||v.url===parsed.url);if(!v){v={id:parsed.id,url:parsed.url,title:saved.title,cues:[],labels:{},format:'',partial:false,updated:Date.now()};state.videos.push(v);}}
 if(!v){toast('Bài học này chưa có video gốc để mở lại. Nội dung đã lưu vẫn được giữ.');return;}
 captureVideoProgress(true);mode='off';closed=false;range=null;
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed','false'));
 pendingLessonJump={videoId:v.id,time:saved.start};
 $('#libraryDialog').close();manualScroll=false;$('#returnActive').hidden=true;
 if(video?.id!==v.id)useVideo(v);else loadPlayer();
 showTab('transcript');const index=TB.active(v.cues,saved.start);updateCurrent(index,saved.start);
 if(!v.url){pendingLessonJump=null;toast('Đã mở nội dung gốc. Bài này chưa có video để phát.');}
 else if(!v.cues.length)toast('Đã mở video tại mốc đã lưu. Nhập lại phụ đề nếu bạn muốn theo dõi lời.');
}
$('#libraryBtn').onclick=()=>{libraryLimit=300;renderLibrary();openDialog('#libraryDialog');};
$('#libraryDialog').addEventListener('close',()=>{const bubble=$('#selectionBubble');bubble.hidden=true;document.body.append(bubble);});
$('#libraryList').onclick=e=>{
 let b=e.target.closest('[data-remove-saved]');if(b){state.saved=state.saved.filter(x=>x.id!==b.dataset.removeSaved);persist();renderLibrary();updateSaved();return;}
 b=e.target.closest('[data-open-saved]');if(b)return openSavedLesson(b.dataset.openSaved);
 b=e.target.closest('[data-research-saved]');if(b){const s=state.saved.find(x=>x.id===b.dataset.researchSaved);if(s)openResearch(s.text);return;}
 if(e.target.closest('[data-more-saved]')){libraryLimit+=300;renderLibrary();}
};
let incomingTransfer=null,transferBusy=false;
function finishExtensionTransfer(){
 if(!incomingTransfer)return;
 window.postMessage({source:'tuanbong-app',type:'finished',transferId:incomingTransfer.transferId},location.origin);
 incomingTransfer=null;const url=new URL(location.href);url.searchParams.delete('transfer');history.replaceState(null,'',url.href);
}
window.addEventListener('message',e=>{
 if(e.source!==window||e.origin!==location.origin||e.data?.source!=='tuanbong-extension'||!dataReady)return;
 const expected=new URL(location.href).searchParams.get('transfer');if(!expected)return;
 if(incomingTransfer){window.postMessage({source:'tuanbong-app',type:'received',transferId:incomingTransfer.transferId},location.origin);return;}
 try{
  incomingTransfer=TBTransfer.decode(e.data.payload,expected);
  const old=state.videos.find(v=>v.id===incomingTransfer.id),cues=incomingTransfer.cues;
  $('#extensionVideoTitle').textContent=incomingTransfer.title;
  $('#extensionImportInfo').textContent=cues.length+' dòng · '+TB.stamp(cues[0].start)+'–'+TB.stamp(cues.at(-1).end)+' · Tiếng trong bản chép lời bạn đã chọn trên YouTube';
  $('#extensionReplaceInfo').textContent=old?.cues.length?'Video này đã có phụ đề. Bấm Nhập sẽ thay phụ đề của bài này; các câu đã lưu vẫn được giữ.':'Link và phụ đề sẽ được lưu cùng bài học trên trình duyệt này.';
  $('#extensionPartial').checked=true;$('#extensionImportError').textContent='';openDialog('#extensionImportDialog');
  window.postMessage({source:'tuanbong-app',type:'received',transferId:incomingTransfer.transferId},location.origin);
 }catch(err){toast(err.message);}
});
$('#extensionImportDialog').addEventListener('cancel',e=>{if(transferBusy)e.preventDefault();});
$('#extensionImportDialog').addEventListener('close',()=>{if(!transferBusy)finishExtensionTransfer();});
$('#extensionImportForm').onsubmit=async e=>{
 e.preventDefault();if(!incomingTransfer||transferBusy)return;
 transferBusy=true;$('#extensionImportSubmit').disabled=true;
 try{
  captureVideoProgress(true);clearTimeout(saveTimer);
  const p=incomingTransfer,old=state.videos.find(v=>v.id===p.id),lesson={...old,id:p.id,url:p.url,title:p.title,cues:p.cues,labels:{},format:'YouTube · tiện ích (mốc kết thúc ước lượng)',partial:$('#extensionPartial').checked,updated:Date.now()};
  const next=TBData.validate({...state,videos:[...state.videos.filter(v=>v.id!==p.id),lesson],current:p.id});
  await TBStore.set(next);state=next;useVideo(state.videos.find(v=>v.id===p.id));showTab('transcript');finishExtensionTransfer();$('#extensionImportDialog').close();toast('Đã nhập '+p.cues.length+' dòng từ YouTube.');
 }catch(err){$('#extensionImportError').textContent=err.message;}
 finally{transferBusy=false;$('#extensionImportSubmit').disabled=false;}
};
async function init(){try{const data=await TBStore.get();if(data)state=TBData.validate(data);}catch(e){toast(e.message+' Bạn có thể dùng tạm và xuất bản sao lưu.');}dataReady=true;document.documentElement.style.setProperty('--reading',state.settings.font+'px');$('#fontSize').value=state.settings.font;const v=state.videos.find(v=>v.id===state.current)||state.videos[0];if(v)useVideo(v);else{renderRecent();renderGrammar();}updateSaved();lookup('');showTab('transcript');tick();}
init();
