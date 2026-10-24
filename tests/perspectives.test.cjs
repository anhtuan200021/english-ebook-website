const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),P=require(path.join(root,'youtube/perspectives.js')),TB=require(path.join(root,'youtube/core.js'));
global.nlp=require(path.join(root,'youtube/vendor/compromise.js'));global.TBGrammar=require(path.join(root,'youtube/grammar.js'));
const has=(r,axis,type)=>r[axis].some(e=>e.type===type);
test('one sentence has independent grammar, form, intention and connector hints',()=>{
 const r=P.analyze('If you are tired, you should take a break.');
 assert.ok(has(r,'structures','modal'));assert.ok(has(r,'structures','conditional'));assert.ok(has(r,'intentions','advice'));assert.ok(has(r,'links','condition'));
 assert.equal(Object.keys(P.axes).length,4);assert.equal('tense' in P.axes,false);
});
test('a request remains a question in form, while its suggested intention is help',()=>{
 const r=P.analyze('Could you please help me?');assert.ok(has(r,'forms','yesno'));assert.ok(has(r,'intentions','request'));assert.equal(has(r,'intentions','question'),false);
 const suggestion=P.analyze("Why don't you take a break?");assert.ok(has(suggestion,'forms','wh'));assert.ok(has(suggestion,'intentions','suggestion'));
});
test('contractions preserve source offsets and negative questions can carry two labels',()=>{
 const text='Don’t you want to learn?',r=P.analyze(text);assert.ok(has(r,'forms','negative'));assert.ok(has(r,'forms','yesno'));assert.ok(has(r,'structures','infinitive'));
 for(const entries of Object.values(r))for(const entry of entries)for(const f of entry.forms){assert.ok(f.start>=0&&f.end<=text.length&&f.end>f.start);assert.ok(text.slice(f.start,f.end));}
});
test('used to and be used to are distinguished without relabeling their tense',()=>{
 const habit=P.analyze('I used to work here.'),accustomed=P.analyze("I'm used to working here.");
 assert.ok(has(habit,'structures','used_to'));assert.equal(has(habit,'structures','accustomed'),false);
 assert.ok(has(accustomed,'structures','accustomed'));assert.equal(has(accustomed,'structures','used_to'),false);
});
test('obvious adjective states and complement clauses are not confidently labeled passive or relative',()=>{
 assert.equal(has(P.analyze("I'm tired."),'structures','passive'),false);
 assert.equal(has(P.analyze('I think that you are right.'),'structures','relative'),false);
 assert.ok(has(P.analyze('The person who called is my friend.'),'structures','relative'));
 assert.ok(has(P.analyze('The house was built last year.'),'structures','passive'));
});
test('connectors separate cause, result, purpose, contrast and clarification',()=>{
 for(const [text,type] of [['I stayed because I was tired.','reason'],['It was late, so I went home.','result'],['I speak slowly so that you can understand.','purpose'],['I was tired, but I kept going.','contrast'],['In other words, we need more time.','clarify'],['First, wash your hands. Then, eat.','sequence']])assert.ok(has(P.analyze(text),'links',type),text);
 assert.equal(has(P.analyze("I'm so tired."),'links','result'),false);assert.equal(has(P.analyze('Bread and butter.'),'links','addition'),true);
 assert.equal(has(P.analyze("I don't know if he is home."),'structures','conditional'),false);
});
test('ambiguous since/while remain context-dependent and unknown text is not assigned a made-up intention',()=>{
 assert.ok(has(P.analyze('While I waited, I read.'),'links','ambiguous'));
 const r=P.analyze('The sky looks different today.');assert.ok(has(r,'intentions','information'));assert.equal(r.intentions.find(e=>e.type==='information').status,'context');
});
test('long input and unknown text preserve the original content and return bounded source spans',()=>{
 const text=Array(300).fill('I think you should rest because you are tired.').join(' '),r=P.analyze(text);
 assert.equal(typeof r,'object');for(const entries of Object.values(r))for(const entry of entries)for(const f of entry.forms)assert.ok(f.end<=text.length);
});
const app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8');
function ui(){
 const nodes=new Map(),workers=[],seeks=[],cues=TB.parse('0:00 Could you help me?\n0:04 I think we should rest because we are tired.\n0:10 Thanks!').cues;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:''});return nodes.get(id);};
 const ctx={renderCoverage(){},TB,TBPerspectives:P,Map,readingGroups:TB.sentences(cues),tab:'perspectives',filter:'past_simple',$:get,esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),grammarMarkup:s=>s,seek:s=>seeks.push(s),Worker:class{constructor(){workers.push(this)}terminate(){this.terminated=true}postMessage(m){this.message=m;}}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf("let perspectiveAxis="),app.indexOf('function norm(t)')),ctx);
 const deliver=(w=workers.at(-1))=>w.onmessage({data:{job:w.message.job,results:w.message.rows.map(s=>({id:s.id,axes:P.analyze(s.text)})),done:true,count:3,total:3}});
 return {ctx,get,workers,seeks,deliver};
}
test('new filters count unique sentences, switch axes without changing the tense filter, and seek the source cue',()=>{
 const s=ui();s.ctx.startPerspectives();s.deliver();assert.match(s.get('#perspectiveFilters').innerHTML,/Tất cả <span>3<\/span>/);
 s.ctx.setPerspectiveAxis('intentions');s.ctx.renderPerspectives();
 assert.equal(s.ctx.filter,'past_simple');assert.match(s.get('#perspectiveFilters').innerHTML,/Nhờ vả/);
 s.get('#perspectiveFilters').onclick({target:{closest:()=>({dataset:{perspectiveFilter:'request'}})}});
 assert.match(s.get('#perspectiveList').innerHTML,/Could you help me/);assert.doesNotMatch(s.get('#perspectiveList').innerHTML,/Thanks/);
 const source=s.ctx.readingGroups[0];s.get('#perspectiveList').onclick({target:{closest:selector=>selector==='[data-perspective-seek]'?{dataset:{perspectiveSeek:source.id}}:null}});
 assert.equal(s.seeks[0].id,source.sourceCueIds[0]);assert.equal(s.seeks[0].start,source.start);
});
test('late worker results from another video cannot populate the current lesson',()=>{
 const s=ui();s.ctx.startPerspectives();const old=s.workers[0];s.ctx.resetPerspectives();assert.equal(old.terminated,true);s.deliver(old);
 assert.equal(vm.runInContext('perspectiveResults.size',s.ctx),0);s.deliver();assert.ok(vm.runInContext('perspectiveResults.size',s.ctx)>0);
});
test('a failed perspective worker leaves a retry and does not change tense controls',()=>{
 const s=ui();s.ctx.startPerspectives();s.workers[0].onerror();assert.match(s.get('#perspectiveList').innerHTML,/data-perspective-retry/);assert.equal(s.ctx.filter,'past_simple');
});
test('the new panel is separate from the unchanged tense overview',()=>{
 const html=fs.readFileSync(path.join(root,'youtube/index.html'),'utf8');
 assert.match(html,/id="tab-grammar"/);assert.match(html,/id="tab-structures"/);assert.match(html,/id="tenseFilters"/);assert.doesNotMatch(html,/id="perspectiveAxes"/);
 assert.match(app,/\['all','Tất cả',segments.length\]/);
});
test('worker returns progressive results and drops queued work after a new lesson arrives',()=>{
 const queued=[],messages=[];const ctx={TBPerspectives:P,importScripts(){},postMessage:m=>messages.push(m),setTimeout:fn=>queued.push(fn)};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'youtube/perspectives-worker.js'),'utf8'),ctx);
 ctx.onmessage({data:{job:1,rows:Array.from({length:65},(_,i)=>({id:'old'+i,text:'You should rest.'}))}});
 assert.equal(messages[0].results.length,30);assert.equal(messages[0].done,false);
 ctx.onmessage({data:{job:2,rows:[{id:'new',text:'Thanks!'}]}});queued.forEach(fn=>fn());
 assert.equal(messages.length,2);assert.equal(messages[1].job,2);assert.equal(messages[1].done,true);assert.equal(messages[1].results[0].id,'new');
});
test('ordinary complete clauses have basic structures, including noun subjects and be/have complements',()=>{
 for(const [text,type] of [['I work every day.','basic_clause'],['My mom cleans the house.','basic_clause'],['The sky looks different today.','basic_clause'],["I'm tired.",'be_complement'],['I have a bike.','have_noun'],['There are two chairs.','existential']]){
  const r=P.analyze(text);assert.ok(has(r,'structures',type),text);assert.ok(has(r,'forms','statement'),text);assert.equal(has(r,'structures','review'),false);
 }
 const obligation=P.analyze('I have to go.');assert.ok(has(obligation,'structures','have_to'));assert.equal(has(obligation,'structures','have_noun'),false);
});
test('phrases and nonfinite clauses are described without inventing a tense or an independent clause',()=>{
 assert.ok(has(P.analyze('A lot of interesting ideas.'),'structures','phrase'));
 assert.ok(has(P.analyze('Walking down the street.'),'structures','nonfinite'));
 assert.ok(has(P.analyze('To be honest.'),'structures','nonfinite'));
 const dependent=P.analyze('Because I was tired.');assert.ok(has(dependent,'forms','dependent'));assert.equal(has(dependent,'forms','statement'),false);
});
test('a missing explicit connector and a genuinely unresolved structure are different states',()=>{
 const plain=P.analyze('I work every day.');assert.ok(has(plain,'links','no_marker'));assert.equal(plain.links[0].status,'not_detected');assert.ok(has(plain,'structures','basic_clause'));
 const unclear=P.analyze('...');assert.ok(has(unclear,'structures','review'));assert.equal(unclear.structures[0].status,'review');assert.ok(has(unclear,'intentions','context'));
});
test('ordinary information is only a contextual intention hint, not an asserted specific speech act',()=>{
 const r=P.analyze('The room is cold.');const hint=r.intentions.find(e=>e.type==='information');assert.ok(hint);assert.equal(hint.status,'context');assert.equal(has(r,'intentions','request'),false);
 assert.ok(has(P.analyze('Hello!'),'intentions','greeting'));assert.ok(has(P.analyze('Please keep going.'),'intentions','encouragement'));
});
test('multiple markers in one category cannot double-count a sentence',()=>{
 const r=P.analyze('I work and I also study.');assert.equal(r.links.filter(e=>e.type==='addition').length,1);
 assert.ok(r.links[0].forms.length>=2);
 for(const axis of Object.values(r))assert.equal(new Set(axis.map(e=>e.type)).size,axis.length);
});
test('all fallback labels have a precise meaning instead of a generic unmatched bucket',()=>{
 for(const axis of Object.keys(P.axes)){const fallback=P.fallbackType(axis);assert.ok(P.axes[axis].types[fallback]);assert.ok(P.descriptions[fallback]);}
 assert.doesNotMatch(app,/Chưa khớp mẫu/);assert.match(app,/Dạng khác \/ chưa rõ thì/);
});
