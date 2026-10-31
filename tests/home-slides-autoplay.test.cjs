const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup({mobile=false,reduced=false}={}){
 const timers=new Map();let id=0;
 function element(){const handlers={};return {handlers,style:{},classList:{toggle(){},remove(){},add(){}},setAttribute(){},getAnimations:()=>[],animate:()=>({}),matches:()=>false,contains:()=>false,addEventListener(n,f){(handlers[n]??=[]).push(f)},fire(n,e={}){for(const f of handlers[n]||[])f(e)}}}
 const box=element(),stage=element(),pause=element(),slides=[element(),element(),element()],dots=[element(),element(),element()],doc=element(),win=element();
 doc.hidden=false;doc.activeElement=element();
 doc.querySelector=s=>({'#home-showcase':box,'.hs-stage':stage,'#hs-pause':pause,'#hs-announce':element()})[s];
 doc.querySelectorAll=s=>s==='.hs-slide'?slides:dots;
 const context={document:doc,window:win,matchMedia:q=>({matches:q.includes('reduced')?reduced:mobile}),setTimeout(f,delay){const n=++id;timers.set(n,{f,delay});return n},clearTimeout:n=>timers.delete(n),requestAnimationFrame:()=>1,Date};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../home-slides.js','utf8'),context);
 return {timers,box,stage,pause,doc,win,slides, tick(){assert.equal(timers.size,1);const [n,t]=[...timers][0];timers.delete(n);t.f()}};
}
test('desktop advances repeatedly every 2.5s, even over slide content',()=>{
 const h=setup();assert.equal([...h.timers.values()][0].delay,2500);
 h.box.fire('mousemove',{target:{closest:()=>true}});h.tick();assert.equal(h.slides[1].inert,false);h.tick();assert.equal(h.slides[2].inert,false);
});
test('phone interval stays 1.5s; interrupted touch clears on tab return',()=>{
 const h=setup({mobile:true});assert.equal([...h.timers.values()][0].delay,1500);
 h.box.fire('touchstart');assert.equal(h.timers.size,0);
 h.doc.hidden=true;h.doc.fire('visibilitychange');h.doc.hidden=false;h.doc.fire('visibilitychange');h.tick();assert.equal(h.slides[1].inert,false);
});
test('restored page resumes with one timer; explicit pause survives return',()=>{
 const h=setup();h.win.fire('pagehide');assert.equal(h.timers.size,0);h.win.fire('pageshow');h.win.fire('pageshow');assert.equal(h.timers.size,1);
 h.pause.onclick();h.doc.hidden=true;h.doc.fire('visibilitychange');h.doc.hidden=false;h.doc.fire('visibilitychange');h.win.fire('pageshow');assert.equal(h.timers.size,0);
 h.pause.onclick();h.tick();assert.equal(h.slides[1].inert,false);
});
test('pointer focus allows autoplay, keyboard focus pauses until explicit resume',()=>{
 const h=setup();h.box.fire('focusin',{target:{matches:()=>false}});assert.equal(h.timers.size,1);
 h.box.fire('focusin',{target:{matches:()=>true}});assert.equal(h.timers.size,0);
 h.pause.onclick();h.pause.onclick();assert.equal(h.timers.size,1);
});
test('reduced motion keeps autoplay disabled through tab restoration',()=>{
 const h=setup({reduced:true});h.win.fire('pageshow');assert.equal(h.timers.size,0);
});
