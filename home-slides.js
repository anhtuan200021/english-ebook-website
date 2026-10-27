(()=>{const box=document.querySelector('#home-showcase');if(!box)return;const stage=document.querySelector('.hs-stage'),slides=[...document.querySelectorAll('.hs-slide')],dots=[...document.querySelectorAll('.hs-choice')],pause=document.querySelector('#hs-pause'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let index=0,timer,manual=reduced.matches,hover=false,focus=false,touchX=null,lastSwipe=0;
// Preserve the normal phone layout; grow only when the actual text needs more room.
function fitOpeningSlide(){
 if(!matchMedia('(max-width:760px)').matches){stage.style.height='';return}
 let needed=580;
 if(index===0){
  needed=Math.max(needed,Math.ceil(slides[0].getBoundingClientRect().height));
 }else{
  const slide=slides[index],copy=slide.querySelector('.hs-copy');
  const px=value=>parseFloat(value)||0;
  const cs=getComputedStyle(copy),ss=getComputedStyle(slide);
  let content=px(cs.paddingTop)+px(cs.paddingBottom);
  for(const child of copy.children){
   const style=getComputedStyle(child);
   if(style.display==='none')continue;
   content+=child.getBoundingClientRect().height+(child.matches('.hs-cta')?0:px(style.marginTop))+px(style.marginBottom);
  }
  const media=slide.querySelector('.hs-media').getBoundingClientRect().height;
  needed=Math.max(needed,Math.ceil(media+content+px(ss.paddingTop)+px(ss.paddingBottom)));
 }
 const height=needed>580||index===0?needed+'px':'';
 if(stage.style.height!==height)stage.style.height=height;
}
if(typeof ResizeObserver!=='undefined'){
 const observer=new ResizeObserver(fitOpeningSlide);
 observer.observe(slides[0]);
 for(const slide of slides){
  const copy=slide.querySelector('.hs-copy');
  observer.observe(copy);
  for(const child of copy.children)observer.observe(child);
 }
}
window.addEventListener('resize',fitOpeningSlide);
document.fonts?.ready.then(fitOpeningSlide);
function sync(){fitOpeningSlide();clearTimeout(timer);pause.textContent=manual?'Bật tự chạy':'Tạm dừng tự chạy';pause.setAttribute('aria-label',pause.textContent);pause.setAttribute('aria-pressed',String(manual));if(!manual&&!hover&&!focus&&!document.hidden)timer=setTimeout(()=>show(index+1,1,false),8000)}
function show(n,direction=1,user=true){const next=(n+slides.length)%slides.length;if(next===index){sync();return}const previous=slides[index];slides.forEach(s=>{s.getAnimations().forEach(a=>a.cancel());s.classList.remove('hs-leaving')});index=next;slides.forEach((s,i)=>{s.classList.toggle('hs-active',i===index);s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index))});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===index)));if(!reduced.matches){previous.classList.add('hs-leaving');const out=previous.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX('+(-direction*65)+'px)',opacity:0}],{duration:420,easing:'ease',fill:'none'});out.onfinish=()=>previous.classList.remove('hs-leaving');slides[index].animate([{transform:'translateX('+(direction*65)+'px)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:420,easing:'ease',fill:'none'})}if(user)document.querySelector('#hs-announce').textContent=dots[index].getAttribute('aria-label');sync()}
dots.forEach((d,i)=>d.onclick=()=>show(i,i<index?-1:1));pause.onclick=()=>{manual=!manual;sync()};
function contentTarget(t){return t.closest('.hs-copy,img,.hs-tag,.hs-bigmark,a,button,.hs-controls')}
stage.addEventListener('click',e=>{if(contentTarget(e.target)||Date.now()-lastSwipe<450)return;const r=stage.getBoundingClientRect(),dir=e.clientX<r.left+r.width/2?-1:1;hover=false;show(index+dir,dir)});
box.addEventListener('mousemove',e=>{const next=!!contentTarget(e.target);if(next!==hover){hover=next;sync()}});box.addEventListener('mouseleave',()=>{hover=false;sync()});box.addEventListener('focusin',e=>{focus=e.target!==stage;sync()});box.addEventListener('focusout',()=>setTimeout(()=>{focus=box.contains(document.activeElement)&&document.activeElement!==stage;sync()},0));stage.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const d=e.key==='ArrowRight'?1:-1;show(index+d,d)}});stage.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});stage.addEventListener('touchend',e=>{if(touchX!==null){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50){lastSwipe=Date.now();show(index+(delta<0?1:-1),delta<0?1:-1)}}touchX=null},{passive:true});document.addEventListener('visibilitychange',sync);sync()})();