'use strict';
const test=require('node:test'),assert=require('node:assert/strict');global.nlp=require('../youtube/vendor/compromise.js');global.TBGrammar=require('../youtube/grammar.js');const S=require('../youtube/sentence-forms.js');
const types=s=>[...new Set(S.analyze(s).forms.map(f=>f.type))].sort();
for(const [s,expected]of [
 ['I have a bike.',['D']],['My dog eats rice.',['D']],['I read the book.',['D']],
 ['Do you work here?',['Q']],['What are you doing?',['Q']],['Who knows that?',['Q']],['Who is Ana?',['Q']],['Can Jane help?',['Q']],
 ["You don't work here.",['D']],['You work here?',['D']],
 ['Please sit down.',['M']],["Let's go.",['M']],['Have a wonderful day.',['M']],['Wait, nothing happened.',['D','M']],
 ['If you want to learn, go watch the video.',['M']],['If you are tired, maybe you need a break.',['D']],
 ['If I had a car, what would I do?',['Q']],['Because how many colors are there?',['Q']],
 ['Because I was tired.',['S']],['Unless he calls.',['S']],['No, because I am tired.',['F','S']],
 ['Hello everyone.',['F']],['Blue.',['F']],['No problem.',['F']],['Money, food, time.',['F']],['How about that?',['F']],
 ['What a beautiful day!',['F']],['How beautiful she is!',['X']],['What a wonderful day we had!',['X']],
 ["I'm going to as a tribute.",['U']],
 ['You know, all the things that I say.',['F']],['Not a teacher, you know, a student.',['F']],
 ['The reason why I left is because I was tired.',['D']],
 ['To be quite frank with you, the work does not pay enough.',['D']],
 ['She said, "Are you ready?"',['D']],
 ["They're like are you ready?",['D']],
 ['She said, "Hello."',['D']],
 ['"Are you ready?"',[]]
])test('sentence form: '+s,()=>assert.deepEqual(types(s),expected,JSON.stringify(S.analyze(s))));
test('reported questions keep separate local spans and source scope',()=>{const s='She said, "Are you ready?"',a=S.analyze(s);assert.deepEqual(a.quotes.map(f=>f.type),['Q']);assert.ok(a.entries.some(e=>e.type==='quoted_Q'&&e.scope==='quoted'));assert.equal(s.slice(a.quotes[0].start,a.quotes[0].end),'Are you ready?');assert.ok(!a.entries.some(e=>e.type==='Q'));});
test('unquoted reenactment is marked as inferred, not as a verified literal quote',()=>{const a=S.analyze("They're like are you ready?");assert.equal(a.quotes[0].source,'inferred');assert.equal(a.quotes[0].status,'context');});
test('negative markers retain their component and quote scopes',()=>{const s='She said, "I am not ready." I never asked.',a=S.analyze(s);assert.deepEqual(a.negative.map(n=>[s.slice(n.start,n.end),n.scope]).sort(),[['never','outer'],['not','quoted']]);assert.ok(a.entries.some(e=>e.type==='negative'&&e.scope==='component'));});
test('negative reply is separate from a grammatical negation marker',()=>{assert.equal(S.analyze('No.').negative[0].kind,'response');assert.equal(S.analyze('I have no money.').negative[0].kind,'marker');});
test('declarative word order with question mark does not become inversion',()=>{const a=S.analyze('You are tired?');assert.ok(a.entries.some(e=>e.type==='D'));assert.ok(a.entries.some(e=>e.type==='declarative_question'));assert.ok(!a.entries.some(e=>e.type==='Q'));});
test('unclosed quotation is explicit instead of inventing a closing boundary',()=>{const a=S.analyze('She said, "Are you ready?');assert.equal(a.quotes.length,0);assert.ok(a.notes.length);});
test('clause structure is not inferred by counting finite verb chains',()=>assert.equal(S.analyze('I think you know.').clauseStructure.status,'not_measured'));
test('literal offsets and source remain intact with curly apostrophes and quotes',()=>{const s='She said, “I don’t know.”';const a=S.analyze(s);for(const e of [...a.forms,...a.quotes,...a.negative])assert.ok(s.slice(e.start,e.end).length);assert.equal(s,'She said, “I don’t know.”');});
test('audio annotations alone are not forced into a spoken fragment',()=>{const a=S.analyze('[inaudible]');assert.deepEqual(a.forms.map(f=>f.type),['Z']);assert.ok(a.notes.length);});
test('integration replaces only form labels, leaving the other axes unchanged',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../youtube/perspectives.js'),'utf8'),ctx={nlp:global.nlp,TBGrammar:global.TBGrammar,TBPatterns:require('../youtube/patterns.js')};vm.createContext(ctx);vm.runInContext(source,ctx);const before=ctx.TBPerspectives;
 const samples=['I have a bike.','She said, "Are you ready?"','If you are tired, call me.','You work here?',"I don't know if she is home."];
 const baseline=samples.map(s=>JSON.parse(JSON.stringify(before.analyze(s))));ctx.TBSentenceForms=S;vm.runInContext(source,ctx);
 for(let i=0;i<samples.length;i++){const a=JSON.parse(JSON.stringify(ctx.TBPerspectives.analyze(samples[i])));for(const axis of ['structures','intentions','links'])assert.deepEqual(a[axis],baseline[i][axis]);assert.ok(a.forms.every(e=>S.types[e.type]));}assert.equal(ctx.TBPerspectives.fallbackType('forms'),'Z');
});
test('worker returns quoted forms and negative component scopes',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),b=path.dirname(require.resolve('../youtube/perspectives.js')),messages=[],ctx={nlp:global.nlp,TBGrammar:global.TBGrammar,TBPatterns:require('../youtube/patterns.js'),TBSentenceForms:S,postMessage:m=>messages.push(JSON.parse(JSON.stringify(m))),setTimeout:f=>f()};vm.createContext(ctx);ctx.importScripts=(...paths)=>{for(const p of paths)if(p.startsWith('perspectives.js'))vm.runInContext(fs.readFileSync(b+'/perspectives.js','utf8'),ctx);};vm.runInContext(fs.readFileSync(b+'/perspectives-worker.js','utf8'),ctx);ctx.onmessage({data:{job:1,rows:[{id:'a',text:'She said, "I am not ready."'}]}});const f=messages[0].results[0].axes.forms;assert.ok(f.some(e=>e.type==='quoted_D'));assert.equal(f.find(e=>e.type==='negative').components[0].scope,'quoted');
});
test('cannot is an explicit negative marker even without an apostrophe',()=>assert.equal(S.analyze('I cannot go.').negative[0].text,'cannot'));
