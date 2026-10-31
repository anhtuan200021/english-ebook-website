(function(root){
 'use strict';
 // A deliberately small teaching view. A missing result is preferable to a
 // guessed object, a truncated noun phrase, or contradictory labels.
 const definitions={
  B:{label:'Là gì / thế nào / ở đâu',frame:'Ai/cái gì + be / từ nối + phần mô tả',explanation:'Phần sau nói rõ danh tính, đặc điểm, trạng thái hoặc vị trí.'},
  I:{label:'Làm gì · không nêu đối tượng',frame:'Ai/cái gì + động từ',explanation:'Ở cách dùng này không nêu đối tượng trực tiếp. Câu vẫn có thể thêm nơi chốn, thời gian hoặc cụm giới từ.'},
  O:{label:'Động từ + người / vật / việc',frame:'Ai/cái gì + động từ + người/vật/việc',explanation:'Phần đi theo nói rõ thích, biết, làm, chọn… ai, cái gì hoặc việc gì.'},
  D:{label:'Cho / nói ai điều gì',frame:'Ai + động từ + người nhận + điều được cho/nói',explanation:'Có hai phần đi sau động từ: người nhận và thứ hoặc nội dung được trao.'},
  C:{label:'Làm / gọi ai thành thế nào',frame:'Ai + động từ + người/vật + phần mô tả',explanation:'Phần cuối mô tả hoặc gọi tên người/vật ngay trước nó.'},
  E:{label:'Có ai / cái gì · There + be',frame:'There + be + người/vật/việc',explanation:'Nêu sự có mặt hoặc tồn tại của ai/cái gì.'},
  review:{label:'Cần xem thêm',frame:'Chưa chốt khung nền',explanation:'Có thể là lời đáp ngắn, câu nhiều ý hoặc phụ đề chưa trọn. Đọc/nghe thêm; không có nghĩa câu sai.'}
 };
 const types=Object.fromEntries(Object.entries(definitions).map(([k,v])=>[k,v.label]));
 const descriptions=Object.fromEntries(Object.entries(definitions).map(([k,v])=>[k,v.frame+'. '+v.explanation]));
 const auxiliaries=new Set('am is are was were be been being have has had do does did can could would will should shall may might must'.split(' '));
 const adverbs=new Set('here there now then today tomorrow yesterday tonight home away outside inside upstairs downstairs back up down out off on again together alone too very really just still already always often sometimes usually never also even only enough much well fast slowly quickly later soon please not ever'.split(' '));
 const determiners=new Set('a an the my your his her our their its this that these those some any no all another each every both many much more several few little enough'.split(' '));
 const objectPronouns=new Set('me you him her us them it myself yourself himself herself ourselves themselves something anything everything nothing someone anyone everyone somebody anybody everybody'.split(' '));
 const lexicalObjects=new Set('have has had having like likes liked love loves loved hate hates hated want wants wanted need needs needed know knows knew see sees saw seen watch watches watched wash washes washed clean cleans cleaned take takes took taken pick picks picked carry carries carried carrying make makes made making give gives gave given tell tells told ask asks asked read reads reading buy buys bought find finds found get gets got bring brings brought send sends sent show shows showed help helps helped help helping call calls called use uses used open opens opened close closes closed enjoy enjoys enjoyed eat eats ate drink drinks drank plant plants planted water waters watered put puts'.split(' '));
 const intransitives=new Set('go goes went gone come comes came walk walks walked walking work works worked working sleep sleeps slept sleeping sit sits sat sitting stand stands stood standing live lives lived living wait waits waited waiting arrive arrives arrived arriving run runs ran running laugh laughs laughed laughing cry cries cried crying smile smiles smiled smiling fall falls fell fallen happen happens happened grow grows grew grown stop stops stopped stay stays stayed staying play plays played playing draw draws drew drawing swim swims swam swimming dance dances danced dancing'.split(' '));
 const smallCodes=new Set(['VI','VG','VOI','VB','M','T','A','UT','AT','AB','SP']);
 function analyze(value,context={}){
  const original=String(value||''),prepared=root.TBGrammar?.prepare(original),text=prepared?.text||original.replace(/[’‘]/g,"'");
  let terms=[];try{terms=root.nlp?.(text).json({offset:true}).flatMap(s=>s.terms||[]).filter(t=>t.offset?.length)||[];}catch{}
  const words=terms.map(t=>({w:t.text.toLowerCase().replace(/[’‘]/g,"'"),start:t.offset.start,end:t.offset.start+t.offset.length,tags:t.tags||[]}));
  if(!words.length)return review();
  const tag=(i,t)=>!!words[i]?.tags.includes(t);
  const hasGap=(a,b)=>{const gap=text.slice(a,b);return /[,!?;:]/.test(gap)||/\./.test(gap)&&!(/\b(?:mr|mrs|ms|dr|st|prof)$/i.test(text.slice(0,a))&&/^\.\s*$/.test(gap));};
  const isAdv=i=>!!words[i]&&(adverbs.has(words[i].w)||tag(i,'Adverb')||tag(i,'Date'));
  const noun=i=>!!words[i]&&!['i','he','she','we','they'].includes(words[i].w)&&!isAdv(i)&&!tag(i,'Verb')&&!tag(i,'Preposition')&&!tag(i,'Conjunction')&&(tag(i,'Noun')||tag(i,'Value')||objectPronouns.has(words[i].w));
  // Read an entire noun phrase. Never stop at an article or possessive alone.
  function np(i){
   if(words[i]?.w==='a'&&['lot','bit','couple'].includes(words[i+1]?.w)&&words[i+2]?.w==='of'){const rest=np(i+3);return rest?{start:words[i].start,end:rest.end,next:rest.next}:null;}
   if(!words[i]||isAdv(i))return null;
   if(objectPronouns.has(words[i].w)&&!['her','his','its','their','your'].includes(words[i].w))return {start:words[i].start,end:words[i].end,next:i+1};
   let j=i,seen=false,last=-1;
   while(j<words.length){
    if(j>i&&hasGap(words[j-1].end,words[j].start))break;
    const w=words[j];
    if(w.w==='of'&&last>=i&&(seen||['all','some','many','most','none','one','two','both'].includes(words[i].w))){const rest=np(j+1);if(rest)return {start:words[i].start,end:rest.end,next:rest.next};break;}
    if(seen&&(tag(j,'Adjective')||determiners.has(w.w)||tag(j,'Determiner')))break;
    if(isAdv(j)||tag(j,'Preposition')||tag(j,'Verb')||['to','that','who','which','because','if','but','when'].includes(w.w)&&j>i)break;
    if(['and','or'].includes(w.w)){
     if(!seen||!words[j+1]||['i','you','he','she','it','we','they'].includes(words[j+1].w))break;
     if(!noun(j+1)&&!determiners.has(words[j+1].w)&&!tag(j+1,'Adjective'))break;
     j++;continue;
    }
    if(tag(j,'Conjunction'))break;
    if(determiners.has(w.w)||tag(j,'Determiner')||tag(j,'Possessive')||tag(j,'Adjective')||tag(j,'Value')||noun(j)){
     if(noun(j)&&!tag(j,'Possessive')&&!determiners.has(w.w))seen=true;
     if(noun(j)&&objectPronouns.has(w.w)&&j>i&&!tag(j,'Possessive'))break;
     last=j;j++;continue;
    }
    break;
   }
   return seen&&last>=i?{start:words[i].start,end:words[last].end,next:last+1}:null;
  }
  function boundedEnd(i){let j=i;while(j<words.length&&!hasGap(words[Math.max(i,j-1)].end,words[j].start)){if(j>i&&['but','because','if','when','although','so'].includes(words[j].w))break;j++;}return j>i?words[j-1].end:words[i]?.end;}
  let grammar=[];try{grammar=context.grammar||root.TBGrammar?.analyze(original)||[];}catch{}
  const candidates=grammar.filter(e=>!['other','uncertain'].includes(e.type)&&e.confidence!=='review').flatMap(e=>(e.forms||[]).map(f=>({e,f}))).sort((a,b)=>a.f.start-b.f.start);
  let chosen=null;
  for(const {e,f} of candidates){
   const inside=words.map((w,i)=>({w,i})).filter(x=>x.w.start>=f.start&&x.w.end<=f.end);
   if(!inside.length)continue;
   // Lexical heads may precede an object and a particle inside one grammar span
   // (take it up); the final word of that span is not necessarily a verb.
   let lex=inside.filter(x=>tag(x.i,'Verb')&&!auxiliaries.has(x.w.w)&&!tag(x.i,'Auxiliary'));
   let head=lex.at(-1)||inside.filter(x=>tag(x.i,'Verb')).at(-1);
   if(!head&&/^(?:i|you|he|she|it|we|they|that|there)'(?:m|re|s)$/.test(inside[0].w.w))head=inside[0];
   if(!head)continue;
   const i=head.i,v=head.w.w;
   if(v==='like'&&/\bjust\s*$/i.test(text.slice(0,head.w.start))&&!/\b(?:i|you|he|she|it|we|they)\s+(?:(?:really|just|always)\s+)*$/i.test(text.slice(0,head.w.start)))continue;
   const copula=/^(?:am|is|are|was|were|be|been|being)$/.test(v)||/^(?:i|you|he|she|it|we|they|this|that|there)'(?:m|re|s)$/.test(v);
   let j=i+1;while(words[j]&&(/^(?:not|just|really|very|so|quite|too|still|already|always|often|usually|never|also|even|only|please)$/.test(words[j].w)||tag(j,'Adverb')&&!adverbs.has(words[j].w)&&!determiners.has(words[j].w)&&!['lot','bit','couple'].includes(words[j].w))&&!hasGap(words[j-1].end,words[j].start))j++;
   if(copula){
    if(!['present_simple','past_simple','modal','future_will','imperative'].includes(e.type))continue;
    if(words.slice(0,i).some(w=>['where','what','who','which','how','why','when'].includes(w.w)))continue;
    const there=words.slice(Math.max(0,i-2),i+2).find(w=>w.w==='there'||w.w==="there's");
    if(words[j]?.w==='there')j++;
    if(there){const n=np(j);if(n){chosen=entry('E',Math.min(f.start,there.start),n.end,[part('Có gì/ai',n)]);break;}continue;}
    // Inversion with an explicit pronoun subject: Is she happy?
    const beforeVerb=words.slice(0,i).filter(w=>!['oh','well','so','hey','okay','and','but'].includes(w.w));
    if(['i','you','he','she','it','we','they'].includes(words[j]?.w)||!beforeVerb.length&&['this','that'].includes(words[j]?.w))j++;
    if(!words[j])continue;
    let n=np(j);
    if(!n&&tag(j,'Adjective')){let k=j+1;while(words[k]&&tag(k,'Adjective')&&!hasGap(words[k-1].end,words[k].start))k++;n={start:words[j].start,end:words[k-1].end};}
    if(!n&&(tag(j,'Preposition')||['here','there','home','outside','inside','upstairs','downstairs'].includes(words[j].w))){
     if(tag(j,'Preposition')){const place=np(j+1);if(place)n={start:words[j].start,end:place.end};}
     else n={start:words[j].start,end:words[j].end};
    }
    if(n&&words[n.next]&&tag(n.next,'Verb')&&!hasGap(n.end,words[n.next].start))continue;
    if(n){chosen=entry('B',f.start,n.end,[part('Phần mô tả',n)]);break;}
    continue;
   }
   if(auxiliaries.has(v)&&!['have','has','had','do','does','did'].includes(v))continue;
   // Passive voice and ambiguous -ed complements need a separate reading.
   if(/\b(?:am|is|are|was|were|be|been|being)\b/.test(text.slice(f.start,head.w.start))&&tag(i,'PastParticiple')&&!tag(i,'Gerund'))continue;
   if(words[j]&&hasGap(head.w.end,words[j].start))j=words.length;
   // Fronted objects need a separate treatment; do not label only the
   // recipient in What can I get you? as if it were the entire complement.
   if(/^\s*(?:what|which)\b/i.test(text))continue;
   const clauseAhead=k=>words[k]&&(/^(?:i|you|he|she|it|we|they|there|this|that)(?:'(?:m|re|s|ve|d|ll))?$/.test(words[k].w))&&(/'(?:m|re|s|ve|d|ll)$/.test(words[k].w)||words[k+1]&&tag(k+1,'Verb'));
   if(/^(?:know|knows|knew|think|thinks|thought|believe|believes|hope|hopes|say|says|said)$/.test(v)){
    let k=j;if(words[k]?.w==='that')k++;
    if(clauseAhead(k)){const end=boundedEnd(j);chosen=entry('O',f.start,end,[part('Ý đi theo',{start:words[j].start,end})]);break;}
   }
   const obj=np(j);
   if(obj){
    const recipient=/^(?:give|gives|gave|given|giving|tell|tells|told|telling|send|sends|sent|show|shows|showed|bring|brings|brought|teach|teaches|taught|make|makes|made)$/.test(v);
    const firstIsPronoun=obj.next===j+1&&objectPronouns.has(words[j].w);
    const second=np(obj.next);
    if(recipient&&second&&!hasGap(obj.end,second.start)){
     const afterSecond=words[second.next];
     if(afterSecond&&tag(second.next,'Verb')&&!hasGap(second.end,afterSecond.start)){
      if(/^(?:tell|tells|told|telling)$/.test(v)){const content={start:second.start,end:boundedEnd(obj.next)};chosen=entry('D',f.start,content.end,[part('Người nhận',obj),part('Nội dung được nói',content)]);break;}
      continue;
     }
     if(/^(?:make|makes|made)$/.test(v)){
      if(words[j].w==='it'){chosen=entry('C',f.start,second.end,[part('Ai/cái gì được mô tả',obj),part('Tên/đặc điểm',second)]);break;}
      if(!/\b(?:toast|cake|coffee|tea|dinner|lunch|breakfast|card|gift|sandwich|meal)\b/i.test(text.slice(second.start,second.end)))continue;
     }
     chosen=entry('D',f.start,second.end,[part('Người nhận',obj),part('Thứ/nội dung được trao',second)]);break;
    }
    if(/^(?:make|makes|made|making|call|calls|called|calling|name|names|named|consider|considers|considered)$/.test(v)){
     const k=obj.next,w=words[k];
     if(w&&!hasGap(obj.end,w.start)&&(tag(k,'Adjective')||/^(?:call|calls|called|name|names|named)$/.test(v)&&tag(k,'ProperNoun'))){
      chosen=entry('C',f.start,w.end,[part('Ai/cái gì được mô tả',obj),part('Tên/đặc điểm',{start:w.start,end:w.end})]);break;
     }
    }
    // POS tags alone are not reliable enough to turn any following noun into
    // an object; require a known transitive verb and a complete phrase.
    const next=words[obj.next];
    // A following finite clause, an unexplained adjective, or a second verb
    // is evidence that this noun phrase may be incomplete. Do not truncate.
    if(next&&!hasGap(obj.end,next.start)&&(clauseAhead(obj.next)||tag(obj.next,'Adjective')||tag(obj.next,'Verb')||determiners.has(next.w)))continue;
    if(/^(?:tell|tells|told|telling|ask|asks|asked)$/.test(v)&&firstIsPronoun&&next&&!hasGap(obj.end,next.start)&&!isAdv(obj.next)&&!tag(obj.next,'Preposition'))continue;
    if(lexicalObjects.has(v)){
     let end=obj.end;
     if(firstIsPronoun&&['up','down','out','off','back','away','in','on'].includes(words[obj.next]?.w)&&/^(?:take|takes|took|pick|picks|picked|put|puts|turn|turns|turned|bring|brings|brought)$/.test(v))end=words[obj.next].end;
     chosen=entry('O',f.start,end,[part('Người/vật/việc đi theo',obj)]);break;
    }
    continue;
   }
   if(/^(?:like|likes|liked|love|loves|loved|hate|hates|hated|want|wants|wanted|need|needs|needed|enjoy|enjoys|enjoyed)$/.test(v)&&words[j]&&(words[j].w==='to'||tag(j,'Gerund'))){
    const actionStart=words[j].w==='to'?j+1:j;
    if(words[actionStart]&&tag(actionStart,'Verb')){const end=boundedEnd(j);chosen=entry('O',f.start,end,[part('Việc đi theo',{start:words[j].start,end})]);break;}
   }
   const temporal=/^(?:every|all|each)\s+(?:day|night|morning|evening|week|month|year)\b/i.test(text.slice(words[j]?.start??text.length));
   if(intransitives.has(v)&&(j>=words.length||isAdv(j)||temporal||tag(j,'Preposition')||['to','and','or','but'].includes(words[j]?.w))){
    if(/^\s*(?:what|who|which)\b/i.test(text))continue;
    chosen=entry('I',f.start,head.w.end,[]);break;
   }
  }
  let extras=[];
  // Keep only a small set of anchored subpatterns inside a collapsed section.
  // Coordination, intent, question form and negation do not become frame tabs.
  try{extras=(root.TBPatterns?.analyze(original,context)||[]).filter(e=>smallCodes.has(e.type)&&e.status==='pattern').map(e=>({...e,forms:e.forms.map(f=>({...f}))}));}catch{}
  if(!chosen)chosen=review()[0];
  chosen.extras=extras;
  return [chosen];
  function part(label,f){return {label,start:f.start,end:f.end};}
  function entry(type,start,end,parts){return {type,patternCode:type,forms:[{start,end}],parts,status:'pattern',frame:definitions[type].frame,note:descriptions[type],scope:'Khung đầu tiên nhận diện được trong đoạn; các ý khác cần đọc/nghe thêm.'};}
  function review(){return [{type:'review',patternCode:null,forms:[],parts:[],extras:[],status:'review',frame:definitions.review.frame,note:descriptions.review}];}
 }
 const api={types,definitions,descriptions,analyze,version:'frames-0.1.0',countRule:'Mỗi đoạn thuộc một nhóm khung nền; chưa chắc để Cần xem thêm. Đây là số đoạn, không phải số mẫu khác nhau.'};
 if(typeof module!=='undefined')module.exports=api;else root.TBFrames=api;
})(globalThis);
