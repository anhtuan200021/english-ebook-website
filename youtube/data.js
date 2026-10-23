(function(root){
 const str=(v,n=20000)=>typeof v==='string'&&v.length<=n;
 function word(w){if(!w||!str(w.id,100)||!str(w.term,200)||!w.term.trim()||!str(w.meaning,500)||!Array.isArray(w.options)||!w.options.length||w.options.length>10||w.options.some(o=>!str(o.text,300)||!str(o.note,500)||!str(o.example,600)))throw Error('Mục cách nói không hợp lệ.');return{id:w.id,term:w.term,meaning:w.meaning,source:'Bạn tự biên soạn',options:w.options.map(o=>({text:o.text,note:o.note,example:o.example}))};}
 function validate(s){if(!s||s.version!==1||!Array.isArray(s.videos)||s.videos.length>300||!Array.isArray(s.saved)||s.saved.length>20000||!Array.isArray(s.words)||s.words.length>10000)throw Error('Tệp không đúng định dạng bản sao lưu TuanBong v1.');
 const videos=s.videos.map(v=>{root.TB.validVideo(v);if(!str(v.title,300)||v.cues.some(c=>c.end>86400))throw Error('Bài học quá dài hoặc tiêu đề không hợp lệ.');const labels={};if(v.labels){if(typeof v.labels!=='object'||Object.keys(v.labels).length>50000)throw Error('Nhãn sửa không hợp lệ.');for(const [key,value]of Object.entries(v.labels)){if(!/^[a-z0-9]+\/g\d+$/.test(key)||!str(value,60)||!['present_simple','present_continuous','present_perfect','present_perfect_continuous','past_simple','past_continuous','past_perfect','past_perfect_continuous','future_will','future_going_to','future_continuous','future_perfect','future_perfect_continuous','modal','imperative','other','uncertain'].includes(value))throw Error('Nhãn thì trong bản sao không hợp lệ.');labels[key]=value;}}
 return{id:v.id,title:v.title,url:v.url||'',favorite:v.favorite===true,lastPosition:Number.isFinite(v.lastPosition)&&v.lastPosition>=0&&v.lastPosition<=86400?v.lastPosition:0,cues:v.cues.map(c=>({id:c.id,start:c.start,end:c.end,text:c.text,estimated:!!c.estimated})).sort((a,b)=>a.start-b.start),format:str(v.format,100)?v.format:'Nhập từ bản sao',partial:!!v.partial,labels,updated:Number(v.updated)||Date.now()};});
 const saved=s.saved.map(x=>{if(!x||!str(x.id,100)||!str(x.text)||!str(x.videoId,100)||!str(x.title,300)||!str(x.note||'',10000)||!Number.isFinite(x.start)||x.start<0)throw Error('Câu đã lưu không hợp lệ.');if(x.url)root.TB.videoURL(x.url);return{id:x.id,text:x.text,videoId:x.videoId,title:x.title,url:x.url||'',start:x.start,note:x.note||'',kind:x.kind==='phrase'?'phrase':'sentence'};});
 const unique=a=>{if(new Set(a.map(x=>x.id)).size!==a.length)throw Error('Tệp có ID bị trùng.');return a;};
 return{version:1,videos:unique(videos),saved:unique(saved),words:unique(s.words.map(word)),current:str(s.current,100)?s.current:'',settings:{font:[16,18,21].includes(s.settings?.font)?s.settings.font:18}};
 }
 function merge(a,b){const combine=(x,y)=>[...new Map([...x,...y].map(v=>[v.id,v])).values()];return validate({...a,videos:combine(a.videos,b.videos),saved:combine(a.saved,b.saved),words:combine(a.words,b.words)});}
 function readLesson(file){
  if(!file||file.type!=='tuanbong-lesson'||file.version!==1||!file.video||!Array.isArray(file.saved))throw Error('Hãy chọn tệp bài học TuanBong đã xuất bằng nút “Xuất bài học này”.');
  const v=file.video,link=root.TB.videoURL(v.url||'');
  if(v.id!==link.id||!Array.isArray(v.cues)||!v.cues.length)throw Error('Bài học cần đúng link YouTube và có phụ đề.');
  const incoming=validate({version:1,videos:[{...v,url:link.url}],saved:file.saved,words:[],current:v.id,settings:{font:18}});
  if(incoming.saved.some(s=>s.videoId!==v.id||(s.url&&root.TB.videoURL(s.url).id!==v.id)))throw Error('Tệp chứa câu đã lưu của video khác.');
  return incoming;
 }
 function lessonFile(video,saved){
  const checked=readLesson({type:'tuanbong-lesson',version:1,video,saved:saved.filter(s=>s.videoId===video.id)});
  return {type:'tuanbong-lesson',version:1,video:checked.videos[0],saved:checked.saved};
 }
 function mergeLesson(state,file){
  const incoming=readLesson(file),v=incoming.videos[0],existing=state.videos.find(x=>x.id===v.id);
  if(incoming.saved.some(s=>state.saved.some(old=>old.id===s.id&&old.videoId!==v.id)))throw Error('ID câu đã lưu trùng với bài khác. Chưa nhập tệp để bảo vệ kho hiện tại.');
  v.favorite=v.favorite||existing?.favorite===true;
  return validate({...state,videos:[...state.videos.filter(x=>x.id!==v.id),v],saved:[...new Map([...state.saved,...incoming.saved].map(s=>[s.id,s])).values()],current:v.id});
 }
 const api={validate,word,merge,readLesson,lessonFile,mergeLesson};if(typeof module!=='undefined')module.exports=api;else root.TBData=api;
})(globalThis);
