const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ext=path.join(root,'extensions/tuanbong-youtube'),app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8');
const A='5SzO5zxzQLs',B='M_ONGazIFsg',UUID='12345678-1234-1234-1234-123456789abc';
const flush=()=>new Promise(r=>setImmediate(r));
test('combined chapter/transcript panel is read even when the old transcript panel remains hidden',async()=>{
 const segment={querySelector:s=>s.includes('Timestamp')?{textContent:'0:09'}:null,querySelectorAll:()=>[{textContent:'0:09'},{textContent:'Keep going. Do not stop.'}]};
 const hidden={getClientRects:()=>[],getAttribute:()=>null};
 const combined={getClientRects:()=>[{}],getAttribute:()=>null,querySelector:()=>null,querySelectorAll:s=>s.includes('transcript-segment')?[segment]:[]};
 let now=0;
 const ctx={URL,location:{href:'https://www.youtube.com/watch?v='+B},Date:class extends Date{static now(){return now}},setTimeout:(fn,ms)=>{now+=ms;Promise.resolve().then(fn)},getComputedStyle:()=>({overflowY:'visible'}),document:{title:'New video - YouTube',querySelector:s=>s.includes('engagement-panel-searchable')?hidden:null,querySelectorAll:s=>s.includes('engagement-panel-section')?[hidden,combined]:[]}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'extract.js'),'utf8'),ctx);
 const result=await ctx.prepareYouTubeTranscript();assert.equal(result.url,'https://www.youtube.com/watch?v='+B);assert.equal(result.count,1);assert.equal(result.transcript,'0:09 Keep going. Do not stop.');
});
test('an unrelated engagement panel is not mistaken for an opened transcript',()=>{
 const ctx={document:{querySelector:()=>null,querySelectorAll:()=>[{getClientRects:()=>[{}],getAttribute:()=>null,querySelectorAll:()=>[]}]} };
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'extract.js'),'utf8'),ctx);assert.equal(ctx.tuanbongTranscriptPanel(),null);
});
function buttonFlow({prepare=()=>new Promise(()=>{}),send=()=>Promise.resolve({ok:true,count:1})}={}){
 const nodes=[],events={},timers=new Map();let timerId=0,listener,id=A;
 const node=tag=>{const n={tag,hidden:false,disabled:false,textContent:'',events:{},append(){},attachShadow(){return node('shadow')},setAttribute(){},addEventListener:(e,f)=>n.events[e]=f,remove(){}};nodes.push(n);return n;};
 const ctx={URL,AbortController,location:{get href(){return 'https://www.youtube.com/watch?v='+id}},document:{createElement:node,documentElement:{},querySelector:()=>null,addEventListener:(e,f)=>events[e]=f},MutationObserver:class{observe(){}},setTimeout:(f,ms)=>{timers.set(++timerId,{f,ms});return timerId},clearTimeout:i=>timers.delete(i),prepareYouTubeTranscript:prepare,chrome:{runtime:{sendMessage:send,onMessage:{addListener:f=>listener=f}}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'youtube.js'),'utf8'),ctx);
 const button=nodes.find(n=>n.tag==='button'),fallback=nodes.find(n=>n.tag==='a');
 return {button,fallback,start:()=>new Promise(r=>listener({type:'tuanbong-start'},null,r)),navigate(){id=B;events['yt-navigate-start']();},expire(ms){for(const [i,t] of [...timers])if(t.ms===ms){timers.delete(i);t.f();}}};
}
test('a stuck extractor stops waiting and enables retry with the current-video fallback',async()=>{
 const f=buttonFlow(),done=f.start();assert.equal(f.button.disabled,true);f.expire(22000);const result=await done;
 assert.equal(result.ok,false);assert.equal(f.button.disabled,false);assert.equal(f.fallback.hidden,false);assert.ok(f.fallback.href.endsWith('?video='+A));
 assert.match(f.button.textContent,/Thử lại/);assert.match(f.button.title,/Chờ quá lâu/);
});
test('a stalled Chrome response also releases the preparing button',async()=>{
 const f=buttonFlow({prepare:async()=>({url:'https://www.youtube.com/watch?v='+A}),send:()=>new Promise(()=>{})}),done=f.start();await flush();f.expire(8000);assert.equal((await done).ok,false);assert.equal(f.button.disabled,false);
});
test('YouTube navigation cancels the previous request and late completion cannot open the old lesson',async()=>{
 let resolve,opened=0;const f=buttonFlow({prepare:()=>new Promise(r=>resolve=r),send:async()=>{opened++;return {ok:true,count:1}}});
 const done=f.start();f.navigate();assert.equal(f.button.disabled,false);resolve({url:'https://www.youtube.com/watch?v='+A});assert.equal((await done).ok,false);assert.equal(opened,0);assert.equal(f.button.disabled,false);
});
function launching(query){
 const old={id:A,url:'https://www.youtube.com/watch?v='+A,cues:[{id:'old'}]},used=[],nodes=new Map();
 const ctx={URL,location:{href:'https://english-ebook-website.pages.dev/youtube/'+query},history:{replaceState(){}},state:{videos:[old],current:A,settings:{font:18}},dataReady:false,incomingTransfer:null,TBStore:{get:async()=>null},TBData:{validate:v=>v},Date,document:{documentElement:{style:{setProperty(){}}}},$:s=>{if(!nodes.has(s))nodes.set(s,{});return nodes.get(s)},useVideo:v=>used.push(v.id),renderRecent(){},renderGrammar(){},updateSaved(){},lookup(){},showTab(){},tick(){},toast(){},setTimeout(){}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function launchVideoFromURL()')),ctx);
 return {ctx,used,old};
}
test('a new transfer opens the explicitly requested video instead of the previous lesson',async()=>{
 const s=launching('?video='+B+'&transfer='+UUID);await flush();assert.deepEqual(s.used,[B]);assert.equal(s.ctx.state.videos[0],s.old);assert.ok(s.ctx.location.href.includes('transfer='));
});
test('older extension URLs wait for their transfer instead of loading an unrelated old video',async()=>{
 const s=launching('?transfer='+UUID);await flush();assert.deepEqual(s.used,[]);
});
test('a normal visit still reopens the previous lesson',async()=>{
 const s=launching('');await flush();assert.deepEqual(s.used,[A]);
});
