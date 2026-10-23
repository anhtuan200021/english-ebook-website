const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(process.env.TB_EXTRACT_SOURCE||path.join(__dirname,'../extensions/tuanbong-youtube/extract.js'),'utf8');
function podcast({count=600,delay=0}={}){
 let now=0,top=0,rendered=0,pending=0,renderAt=Infinity,moves=0;
 const stamp=i=>Math.floor(i/60)+':'+String(i%60).padStart(2,'0');
 const panel={clientHeight:400,clientTop:0,scrollHeight:count*60,get scrollTop(){return top},set scrollTop(value){const next=Math.max(0,Math.min(value,this.scrollHeight-this.clientHeight));if(next!==top){moves++;top=next;pending=next;renderAt=now+delay;}},getClientRects:()=>[{}],getAttribute:()=>null,getBoundingClientRect:()=>({top:0}),querySelector:()=>null,querySelectorAll(selector){
  if(!selector.includes('transcript-segment-renderer'))return [];
  if(now>=renderAt){rendered=pending;renderAt=Infinity;}
  const first=Math.floor(rendered/60),last=Math.min(count,Math.ceil((rendered+400)/60));
  return Array.from({length:last-first},(_,j)=>{const i=first+j;return {textContent:stamp(i)+'Caption '+i,getBoundingClientRect:()=>({top:i*60-top,bottom:(i+1)*60-top,height:60}),querySelector:s=>({childElementCount:0,textContent:s.includes('Timestamp')?stamp(i):'Caption '+i+'.'})};});
 }};
 const ctx={URL,WeakMap,Date:class extends Date{static now(){return now}},location:{href:'https://www.youtube.com/watch?v=M65-VCoN14g'},setTimeout:(f,ms)=>{now+=ms;queueMicrotask(f)},getComputedStyle:()=>({overflowY:'auto'}),document:{title:'Podcast - YouTube',querySelector:s=>s.includes('engagement-panel-searchable')?panel:null,querySelectorAll:()=>[]}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,stats:()=>({elapsed:now,moves})};
}
test('600 virtualized podcast captions are all collected without fixed 100ms waits',async()=>{
 const s=podcast(),result=await s.ctx.prepareYouTubeTranscript();
 assert.equal(result.count,600);assert.ok(s.stats().elapsed<6000,JSON.stringify(s.stats()));
 const lines=result.transcript.split('\n');for(let i=0;i<600;i++)assert.ok(lines[i].endsWith(' Caption '+i+'.'));
});
test('slow virtual rendering is awaited rather than skipping unread caption windows',async()=>{
 const s=podcast({count:120,delay:175}),result=await s.ctx.prepareYouTubeTranscript();
 assert.equal(result.count,120);const lines=result.transcript.split('\n');
 for(let i=0;i<120;i++)assert.ok(lines[i].endsWith(' Caption '+i+'.'));
});
module.exports=podcast;
