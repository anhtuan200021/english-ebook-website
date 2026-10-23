const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8');
function setup(){
 const cues=Array.from({length:6},(_,i)=>({id:String(i),start:i*3,text:'Caption '+i}));
 const focus={hidden:true,innerHTML:''},follow={checked:true},list={clientHeight:500,clientTop:0,scrollTop:0,scrollHeight:1000,getBoundingClientRect:()=>({top:0}),querySelector:q=>({getBoundingClientRect:()=>({top:Number(q.match(/\d+/)[0])*100})})};
 const ctx={video:{cues},activeIndex:-1,transcriptLimit:150,manualScroll:false,tab:'transcript',programmaticScroll:false,$:s=>s==='#follow'?follow:s==='#transcriptFocus'?focus:list,$$:()=>[],CSS:{escape:x=>x},esc:x=>x,tokens:x=>x,isSaved:()=>false,TB:{stamp:x=>String(x)},setTimeout(){}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function focusRows('),app.indexOf('function updateCurrent(')),ctx);return {ctx,cues,focus,list,follow};
}
test('before playback the first caption appears highlighted in the first slot with no empty leading row',()=>{
 const s=setup();s.ctx.markTranscriptFocus();assert.equal(s.focus.hidden,false);
 assert.ok(s.focus.innerHTML.startsWith('<article class="cue active" data-cue="0"'));
 assert.ok(s.focus.innerHTML.includes('data-cue="1"'));assert.ok(s.focus.innerHTML.includes('data-cue="2"'));
 assert.doesNotMatch(s.focus.innerHTML,/Chưa có câu trước|Chờ phụ đề/);
});
test('the first timed caption stays first, then the highlight moves to the second slot and stays there',()=>{
 const s=setup();
 for(const [index,slot] of [[0,0],[1,1],[2,1],[3,1],[5,1],[0,0]]){
  const rows=s.ctx.focusRows(s.cues,index);assert.equal(rows[slot].cue.id,String(index));assert.equal(rows[slot].offset,0);
  assert.equal(rows.filter(r=>r.offset===0).length,1);
  if(index>0)assert.equal(rows[0].cue.id,String(index-1));
 }
});
test('the list below the fixed frame starts after the three displayed captions, including before playback',()=>{
 for(const [index,next] of [[-1,3],[0,3],[1,3],[2,4]]){
  const s=setup();s.ctx.activeIndex=index;s.ctx.alignTranscript();assert.equal(s.list.scrollTop,next*100);
 }
});
test('short and empty transcripts do not invent or duplicate captions',()=>{
 const s=setup();s.ctx.video.cues=s.cues.slice(0,1);s.ctx.markTranscriptFocus();
 assert.equal((s.focus.innerHTML.match(/<article/g)||[]).length,1);assert.ok(s.focus.innerHTML.startsWith('<article class="cue active"'));
 s.ctx.video.cues=[];s.ctx.markTranscriptFocus();assert.equal(s.focus.hidden,true);
});
test('manual scroll does not block the fixed highlight, and disabling follow hides the frame',()=>{
 const s=setup();s.ctx.manualScroll=true;s.ctx.activeIndex=3;s.ctx.markTranscriptFocus();
 assert.ok(s.focus.innerHTML.includes('class="cue active" data-cue="3"'));s.ctx.alignTranscript();assert.equal(s.list.scrollTop,0);
 s.follow.checked=false;s.ctx.markTranscriptFocus();assert.equal(s.focus.hidden,true);
});
