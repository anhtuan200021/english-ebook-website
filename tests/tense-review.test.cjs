'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
global.TB=require('../youtube/core.js');global.nlp=require('../youtube/vendor/compromise.js');const G=require('../youtube/grammar.js'),Data=require('../youtube/data.js');
const flat=s=>G.analyze(s).flatMap(e=>e.forms.map(f=>({...f,type:e.type})));
for(const [text,form,type] of [
 ["Okay, let's go.","let's go",'imperative'],
 ["Let's clean the room.","Let's clean",'imperative'],
 ['You got to do it.','got to do','present_simple'],
 ['Have a great day.','Have','imperative'],
 ["I've since realized the problem.","I've since realized",'present_perfect'],
 ["I'm going to either just joke or say something.","I'm going to either just joke",'future_going_to'],
 ['What is this lady talking about?','is this lady talking','present_continuous'],
 ['What are those children doing?','are those children doing','present_continuous'],
 ["My brain works.",'works','present_simple'],
 ['She told me what my mom said.','said','past_simple'],
 ['I loved the name but hated the idea.','hated','past_simple'],
 ['All you want is a simple answer.','want','present_simple'],
 ['Nothing happened.','happened','past_simple'],
 ["I'm like please ask me something.",'ask','imperative'],
 ["If you want to learn, go watch the video.",'go watch','imperative'],
 ['They like.','like','present_simple'],
 ['You guys really like that.','like','present_simple'],
 ['You listen to like one thing or watch like one thing.','watch','present_simple']
])test('reviewed tense: '+text,()=>assert.ok(flat(text).some(f=>f.text===form&&f.type===type),JSON.stringify(flat(text))));
for(const text of ['Something like that.','Laa or Lorenna or whatever, something like that.','The or sound.','The name and the sound.'])test('noun/filler is not an extra finite action: '+text,()=>assert.equal(flat(text).length,0,JSON.stringify(flat(text))));
test('nonfinite help complement does not introduce a new present-simple clause',()=>assert.deepEqual(flat('My videos are good to help you practice speaking.').map(f=>f.text),['are']));
test('malformed be plus finite verb stays uncertain',()=>assert.ok(flat("He's just thinks he's right.").some(f=>f.text==="He's just thinks"&&f.type==='uncertain')));
test('going-to without a recognized action stays uncertain',()=>assert.ok(flat("I'm going to as a tribute.").some(f=>f.type==='uncertain')));
test('same-form words remain uncertain without sufficient context',()=>assert.ok(flat('I hit the ball.').some(f=>f.type==='uncertain')));
test('repeated opening keeps all original source and marks review',()=>{const s='She thought it she thought it sounded good.',r=G.analyze(s);assert.equal(r[0].confidence,'review');assert.equal(r.filter(e=>e.forms.some(f=>f.text==='thought')).length,2);for(const e of r)for(const f of e.forms)assert.equal(s.slice(f.start,f.end),f.text);});
test('snapshot includes incomplete status, all spans and effective labels, and reimports safely',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../youtube/app.js'),'utf8'),ctx={grammarRows:[{s:{id:'u1'},entry:{id:'g1',type:'present_simple',forms:[{start:2,end:6,text:'work'}]}}],grammarProcessed:new Set(['u1']),segments:[{id:'u1',text:'I work.',start:0,cueIds:['c1']},{id:'u2',text:'Hello.',start:4,cueIds:['c2']}],typeOf:()=> 'past_simple'};vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function grammarSnapshot('),app.indexOf("$('#exportLessonBtn').onclick=")),ctx);
 const snapshot=JSON.parse(JSON.stringify(ctx.grammarSnapshot()));assert.equal(snapshot.complete,false);assert.equal(snapshot.processed,1);assert.equal(snapshot.total,2);assert.equal(snapshot.units[0].entries[0].type,'past_simple');assert.deepEqual(snapshot.units[0].sourceCueIds,['c1']);assert.equal(snapshot.units[1].processed,false);assert.deepEqual(snapshot.units[1].entries,[]);
 ctx.grammarProcessed.add('u2');assert.equal(ctx.grammarSnapshot().complete,true);
 const video={id:'5SzO5zxzQLs',title:'Test',url:'https://www.youtube.com/watch?v=5SzO5zxzQLs',cues:[{id:'c1',start:0,end:4,text:'I work.',estimated:true}],labels:{},format:'SRT',partial:true,updated:Date.now()};const portable=Data.lessonFile(video,[]);portable.analysis=snapshot;assert.equal(Data.readLesson(portable).videos[0].cues[0].text,'I work.');
});
test('dependent verbs remain available as details without inflating finite counts',()=>{
 const s='I want to help you practice speaking.',a=G.inspect(s);assert.deepEqual(a.entries.flatMap(e=>e.forms.map(f=>f.text)),['want']);assert.ok(a.details.some(d=>d.text==='to help'&&d.type==='nonfinite'));assert.ok(a.details.some(d=>d.text==='practice'&&d.type==='nonfinite'));assert.ok(a.details.some(d=>d.text==='speaking'&&d.type==='dependent_ing'));for(const d of a.details)assert.equal(s.slice(d.start,d.end),d.text);
});
test('sound annotations and immediate restarts preserve source offsets',()=>{
 const s='I I [clears throat] work here.',a=G.inspect(s);assert.equal(a.analysisText.length,s.length);assert.ok(a.details.some(d=>d.type==='restart'));assert.ok(a.details.some(d=>d.type==='sound_note'));for(const d of a.details)assert.equal(s.slice(d.start,d.end),d.text);
});
test('worker returns supplementary detail alongside finite classification',()=>{
 const messages=[],ctx={TBGrammar:G,importScripts(){},postMessage:m=>messages.push(m),setTimeout:f=>f()};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../youtube/grammar-worker.js'),'utf8'),ctx);ctx.onmessage({data:{job:1,rows:[{id:'a',text:'I want to work.'}]}});assert.equal(messages[0].done,true);assert.equal(messages[0].results[0].details[0].text,'to work');assert.equal(messages[0].results[0].entries[0].type,'present_simple');
});
