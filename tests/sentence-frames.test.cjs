const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
global.nlp=require('../youtube/vendor/compromise.js');
global.TBGrammar=require('../youtube/grammar.js');
global.TBPatterns=require('../youtube/patterns.js');
global.TBFrames=require('../youtube/sentence-frames.js');
const F=global.TBFrames;
const frame=text=>F.analyze(text)[0];
test('six teaching frames have different evidence and only one primary group',()=>{
 const cases=[['She is happy.','B'],['The baby sleeps.','I'],['I wash the dishes.','O'],['She gives me a book.','D'],['You make me happy.','C'],['There is a chair outside.','E']];
 for(const [text,expected]of cases){const r=F.analyze(text);assert.equal(r.length,1);assert.equal(r[0].type,expected,text);assert.ok(r[0].forms.length,text);}
 assert.deepEqual(Object.keys(F.types),['B','I','O','D','C','E','review']);
});
test('reported contradictions and incomplete object spans are corrected',()=>{
 const pick=frame('Pick a pot and take it up.');assert.equal(pick.type,'O');assert.deepEqual(pick.parts.map(p=>'Pick a pot and take it up.'.slice(p.start,p.end)),['a pot']);
 const take=frame('Take it up.');assert.equal(take.type,'O');assert.equal('Take it up.'.slice(take.forms[0].start,take.forms[0].end),'Take it up');
 const sit=frame('I sit here.');assert.equal(sit.type,'I');assert.equal(sit.parts.length,0);
 const garden=frame('Do you have a garden?');assert.equal(garden.type,'O');assert.ok(garden.parts.some(p=>'Do you have a garden?'.slice(p.start,p.end)==='a garden'));
 const like=frame('I like to sit here and draw.');assert.equal(like.type,'O');assert.ok(like.parts.some(p=>'I like to sit here and draw.'.slice(p.start,p.end)==='to sit here and draw'));assert.ok(like.extras.some(e=>e.type==='VI'));
});
test('noun coordination never becomes a main frame and clauses keep auxiliaries',()=>{
 for(const t of ['Peppa and her family have come to help their friends today.','A few flowers and bushes will make all the difference.'])assert.ok(!F.analyze(t).some(e=>e.type==='CO'));
 assert.equal(frame('A few flowers and bushes will make all the difference.').type,'O');
 assert.equal(frame("I'm not carrying a tree up those stairs.").type,'O');
 assert.equal(frame('She is very happy.').type,'B');assert.equal(frame('Is she happy?').type,'B');
 const t='Are there any chairs?',e=frame(t);assert.equal(e.type,'E');assert.equal(t.slice(e.forms[0].start,e.forms[0].end),'Are there any chairs');
});
test('unknown words, passive and short responses are not forced into an action frame',()=>{
 for(const t of ['Thank you.','Reef Garden.','The house was built last year.','Xyzzy glorp flibbert.','I want to.','I wash the.']){const r=frame(t);assert.equal(r.type,'review',t);assert.equal(r.forms.length,0);}
});
test('corpus regressions preserve names, clauses and object complements',()=>{
 const t='I will call Mr. Bull.',call=frame(t);assert.equal(call.type,'O');assert.ok(call.parts.some(p=>t.slice(p.start,p.end)==='Mr. Bull'));
 const s='People in the street do not know we are here.',known=frame(s);assert.equal(known.type,'O');assert.ok(known.parts.some(p=>s.slice(p.start,p.end)==='we are here'));
 const soil='Peppa and her friends are making the soil flat.',flat=frame(soil);assert.equal(flat.type,'C');assert.deepEqual(flat.parts.map(p=>soil.slice(p.start,p.end)),['the soil','flat']);
 assert.equal(frame('What can I get you today?').type,'review');
 assert.equal(frame('There are a lot of stairs.').type,'E');
 const q='Oh, is that the garden?',be=frame(q);assert.equal(be.type,'B');assert.ok(be.parts.some(p=>q.slice(p.start,p.end)==='the garden'));
 for(const q of ['Where is the grass?','What are you two doing here?','And a lounge and a kitchen just like you.'])assert.equal(frame(q).type,'review',q);
 const clause='Mommy Pig tells me you have a very special visitor.',tell=frame(clause);assert.equal(tell.type,'D');assert.ok(tell.parts.some(p=>clause.slice(p.start,p.end)==='you have a very special visitor'));
 const made="Let's make it the biggest marble run ever.";assert.equal(frame(made).type,'C');
});
test('question form and tense remain separate from the primary sentence frame',()=>{
 const before=global.TBGrammar.analyze('Do you have a garden?');
 const P=require('../youtube/perspectives.js');const r=P.analyze('Do you have a garden?');assert.equal(r.structures[0].type,'O');assert.ok(r.forms.some(e=>['yesno','Y'].includes(e.type)));assert.deepEqual(global.TBGrammar.analyze('Do you have a garden?'),before);
 assert.equal(Object.keys(P.axes.structures.types).length,7);
});
test('filter counts partition the processed segments and details are collapsed',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../youtube/app.js'),'utf8'),nodes=new Map();
 const get=s=>{if(!nodes.has(s))nodes.set(s,{textContent:'',innerHTML:'',classList:{add(){},remove(){}}});return nodes.get(s);};
 const segments=['She is happy.','I wash the dishes.','Hello.'].map((text,i)=>({id:String(i),text,start:i*4,sourceCueIds:['c'+i]}));
 const c={TBFrames:F,TBPatterns:global.TBPatterns,TBPerspectives:{axes:{structures:{hint:''}}},TB:{stamp:n=>String(n)},segments,perspectiveResults:new Map(segments.map(s=>[s.id,{structures:F.analyze(s.text)}])),perspectiveFilter:'all',perspectiveLimit:80,perspectiveFailed:false,perspectiveDone:true,$:get,esc:s=>String(s),grammarMarkup:s=>s,renderCoverage(){}};c.globalThis=c;vm.createContext(c);
 vm.runInContext(src.slice(src.indexOf('function sentenceFrameDetails('),src.indexOf('function renderPerspectives(')),c);c.renderSentenceFrames();
 const filters=get('#perspectiveFilters').innerHTML;assert.equal((filters.match(/data-perspective-filter=/g)||[]).length,8);assert.match(filters,/Khung đã nhận diện/);assert.match(get('#perspectiveHint').textContent,/2 đoạn có khung · 1 cần xem thêm/);
 const cards=get('#perspectiveList').innerHTML;assert.equal((cards.match(/<article /g)||[]).length,2);assert.match(cards,/<details class="sentence-frame-details">/);assert.doesNotMatch(cards,/<details[^>]*\bopen\b/);assert.doesNotMatch(cards,/Phối hợp nhiều phần/);
 c.perspectiveFilter='review';c.renderSentenceFrames();assert.equal((get('#perspectiveList').innerHTML.match(/<article /g)||[]).length,1);assert.match(get('#perspectiveList').innerHTML,/Hello/);
});
