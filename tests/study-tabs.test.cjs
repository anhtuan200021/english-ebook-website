const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8'),html=fs.readFileSync(path.join(root,'youtube/index.html'),'utf8');
function setup(){
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,{hidden:true,setAttribute(k,v){this[k]=v;}});return nodes.get(s);};
 const buttons=['transcript','grammar','structures','forms','intentions','links'].map(id=>({id:'tab-'+id,dataset:{tab:['transcript','grammar'].includes(id)?id:'perspectives',perspectiveAxis:['transcript','grammar'].includes(id)?undefined:id},setAttribute(k,v){this[k]=v;},click(){this.onclick()},focus(){this.focused=true;}}));
 const ctx={tab:'transcript',perspectiveAxis:'structures',$:get,$$:()=>buttons,setPerspectiveAxis:axis=>ctx.perspectiveAxis=axis,startPerspectives(){},renderPerspectives(){},renderGrammar(){},requestAnimationFrame(){},alignTranscript(){}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function showTab('),app.indexOf('function tokens(')),ctx);
 return {ctx,get,buttons};
}
test('all six direct tabs select exactly one view and label the shared panel correctly',()=>{
 const s=setup();for(const button of s.buttons){button.click();assert.equal(s.buttons.filter(b=>b['aria-selected']==='true').length,1);assert.equal(button.tabIndex,0);
  if(button.dataset.tab==='perspectives'){assert.equal(s.get('#panel-perspectives').hidden,false);assert.equal(s.get('#panel-perspectives')['aria-labelledby'],button.id);assert.equal(s.ctx.perspectiveAxis,button.dataset.perspectiveAxis);}
 }
});
test('keyboard navigation wraps all six tabs instead of the old three-tab range',()=>{
 const s=setup(),event=key=>({key,preventDefault(){}});s.buttons[5].onkeydown(event('ArrowRight'));assert.equal(s.buttons[0].focused,true);
 s.buttons[0].onkeydown(event('ArrowLeft'));assert.equal(s.buttons[5]['aria-selected'],'true');s.buttons[1].onkeydown(event('End'));assert.equal(s.buttons[5]['aria-selected'],'true');s.buttons[4].onkeydown(event('Home'));assert.equal(s.buttons[0]['aria-selected'],'true');
});
test('the deferred similar-expression feature cannot switch the app into an invisible tab',()=>{
 const s=setup();s.buttons[3].click();s.ctx.showTab('words');assert.equal(s.ctx.perspectiveAxis,'forms');assert.equal(s.get('#panel-perspectives').hidden,false);assert.equal(s.get('#panel-words').hidden,true);
});
test('HTML has six primary tabs, no nested axis bar, and no similar-expression tab',()=>{
 assert.equal((html.match(/role="tab"/g)||[]).length,6);assert.doesNotMatch(html,/id="tab-(?:words|perspectives)"/);assert.doesNotMatch(html,/id="perspectiveAxes"/);
 for(const id of ['structures','forms','intentions','links'])assert.match(html,new RegExp('id="tab-'+id+'"'));
});
