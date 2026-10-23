const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),TB=require(path.join(root,'youtube/core.js'));
const ctx={module:{exports:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'extensions/tuanbong-youtube/extract.js'),'utf8'),ctx);
test('localized duration artifacts are stripped only when they match the cue timestamp',()=>{
 for(const [start,text,want] of [[0,'0 giâyHi friends.','Hi friends.'],[9,'9 giâyso that you can learn.','so that you can learn.'],[69,'1 phút 9 giâyKeep going.','Keep going.'],[60,'1 phút Hi friends.','Hi friends.'],[3609,'1 giờ 9 giâyHello.','Hello.'],[9,'9 seconds to go.','9 seconds to go.'],[8,'9 giâyHi friends.','9 giâyHi friends.'],[9,'I waited 9 seconds.','I waited 9 seconds.']]){
  assert.equal(TB.stripCaptionTimeLabel(text,start),want);assert.equal(ctx.stripCaptionTimeLabel(text,start),want);
 }
});
test('modern row fallback cannot transfer its clock and accessibility duration as spoken text',()=>{
 const row={textContent:'0:099 giâyso that you can learn every day.',querySelector:s=>s.includes('Timestamp')?{textContent:'0:09'}:null,querySelectorAll:()=>[{textContent:'0:099 giâyso that you can learn every day.'}]};
 const panel={getClientRects:()=>[{}],getAttribute:()=>null,querySelectorAll:()=>[row]};
 ctx.URL=URL;ctx.location={href:'https://www.youtube.com/watch?v=5SzO5zxzQLs'};ctx.document={title:'Test - YouTube',querySelector:s=>s.includes('engagement-panel-searchable')?panel:null,querySelectorAll:()=>[]};
 assert.equal(ctx.extractYouTubeTranscript().transcript,'0:09 so that you can learn every day.');
});
test('hidden screen-reader nodes are removed from a copy without changing the YouTube DOM',()=>{
 const original={textContent:'0 giâyHi friends.',cloneNode(){const copy={textContent:this.textContent,querySelectorAll:()=>[{remove(){copy.textContent='Hi friends.';}}]};return copy;}};
 assert.equal(ctx.tuanbongSubtitleText(original),'Hi friends.');assert.equal(original.textContent,'0 giâyHi friends.');
});
const app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8');
function repair(){const c={TB};vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function repairExtensionCaptionLabels('),app.indexOf('function useVideo(')),c);return c.repairExtensionCaptionLabels;}
const lesson=()=>({format:'YouTube · tiện ích (mốc kết thúc ước lượng)',labels:{manual:'present_simple'},cues:[0,9,19].map((start,i)=>({id:'c'+i,start,end:start+9,text:start+' giâyHi friends.'}))});
test('opening an affected existing extension lesson repairs text while preserving IDs, times and labels',()=>{
 const v=lesson(),before=v.cues.map(({id,start,end})=>({id,start,end})),labels=v.labels;
 assert.equal(repair()(v),true);assert.deepEqual(v.cues.map(({id,start,end})=>({id,start,end})),before);assert.equal(v.labels,labels);assert.ok(v.cues.every(c=>c.text==='Hi friends.'));assert.equal(repair()(v),false);
});
test('manual subtitles and isolated phrases are left untouched',()=>{
 const manual=lesson();manual.format='SRT';assert.equal(repair()(manual),false);
 const isolated=lesson();isolated.cues[1].text='I work.';isolated.cues[2].text='Keep going.';assert.equal(repair()(isolated),false);
});
