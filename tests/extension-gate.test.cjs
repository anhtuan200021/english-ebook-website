const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),gateSource=fs.readFileSync(path.join(root,'youtube/gate.js'),'utf8'),bridgeSource=fs.readFileSync(path.join(root,'extensions/tuanbong-youtube/bridge.js'),'utf8');
const origin='https://english-ebook-website.pages.dev',UUID='12345678-1234-1234-1234-123456789abc';
global.TB=require(path.join(root,'youtube/core.js'));const Transfer=require(path.join(root,'youtube/transfer.js'));
function setup({transfer=false,clipboardFails=false,userAgent=""}={}){
 const events={},docEvents={},nodes=new Map(),scripts=[],sent=[],timers=new Map();let n=0,copies=[];
 const node=()=>({hidden:false,inert:false,disabled:false,textContent:'',dataset:{appSrc:'app.js?v=0.4.0'},addEventListener(e,f){this[e]=f;},remove(){this.removed=true;}});
 const get=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);};
 get('#extensionGate').hidden=true;get('#studyApp').hidden=true;get('#studyApp').inert=true;
 const ctx={URL,TBTransfer:Transfer,location:{href:origin+'/youtube/'+(transfer?'?transfer='+UUID:''),origin},crypto:{randomUUID:()=>++n===1?UUID:'22345678-1234-1234-1234-123456789abc'},navigator:{userAgent,clipboard:{writeText:async text=>{if(clipboardFails)throw Error('Denied');copies.push(text);}}},setInterval:(f,ms)=>{const id=++n;timers.set(id,{f,ms,interval:true});return id;},clearInterval:id=>timers.delete(id),setTimeout:(f,ms)=>{const id=++n;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),document:{hidden:false,querySelector:get,createElement:node,head:{append:s=>scripts.push(s)},addEventListener:(e,f)=>docEvents[e]=f},window:{addEventListener:(e,f)=>events[e]=f,postMessage:m=>sent.push(m)}};
 vm.createContext(ctx);vm.runInContext(gateSource,ctx);
 const deliver=(data,extra={})=>events.message({source:ctx.window,origin,data:{source:'tuanbong-extension',...data},...extra});
 const ready=(extra={})=>deliver({type:'extension-ready',protocol:1,version:'0.4.0',requestId:sent.at(-1).requestId,...extra});
 return {ctx,get,scripts,sent,copies,events,ready,deliver,timeout(){for(const t of timers.values())if(!t.interval&&t.ms===4000)t.f();}};
}
test('no extension leaves the complete tool hidden and never executes its application script',()=>{
 const s=setup();assert.equal(s.get('#studyApp').hidden,true);assert.equal(s.get('#studyApp').inert,true);assert.equal(s.scripts.length,0);
 s.timeout();assert.equal(s.scripts.length,0);assert.equal(s.get('#extensionCheck').disabled,false);assert.match(s.get('#extensionCheckStatus').textContent,/Chưa kết nối/);
});
test('a matching extension reply loads the app once and reveals it only after the script loads',()=>{
 const s=setup();s.ready();s.ready();assert.equal(s.scripts.length,1);assert.equal(s.scripts[0].src,'app.js?v=0.4.0');assert.equal(s.get('#studyApp').hidden,true);
 s.scripts[0].onload();assert.equal(s.get('#studyApp').hidden,false);assert.equal(s.get('#studyApp').inert,false);assert.equal(s.get('#extensionGate').hidden,true);
});
test('foreign windows, wrong origins, old challenges and malformed replies do not unlock the tool',()=>{
 const s=setup(),valid={type:'extension-ready',protocol:1,version:'0.4.0',requestId:s.sent[0].requestId};
 s.deliver(valid,{source:{}});s.deliver(valid,{origin:'https://evil.example'});s.ready({requestId:'old'});s.ready({protocol:2});s.ready({version:'unknown'});
 assert.equal(s.scripts.length,0);assert.equal(s.get('#studyApp').hidden,true);
});
test('retry uses a fresh challenge and a late valid reply can recover from the initial timeout',()=>{
 const s=setup(),old=s.sent[0].requestId;s.timeout();s.get('#extensionCheck').click();assert.notEqual(s.sent.at(-1).requestId,old);
 s.ready({requestId:old});assert.equal(s.scripts.length,0);s.timeout();s.ready();assert.equal(s.scripts.length,1);
});
test('a failed app download leaves the gate visible and supports a new attempt',()=>{
 const s=setup();s.ready();s.scripts[0].onerror();assert.equal(s.get('#studyApp').hidden,true);assert.equal(s.get('#extensionGate').hidden,false);assert.equal(s.get('#extensionCheck').disabled,false);
 s.get('#extensionCheck').click();s.ready();assert.equal(s.scripts.length,2);
});
test('copying Chrome settings gives clear feedback, including clipboard denial',async()=>{
 const s=setup();await s.get('#copyExtensionsAddress').click();assert.deepEqual(s.copies,['chrome://extensions']);assert.match(s.get('#copyExtensionsStatus').textContent,/Đã sao chép/);
 const denied=setup({clipboardFails:true});await denied.get('#copyExtensionsAddress').click();assert.match(denied.get('#copyExtensionsStatus').textContent,/Bạn gõ/);
});
test('a valid older one-click transfer opens the app without prematurely acknowledging or deleting its captions',()=>{
 const s=setup({transfer:true}),payload={version:1,transferId:UUID,createdAt:Date.now(),url:'https://www.youtube.com/watch?v=3HB2dbVpluU',transcript:'0:00 Hello.\n0:05 Keep going.',autoOpen:true};
 s.deliver({payload:{...payload,transferId:'wrong'}});assert.equal(s.scripts.length,0);
 s.deliver({payload});assert.equal(s.scripts.length,1);assert.ok(s.sent.every(m=>m.type==='extension-ping'));
});
test('returning to the page checks again, while an already-loading app is not restarted',()=>{
 const s=setup();s.timeout();const before=s.sent.length;s.events.focus();assert.ok(s.sent.length>before);s.ready();const after=s.sent.length;s.events.focus();assert.equal(s.sent.length,after);
});
function bridge({invalidated=false}={}){
 let listener,storageReads=0;const sent=[];
 const ctx={URL,location:{href:origin+'/youtube/',origin},chrome:{runtime:{getManifest:()=>{if(invalidated)throw Error('Context invalidated');return {version:'0.4.0'};}},storage:{local:{get:async()=>{storageReads++;return {};}}}},window:{addEventListener:(e,f)=>listener=f,postMessage:m=>sent.push(m)}};
 vm.createContext(ctx);vm.runInContext(bridgeSource,ctx);
 return {ctx,sent,reads:()=>storageReads,send:(data,extra={})=>listener({source:ctx.window,origin,data:{source:'tuanbong-app',type:'extension-ping',requestId:UUID,...data},...extra})};
}
test('the installed extension answers on normal visits without reading transfer storage',async()=>{
 const b=bridge();await b.send();assert.equal(b.sent.length,1);assert.equal(b.sent[0].type,'extension-ready');assert.equal(b.sent[0].requestId,UUID);assert.equal(b.sent[0].version,'0.4.0');assert.equal(b.reads(),0);
});
test('the bridge ignores foreign pages, invalid challenges and invalidated extension contexts',async()=>{
 const b=bridge();await b.send({}, {origin:'https://evil.example'});await b.send({requestId:'x'});await b.send({}, {source:{}});assert.equal(b.sent.length,0);
 const gone=bridge({invalidated:true});await gone.send();assert.equal(gone.sent.length,0);
});
test('the page hides all study content initially and does not directly include the app script',()=>{
 const html=fs.readFileSync(path.join(root,'youtube/index.html'),'utf8');assert.match(html,/id="studyApp"[^>]*hidden inert/);assert.doesNotMatch(html,/<script[^>]+src="app\.js/);
 for(const id of ['extensionGate','extensionCheck','extensionCheckStatus','copyExtensionsAddress'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 assert.match(html,/downloads\/tuanbong-chrome\.zip\?v=0\.4\.0/);
});
test('gate and bridge connect end to end through their real message protocol on a normal visit',async()=>{
 const s=setup(),listeners=[s.events.message];
 s.ctx.chrome={runtime:{getManifest:()=>({version:'0.4.0'})}};
 s.ctx.window.addEventListener=(event,fn)=>{if(event==='message')listeners.push(fn);};
 s.ctx.window.postMessage=data=>queueMicrotask(()=>listeners.forEach(fn=>fn({source:s.ctx.window,origin,data})));
 vm.runInContext(bridgeSource,s.ctx);s.get('#extensionCheck').click();await new Promise(r=>setImmediate(r));
 assert.equal(s.scripts.length,1);s.scripts[0].onload();assert.equal(s.get('#studyApp').hidden,false);assert.equal(s.get('#extensionGate').hidden,true);
});

test('Safari opens manual study directly, expands the link field, and never waits for a Chrome extension',()=>{
 for(const userAgent of [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
 ]){
  const s=setup({userAgent});assert.equal(s.scripts.length,1);assert.equal(s.sent.length,0);
  s.scripts[0].onload();assert.equal(s.get('#studyApp').hidden,false);assert.equal(s.get('#studyApp').inert,false);
  assert.equal(s.get('#extensionGate').hidden,true);assert.equal(s.get('.manual-video').open,true);
  s.events.focus();assert.equal(s.scripts.length,1);
 }
});
test('Safari can retry a failed manual app load without requiring an extension',()=>{
 const s=setup({userAgent:'Version/26.0 Safari/605.1.15'});
 s.scripts[0].onerror();assert.equal(s.get('#studyApp').hidden,true);assert.equal(s.get('#extensionCheck').disabled,false);
 s.get('#extensionCheck').click();assert.equal(s.scripts.length,2);assert.equal(s.sent.length,0);
});
test('Chrome and other browsers with Safari in their user agent retain extension onboarding',()=>{
 for(const userAgent of [
 'Mozilla/5.0 AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36',
 'Mozilla/5.0 AppleWebKit/605.1.15 CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
 'Mozilla/5.0 Version/26.0 EdgiOS/141.0 Safari/605.1.15',
 'Mozilla/5.0 Version/4.0 Chrome/141.0 Safari/537.36 SamsungBrowser/28.0'
 ]){
  const s=setup({userAgent});assert.equal(s.scripts.length,0);assert.equal(s.sent.length,1);assert.equal(s.get('#studyApp').hidden,true);
 }
});

test('installation guide stays hidden throughout a successful extension connection',()=>{
 const s=setup();assert.equal(s.get('#extensionGate').hidden,true);assert.equal(s.get('#extensionBoot').hidden,false);
 s.ready();assert.equal(s.get('#extensionGate').hidden,true);assert.equal(s.get('#extensionBoot').hidden,false);
 s.scripts[0].onload();assert.equal(s.get('#extensionGate').hidden,true);assert.equal(s.get('#extensionBoot').hidden,true);
 assert.equal(s.get('#studyApp').hidden,false);
});
test('only a connection timeout reveals installation instructions, and a late connection hides them again',()=>{
 const s=setup();assert.equal(s.get('#extensionGate').hidden,true);s.timeout();
 assert.equal(s.get('#extensionGate').hidden,false);assert.equal(s.get('#extensionBoot').hidden,true);
 s.ready();assert.equal(s.get('#extensionGate').hidden,true);assert.equal(s.get('#extensionBoot').hidden,false);
 s.scripts[0].onerror();assert.equal(s.get('#extensionGate').hidden,false);assert.equal(s.get('#extensionBoot').hidden,true);
});
test('HTML hides instructions before any script executes, with an accessible loading state and no-JS fallback',()=>{
 const html=fs.readFileSync(path.join(root,'youtube/index.html'),'utf8');
 assert.match(html,/id="extensionGate"[^>]*hidden/);
 assert.match(html,/id="extensionBoot"[^>]*role="status"/);
 assert.match(html,/<noscript><style>#extensionBoot\{display:none\}/);
});
