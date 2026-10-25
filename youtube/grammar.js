(function(root){
 'use strict';
 const TYPES={present_simple:'Hiện tại đơn',present_continuous:'Hiện tại · đang làm',present_perfect:'Tới nay · đã làm / trải nghiệm',present_perfect_continuous:'Tới nay · làm kéo dài',past_simple:'Quá khứ · đã xảy ra',past_continuous:'Quá khứ · đang làm',past_perfect:'Quá khứ · đã làm trước đó',past_perfect_continuous:'Quá khứ · làm kéo dài trước đó',future_will:'Tương lai · will',future_going_to:'Tương lai · going to',future_in_past:'Đã định làm · was going to',future_continuous:'Tương lai · sẽ đang làm',future_perfect:'Tương lai · sẽ xong trước mốc',future_perfect_continuous:'Tương lai · làm kéo dài tới mốc',modal:'Can / could / should…',imperative:'Bảo / mời làm gì',other:'Lời ngắn / chưa thấy động từ',uncertain:'Chưa rõ cách dùng'};
 const irreg={be:['was','were','been'],go:['went','gone'],see:['saw','seen'],eat:['ate','eaten'],take:['took','taken'],give:['gave','given'],write:['wrote','written'],speak:['spoke','spoken'],come:['came','come'],become:['became','become'],run:['ran','run'],do:['did','done'],have:['had','had'],get:['got','gotten','got'],make:['made','made'],say:['said','said'],tell:['told','told'],buy:['bought','bought'],think:['thought','thought'],bring:['brought','brought'],find:['found','found'],feel:['felt','felt'],leave:['left','left'],meet:['met','met'],keep:['kept','kept'],sleep:['slept','slept'],hear:['heard','heard'],know:['knew','known'],grow:['grew','grown'],drive:['drove','driven'],ride:['rode','ridden'],choose:['chose','chosen'],break:['broke','broken'],begin:['began','begun'],drink:['drank','drunk'],forget:['forgot','forgotten'],understand:['understood','understood'],lose:['lost','lost'],send:['sent','sent'],spend:['spent','spent'],build:['built','built'],pay:['paid','paid'],teach:['taught','taught'],learn:['learned','learnt'],sit:['sat','sat'],stand:['stood','stood'],wear:['wore','worn'],win:['won','won'],fall:['fell','fallen'],hold:['held','held'],sell:['sold','sold'],read:['read','read'],put:['put','put'],cut:['cut','cut'],let:['let','let'],hurt:['hurt','hurt'],hit:['hit','hit']};
 const bases=new Set(('work study walk talk call cook wash clean want need like love live look watch play use wait help ask answer try move start stop listen open close lock finish enjoy visit remember explain turn check change learn protect brush dress drink save share choose leave come go be have do get make say tell read write eat take give see know think feel hear keep sleep understand find believe prefer wish hope mean seem sound happen exist matter assume confuse introduce imitate copy joke mess buckle relax grab annoy irritate react accept hate stay meet bring buy send spend pay show speak practice carry fold ride drive run sit stand put pick carry plan').split(' '));
 const past=new Set(),part=new Set();for(const [base,forms]of Object.entries(irreg)){bases.add(base);past.add(forms[0]);if(base==='be')past.add('were');forms.slice(base==='be'?2:1).forEach(x=>part.add(x));}

 const subjects=new Set('i you he she it we they there this that these those who what someone somebody nobody everybody nothing something anything everything anyone everyone'.split(' '));
 const skip=new Set('not never already just still always often usually sometimes really ever also probably certainly recently finally literally officially since either even legally briefly actually fully simply directly totally generally normally personally pretty very quite perhaps rather'.split(' '));
 const particles=new Set('up out off away back down on in over around through by'.split(' '));
 const forbidden=new Set('to of for by with from at into onto about than as if because cuz although unless when while until before after so then first next okay ok well anyways anyway right'.split(' '));
 const sameForm=new Set('read put cut let hurt hit set'.split(' '));
 const states=new Set('tired interested excited bored worried married closed locked done gone finished pleased surprised confused satisfied supposed amazing interesting annoying exciting boring'.split(' '));
 const reason={present_simple:'Dùng cho trạng thái, việc thường làm hoặc thông tin đang nêu. Xem cả câu để hiểu thời gian thực tế.',present_continuous:'Có am/is/are và từ chỉ hành động dạng như doing, working. Thường nói việc đang diễn ra; đôi khi nói kế hoạch.',present_perfect:'Hiện tại hoàn thành: have/has đi với dạng như done, seen, worked. Nói việc hoặc trải nghiệm liên hệ tới hiện tại.',present_perfect_continuous:'Hiện tại hoàn thành tiếp diễn: have/has been đi với dạng như doing, working. Nói quá trình kéo dài tới hiện tại hoặc gần đây.',past_simple:'Dạng như went, worked, was, did. Có thể kể quá khứ; trong câu giả định cần hiểu theo ý cả câu.',past_continuous:'Was/were đi với dạng như doing, working: việc đang diễn ra ở thời điểm quá khứ.',past_perfect:'Quá khứ hoàn thành: had đi với dạng như done, seen, worked: việc đã xảy ra trước một mốc quá khứ.',past_perfect_continuous:'Quá khứ hoàn thành tiếp diễn: had been đi với dạng như doing, working: quá trình kéo dài trước một mốc quá khứ.',future_will:'Will/shall và động từ theo sau. Có thể là lời hứa, dự đoán, quyết định hoặc cách nói về việc thường gặp.',future_going_to:'Am/is/are going to (hoặc gonna) và động từ: kế hoạch, dự đoán hoặc việc sắp được nhắc tới; không bắt buộc là tương lai gần.',future_in_past:'Was/were going to và động từ: một dự định nhìn từ thời điểm quá khứ.',future_continuous:'Will be và dạng như doing, working: việc đang diễn ra ở một mốc tương lai.',future_perfect:'Tương lai hoàn thành: will have và dạng như done, seen, worked: việc đã xong trước mốc tương lai.',future_perfect_continuous:'Tương lai hoàn thành tiếp diễn: will have been và dạng như doing, working: quá trình kéo dài tới mốc tương lai.',modal:'Can/could/should/must… và phần theo sau. Có thể nói khả năng, cho phép, lời khuyên hoặc giả định; đây không phải một thì riêng.',imperative:'Bảo, mời hoặc nhắc làm việc gì; thường không nói ra người hoặc vật được nói tới you. Không xếp như hiện tại đơn.',other:'Có thể là lời chào, đáp ngắn, phần câu đang nói dở hoặc app chưa tìm thấy động từ. Không có nghĩa lời nói sai.',uncertain:'Có nhiều cách hiểu; cần đọc thêm câu trước/sau hoặc nghe lại.'};
 function prepare(value){
  const original=String(value||''),chars=original.split(''),ignored=[];
  const mask=(start,end,kind)=>{for(let i=start;i<end;i++)if(!/\s/.test(chars[i]))chars[i]=' ';ignored.push({start,end,kind,text:original.slice(start,end)});};
  for(const m of original.matchAll(/\[(?:music|applause|laughter|laughing|laughs|chuckles|sighs|clears throat|coughs|inaudible|silence|crosstalk|nhạc|vỗ tay|tiếng cười)(?:[^\]\r\n]{0,60})\]/gi))mask(m.index,m.index+m[0].length,'sound_note');
  // Only immediate restarts with a pronoun/article are hidden. Never erase
  // had had, that that, focus focus, names, negatives or repeated whole ideas.
  const working=()=>chars.join('');
  const patterns=[/\b((?:i|you|we|they|he|she|it)(?:['’](?:m|re|ve|d|ll))?\s+(?:am\s+|are\s+)?going\s+to)\s+(?=\1\b)/gi,/\b((?:i|you|we|they|he|she|it)\s+(?:don['’]t|can['’]t|want))\s+(?=\1\b)/gi,/\b(i|you|we|they|he|she|it|the|my|your|their|our|i['’]m|they['’]re|we['’]re|that['’]s)\s+(?=\1\b)/gi];
  for(const re of patterns)for(let pass=0;pass<2;pass++){let changed=false;for(const m of working().matchAll(re)){mask(m.index,m.index+m[0].length,'restart');changed=true;}if(!changed)break;}
  return {original,text:working().replace(/[’‘]/g,"'"),ignored};
 }
 function inspect(value){
  const prepared=prepare(value),text=prepared.original,scan=prepared.text;
  let sourceTags=[];try{if(typeof root.nlp==='function')sourceTags=root.nlp(scan).json({offset:true}).flatMap(s=>s.terms||[]).filter(t=>t.text&&t.offset?.length);}catch{}
  const byStart=new Map(sourceTags.map(t=>[t.offset.start,t.tags||[]]));
  const raw=[...scan.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g)].map(m=>({w:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length,tags:byStart.get(m.index)||[]}));
  const tokens=[];
  const rawSkip=(i)=>{while(i<raw.length){if(skip.has(raw[i].w)||raw[i].tags.includes('Adverb')&&!particles.has(raw[i].w)){i++;continue;}if(raw[i]?.w==='kind'&&raw[i+1]?.w==='of'){i+=2;continue;}break;}return i;};
  raw.forEach((r,index)=>{
   let list=[r.w],ambiguous=false;const m=r.w.match(/^([a-z]+)'(m|re|ve|ll|s|d)$/),ahead=rawSkip(index+1),n=raw[ahead]?.w;
   if(m&&r.w!=="let's"){const c=m[2],pronoun=subjects.has(m[1])||['here','one','someone','somebody','everybody','nobody'].includes(m[1]);let aux={m:'am',re:'are',ve:'have',ll:'will'}[c];
    if(c==='s'){
     const isState=states.has(n),follow=raw[ahead+1];
     aux=n==='been'||part.has(n)&&!isState||/ed$/.test(n||'')&&!isState?'has':'is';
     if(['finished','done'].includes(n)&&follow&&!['with','for','by','in'].includes(follow.w))aux='has';
     if(['gone','done','finished'].includes(n)&&!follow)ambiguous=true;
     if(!pronoun&&!['not','been','gonna','going'].includes(n)&&!states.has(n)&&!raw[ahead]?.tags.includes('Adjective')&&!raw[ahead]?.tags.includes('Verb'))return tokens.push(r);
    }
    if(c==='d'){aux=part.has(n)||/ed$/.test(n||'')&&!bases.has(n)?'had':'would';if(sameForm.has(n))ambiguous=true;}
    list=[m[1],aux];
   }else if(r.w.endsWith("n't")){const head=r.w.slice(0,-3);list=[{wo:'will',ca:'can',sha:'shall'}[head]||head,'not'];}
   else if(r.w==='cannot')list=['can','not'];
   list.forEach(w=>tokens.push({...r,w,ambiguous}));
  });
  const at=i=>tokens[i]?.w,has=(i,tag)=>tokens[i]?.tags.includes(tag),isBase=i=>!!tokens[i]&&(bases.has(at(i))||has(i,'Infinitive'));
  const isIng=i=>/ing$/.test(at(i)||'')&&(!states.has(at(i))||has(i,'Verb')&&!has(i,'Adjective'))&&at(i)!=='thing';
  const isPart=i=>part.has(at(i))||!!tokens[i]&&!bases.has(at(i))&&/ed$/.test(at(i))&&(has(i,'Verb')||has(i,'Adjective')||!tokens[i].tags.length);
  const isSkip=i=>skip.has(at(i))||has(i,'Adverb')&&!particles.has(at(i))||at(i)==='freaking'&&(states.has(at(i+1))||has(i+1,'Adjective'));
  function next(i,question=false){let j=i+1;for(let n=0;n<12&&j<tokens.length;n++){
   if(/[.!?;:]|\b(?:and|but|because|if|when)\b/.test(scan.slice(tokens[i].end,tokens[j].start)))break;
   if(at(j)==='kind'&&at(j+1)==='of'){j+=2;continue;}
   if(isSkip(j)||at(j)==='like'&&(isBase(j+1)||isIng(j+1)&&['am','is','are','was','were','be','been','being'].includes(at(i)))||question&&(subjects.has(at(j))||at(j)==='all')){j++;continue;}break;
  }
   if(question&&(i===0||['what','why','where','how','when','who'].includes(at(i-1))||/[.!?;:\x22]\s*$/.test(scan.slice(0,tokens[i].start)))&&['am','is','are','was','were','has','have','had','does','do','did'].includes(at(i))&&(has(j,'Determiner')||has(j,'Noun')&&!has(j,'Verb')||['this','that','these','those','my','your','his','her','our','their'].includes(at(j)))){let k=j+1;while(k<j+5&&(has(k,'Adjective')||has(k,'Noun'))&&!has(k,'Verb'))k++;if(isIng(k)||isBase(k)||isPart(k))j=k;}
   return j;}
  const nonfinite=new Set(),entries=[],consumed=new Set();
  for(let i=0;i<tokens.length;i++){
   if(at(i)==='to'){
    if(['listen','listening','look','looking'].includes(at(i-1))&&at(i+1)==='like')continue;
    let j=next(i);if(isBase(j)){nonfinite.add(j);if(['be','have','get'].includes(at(j))){const k=next(j);if(isIng(k)||isPart(k))nonfinite.add(k);}let k=j+1;for(let n=0;n<7&&k<tokens.length;n++,k++){if(/[.!?;]/.test(scan.slice(tokens[k-1].end,tokens[k].start)))break;if(at(k)==='and'||at(k)==='or'){const z=next(k);if(isBase(z)){nonfinite.add(z);k=z;continue;}break;}if(subjects.has(at(k)))break;}}
   }
  }
  function commandAt(i){
   const before=scan.slice(0,tokens[i].start),quoted=before.replace(/\b(?:am|is|are|was|were|be|[a-z]+['’](?:m|re|s))\s+like\s+(?=please\b)/gi,';'),lead=quoted.slice(Math.max(quoted.lastIndexOf('.'),quoted.lastIndexOf('?'),quoted.lastIndexOf('!'),quoted.lastIndexOf(';'),quoted.lastIndexOf('"'))+1);
   return /^(?:(?:so|and|but|um|well|okay|ok|first|then|now|please|just|anyway|anyways|all\s+right|like)\b[\s,]*)*$/i.test(lead.trim());
  }
  function add(i,j,type,note='',low=false,usage=''){
   j=Math.max(i,Math.min(j,tokens.length-1));
   const main=at(j),rootWord=at(i);
   if(particles.has(at(j+1))&&['get','got','go','went','going','sit','sat','take','took','taken','look','looking','come','came','give','gave','grow','grew','turn','figure','figured','start','started','buckle','pull','pulled','pick','picked','put','fell','fall'].includes(main))j++;
   if(['figure','figured','look','pick','picked','take','took','put'].includes(main)&&['it','them','me','you'].includes(at(j+1))&&particles.has(at(j+2)))j+=2;
   if(['go','come'].includes(at(j))&&isBase(j+1)&&!/[,.!?;]/.test(scan.slice(tokens[j].end,tokens[j+1].start)))j++;
   const start=tokens[i].start,end=tokens[j].end,amb=tokens.slice(i,j+1).some(t=>t.ambiguous);
   const entry={type:amb?'uncertain':type,forms:[{start,end,text:text.slice(start,end)}],reason:reason[amb?'uncertain':type]+(note?' '+note:''),confidence:low||amb?'review':'rule',segment:entries.length,usage};
   const prev=entries.at(-1),between=prev?scan.slice(prev.forms.at(-1).end,start):'';
   if(prev&&prev.type===entry.type&&/^\s*(?:and|or)\s*$/i.test(between)&&!subjects.has(rootWord)){prev.forms.push(...entry.forms);}else entries.push(entry);
   for(let k=i;k<=j;k++)consumed.add(k);
   if(/^(?:make|makes|made|making|let|lets|help|helps|helped|helping|have|has|had)$/.test(main)){
    let k=j+1;if(['me','you','him','her','us','them'].includes(at(k))){k=next(k);if(isBase(k))nonfinite.add(k);}
   }
  }
  let inherited=null;
  for(let i=0;i<tokens.length;i++){
   if(consumed.has(i))continue;
   if(nonfinite.has(i)&&entries.at(-1)?.usage==='got_to'&&/\band\s*$/.test(scan.slice(entries.at(-1).forms.at(-1).end,tokens[i].start)))nonfinite.delete(i);
   if(nonfinite.has(i)){if(['help','make','let','have'].includes(at(i))&&['me','you','him','her','us','them'].includes(at(i+1))){const k=next(i+1);if(isBase(k))nonfinite.add(k);}continue;}
   if(/^\s*(?:thanks|thank you|hello|hi|bye|good morning|good evening)\b/i.test(scan)&&i===0)continue;
   const w=at(i),p=at(i-1),j=next(i,true),n=at(j);
   if(['when','because','cuz','if','although','while','unless','but'].includes(w)){inherited=null;continue;}
   if(w==="let's"){if(isBase(j))add(i,j,'imperative','Let’s mời hoặc gợi ý cùng làm.');continue;}
   if(w==='like'){
    let prev=i-1;while(prev>=0&&isSkip(prev))prev--;
    const beforePrev=at(prev-1),subject=['i','you','he','she','it','we','they','who'].includes(at(prev))&&!['with','to','for','of','from','about','make','makes','made','making','find','found','feel'].includes(beforePrev);
    const object=i===tokens.length-1&&subjects.has(at(prev))||at(i+1)==='to'||isIng(i+1)||has(i+1,'Noun')||has(i+1,'Determiner')||['it','him','her','them','this','that','you','us'].includes(at(i+1));
    const nounSubject=!/^(?:something|anything|nothing|someone|anyone|whatever)$/.test(at(prev)||'')&&has(prev,'Noun')&&!has(prev,'ProperNoun')&&!['to','with','of','for','or','and'].includes(beforePrev)&&(!entries.some(e=>scan.slice(e.forms.at(-1).end,tokens[i].start).indexOf('.')<0)||at(prev)==='guys'&&at(prev-1)==='you');
    const directCommand=commandAt(i)&&['my','your','the','our'].includes(at(i+1));
    if(has(i,'Preposition')||has(i,'Conjunction')||!directCommand&&(!(subject||nounSubject)||!object&&i+1<tokens.length||/^\s*,/.test(scan.slice(tokens[i].end,tokens[i+1]?.start))))continue;
   }
   if(['can','could','should','must','might','may','would','will','shall'].includes(w)){
    let end=j,type=['will','shall'].includes(w)?'future_will':'modal',note='';
    if(!n||/^[.!?;,\s]*$/.test(scan.slice(tokens[i].end,tokens[j]?.start??scan.length))&&n&&/^[.!?;]/.test(scan.slice(tokens[i].end,tokens[j].start))){add(i,i,type,'Phần hành động được lược hoặc lời nói chưa hoàn tất; đọc câu trước/sau.',true,'ellipsis');continue;}
    if(n==='have'){
     const k=next(j);end=j;
     if(isPart(k)){end=k;if(at(k)==='been'){const z=next(k);if(isIng(z))end=z;else if(isPart(z))end=z;}
      if(type!=='modal')type=at(k)==='been'&&isIng(next(k))?'future_perfect_continuous':'future_perfect';
      else note='Have + dạng như done/been: nói khả năng hoặc giả định về việc trước đó.';
     }
    }else if(n==='be'){
     const k=next(j);end=j;if(isIng(k)){end=k;if(type!=='modal')type='future_continuous';}else if(isPart(k)||states.has(at(k)))end=k;
    }
    if(isBase(j)||['have','be'].includes(n)){add(i,end,type,note);inherited=type;}else add(i,i,'uncertain','Chưa thấy phần hành động theo sau; có thể người nói đổi cách nói hoặc app chưa hiểu.',true);
    continue;
   }
   if(w==='got'&&at(i+1)==='to'&&isBase(next(i+1))){add(i,next(i+1),'present_simple','Got to + hành động có thể nói cần/phải trong khẩu ngữ, không tự hiểu là quá khứ của get.',true,'got_to');continue;}
   if(w==='had'&&n==='better'){const k=next(j);if(isBase(k)){add(i,k,'modal','Had better dùng để khuyên/nhắc làm gì.');inherited='modal';continue;}}
   if(w==='used'&&at(i+1)==='to'&&isBase(next(i+1))&&!['am','is','are','was','were','be','been','get','got','getting'].includes(p)){
    add(i,next(i+1),'past_simple','Used to nói việc hoặc trạng thái trước đây, nay có thể đã khác.','', 'past_habit');continue;
   }
   if(['have','has','had'].includes(w)){
    if(w==='have'&&commandAt(i)&&!isPart(j)&&at(i+1)!=='to'){add(i,i,'imperative','Have + vật/điều: lời bảo, lời mời hoặc lời chúc.');inherited='imperative';continue;}
    if(isPart(j)){let end=j,type=w==='had'?'past_perfect':'present_perfect';if(n==='been'){const k=next(j);if(isIng(k)){end=k;type=w==='had'?'past_perfect_continuous':'present_perfect_continuous';}else if(isPart(k))end=k;}
     add(i,end,type);inherited=type;continue;}
    if(at(i+1)==='to'){const k=next(i+1);if(isBase(k)){add(i,k,w==='had'?'past_simple':'present_simple','Have to nói cần/phải làm gì.');continue;}}
    add(i,i,w==='had'?'past_simple':'present_simple');continue;
   }
   if(['am','is','are','was','were'].includes(w)){
    const present=['am','is','are'].includes(w);let end=i,type=present?'present_simple':'past_simple',note='',low=false;
    if(!tokens.slice(i+1,j).some(t=>subjects.has(t.w)||t.w==='like')&&has(j,'Verb')&&/s$/.test(n||'')&&!['is','was','has'].includes(n)&&!isIng(j)&&!isPart(j)){add(i,j,'uncertain','Be đứng trước một động từ đã chia khác; có thể lời nói vấp hoặc bản chép sai.',true);continue;}
    if((n==='going'&&at(j+1)==='to')||n==='gonna'){
     const k=n==='gonna'?next(j):next(j+1);
     if(isBase(k)){
      if(at(k)==='work'&&k===tokens.length-1){add(i,k,'uncertain','Going to work có thể là đi làm hoặc dự định làm việc.',true);continue;}
      let finish=k;if(at(k)==='be'&&isIng(next(k)))finish=next(k);
      add(i,finish,present?'future_going_to':'future_in_past',finish!==k?'Going to đi với be + dạng doing.':'');inherited=null;continue;
     }
    }
    if((n==='going'&&at(j+1)==='to'||n==='gonna')&&!isBase(n==='gonna'?next(j):next(j+1))){add(i,n==='gonna'?j:j+1,'uncertain','Bắt đầu going to/gonna nhưng chưa nhận ra hành động sau đó; có thể nói dở hoặc bộ phân tích chưa hiểu.',true);continue;}
    if(n==='freaking'&&/ing$/.test(at(j+1)||'')){add(i,j+1,'uncertain','Freaking có thể là từ nhấn mạnh; dạng -ing sau đó cần đọc theo ngữ cảnh để phân biệt tính chất và hành động.',true);continue;}
    if(n==='over'&&at(j+1)==='here'&&isIng(j+2)){add(i,j+2,present?'present_continuous':'past_continuous','Over here chỉ vị trí chen trước hành động; có thể có cách phân tích khác.',true);continue;}
    if(isIng(j)&&states.has(n)&&has(j,'Adjective')){add(i,j,'uncertain','Be + dạng -ing ở đây có thể mô tả tính chất hoặc hành động; cần xét ngữ cảnh.',true);continue;}
    if(isIng(j)){type=present?'present_continuous':'past_continuous';end=j;const k=next(j);if(n==='being'&&isPart(k))end=k;
     if(present&&/\b(tomorrow|tonight|next week|next time)\b/i.test(scan))note='Giữ dạng đang làm; câu có thể đang nói về tương lai.';
    }else if(isPart(j)||states.has(n)){end=j;if(!['amazing','boring','interesting','annoying','exciting','tired','interested','confused','worried','happy'].includes(n)){note='Có thể mô tả trạng thái hoặc việc được làm; cần xem cả câu.';low=true;}}
    add(i,end,type,note,low);inherited=type;continue;
   }
   if(['be','been','being'].includes(w))continue;
   if(['do','does','did'].includes(w)){
    const imperative=commandAt(i)&&at(i+1)==='not'&&!subjects.has(at(i+2)),end=isBase(j)?j:i;
    add(i,end,imperative?'imperative':w==='did'?'past_simple':'present_simple',end===i?'Hành động có thể được lược vì đã nói ở câu trước.':'');inherited=imperative?'imperative':w==='did'?'past_simple':'present_simple';continue;
   }
   if(isPart(i)&&p==='there'&&entries.some(e=>e.type==='present_simple'&&/\b(?:is|are|there's)\b/i.test(e.forms[0].text)))continue;
   if(['show','sound','name','question'].includes(w)&&['that','this','the','a','an','my','your','their'].includes(p)&&!subjects.has(at(i-2)))continue;
   if(forbidden.has(w)||particles.has(w)&&!has(i,'Verb')||has(i,'Preposition')||has(i,'Conjunction')||has(i,'Determiner')||has(i,'Adverb')||has(i,'ProperNoun')||['to','without','after','before','of','for','by','with','having'].includes(p)&&!(p==='of'&&at(i-2)==='kind')||isIng(i)||w==='not')continue;
   // Never turn an adjective or noun into a finite verb just from its suffix.
   const tagged=has(i,'Verb')&&!has(i,'Gerund'),noTags=!tokens[i].tags.length;
   const prev=entries.at(-1),between=prev?scan.slice(prev.forms.at(-1).end,tokens[i].start):'';
   const shared=prev&&(/^[\s,]*(?:and|or)[\s,]*(?:then\s+)?$/i.test(between)||prev.type==='imperative'&&/^\s*,\s*$/.test(between))&&!subjects.has(w);
   const lexicalThird=/s$/.test(w)&&bases.has(w.replace(/s$/,''))&&!['names','means','times'].includes(w);
   if(has(i,'Adjective')&&!tagged||has(i,'Noun')&&!tagged&&!lexicalThird&&!bases.has(w))continue;
   let before=i-1;while(before>=0){if(isSkip(before)||at(before)==='like'&&isBase(i)){before--;continue;}if(at(before)==='of'&&at(before-1)==='kind'){before-=2;continue;}break;}
   const subjectWord=at(before),lastEntry=entries.at(-1),since=lastEntry?scan.slice(lastEntry.forms.at(-1).end,tokens[i].start):scan.slice(0,tokens[i].start);
   const parentheticalSubject=/\b(?:i|you|he|she|it|we|they)\s+(?:just\s+)?like,\s*you\s+know,\s*$/i.test(scan.slice(0,tokens[i].start));
   const pronounSubject=parentheticalSubject||subjects.has(subjectWord)&&!['me','him','her','us','them'].includes(subjectWord)&&!(lastEntry&&subjectWord==='you'&&/\b(?:give|gave|given|send|sent|show|showed|shown|teach|taught|offer|offered|tell|told|ask|asked|asking)$/i.test(lastEntry.forms.at(-1).text)&&!/[.!?;:]|\b(?:and|but|because|if|when|that)\b/i.test(since));
   const newClause=!lastEntry||/[.!?;:]/.test(since)||/\b(?:and|but|because|cuz|if|when|who|which|that|what|how)\b/i.test(since)||lastEntry.forms.some(f=>/^(?:you\s+)?know$/i.test(f.text));
   const nounSubject=!/,\s*$/.test(scan.slice(tokens[before]?.end||0,tokens[i].start))&&(has(before,'Noun')||has(before,'ProperNoun'))&&!has(before,'Determiner')&&!has(before,'Possessive')&&newClause&&!['to','of','with','for','by','from','about'].includes(at(before-1));
   const commaFuture=lastEntry&&lastEntry.type==='future_going_to'&&/^(?:\s+each\s+other)?\s*,\s*$/i.test(since)&&w==='get'&&at(i+1)==='to';
   const coordinated=lastEntry&&/\b(?:and|or|but)\s+(?:(?:then|just|also|still|like)\s+)*$/i.test(since)&&!/[.!?;]/.test(since)&&!/\b(?:the|a|an|of|than)\s+(?:and|or|but)\s*$/i.test(since)&&(isBase(i)||has(i,'PastTense'))&&!['stuff','sound','name','names','questions','question','show'].includes(w)&&['present_simple','past_simple','future_will','future_going_to','modal','imperative'].includes(lastEntry.type);
   const conditionalCommand=isBase(i)&&/,\s*$/.test(scan.slice(0,tokens[i].start))&&/^\s*(?:if|unless)\b/i.test(scan)&&!/[.!?;]/.test(scan.slice(0,tokens[i].start));
   const commandContinuation=inherited==='imperative'&&/(?:and|then)\s*$/i.test(between)&&! /\b(?:i|you|we|they|he|she|it|who|because|if|when)\b/i.test(between);
   const nounPhraseContinuation=(['am','is','are','was','were'].includes(at(next(i))))&&!pronounSubject&&!commandAt(i)&&!shared&&!commandContinuation;
   if(nounPhraseContinuation&&!lexicalThird&&!pronounSubject||/^[\s,]*$/.test(since)&&lastEntry==null&&i>0&&!pronounSubject&&!commandAt(i))continue;
   if(!(pronounSubject||nounSubject||commandAt(i)||shared||commandContinuation||coordinated||commaFuture||conditionalCommand))continue;
   if(!tagged&&!(noTags&&bases.has(w)||lexicalThird||bases.has(w)&&(pronounSubject&&w!=='like'||commandAt(i)||shared||coordinated||commaFuture||conditionalCommand)))continue;
   if(sameForm.has(w)){add(i,i,'uncertain','Từ này có cùng dạng chữ ở hiện tại và quá khứ; đọc thêm đoạn trước/sau.',true);continue;}
   let type;
   if(inherited==='imperative'&&isBase(i)&&/(?:and|then)\s*$/i.test(between)&&! /\b(?:i|you|we|they|he|she|it|who|because|if|when)\b/i.test(between))type='imperative';
   else if(commaFuture)type='future_going_to';
   else if(coordinated)type=has(i,'PastTense')?'past_simple':lastEntry.type;
   else if(conditionalCommand)type='imperative';
   else if(shared&&isBase(i)&&!['uncertain','other'].includes(prev.type))type=prev.type;
   else if(commandAt(i)&&isBase(i))type='imperative';
   else type=past.has(w)||has(i,'PastTense')&&!bases.has(w)?'past_simple':'present_simple';
   add(i,i,type);inherited=type;
  }
  for(let k=0;k<entries.length-1;k++){
   const entry=entries[k],f=entry.forms.at(-1),following=entries[k+1].forms[0];
   const subject=(scan.slice(0,f.start).match(/\b(i|you|he|she|it|we|they|this|that|there)\s+(?:(?:just|really|always)\s+)*$/i)||f.text.match(/^(i|you|he|she|it|we|they|there)['’]/i)||f.text.match(/^(?:can|could|will|would|should)\s+(i|you|he|she|it|we|they)\b/i))?.[1];
   const gap=scan.slice(f.end,following.start),nextSubject=(following.text.match(/^(i|you|he|she|it|we|they|there)['’]/i)||following.text.match(/^(?:can|could|will|would|should)\s+(i|you|he|she|it|we|they)\b/i))?.[1];
   if(subject&&!/[.!?;:]|\b(?:and|but|because|if|when|that|what|who)\b/i.test(gap)&&(new RegExp('\\b'+subject+'\\s*$','i').test(gap)||nextSubject?.toLowerCase()===subject.toLowerCase())){
    entry.confidence='review';entry.usage='possible_restart';entry.reason+=' Chủ ngữ được mở lại ngay sau đó; có thể là lượt nói lại hoặc nhấn mạnh. Giữ nguyên cả hai và nghe đối chiếu.';
   }
  }
  // A recognisable formula is not an unresolved grammatical error.
  if(!entries.length)entries.push({id:'g0',type:'other',forms:[],reason:reason.other,confidence:/^\s*(?:hello|hi|bye|okay|ok|yes|no|yeah|thanks|thank you|blue|green|done|simple|all right|how about that|next question)\b/i.test(scan)?'rule':'review',clause:text});
  const result=entries.map(e=>({...e,id:e.forms.length?'v2-'+e.forms.map(f=>f.start+'-'+f.end).join('_'):'g0',clause:text}));
  const details=prepared.ignored.map(x=>({...x,type:x.kind==='restart'?'restart':'sound_note',reason:x.kind==='restart'?'Lượt mở đầu được nói lại ngay; chỉ bỏ qua khi phân tích, không sửa phụ đề.':'Chú thích âm thanh; không phải lời có thì.'}));
  for(let i=0;i<tokens.length;i++){
   if(consumed.has(i))continue;
   if(nonfinite.has(i)&&isBase(i)){const start=at(i-1)==='to'?tokens[i-1].start:tokens[i].start,end=tokens[i].end;details.push({start,end,text:text.slice(start,end),type:'nonfinite',reason:'Dạng động từ phụ thuộc phần trước; chưa có thì riêng ở vị trí này. Cần đọc cùng cụm chi phối.'});}
   else if(isIng(i)&&has(i,'Gerund'))details.push({start:tokens[i].start,end:tokens[i].end,text:text.slice(tokens[i].start,tokens[i].end),type:'dependent_ing',reason:'Dạng -ing chưa được gắn với trợ động từ chia thì. Có thể là phần ý phụ, tên hoạt động hoặc bổ nghĩa; cần đọc ngữ cảnh.'});
  }
  return {entries:result,details:details.sort((a,b)=>a.start-b.start),ignored:prepared.ignored,analysisText:scan};
 }
 function analyze(text){return inspect(text).entries;}
 const api={TYPES,analyze,inspect,prepare,version:3};if(typeof module!=='undefined')module.exports=api;else root.TBGrammar=api;
})(globalThis);
