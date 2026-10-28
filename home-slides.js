(()=>{const box=document.querySelector('#home-showcase');if(!box)return;const stage=document.querySelector('.hs-stage'),slides=[...document.querySelectorAll('.hs-slide')],dots=[...document.querySelectorAll('.hs-choice')],pause=document.querySelector('#hs-pause'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let index=0,timer,manual=reduced.matches,hover=false,focus=false,touchX=null,lastSwipe=0,touching=false,touchStartedAt=0,lastTouchAt=0;
// Measure every slide's natural content once, so autoplay cannot move the page.
let fitFrame=0,lastLayoutWidth=window.innerWidth,inView=true;
function fitOpeningSlide(){
 if(!matchMedia('(max-width:760px)').matches){stage.style.height='';return}
 const px=value=>parseFloat(value)||0;
 let needed=580;
 for(const slide of slides){
  if(slide.classList.contains('hs-intro')){
   needed=Math.max(needed,Math.ceil(slide.getBoundingClientRect().height));
   continue;
  }
  const copy=slide.querySelector('.hs-copy'),cs=getComputedStyle(copy),ss=getComputedStyle(slide);
  let content=px(cs.paddingTop)+px(cs.paddingBottom);
  for(const child of copy.children){
   const style=getComputedStyle(child);
   if(style.display==='none')continue;
   content+=child.getBoundingClientRect().height+(child.matches('.hs-cta')?0:px(style.marginTop))+px(style.marginBottom);
  }
  needed=Math.max(needed,Math.ceil(slide.querySelector('.hs-media').getBoundingClientRect().height+content+px(ss.paddingTop)+px(ss.paddingBottom)));
 }
 const height=needed+'px';
 if(stage.style.height!==height)stage.style.height=height;
}
function scheduleFit(){
 if(fitFrame)return;
 fitFrame=requestAnimationFrame(()=>{fitFrame=0;fitOpeningSlide()});
}
if(typeof ResizeObserver!=='undefined'){
 const observer=new ResizeObserver(scheduleFit);
 // Do not observe stretched copy containers: their height is an output of this calculation.
 for(const slide of slides){
  observer.observe(slide.querySelector('.hs-media'));
  for(const child of slide.querySelector('.hs-copy').children)observer.observe(child);
 }
}
window.addEventListener('resize',()=>{
 // Safari's expanding/collapsing toolbar changes height without changing text layout.
 if(window.innerWidth===lastLayoutWidth)return;
 lastLayoutWidth=window.innerWidth;scheduleFit();sync();
});
document.fonts?.ready.then(scheduleFit);
if(typeof IntersectionObserver!=='undefined'){
 const visibility=new IntersectionObserver(entries=>{
  const visible=entries[0].isIntersecting;
  if(visible!==inView){inView=visible;sync()}
 },{threshold:0});
 visibility.observe(box);
}
function sync(){scheduleFit();clearTimeout(timer);pause.textContent=manual?'Bật tự chạy':'Tạm dừng tự chạy';pause.setAttribute('aria-label',pause.textContent);pause.setAttribute('aria-pressed',String(manual));if(!manual&&!hover&&!focus&&!touching&&inView&&!document.hidden)timer=setTimeout(()=>show(index+1,1,false),matchMedia('(max-width:760px)').matches?1500:3000)}
function show(n,direction=1,user=true){const next=(n+slides.length)%slides.length;if(next===index){sync();return}const previous=slides[index];slides.forEach(s=>{s.getAnimations().forEach(a=>a.cancel());s.classList.remove('hs-leaving')});index=next;slides.forEach((s,i)=>{s.classList.toggle('hs-active',i===index);s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index))});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===index)));if(!reduced.matches){previous.classList.add('hs-leaving');const out=previous.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX('+(-direction*65)+'px)',opacity:0}],{duration:420,easing:'ease',fill:'none'});out.onfinish=()=>previous.classList.remove('hs-leaving');slides[index].animate([{transform:'translateX('+(direction*65)+'px)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:420,easing:'ease',fill:'none'})}if(user)document.querySelector('#hs-announce').textContent=dots[index].getAttribute('aria-label');sync()}
dots.forEach((d,i)=>d.onclick=()=>show(i,i<index?-1:1));pause.onclick=()=>{manual=!manual;sync()};
function contentTarget(t){return t.closest('.hs-copy,img,.hs-tag,.hs-bigmark,a,button,.hs-controls')}
stage.addEventListener('click',e=>{if(contentTarget(e.target)||Date.now()-lastSwipe<450)return;const r=stage.getBoundingClientRect(),dir=e.clientX<r.left+r.width/2?-1:1;hover=false;show(index+dir,dir)});
box.addEventListener('mousemove',e=>{if(touching||Date.now()-lastTouchAt<1000)return;const next=!!contentTarget(e.target);if(next!==hover){hover=next;sync()}});box.addEventListener('mouseleave',()=>{hover=false;sync()});box.addEventListener('focusin',e=>{focus=!touching&&Date.now()-lastTouchAt>=1000&&e.target!==stage;sync()});box.addEventListener('focusout',()=>setTimeout(()=>{focus=!touching&&Date.now()-lastTouchAt>=1000&&box.contains(document.activeElement)&&document.activeElement!==stage;sync()},0));stage.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const d=e.key==='ArrowRight'?1:-1;show(index+d,d)}});stage.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});stage.addEventListener('touchend',e=>{if(touchX!==null){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50){lastSwipe=Date.now();show(index+(delta<0?1:-1),delta<0?1:-1)}}touchX=null},{passive:true});
// Holding anywhere on the mobile slide pauses autoplay; release starts a fresh interval (1.5 seconds on phones, three on desktop).
// Touch-generated hover/focus must not leave autoplay stuck after the finger lifts.
box.addEventListener('touchstart',()=>{
 touching=true;touchStartedAt=Date.now();lastTouchAt=touchStartedAt;
 hover=false;focus=false;sync();
},{passive:true});
function releaseTouch(event){
 if(!touching||event.touches.length)return;
 if(Date.now()-touchStartedAt>=300)lastSwipe=Date.now();
 touching=false;lastTouchAt=Date.now();hover=false;focus=false;sync();
}
document.addEventListener('touchend',releaseTouch,{passive:true});
document.addEventListener('touchcancel',event=>{touchX=null;releaseTouch(event)},{passive:true});

document.addEventListener('visibilitychange',sync);sync()})();