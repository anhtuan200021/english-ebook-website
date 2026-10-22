(function(root){
 const TYPES={present_simple:'Hiện tại đơn',present_continuous:'Hiện tại tiếp diễn',present_perfect:'Hiện tại hoàn thành',present_perfect_continuous:'Hiện tại hoàn thành tiếp diễn',past_simple:'Quá khứ đơn',past_continuous:'Quá khứ tiếp diễn',past_perfect:'Quá khứ hoàn thành',past_perfect_continuous:'Quá khứ hoàn thành tiếp diễn',future_will:'Tương lai · will',future_going_to:'Tương lai · be going to',future_continuous:'Tương lai tiếp diễn',future_perfect:'Tương lai hoàn thành',future_perfect_continuous:'Tương lai hoàn thành tiếp diễn',modal:'Động từ khuyết thiếu',imperative:'Mệnh lệnh',other:'Mảnh câu / không có động từ chia',uncertain:'Chưa xác định'};
 const irreg={be:['was','were','been'],go:['went','gone'],see:['saw','seen'],eat:['ate','eaten'],take:['took','taken'],give:['gave','given'],write:['wrote','written'],speak:['spoke','spoken'],come:['came','come'],become:['became','become'],run:['ran','run'],do:['did','done'],have:['had','had'],get:['got','gotten','got'],make:['made','made'],say:['said','said'],tell:['told','told'],buy:['bought','bought'],think:['thought','thought'],bring:['brought','brought'],find:['found','found'],feel:['felt','felt'],leave:['left','left'],meet:['met','met'],keep:['kept','kept'],sleep:['slept','slept'],hear:['heard','heard'],know:['knew','known'],grow:['grew','grown'],drive:['drove','driven'],ride:['rode','ridden'],choose:['chose','chosen'],break:['broke','broken'],begin:['began','begun'],drink:['drank','drunk'],forget:['forgot','forgotten'],understand:['understood','understood'],lose:['lost','lost'],send:['sent','sent'],spend:['spent','spent'],build:['built','built'],pay:['paid','paid'],teach:['taught','taught'],learn:['learned','learnt'],sit:['sat','sat'],stand:['stood','stood'],wear:['wore','worn'],win:['won','won'],fall:['fell','fallen'],hold:['held','held'],sell:['sold','sold'],read:['read','read'],put:['put','put'],cut:['cut','cut'],let:['let','let'],hurt:['hurt','hurt'],hit:['hit','hit']};
 const bases=new Set(('work study walk talk call cook wash clean want need like love live look watch play use wait help ask answer try move start stop listen open close lock finish enjoy visit remember explain turn check change learn protect brush dress drink save share choose leave come go be have do get make say tell read write eat take give see know think feel hear keep sleep understand find believe prefer wish hope mean seem sound happen stay meet bring buy send spend pay show speak practice carry fold ride drive run sit stand put pick carry plan').split(' '));
 const past=new Set(),part=new Set();for(const [base,forms]of Object.entries(irreg)){bases.add(base);past.add(forms[0]);if(base==='be')past.add('were');forms.slice(base==='be'?2:1).forEach(x=>part.add(x));}
 const subjects=new Set('i you he she it we they there this that who what'.split(' '));
 const skip=new Set('not never already just still always often usually sometimes really ever also probably certainly recently finally'.split(' '));
 const sameForm=new Set('read put cut let hurt hit set'.split(' '));
 const states=new Set('tired interested excited bored worried married closed locked done gone finished pleased surprised'.split(' '));
 const reason={present_simple:'Động từ ở dạng hiện tại hoặc be (am/is/are). Có thể dùng cho trạng thái, thói quen hay lịch trình; quy tắc không suy ra ý định người nói.',present_continuous:'am/is/are + động từ -ing.',present_perfect:'have/has + quá khứ phân từ (V3).',present_perfect_continuous:'have/has been + động từ -ing.',past_simple:'Động từ quá khứ hoặc did/was/were.',past_continuous:'was/were + động từ -ing.',past_perfect:'had + quá khứ phân từ (V3).',past_perfect_continuous:'had been + động từ -ing.',future_will:'will/shall + động từ nguyên mẫu.',future_going_to:'be going to + động từ nguyên mẫu.',future_continuous:'will be + động từ -ing.',future_perfect:'will have + quá khứ phân từ.',future_perfect_continuous:'will have been + động từ -ing.',modal:'Động từ khuyết thiếu + động từ nguyên mẫu. Không tự xếp could/would vào quá khứ đơn.',imperative:'Động từ nguyên mẫu dùng để yêu cầu/nhắc nhở, không có chủ ngữ hiển thị.',other:'Chưa thấy động từ chia rõ. Có thể là mảnh phụ đề hoặc cụm không hữu hạn.',uncertain:'Chưa đủ căn cứ để chọn một nhóm.'};
 function analyze(text){
  text=String(text||'');let sourceTags=[];try{if(typeof root.nlp==='function')sourceTags=root.nlp(text).json().flatMap(x=>x.terms||[]).filter(x=>x.text).map(x=>({s:x.text.toLowerCase().replace(/’/g,"'"),tags:x.tags||[]}));}catch{}
  const raw=[...text.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)].map(m=>({w:m[0].toLowerCase().replace(/’/g,"'"),start:m.index,end:m.index+m[0].length}));
  const tokens=[];raw.forEach((r,index)=>{
    let list=[r.w],ambiguous=false;const m=r.w.match(/^(i|you|he|she|it|we|they|that|there|who|what|here)'(m|re|ve|ll|s|d)$/);let ahead=index+1;while(skip.has(raw[ahead]?.w))ahead++;const next=raw[ahead]?.w;
    if(m){const c=m[2];let aux={m:'am',re:'are',ve:'have',ll:'will'}[c];if(c==='s'){aux=next==='been'||part.has(next)||/ed$/.test(next||'')&&!states.has(next)?'has':'is';if(next==='finished'&&raw[ahead+1])aux='has';if(['gone','done','finished'].includes(next)&&!raw[ahead+1])ambiguous=true;}
      if(c==='d'){aux=part.has(next)||/ed$/.test(next||'')?'had':'would';if(sameForm.has(next))ambiguous=true;}list=[m[1],aux];
    }else if(r.w.endsWith("n't")){const head=r.w.slice(0,-3);list=[{wo:'will',ca:'can',sha:'shall'}[head]||head,'not'];}
    const tags=sourceTags.find(x=>x.s===r.w)?.tags||[];list.forEach(w=>tokens.push({...r,w,tags,ambiguous}));
  });
  const at=i=>tokens[i]?.w;const isIng=i=>/ing$/.test(at(i)||'')&&at(i)!=='thing';const isPart=i=>part.has(at(i))||/ed$/.test(at(i)||'');
  const isBase=i=>bases.has(at(i))||tokens[i]?.tags.includes('Infinitive');
  function next(i,question=false){let j=i+1;while(j<tokens.length&&(skip.has(at(j))||question&&subjects.has(at(j))))j++;return j;}
  const entries=[],consumed=new Set();let segment=0;
  function emit(i,j,type,notes='',low=false){
    j=Math.max(i,Math.min(j,tokens.length-1));const start=tokens[i].start,end=tokens[j].end;
    const gaps=text.slice(tokens[Math.max(0,i-1)]?.end||0,start);if(/[.!?;]/.test(gaps))segment++;
    const item={type,forms:[{start,end,text:text.slice(start,end)}],reason:reason[type]+(notes?' '+notes:''),confidence:low||tokens.slice(i,j+1).some(x=>x.ambiguous)?'review':'rule',segment};
    if(item.confidence==='review'&&tokens.slice(i,j+1).some(x=>x.ambiguous)){item.type='uncertain';item.reason='Dạng rút gọn có thể mang nhiều nghĩa (is/has hoặc had/would). Cần thêm ngữ cảnh.';}
    const prev=entries.at(-1);const between=prev?text.slice(prev.forms.at(-1).end,start):'';
    if(prev&&prev.type===item.type&&/^\s*(?:and|or)\s*$/i.test(between)&&!subjects.has(at(i))){prev.forms.push(...item.forms);prev.reason+=' Hai động từ nối nhau, có thể dùng chung chủ ngữ.';}else entries.push(item);
    for(let k=i;k<=j;k++)consumed.add(k);
  }
  for(let i=0;i<tokens.length;i++){
    if(consumed.has(i))continue;if(['up','out','off','away','back','down','on','in','over','around','through'].includes(at(i))&&consumed.has(i-1))continue;const w=at(i),p=at(i-1),j=next(i,true),n=at(j);if(['when','because','if','although','while','unless'].includes(w)){segment++;continue;}
    if(w==='will'||w==='shall'||['can','could','should','must','might','may','would'].includes(w)){
      if(!n)continue;let end=j,type=w==='will'||w==='shall'?'future_will':'modal',notes='';
      if(n==='have'){const k=next(j);end=k;if(at(k)==='been'){const z=next(k);if(isIng(z)){end=z;if(type!=='modal')type='future_perfect_continuous';}else if(type!=='modal')type='future_perfect';}else if(isPart(k)&&type!=='modal')type='future_perfect';else if(!isPart(k))notes='Cụm sau trợ động từ cần kiểm tra.';}
      else if(n==='be'){const k=next(j);if(isIng(k)){end=k;if(type!=='modal')type='future_continuous';}else if(isPart(k)){end=k;notes='be + V3 có thể là cấu trúc bị động.';}}
      if(isBase(j)||['have','be'].includes(n))emit(i,end,type,notes);else emit(i,i,'uncertain','Sau từ có thể là động từ khuyết thiếu chưa có dạng động từ rõ.',true);continue;
    }
    if(['have','has','had'].includes(w)){
      if(isPart(j)){let end=j,type=w==='had'?'past_perfect':'present_perfect',notes='';if(n==='been'){const k=next(j);if(isIng(k)){end=k;type=w==='had'?'past_perfect_continuous':'present_perfect_continuous';}else if(isPart(k)){end=k;notes='been + V3: có dạng bị động; không phải một thì riêng.';}}
        emit(i,end,type,notes);continue;
      }
      if(p==='to'||['will','would','could','should','must','may','might'].includes(p))continue;
      emit(i,i,w==='had'?'past_simple':'present_simple','have ở đây chưa có V3 theo sau; không tự coi là hoàn thành.');continue;
    }
    if(['am','is','are','was','were','be','been','being'].includes(w)){
      if(['be','been','being'].includes(w)){continue;}
      const present=['am','is','are'].includes(w);let end=j,type=present?'present_simple':'past_simple',notes='',low=false;
      if(n==='going'&&at(j+1)==='to'&&isBase(j+2)&&present){if(at(j+2)==='work'){emit(i,j+2,'uncertain','going to work có thể là “đi làm” hoặc dự định “làm việc”.',true);continue;}emit(i,j+2,'future_going_to');continue;}
      if(isIng(j)){type=present?'present_continuous':'past_continuous';const k=next(j);if(n==='being'&&isPart(k)){end=k;notes='being + V3: có dạng bị động.';}if(present&&/\b(tomorrow|tonight|next week)\b/i.test(text))notes+=' Có từ chỉ thời gian tương lai; vẫn giữ nhãn hình thức tiếp diễn.';}
      else if(isPart(j)){notes='be + V3/tính từ: có thể là trạng thái hoặc bị động, cần xem ngữ cảnh.';low=true;}
      else {end=i;if(n)notes='be là động từ chia; tính từ/danh từ theo sau không phải -ing.';}
      emit(i,end,type,notes,low);continue;
    }
    if(['do','does','did'].includes(w)){
      const before=tokens.slice(0,i).some(t=>subjects.has(t.w));const imperative=!before&&i<=1&&at(i+1)==='not';
      if(isBase(j)){emit(i,j,imperative?'imperative':w==='did'?'past_simple':'present_simple',imperative?'Dạng phủ định do not + động từ.':'Trợ động từ do/does/did quyết định thì trong câu hỏi/phủ định.');continue;}
      emit(i,i,w==='did'?'past_simple':'present_simple');continue;
    }
    if(['to','without','after','before','of','for','by','with','having'].includes(p)||isIng(i)||w==='not')continue;
    const knownPast=past.has(w)||(/ed$/.test(w)&&tokens[i].tags.includes('Verb'));
    const taggedVerb=tokens[i].tags.includes('Verb')&&!tokens[i].tags.includes('Gerund');
    const subjectBefore=subjects.has(p)||(tokens[Math.max(0,i-1)]?.tags.includes('Noun')&&!['my','your','his','her','its','our','their'].includes(p))||skip.has(p)||['and','or'].includes(p)&&entries.length;
    if(knownPast&&!sameForm.has(w)){emit(i,i,'past_simple');continue;}
    if(sameForm.has(w)&&(taggedVerb||subjectBefore)){emit(i,i,'uncertain','Dạng này có thể giống nhau ở hiện tại và quá khứ; không dùng trạng từ thời gian làm bằng chứng duy nhất.',true);continue;}
    if((taggedVerb||bases.has(w)&&subjectBefore)&&(!part.has(w)||bases.has(w))&&!['my','your','his','her','its','our','their'].includes(p)){
      const imperative=(i===0||i===1&&at(0)==='please')&&isBase(i)&&!subjects.has(w);emit(i,i,imperative?'imperative':'present_simple');
    }
  }
  if(!entries.length)return[{id:'g0',type:'other',forms:[],reason:reason.other,confidence:'review',clause:text}];
  return entries.map((e,i)=>({...e,id:'g'+i,clause:text}));
 }
 const api={TYPES,analyze,version:1};if(typeof module!=='undefined')module.exports=api;else root.TBGrammar=api;
})(globalThis);
