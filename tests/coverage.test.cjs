const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../youtube/coverage.js'),TB=require('../youtube/core.js'),P=require('../youtube/perspectives.js');
global.nlp=require('../youtube/vendor/compromise.js');global.TBGrammar=require('../youtube/grammar.js');
const app=fs.readFileSync(__dirname+'/../youtube/app.js','utf8');
test('audit partitions unique sentences, never mistakes pending work for unclassified text',()=>{
 const rows=['a','b','c','d','e','f','a'].map(id=>({id})),data={a:[{type:'present_simple'}],b:[{type:'uncertain'}],c:[{type:'other',confidence:'review'}],d:[{type:'modal'}],e:[]};
 const s=C.summarize(rows,r=>data[r.id],'grammar');assert.equal(s.total,6);assert.equal(s.processed,5);assert.deepEqual(s.counts,{pattern:1,review:2,context:0,not_detected:0,no_finite:1,other_form:1,pending:1});assert.equal(Object.values(s.counts).reduce((a,b)=>a+b),s.total);
});
test('mixed labels count once; any review evidence is retained rather than hidden by a match',()=>{
 assert.equal(C.status([{type:'present_simple'},{type:'past_simple'}],'grammar'),'pattern');
 assert.equal(C.status([{type:'present_simple'},{type:'past_simple',confidence:'review'}],'grammar'),'review');
 assert.equal(C.status([{type:'modal'},{type:'present_simple'}],'grammar'),'pattern');
});
test('context and absent explicit connector are not presented as grammar errors',()=>{
 assert.equal(C.status([{type:'information',status:'context'}],'intentions'),'context');
 assert.equal(C.status([{type:'no_marker',status:'not_detected'}],'links'),'not_detected');
 assert.equal(C.status([{type:'review'}],'structures'),'review');
});
test('all five analyses use identical sentence units, unique tense counts and stable original-cue seeks',()=>{
 const cues=TB.parse('0:00 I work. She is resting.\n0:06 I was tired, but I have finished my work.\n0:12 Thanks!').cues,nodes=new Map(),get=k=>{if(!nodes.has(k))nodes.set(k,{textContent:'',innerHTML:''});return nodes.get(k)},workers=[];
 const legacy=TB.group(cues),last=legacy.find(g=>g.text==='Thanks!');
 const ctx={TENSE_HELP:{},TB,Set,Map,TYPES:global.TBGrammar.TYPES,video:{cues,labels:{[last.id+'/g0']:'imperative'}},job:0,worker:null,tab:'grammar',activeIndex:0,$:get,esc:String,renderCoverage(){},resetPerspectives(){},renderReadingContext(){},toast(){},Worker:class{constructor(){workers.push(this)}postMessage(m){this.message=m}terminate(){}}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function analyze(){'),app.indexOf("$('#tenseFilters').onclick")),ctx);
 ctx.analyze();const rows=workers[0].message.rows,groups=TB.sentences(cues);assert.equal(rows.length,groups.length);assert.deepEqual(Array.from(rows,r=>r.text),groups.map(s=>s.text));
 workers[0].onmessage({data:{job:ctx.job,results:rows.map(r=>({id:r.id,entries:global.TBGrammar.analyze(r.text)})),done:true}});
 assert.match(get('#tenseFilters').innerHTML,new RegExp('Tất cả <span>'+ctx.grammarRows.reduce((n,r)=>n+Math.max(1,r.entry.forms.length),0)+'</span>'));
 const past=ctx.grammarRows.filter(r=>ctx.typeOf(r)==='past_simple');assert.ok(past.length);assert.ok(past.every(r=>cues.some(c=>c.id===r.s.cueIds[0])));
 assert.equal(ctx.typeOf(ctx.grammarRows.find(r=>r.s.text==='Thanks!')),'imperative');
 for(const axis of Object.keys(P.axes)){const data=new Map(groups.map(s=>[s.id,P.analyze(s.text)[axis]])),audit=C.summarize(groups,s=>data.get(s.id),axis);assert.equal(audit.total,rows.length);assert.equal(audit.processed,rows.length);}
});
test('same-tense multiple verb phrases retain their individual counts',()=>{
 const render=app.slice(app.indexOf('function grammarEntryCount('),app.indexOf("$('#tenseFilters').onclick")),nodes=new Map(),get=k=>{if(!nodes.has(k))nodes.set(k,{});return nodes.get(k)};
 const s={id:'s1',text:'I cook and I clean.',start:0},entry={type:'present_simple',forms:[{start:2,end:6}]};
 const ctx={TENSE_HELP:{},grammarRows:[{s,entry},{s,entry}],segments:[s],grammarProcessed:new Set(['s1']),Map,Set,TYPES:{present_simple:'Hiện tại đơn'},filter:'all',grammarLimit:100,typeOf:r=>r.entry.type,renderCoverage(){},groupGrammarRows:()=>[],esc:String,$:get};
 vm.createContext(ctx);vm.runInContext(render,ctx);ctx.renderGrammar();assert.match(get('#tenseFilters').innerHTML,/Hiện tại đơn <span>2<\/span>/);assert.match(get('#tenseFilters').innerHTML,/Tất cả <span>2<\/span>/);
});
test('collapsed audit explicitly refuses to invent an accuracy percentage',()=>{
 const el={};
 const ctx={document:{querySelector:()=>el}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../youtube/coverage.js','utf8'),ctx);ctx.renderCoverage('#audit',[{id:'a'}],()=>[{type:'present_simple'}],'grammar');assert.match(el.innerHTML,/Chưa đo tỷ lệ đúng\/sai/);assert.match(el.innerHTML,/100%/);
});
test('coordinated verb phrases remain distinct even when the grammar engine groups their entries',()=>{
 const source='I eat and drink.',entry=global.TBGrammar.analyze(source)[0];assert.equal(entry.forms.length,2);
 const ctx={TYPES:global.TBGrammar.TYPES,esc:String,typeOf:r=>r.entry.type};vm.createContext(ctx);
 vm.runInContext(app.slice(app.indexOf('function groupGrammarRows('),app.indexOf('function grammarMarkup(')),ctx);
 vm.runInContext(app.slice(app.indexOf('function grammarEntryCount('),app.indexOf('function renderGrammar(){')),ctx);
 assert.equal(ctx.grammarEntryCount(entry),2);const grouped=ctx.groupGrammarRows([{s:{id:'1',text:source,start:0},entry}]);
 const html=ctx.grammarDetails(grouped[0]);assert.match(html,/<strong>eat<\/strong>/);assert.match(html,/<strong>drink<\/strong>/);assert.equal((html.match(/Hiện tại đơn/g)||[]).length,2);
});
test('a sentence with two different tenses exposes both phrases and both labels',()=>{
 const source='I was tired, but I have finished my work.',entries=global.TBGrammar.analyze(source),ctx={TYPES:global.TBGrammar.TYPES,esc:String,typeOf:r=>r.entry.type};vm.createContext(ctx);
 vm.runInContext(app.slice(app.indexOf('function groupGrammarRows('),app.indexOf('function grammarMarkup(')),ctx);
 vm.runInContext(app.slice(app.indexOf('function grammarEntryCount('),app.indexOf('function renderGrammar(){')),ctx);
 const grouped=ctx.groupGrammarRows(entries.map(entry=>({s:{id:'1',text:source,start:0},entry}))),html=ctx.grammarDetails(grouped[0]);
 assert.match(html,/<strong>was tired<\/strong>/);assert.match(html,/Quá khứ · đã xảy ra/);assert.match(html,/<strong>have finished<\/strong>/);assert.match(html,/Tới nay · đã làm \/ trải nghiệm/);
});
