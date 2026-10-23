const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');global.TB=require(path.join(root,'youtube/core.js'));const TB=global.TB,Data=require(path.join(root,'youtube/data.js'));
const A='M65-VCoN14g',B='5SzO5zxzQLs';
const lesson=id=>({id,url:'https://www.youtube.com/watch?v='+id,title:'Podcast '+id,cues:TB.parse('0:00 Hello.\n0:05 Keep going.').cues,labels:{},lastPosition:123,favorite:false,partial:true,format:'YouTube · tiện ích',updated:1});
const saved=(id,videoId)=>({id,videoId,text:'Keep going.',title:'Podcast',url:'https://www.youtube.com/watch?v='+videoId,start:5,note:'',kind:'sentence'});
const state=()=>({version:1,videos:[lesson(B)],saved:[saved('other',B)],words:[],settings:{font:21},current:B});
test('portable export contains only one video and its saved sentences, preserving cue IDs and timing',()=>{
 const v=lesson(A),file=Data.lessonFile(v,[saved('one',A),saved('other',B)]),roundtrip=Data.readLesson(JSON.parse(JSON.stringify(file)));
 assert.equal(file.type,'tuanbong-lesson');assert.equal(file.saved.length,1);assert.equal(roundtrip.videos.length,1);
 assert.deepEqual(roundtrip.videos[0].cues,v.cues);assert.equal(roundtrip.videos[0].lastPosition,123);assert.equal(roundtrip.videos[0].partial,true);
 assert.equal('settings' in file,false);assert.equal('words' in file,false);
});
test('import opens the selected video while preserving other lessons, saved sentences and local settings',()=>{
 const before=state(),file=Data.lessonFile(lesson(A),[saved('one',A)]),after=Data.mergeLesson(before,file);
 assert.equal(after.current,A);assert.equal(after.videos.length,2);assert.equal(after.saved.length,2);assert.equal(after.settings.font,21);
 assert.deepEqual(after.videos.find(v=>v.id===B),Data.validate(before).videos[0]);assert.equal(before.videos.length,1);
});
test('reimport updates one video without duplicating it and preserves an existing favorite',()=>{
 const before=state();before.videos.push({...lesson(A),favorite:true,lastPosition:456});
 const file=Data.lessonFile(lesson(A),[saved('one',A)]),once=Data.mergeLesson(before,file),twice=Data.mergeLesson(once,file);
 assert.equal(twice.videos.length,2);assert.equal(twice.saved.length,2);const v=twice.videos.find(v=>v.id===A);assert.equal(v.lastPosition,123);assert.equal(v.favorite,true);
});
test('wrong file types, broken cue timing, mismatched video IDs, and foreign saved sentences are rejected',()=>{
 const good=Data.lessonFile(lesson(A),[]);
 for(const bad of [{version:1,videos:[lesson(A)],saved:[],words:[]},{...good,version:2},{...good,video:{...good.video,id:B}},{...good,video:{...good.video,cues:[]}},{...good,saved:[saved('foreign',B)]},{...good,video:{...good.video,cues:[{id:'x',text:'Bad',start:5,end:1}]}},{...good,saved:[{...saved('one',A),url:'javascript:alert(1)'}]}])assert.throws(()=>Data.readLesson(bad));
});
test('a conflicting saved ID cannot overwrite a sentence belonging to another lesson',()=>{
 const before=state(),snapshot=JSON.stringify(before),file=Data.lessonFile(lesson(A),[saved('other',A)]);
 assert.throws(()=>Data.mergeLesson(before,file),/trùng/);assert.equal(JSON.stringify(before),snapshot);
});
const app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8');
function ui({fail=false}={}){
 const nodes=new Map(),writes=[],downloads=[],messages=[],opened=[],used=[];
 const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',disabled:false,textContent:'',addEventListener(){},click(){},close(){this.closed=true;}});return nodes.get(s);};
 const original=state();const ctx={TB,TBData:Data,state:original,video:original.videos[0],dataReady:true,pendingLessonJump:null,saveTimer:null,$:get,download:(...x)=>downloads.push(x),toast:t=>messages.push(t),captureVideoProgress(){},openDialog:id=>opened.push(id),useVideo:v=>used.push(v.id),updateSaved(){},clearTimeout(){},TBStore:{set:async s=>{if(fail)throw Error('Storage full');writes.push(s);}}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('// A portable lesson'),app.indexOf("$('#exportBtn').onclick=")),ctx);
 const select=async file=>{const input={files:[file],value:'lesson.json'};await get('#lessonFile').onchange({target:input});return input;};
 return {ctx,get,writes,downloads,messages,opened,used,original,select,submit:()=>get('#lessonImportForm').onsubmit({preventDefault(){}})};
}
test('selecting a valid lesson only previews; confirmation stores it and opens the correct video',async()=>{
 const s=ui(),file=Data.lessonFile(lesson(A),[saved('one',A)]),input=await s.select({size:500,text:async()=>JSON.stringify(file)});
 assert.equal(s.writes.length,0);assert.equal(s.ctx.state,s.original);assert.equal(s.opened[0],'#lessonImportDialog');assert.equal(input.value,'');
 assert.equal(s.get('#lessonFileTitle').textContent,lesson(A).title);await s.submit();
 assert.equal(s.writes.length,1);assert.equal(s.ctx.state.current,A);assert.deepEqual(s.used,[A]);assert.equal(s.get('#lessonImportDialog').closed,true);
});
test('invalid or oversized files do not change the library or open a preview',async()=>{
 const s=ui();await s.select({size:30000000,text:async()=>{throw Error('Must not read')}});await s.select({size:10,text:async()=>'{broken'});
 assert.equal(s.writes.length,0);assert.equal(s.opened.length,0);assert.equal(s.ctx.state,s.original);
});
test('failed storage leaves the original library active and allows a retry',async()=>{
 const s=ui({fail:true});await s.select({size:500,text:async()=>JSON.stringify(Data.lessonFile(lesson(A),[]))});await s.submit();
 assert.equal(s.ctx.state,s.original);assert.equal(s.used.length,0);assert.equal(s.get('#lessonFileSubmit').disabled,false);assert.match(s.get('#lessonFileError').textContent,/Storage full/);
});
