const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),TB=require(path.join(root,'youtube/core.js'));
const app=fs.readFileSync(process.env.TB_SYNC_APP||path.join(root,'youtube/app.js'),'utf8');
function following({brokenReading=false}={}){
 let time=0,scheduled=0;
 const cues=TB.parse('0:00 First sentence.\n0:04 Second sentence.\n0:10 Third sentence.\n0:17 Fourth sentence.').cues;
 const focus={innerHTML:'',hidden:true},clock={textContent:''};
 const ctx={TB,Date,video:{cues},playerReady:true,pendingSeek:null,mode:'off',range:null,closed:false,activeIndex:-1,tickId:null,
  $:s=>s==='#clock'?clock:s==='#follow'?{checked:true}:focus,$$:()=>[],esc:x=>x,tokens:x=>x,isSaved:()=>false,
  captureVideoProgress(){},alignTranscript(){},updateSaved(){},renderReadingContext(){if(brokenReading)throw Error('Reading card not available');},
  setTimeout:()=>++scheduled,player:{getCurrentTime:()=>time,getPlayerState:()=>1}};
 vm.createContext(ctx);
 vm.runInContext(app.slice(app.indexOf('function focusRows('),app.indexOf('function alignTranscript('))+app.slice(app.indexOf('function updateCurrent('),app.indexOf('function setPlaybackMode(')),ctx);
 return {ctx,cues,focus,clock,setTime:t=>time=t,scheduled:()=>scheduled};
}
test('playing and seeking move the active caption into the fixed middle slot in timestamp order',()=>{
 const s=following();for(const [t,i] of [[0,0],[4.1,1],[10.1,2],[17.1,3],[4.2,1]]){
  s.setTime(t);s.ctx.tick();assert.equal(s.ctx.activeIndex,i);
  assert.ok(s.focus.innerHTML.includes('class="cue active" data-cue="'+s.cues[i].id+'"'));
  assert.equal(s.clock.textContent,TB.stamp(t));
 }assert.equal(s.scheduled(),5);
});
test('a failing reading card cannot freeze transcript following or the playback clock',()=>{
 const s=following({brokenReading:true});for(const [t,i] of [[0,0],[4.1,1],[10.1,2]]){
  s.setTime(t);s.ctx.tick();assert.equal(s.ctx.activeIndex,i);
  assert.ok(s.focus.innerHTML.includes('class="cue active" data-cue="'+s.cues[i].id+'"'));
  assert.equal(s.clock.textContent,TB.stamp(t));
 }assert.equal(s.scheduled(),3);
});
test('pending seeks ignore stale player time and resume following when the requested cue arrives',()=>{
 const s=following();s.ctx.tick();s.ctx.pendingSeek={index:2,time:10,until:Date.now()+2500};
 s.setTime(2);s.ctx.tick();assert.equal(s.ctx.activeIndex,0);
 s.setTime(10.2);s.ctx.tick();assert.equal(s.ctx.activeIndex,2);assert.equal(s.ctx.pendingSeek,null);
});
function loading({fail=false}={}){
 const first={id:'5SzO5zxzQLs',url:'https://www.youtube.com/watch?v=5SzO5zxzQLs',cues:[]},second={id:'M_ONGazIFsg',url:'https://www.youtube.com/watch?v=M_ONGazIFsg',cues:[]};
 const configs=[],loads=[],node={hidden:false,value:'1',innerHTML:''};
 const player={setPlaybackRate(){},loadVideoById:o=>loads.push(o)};
 const ctx={TB,Date,video:first,player:null,playerReady:false,playerLoading:false,playerId:'',pendingLessonJump:null,pendingSeek:null,closed:false,
  location:{origin:'https://example.test'},$:()=>node,youtubeAPI:async()=>{if(fail)throw Error('Offline');},lessonPlaybackStart:()=>0,resumePlayer(){},toast(){},esc:x=>x,renderMeta(){},persist(){},captureVideoProgress(){},
  YT:{Player:function(id,config){configs.push(config);return player;}}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('async function loadPlayer('),app.indexOf('function seek(')),ctx);
 return {ctx,second,configs,loads};
}
test('one-click lesson arriving before onReady reuses one player and loads the requested video',async()=>{
 const s=loading();await s.ctx.loadPlayer();s.ctx.video=s.second;await s.ctx.loadPlayer();
 assert.equal(s.configs.length,1,'do not create a second player before the first is ready');
 assert.equal(s.ctx.playerLoading,true);
 s.configs[0].events.onReady();assert.equal(s.ctx.playerReady,true);assert.equal(s.ctx.playerLoading,false);
 assert.equal(s.loads.length,1);assert.equal(s.loads[0].videoId,s.second.id);assert.equal(s.ctx.playerId,s.second.id);
});
test('failed API loading unlocks the retry without reporting a ready player',async()=>{
 const s=loading({fail:true});await s.ctx.loadPlayer();assert.equal(s.ctx.playerLoading,false);assert.equal(s.ctx.playerReady,false);assert.equal(s.configs.length,0);
});
test('the app and caption core use the same cache version so old dependencies cannot be reused',()=>{
 const html=fs.readFileSync(path.join(root,'youtube/index.html'),'utf8');
 const core=html.match(/src="core\.js\?v=([^"]+)"/),app=html.match(/data-app-src="app\.js\?v=([^"]+)"/);
 assert.ok(core);assert.ok(app);assert.equal(core[1],app[1]);
});
