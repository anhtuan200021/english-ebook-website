'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
global.nlp=require('../youtube/vendor/compromise.js');global.TBGrammar=require('../youtube/grammar.js');const P=require('../youtube/patterns.js');
const entries=s=>P.analyze(s),has=(s,c)=>entries(s).some(e=>e.type===c),forms=(s,c)=>entries(s).find(e=>e.type===c)?.forms.map(f=>s.slice(f.start,f.end))||[];
for(const [s,codes] of [
 ["I want you to still remember that.",['VOI']],
 ['It makes you feel better.',['VB']],
 ['You will never catch me asking somebody.',['OI','M']],
 ['I have a hard time understanding names.',['HARD','H']],
 ["I don't know if he is home.",['WH']],
 ['If he is home, call me.',['IF','DJ']],
 ["I'm going to either just joke or say something.",['A','EITHER']],
 ['My aunt did too.',['ELL']],
 ["I'd rather stay.",['WR','M']],
 ["They're like, \"What is this?\"",['QU','W']],
 ["It's amazing.",['B']],
 ['The teacher named Ana works here.',['RR']],
 ['The house that was built last year is big.',['R']],
 ['I know what to tell you.',['WH','WTI']],
 ["It's so easy to learn.",['IT','JI']],
 ['I am already used to working here.',['AT']],
 ['I used to work here.',['UT']],
 ['She might have chosen the name.',['MP','M']],
 ['I have a bike.',['H']],
 ['I like to eat.',['VI']],
 ["I don't like that.",['NEG','O']],
 ['She calls me that.',['C']],
 ['I agree to work here.',['VI']],
 ['You got to do it.',['GT']],
 ["Let's go.",['L','DJ']],
 ['Who knows that?',['WS']],
 ['How many colors are there?',['W','E']],
 ['Have a wonderful day.',['DJ']],
 ['No problem.',['F']],
 ['What I want to say is this.',['FOC']],
 ['I want the video to be useful.',['VOI']],
 ['I like cooking.',['VG']],
 ['I want to know who I am.',['WH','WHAT']],
 ["That's why I did it.",['WHY']]
])test('specific patterns: '+s,()=>{for(const c of codes)assert.ok(has(s,c),c+' '+JSON.stringify(entries(s)));});
for(const [s,codes]of [
 ['I have a bike.',['M','DP']],
 ['I agree to Lauren Taylor.',['VI']],
 ["I don't know if he is home.",['IF']],
 ['You will never catch me asking somebody.',['VB']],
 ['It makes you feel better.',['OI']],
 ['I am already used to working here.',['UT']],
 ['The or sound.',['M','O']],
 ['My mom is a teacher.',['O']],
 ["I'm like asking you.",['VG']],
 ['What is this?',['WS','TH']],
 ['Is that your name?',['TH']],
 ['I know that.',['TH']],
 ["That's why I'm here.",['R']],
 ["I'm not like I'm a professor.",['QU']],
 ['I need to learn.',['PUR']]
])test('do not infer from a keyword: '+s,()=>{for(const c of codes)assert.equal(has(s,c),false,c+' '+JSON.stringify(entries(s)));});
test('one family per source region preserves separate literal examples',()=>{const s='I want to eat and I want to drink.',e=entries(s).filter(e=>e.type==='VI');assert.equal(e.length,1);assert.equal(e[0].forms.length,2);});
test('cross-region alternatives keep evidence local and need context',()=>{const a='I will either stay.',b='Or I will leave.';assert.ok(P.analyze(a,{next:b}).some(e=>e.type==='EITHER'));assert.ok(P.analyze(b,{previous:a}).some(e=>e.type==='EITHER'));assert.ok(!P.analyze(b).some(e=>e.type==='EITHER'));});
test('curly apostrophes, repeats and source offsets are unchanged',()=>{const s='I I don’t want you to go.';for(const e of entries(s))for(const f of e.forms)assert.equal(typeof s.slice(f.start,f.end),'string');assert.ok(has(s,'VOI'));assert.equal(s,'I I don’t want you to go.');});
test('engine has no video-specific annotations or source imports',()=>{const s=fs.readFileSync(require.resolve('../youtube/patterns.js'),'utf8');assert.doesNotMatch(s,/5SzO5zxzQLs|T0[0-9]{3}|source_sha256|source_refs|fetch\s*\(/);});
test('existing special constructions remain available beyond this video',()=>{assert.ok(has('I wish I were home.','WISH'));assert.ok(has('You had better leave.','BETTER'));});
test('integration changes only the pattern axis for the same grammar input',()=>{
 const vm=require('node:vm'),path=require('node:path'),root=path.dirname(require.resolve('../youtube/perspectives.js')),source=fs.readFileSync(root+'/perspectives.js','utf8');
 const ctx={nlp:global.nlp,TBGrammar:global.TBGrammar};vm.createContext(ctx);vm.runInContext(source,ctx);const prior=ctx.TBPerspectives;
 const samples=['If you are tired, you should take a break.','Could you please help me?',"They're like, \"What is your name?\"",'I know what to say.','Bread and butter.','I have a bike.'];
 const baseline=samples.map(s=>JSON.parse(JSON.stringify(prior.analyze(s))));ctx.TBPatterns=P;vm.runInContext(source,ctx);
 for(let i=0;i<samples.length;i++){const after=JSON.parse(JSON.stringify(ctx.TBPerspectives.analyze(samples[i])));for(const axis of ['forms','intentions','links'])assert.deepEqual(after[axis],baseline[i][axis]);assert.ok(after.structures.every(e=>P.types[e.type]));}assert.equal(ctx.TBPerspectives.axes.structures.types.O,P.types.O);
});
test('worker returns both pattern evidence and intact source IDs',()=>{
 const vm=require('node:vm'),path=require('node:path'),root=path.dirname(require.resolve('../youtube/perspectives-worker.js')),messages=[];
 const ctx={nlp:global.nlp,TBGrammar:global.TBGrammar,TBPatterns:P,postMessage:m=>messages.push(JSON.parse(JSON.stringify(m))),setTimeout:f=>f()};vm.createContext(ctx);ctx.importScripts=(...names)=>{for(const n of names)if(n.startsWith('perspectives.js'))vm.runInContext(fs.readFileSync(root+'/perspectives.js','utf8'),ctx);};vm.runInContext(fs.readFileSync(root+'/perspectives-worker.js','utf8'),ctx);ctx.onmessage({data:{job:1,rows:[{id:'source-1',text:'I want you to work.'}]}});assert.equal(messages[0].done,true);assert.equal(messages[0].results[0].id,'source-1');assert.ok(messages[0].results[0].axes.structures.some(e=>e.type==='VOI'));
});
test('export snapshot distinguishes unprocessed regions from analyzed empty results',()=>{
 const vm=require('node:vm'),app=fs.readFileSync(require.resolve('../youtube/app.js'),'utf8'),ctx={perspectiveDone:false,perspectiveFailed:false,perspectiveResults:new Map([['a',{structures:P.analyze('I want to work.')}]]),segments:[{id:'a',text:'I want to work.',start:0,cueIds:['c1']},{id:'b',text:'Hello.',start:5,cueIds:['c2']}],TBPatterns:P};vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function perspectiveSnapshot('),app.indexOf("$('#exportLessonBtn').onclick=")),ctx);const result=JSON.parse(JSON.stringify(ctx.perspectiveSnapshot()));assert.equal(result.complete,false);assert.equal(result.processed,1);assert.equal(result.units[1].processed,false);assert.equal(result.units[1].axes,null);assert.equal(result.units[0].axes.structures.find(e=>e.type==='VI').forms.length,1);
});
test('spoken like before a base action extends evidence to the action, not to like alone',()=>{
 const s="I'm going to like fully explain it.";assert.ok(forms(s,'A').some(t=>t.endsWith('explain')));assert.ok(!forms(s,'A').some(t=>t.endsWith('like')));
});
test('preposition listen to does not become a purpose frame from filler like',()=>assert.equal(has('I listen to like one thing.','PUR'),false));
test('be before a noun subject in a continuous question is auxiliary, not an extra copular frame',()=>assert.equal(has('What is this lady talking about?','B'),false));
test('an omitted modal action remains available with an ellipsis warning',()=>{assert.ok(has("I probably won't.",'M'));assert.ok(has("I probably won't.",'ELL'));});
