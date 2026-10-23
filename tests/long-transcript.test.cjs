const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(process.env.TB_EXTRACT_SOURCE||path.join(__dirname,'../extensions/tuanbong-youtube/extract.js'),'utf8');
function fixture(count=4500){
 let now=0,reads=0,clones=0,pauses=0;
 const stamp=n=>(n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(n>=3600?2:1,'0')+':'+String(n%60).padStart(2,'0');
 const nodes=Array.from({length:count},(_,i)=>{
  const row={time:stamp(i),body:'This is podcast caption '+i+'.',get textContent(){return this.time+this.body;},querySelector:s=>s.includes('Timestamp')?{textContent:row.time}:(reads++,{textContent:row.body,cloneNode(){clones++;return {textContent:row.body,querySelectorAll:()=>[]};}})};
  return row;
 });
 const panel={getClientRects:()=>[{}],getAttribute:()=>null,querySelector:()=>null,querySelectorAll:s=>s.includes('transcript-segment-renderer')?nodes:[]};
 const ctx={URL,WeakMap,Date:class extends Date{static now(){return now}},location:{href:'https://www.youtube.com/watch?v=5SzO5zxzQLs'},setTimeout:(fn,ms)=>{now+=ms;pauses++;Promise.resolve().then(fn);},document:{title:'Long podcast - YouTube',querySelector:s=>s.includes('engagement-panel-searchable')?panel:null,querySelectorAll:()=>[]}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,panel,nodes,stats:()=>({reads,clones,pauses,elapsed:now})};
}
test('a 75-minute transcript is parsed once per row across repeated readiness checks',async()=>{
 const s=fixture(),result=await s.ctx.prepareYouTubeTranscript();
 assert.equal(result.count,4500);assert.equal(result.transcript.split('\n').length,4500);assert.ok(result.transcript.endsWith('1:14:59 This is podcast caption 4499.'));
 assert.equal(s.stats().reads,4500);assert.equal(s.stats().clones,4500);assert.ok(s.stats().pauses>=3,'the readiness checks still wait for late rows');
});
test('changed or recycled DOM rows are reparsed while unchanged captions are reused',()=>{
 const s=fixture(3),cache=new WeakMap(),options={panel:s.panel,segments:s.nodes,cache};
 s.ctx.extractYouTubeTranscript(options);s.ctx.extractYouTubeTranscript(options);assert.equal(s.stats().reads,3);
 s.nodes[1].body='A corrected caption.';const changed=s.ctx.extractYouTubeTranscript(options);assert.equal(s.stats().reads,4);assert.ok(changed.transcript.includes('0:01 A corrected caption.'));
 s.nodes[1].time='2:00';s.nodes[1].body='A recycled row at a different timestamp.';const recycled=s.ctx.extractYouTubeTranscript(options);assert.equal(s.stats().reads,5);assert.ok(recycled.transcript.includes('2:00 A recycled row'));
});
test('an ordinary text-only caption needs no DOM clone',()=>{
 const s=fixture(1);const node={textContent:'I waited nine seconds.',childElementCount:0,cloneNode(){throw Error('Unnecessary clone');}};
 assert.equal(s.ctx.tuanbongSubtitleText(node),'I waited nine seconds.');
});
test('caching is isolated to the current extraction rather than reusing another video',async()=>{
 const s=fixture(2);await s.ctx.prepareYouTubeTranscript();const first=s.stats().reads;
 await s.ctx.prepareYouTubeTranscript();assert.equal(s.stats().reads,first*2);
});
