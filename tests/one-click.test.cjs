const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ext=path.join(root,'extensions/tuanbong-youtube'),app=path.join(root,'youtube');
global.TB=require(path.join(app,'core.js'));const TB=global.TB,Transfer=require(path.join(app,'transfer.js'));
const ID='5SzO5zxzQLs',OTHER='M_ONGazIFsg',UUID='12345678-1234-1234-1234-123456789abc',origin='https://english-ebook-website.pages.dev';
const payload=(extra={})=>({version:1,transferId:UUID,createdAt:Date.now(),url:'https://www.youtube.com/watch?v='+ID,title:'A video',transcript:'0:00 Hello.\n0:04 I work every day.',count:2,...extra});
function extractor({open=false,expand=false,virtual=false,mounted=false,append=false,navigate=false,noTranscript=false,english=false}={}){
 let now=0,current=ID,expanded=false,opens=0,expands=0,englishSelected=false;
 const visible=node=>node? [{}]:[];
 const segment=(i)=>({getBoundingClientRect:()=>({top:i*100-scroll.top,bottom:(i+1)*100-scroll.top,height:100}),querySelector:s=>({textContent:s.includes('Timestamp')?'0:'+String(i*4).padStart(2,'0'):'Sentence '+i+'.'})});
 const scroll={top:virtual?200:0};
 const panel={getClientRects:()=>visible(open),getAttribute:()=>null,getBoundingClientRect:()=>({top:0}),clientHeight:virtual||mounted?200:0,scrollHeight:virtual||mounted?1000:0,get scrollTop(){return scroll.top},set scrollTop(v){scroll.top=Math.min(800,v)},querySelector:s=>english&&s.includes('footer')?chooser:null,querySelectorAll:s=>s.includes('ytd-transcript-segment-renderer')?(virtual?Array.from({length:Math.min(2,10-Math.floor(scroll.top/100))},(_,j)=>segment(Math.floor(scroll.top/100)+j)):mounted?Array.from({length:10},(_,i)=>segment(i)):Array.from({length:append&&now>=300?3:2},(_,i)=>segment(i))):[]};
 const chooser={textContent:'Tiếng Việt',getClientRects:()=>[{}],getAttribute:()=>null,click(){}};
 const option={textContent:'English (auto-generated)',getClientRects:()=>[{}],getAttribute:()=>null,click(){englishSelected=true;chooser.textContent='English';}};
 const control={textContent:'Hiện bản chép lời',getClientRects:()=>[{}],getAttribute:()=>null,click(){open=true;opens++;}};
 const expander={getClientRects:()=>[{}],getAttribute:()=>null,click(){expanded=true;expands++;}};
 const location={get href(){return 'https://www.youtube.com/watch?v='+current}};
 const ctx={URL,location,Date:class extends Date{static now(){return now}},setTimeout:(fn,ms)=>{now+=ms;if(navigate)current=OTHER;Promise.resolve().then(fn)},getComputedStyle:()=>({overflowY:'auto'}),document:{title:'Test - YouTube',querySelector:s=>s.includes('metadata h1')?{textContent:'A video'}:s.includes('watch-flexy')?{getAttribute:()=>current}:s.includes('engagement-panel')||s==='ytd-transcript-renderer'?panel:s.includes('#expand')&&expand?expander:null,querySelectorAll:s=>s.includes('paper-listbox')&&english?[option]:s.includes('description-transcript')&&!noTranscript&&(!expand||expanded)?[control]:[]}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'extract.js'),'utf8'),ctx);
 return {ctx,get elapsed(){return now},get counts(){return {opens,expands,englishSelected}},scroll};
}
test('one click expands the description, opens transcript and collects stable captions',async()=>{const e=extractor({expand:true});const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.autoOpen,true);assert.equal(p.count,2);assert.equal(p.url,'https://www.youtube.com/watch?v='+ID);assert.deepEqual(e.counts,{opens:1,expands:1,englishSelected:false});});
test('already-open transcript requires no extra click and selects English when available',async()=>{const e=extractor({open:true,english:true});const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.count,2);assert.equal(e.counts.opens,0);assert.equal(e.counts.englishSelected,true);});
test('virtualized rows are collected from the top and original scroll is restored',async()=>{const e=extractor({open:true,virtual:true});const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.count,10);assert.equal(p.transcript.split('\n')[0],'0:00 Sentence 0.');assert.equal(e.scroll.top,200);});
test('fully mounted scrollable transcript skips scrolling and is ready within one second after loading',async()=>{const e=extractor({open:true,mounted:true});let moves=0;const original=Object.getOwnPropertyDescriptor(e.scroll,'top');Object.defineProperty(e.scroll,'top',{get(){return original.value},set(){moves++}});const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.count,10);assert.ok(e.elapsed<=1000);assert.ok(moves<=1,'only final scroll restoration is allowed');});
test('new rows arriving during settling are included before transfer',async()=>{const e=extractor({open:true,append:true});const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.count,3);assert.ok(e.elapsed>=600);});
test('a fully loaded list inside a taller panel skips header/footer scrolling',async()=>{
 const e=extractor({open:true,mounted:true}),panel=e.ctx.document.querySelector('ytd-transcript-renderer'),read=panel.querySelectorAll;
 const list={scrollHeight:1000,scrollTop:0,getBoundingClientRect:()=>({top:0}),contains:()=>true,parentElement:panel};
 panel.scrollHeight=1500;panel.contains=()=>true;
 panel.querySelectorAll=s=>read(s).map(node=>{node.parentElement=list;return node;});
 const p=await e.ctx.prepareYouTubeTranscript();assert.equal(p.count,10);assert.ok(e.elapsed<=500,'only settling delay, no panel scrolling');
});
test('faster progressive collection still includes every virtualized caption',async()=>{
 const e=extractor({open:true,virtual:true});const p=await e.ctx.prepareYouTubeTranscript();
 assert.equal(p.count,10);assert.ok(e.elapsed<=1400);assert.equal(e.scroll.top,200);
});
test('navigation during extraction cancels instead of transferring the wrong video',async()=>{await assert.rejects(extractor({navigate:true}).ctx.prepareYouTubeTranscript(),/Video đã thay đổi/);});
test('missing transcript times out with usable manual fallback instructions',async()=>{await assert.rejects(extractor({noTranscript:true}).ctx.prepareYouTubeTranscript({timeoutMs:1000}),/Hiện bản chép lời/);});
test('automatic import is opt-in and payload size, identity and timestamps are validated',()=>{assert.equal(Transfer.decode(payload(),UUID).autoOpen,false);assert.equal(Transfer.decode(payload({autoOpen:true}),UUID).autoOpen,true);assert.equal(Transfer.decode(payload({autoOpen:'true'}),UUID).autoOpen,false);for(const extra of [{transcript:'x'.repeat(1500001)},{transferId:'other'},{createdAt:0},{url:'javascript:alert(1)'},{transcript:'No times'}])assert.throws(()=>Transfer.decode(payload(extra),UUID));});
function background(){
 const values={},created=[];let listener,n=0;
 const chrome={runtime:{onMessage:{addListener:f=>listener=f}},tabs:{get:async()=>({url:'https://www.youtube.com/watch?v='+ID}),create:async args=>created.push(args)},storage:{local:{get:async()=>({...values}),set:async obj=>Object.assign(values,obj),remove:async keys=>{for(const key of [].concat(keys))delete values[key]}}}};
 const ctx={URL,Date,crypto:{randomUUID:()=>n++?'22345678-1234-1234-1234-123456789abc':UUID},chrome};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'background.js'),'utf8'),ctx);
 return {values,created,send:(p,url='https://www.youtube.com/watch?v='+ID)=>new Promise(resolve=>listener({type:'tuanbong-open-lesson',payload:p},{url,tab:{id:1}},resolve))};
}
test('two quick launches receive independent transfer storage and the requested video in each app URL',async()=>{const b=background();const results=await Promise.all([b.send(payload()),b.send(payload())]);assert.ok(results.every(r=>r.ok));assert.equal(Object.keys(b.values).length,2);assert.equal(b.created.length,2);for(const tab of b.created){const u=new URL(tab.url);assert.equal(u.origin,origin);assert.equal(u.pathname,'/youtube/');assert.equal(u.searchParams.get('video'),ID);assert.ok(u.searchParams.get('transfer'));}});
test('background rejects an unrelated sender or mismatched video without writing or opening tabs',async()=>{const b=background();assert.equal((await b.send(payload(),'https://evil.example/watch?v='+ID)).ok,false);assert.equal((await b.send(payload({url:'https://www.youtube.com/watch?v='+OTHER}))).ok,false);assert.equal(b.created.length,0);assert.equal(Object.keys(b.values).length,0);});
function importing({old=true,fail=false}={}){
 const nodes=new Map(),events={},writes=[],messages=[];const lesson={id:ID,url:'https://www.youtube.com/watch?v='+ID,title:'Corrected',cues:TB.parse('0:00 Original corrected caption.').cues,labels:{one:'past_simple'},favorite:true,lastPosition:50};
 const state={version:1,videos:old?[lesson]:[],saved:[],words:[],settings:{font:18}};
 const ctx={URL,TB,TBData:{validate:s=>s},TBTransfer:Transfer,state,dataReady:true,location:{href:origin+'/youtube/?transfer='+UUID,origin},history:{replaceState(){}},saveTimer:1,clearTimeout(){},captureVideoProgress(){},openDialog(){},toast(){},showTab(){},useVideo:v=>ctx.current=v,TBStore:{set:async s=>{if(fail)throw Error('Storage failed');writes.push(s)}},$:s=>{if(!nodes.has(s))nodes.set(s,{textContent:'',checked:true,disabled:false,close(){},addEventListener:(event,fn)=>events[s+event]=fn});return nodes.get(s)},window:{addEventListener:(event,fn)=>events[event]=fn,postMessage:m=>messages.push(m)}};
 const source=fs.readFileSync(path.join(app,'app.js'),'utf8');vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let incomingTransfer='),source.indexOf('async function init()')),ctx);
 return {ctx,state,lesson,nodes,writes,messages,deliver:p=>events.message({source:ctx.window,origin,data:{source:'tuanbong-extension',payload:p}}),submit:()=>nodes.get('#extensionImportForm').onsubmit({preventDefault(){}})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('one-click launch opens an existing lesson without replacing corrected captions or labels',async()=>{const i=importing();i.deliver(payload({autoOpen:true}));await flush();assert.equal(i.ctx.current,i.lesson);assert.equal(i.writes.length,0);assert.equal(i.ctx.current.favorite,true);assert.equal(i.ctx.current.lastPosition,50);assert.deepEqual(i.ctx.current.labels,{one:'past_simple'});assert.ok(i.messages.some(m=>m.type==='finished'));});
test('new lesson is automatically imported only after successful storage',async()=>{const i=importing({old:false});i.deliver(payload({autoOpen:true}));await flush();assert.equal(i.writes.length,1);assert.equal(i.ctx.current.cues.length,2);assert.equal(i.ctx.current.partial,true);assert.ok(i.messages.some(m=>m.type==='finished'));});
test('failed auto import preserves existing state and shows a retryable import dialog',async()=>{const i=importing({old:false,fail:true});i.deliver(payload({autoOpen:true}));await flush();assert.equal(i.ctx.state,i.state);assert.equal(i.ctx.current,undefined);assert.equal(i.nodes.get('#extensionImportError').textContent,'Storage failed');assert.ok(!i.messages.some(m=>m.type==='finished'));assert.equal(i.nodes.get('#extensionImportSubmit').disabled,false);});
test('old extension payload still requires review and keeps favorites when manually imported',async()=>{const i=importing();i.deliver(payload());assert.equal(i.writes.length,0);await i.submit();assert.equal(i.writes.length,1);assert.equal(i.ctx.current.favorite,true);assert.equal(i.ctx.current.lastPosition,50);});
test('bridge delivers only its own transfer and never deletes a different launch',async()=>{
 const values={['tuanbongTransfer:'+UUID]:payload(),['tuanbongTransfer:22345678-1234-1234-1234-123456789abc']:payload({transferId:'22345678-1234-1234-1234-123456789abc'})},events={},sent=[];
 let retryMs,stopped=false;
 const ctx={URL,location:{href:origin+'/youtube/?transfer='+UUID,origin},chrome:{storage:{local:{get:async()=>values,remove:async key=>delete values[key]}}},setInterval:(fn,ms)=>{retryMs=ms;return 1},setTimeout:()=>1,clearInterval(){stopped=true},window:{postMessage:m=>sent.push(m),addEventListener:(event,fn)=>events[event]=fn}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ext,'bridge.js'),'utf8'),ctx);await flush();assert.equal(sent[0].payload.transferId,UUID);
 assert.ok(retryMs<=250);await events.message({source:ctx.window,origin,data:{source:'tuanbong-app',type:'received',transferId:UUID}});assert.equal(stopped,true);assert.equal(Object.keys(values).length,2);
 await events.message({source:ctx.window,origin:'https://evil.example',data:{source:'tuanbong-app',type:'finished',transferId:UUID}});assert.equal(Object.keys(values).length,2);
 await events.message({source:ctx.window,origin,data:{source:'tuanbong-app',type:'finished',transferId:UUID}});assert.equal(Object.keys(values).length,1);
});
test('manual fallback opens the requested video and preserves all other lessons',()=>{const i=importing();i.ctx.location.href=origin+'/youtube/?video='+OTHER;const v=i.ctx.launchVideoFromURL();assert.equal(v.id,OTHER);assert.equal(v.cues.length,0);assert.equal(i.ctx.state.videos[0],i.lesson);assert.equal(i.ctx.state.videos.length,2);});
test('invalid fallback IDs cannot create a lesson',()=>{const i=importing();i.ctx.location.href=origin+'/youtube/?video=javascript:evil';assert.equal(i.ctx.launchVideoFromURL(),null);assert.equal(i.ctx.state.videos.length,1);});
test('extension access is restricted to YouTube and the TuanBong learning path',()=>{const m=JSON.parse(fs.readFileSync(path.join(ext,'manifest.json')));assert.equal(m.version,'0.3.4');assert.deepEqual(m.permissions,['activeTab','scripting','storage']);assert.deepEqual(m.host_permissions,[origin+'/youtube/*','https://www.youtube.com/*','https://youtube.com/*','https://m.youtube.com/*']);assert.equal(m.background.service_worker,'background.js');for(const script of ['extract.js','youtube.js','background.js','popup.js','bridge.js'])assert.doesNotMatch(fs.readFileSync(path.join(ext,script),'utf8'),/fetch\s*\(|XMLHttpRequest|eval\s*\(/);});
