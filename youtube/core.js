(function(root){
  const time=s=>{const t=String(s).trim().replace(',','.');if(!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(t))return NaN;const a=t.split(':').map(Number);if(a.slice(1).some(x=>x>=60))return NaN;return a.reduce((n,x)=>n*60+x,0);};
  const stamp=n=>{n=Math.max(0,Math.floor(Number(n)||0));return(n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(n>=3600?2:1,'0')+':'+String(n%60).padStart(2,'0');};
  const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
  function videoURL(s){let u;try{u=new URL(s.trim());}catch{throw Error('Dán đường dẫn video YouTube hợp lệ.');}let id;if(!['https:','http:'].includes(u.protocol))throw Error('Đường dẫn không hợp lệ.');if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:null;if(!/^[\w-]{11}$/.test(id||''))throw Error('Chưa tìm thấy mã video trong đường dẫn này.');return{url:'https://www.youtube.com/watch?v='+id,id};}
  const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[x]).replace(/\s+/g,' ').trim();
  function parse(raw){
    if(typeof raw!=='string'||raw.length>1500000)throw Error('Nội dung tối đa 1,5 triệu ký tự.');
    const lines=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');const rows=[];const format=raw.includes('-->')?(raw.trim().startsWith('WEBVTT')?'VTT':'SRT'):'Bản chép lời dán';let ignored=0;
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      if(/^NOTE\b|^STYLE\b|^REGION\b/.test(line)){while(i+1<lines.length&&lines[i+1].trim())i++;continue;}
      const arrow=line.match(/^(\d+(?::\d{2}){1,2}(?:[.,]\d+)?)\s*-->\s*(\d+(?::\d{2}){1,2}(?:[.,]\d+)?)/);
      if(arrow){const start=time(arrow[1]),end=time(arrow[2]);let parts=[];while(i+1<lines.length&&lines[i+1].trim())parts.push(lines[++i]);const text=clean(parts.join(' '));if(text&&Number.isFinite(start)&&Number.isFinite(end)&&end>start)rows.push({start,end,text,estimated:false});else ignored++;continue;}
      const t=line.match(/^(\d+(?::\d{2}){1,2})(?:\s+(.+))?$/);
      if(t){const start=time(t[1]);let parts=t[2]?[t[2]]:[];while(i+1<lines.length&&!/^\d+(?::\d{2}){1,2}(?:\s|$)/.test(lines[i+1].trim())){const next=lines[++i].trim();if(next)parts.push(next);}const text=clean(parts.join(' '));if(text&&Number.isFinite(start))rows.push({start,text,estimated:true});else ignored++;}
    }
    if(!rows.length)throw Error('Chưa tìm thấy phụ đề có mốc giờ. Dán dạng “0:02 Nội dung câu”, hoặc nhập SRT/VTT.');
    if(rows.length>12000)throw Error('Tối đa 12.000 dòng mỗi lần nhập. Chia nhỏ tệp rồi thử lại.');
    rows.sort((a,b)=>a.start-b.start);const seen=new Set();const cues=rows.filter(r=>{const k=r.start+'|'+r.text;if(seen.has(k))return false;seen.add(k);return true;});
    let nextStart=null;for(let i=cues.length-1;i>=0;i--){const r=cues[i];if(i<cues.length-1&&cues[i+1].start>r.start)nextStart=cues[i+1].start;if(!Number.isFinite(r.end))r.end=nextStart??r.start+5;r.id='c'+hash(JSON.stringify([r.start,r.end,r.text]));}
    return{cues,format,ignored};
  }
  function active(cues,n){let lo=0,hi=cues.length-1,b=-1;while(lo<=hi){const m=(lo+hi)>>1;if(cues[m].start<=n){b=m;lo=m+1;}else hi=m-1;}return b>=0&&n<cues[b].end?b:-1;}
  function group(cues){const out=[];let pending=null;for(const cue of cues){if(pending&&(cue.start-pending.start>24||cue.start-pending.end>2.5||pending.text.split(/\s+/).length>55)){out.push(pending);pending=null;}if(!pending)pending={id:'s'+cue.id,start:cue.start,end:cue.end,text:cue.text,cueIds:[cue.id],estimated:cue.estimated};else{pending.end=Math.max(pending.end,cue.end);pending.text+=' '+cue.text;pending.cueIds.push(cue.id);pending.estimated ||= cue.estimated;}if(/[.!?]["'”’)]?$/.test(cue.text)&&!/(?:\bMr|\bMrs|\bDr)\.$/.test(cue.text)){out.push(pending);pending=null;}}if(pending)out.push(pending);return out;}
  function sentences(cues){
    const fragments=[],source=new Map();
    for(const c of cues){
      const cuts=[0];for(const m of c.text.matchAll(/[.!?]["'”’)]*\s+(?=[A-Z"“])/g)){const end=m.index+m[0].trimEnd().length;if(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|etc)\.$/i.test(c.text.slice(0,end)))continue;cuts.push(m.index+m[0].length);}cuts.push(c.text.length);
      for(let i=0;i<cuts.length-1;i++){const text=c.text.slice(cuts[i],cuts[i+1]).trim();if(!text)continue;const id=c.id+'p'+i,n=Math.max(c.text.length,1);fragments.push({id,text,start:c.start+(c.end-c.start)*cuts[i]/n,end:c.start+(c.end-c.start)*cuts[i+1]/n,estimated:c.estimated||cuts.length>2});source.set(id,c.id);}
    }
    return group(fragments).map(g=>({...g,id:'r'+hash(g.cueIds.join('|')),sourceCueIds:[...new Set(g.cueIds.map(id=>source.get(id)))],complete:/[.!?]["'”’)]?$/.test(g.text)}));
  }
  // Analysis can read across quoted sentences without changing the playback text,
  // cue IDs or timing. Bound joins so a missing closing quote cannot swallow a lesson.
  function analysisUnits(cues){
    const groups=sentences(cues),out=[];let pending=null,open=false;
    const toggle=text=>{for(const c of text)if(c==='"'||c==='“'||c==='”')open=!open;};
    const push=()=>{if(pending){out.push(pending);pending=null;}open=false;};
    for(const g of groups){
      if(pending&&open&&g.start-pending.end<=3&&g.end-pending.start<=45&&(pending.text.match(/\S+/g)||[]).length<120){
        pending.text+=' '+g.text;pending.end=g.end;pending.estimated ||= g.estimated;pending.complete=g.complete;
        pending.sourceCueIds=[...new Set([...pending.sourceCueIds,...g.sourceCueIds])];pending.cueIds.push(...g.cueIds);pending.id='a'+hash(pending.cueIds.join('|'));toggle(g.text);
      }else{push();pending={...g,cueIds:[...g.cueIds],sourceCueIds:[...g.sourceCueIds]};toggle(g.text);}
      if(!open)push();
    }
    push();return out;
  }
  function phraseChunks(text){
    text=String(text||'');const cuts=[0],words=s=>(s.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[]).length;
    const boundaries=/[,;:]\s+|\b(?:and|but|so)\s+(?=(?:I|we|you|he|she|it|they|there|this|that)\b)|\b(?:because|although|while|when|which means|that means)\b/gi;
    for(const m of text.matchAll(boundaries)){const at=/^[,;:]/.test(m[0])?m.index+m[0].length:m.index;if(cuts.length<6&&words(text.slice(cuts.at(-1),at))>=4&&words(text.slice(at))>=3)cuts.push(at);}
    cuts.push(text.length);return cuts.slice(0,-1).map((start,i)=>({start,end:cuts[i+1],text:text.slice(start,cuts[i+1])})).filter(x=>x.text.length);
  }
  function cueSpan(text,cueText){
    if(!text||!cueText)return null;const at=text.indexOf(cueText);if(at>=0&&at===text.lastIndexOf(cueText))return{start:at,end:at+cueText.length};
    const within=cueText.indexOf(text);return within>=0&&within===cueText.lastIndexOf(text)?{start:0,end:text.length}:null;
  }
  function readingExcerpt(text,cueText){
    text=String(text||'');const spoken=cueSpan(text,cueText),count=s=>(s.match(/\S+/g)||[]).length,phrases=phraseChunks(text),blocks=[];
    for(const p of phrases){const words=[...p.text.matchAll(/\S+/g)];let start=p.start;for(let i=12;i<words.length;i+=12){const end=p.start+words[i].index;blocks.push({start,end,text:text.slice(start,end)});start=end;}blocks.push({start,end:p.end,text:text.slice(start,p.end)});}
    if(!blocks.length)return{chunks:[],spoken,partial:false};
    if(count(text)<=28&&phrases.length<=3)return{chunks:phrases,spoken,partial:false};
    let first=spoken?blocks.findIndex(b=>b.end>spoken.start):0;if(first<0)first=0;
    let last=first;if(spoken)while(last+1<blocks.length&&blocks[last].end<spoken.end)last++;
    let start=blocks[first].start,end=blocks[last].end;
    if(count(text.slice(start,end))>28&&spoken){start=spoken.start;end=spoken.end;}
    else if(first===last&&last+1<blocks.length&&count(text.slice(start,blocks[last+1].end))<=24){end=blocks[++last].end;}
    return{chunks:blocks.filter(b=>b.end>start&&b.start<end).map(b=>({start:Math.max(start,b.start),end:Math.min(end,b.end),text:text.slice(Math.max(start,b.start),Math.min(end,b.end))})),spoken,partial:start>0||end<text.length};
  }
  function sentenceWindow(groups,index){if(!groups.length)return[];index=Math.max(0,Math.min(index,groups.length-1));const start=Math.max(0,Math.min(index-1,groups.length-3));return groups.slice(start,start+3).map((sentence,n)=>({sentence,index:start+n,offset:start+n-index}));}
  // Repeat the selected caption only. A short tail may fill silence, never the next cue.
  function loopRange(cue,cues=[]){
    if(!cue)return null;
    const index=cues.findIndex(c=>c.id===cue.id),selected=index>=0?cues[index]:cue;
    const next=index>=0?cues.slice(index+1).find(c=>c.start>selected.start):null;
    return {start:selected.start,end:Math.min(selected.end+.65,next?.start??Infinity)};
  }
  function playbackAction({time:t,paused,range,mode,closed}){if(paused||!range||mode==='off'||closed)return null;if(t>=range.end&&t<range.end+1.5)return mode==='loop'?{type:'seek',time:range.start}:{type:'pause',hold:range.end-.04};return null;}
  function validVideo(v){if(!v||typeof v.id!=='string'||v.id.length>100||typeof v.title!=='string'||!Array.isArray(v.cues)||v.cues.length>12000)throw Error('Bản sao có video không hợp lệ.');if(v.url)videoURL(v.url);const ids=new Set();for(const c of v.cues){if(!c||typeof c.id!=='string'||ids.has(c.id)||typeof c.text!=='string'||c.text.length>20000||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start)throw Error('Bản sao có dòng phụ đề không hợp lệ.');ids.add(c.id);}return v;}
function stripCaptionTimeLabel(text,start){
 const normalized=String(text||'').normalize('NFC');
 const match=normalized.match(/^(?:(\d+)\s*giờ\s*)?(?:(\d+)\s*phút\s*)?(?:(\d+)\s*giây\s*)?/i);
 if(!match?.[0]||!/[A-Za-z]/.test(normalized.slice(match[0].length,match[0].length+1)))return text;
 const seconds=Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0);
 return Math.abs(seconds-start)<.01?normalized.slice(match[0].length):text;
}
  const api={stripCaptionTimeLabel,time,stamp,hash,videoURL,parse,active,group,sentences,analysisUnits,phraseChunks,cueSpan,readingExcerpt,sentenceWindow,loopRange,playbackAction,validVideo};if(typeof module!=='undefined')module.exports=api;else root.TB=api;
})(globalThis);
