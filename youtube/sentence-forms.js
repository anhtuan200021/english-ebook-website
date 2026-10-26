(function(root){
 'use strict';
 const types={D:'Câu kể / nêu ý',Q:'Câu hỏi theo cấu trúc',M:'Bảo / rủ / nhắc / chúc',X:'Cảm thán có khung đầy đủ',F:'Lời ngắn / cụm rút gọn',S:'Ý phụ đang nối tiếp',U:'Lượt nói chưa hoàn tất',Z:'Chưa đủ căn cứ để chốt',negative:'Có dấu phủ định · xem phạm vi',declarative_question:'Trật tự câu kể có dấu hỏi',quoted_D:'Lời dẫn · câu kể',quoted_Q:'Lời dẫn · câu hỏi',quoted_M:'Lời dẫn · bảo / rủ làm',quoted_X:'Lời dẫn · cảm thán đầy đủ',quoted_F:'Lời dẫn · lời ngắn',quoted_S:'Lời dẫn · ý phụ',quoted_U:'Lời dẫn · chưa hoàn tất',quoted_Z:'Lời dẫn · cần kiểm tra'};
 const descriptions={D:'Khung kể/nêu ý. Có thể dùng để kể, đánh giá, hỏi lại theo giọng hoặc diễn lại lời; nhãn không xác nhận nội dung là thật.',Q:'Có cách ráp câu hỏi, như đảo trợ động từ hoặc từ hỏi làm chủ ngữ. Không suy ra đây là hỏi thật, nhờ giúp hay hỏi tu từ chỉ từ cấu trúc.',M:'Bảo, rủ, nhắc hoặc chúc làm gì, thường hiểu ngầm người nghe. Let’s rủ cùng làm; không chỉ có ra lệnh.',X:'Khung cảm thán what/how có phần chủ ngữ–động từ đầy đủ. Không gán chỉ vì có dấu !, so hoặc cảm xúc mạnh.',F:'Lời chào, tên, đáp ngắn, công thức hoặc cụm từ dùng trong hội thoại; không mặc định là câu sai.',S:'Ý mở bằng because/if/unless… chưa thấy khung chính hoàn tất trong vùng đang đọc. Cần đọc câu trước/sau.',U:'Nhận ra phần mở đầu nhưng chưa thấy phần hoàn tất. Giữ nguyên chữ; không tự thêm hành động còn thiếu.',Z:'Bộ nhận diện chưa đủ căn cứ, hoặc ranh giới lời chưa rõ. Không phải một loại câu sai.',negative:'Có dấu không/chưa/không bao giờ… ở một thành phần. Có thể nằm trong ý phụ hoặc lời dẫn; không có nghĩa toàn vùng là câu phủ định.',declarative_question:'Vẫn theo trật tự câu kể nhưng có dấu hỏi. Cần nghe giọng để hiểu đang hỏi lại, xác nhận hay có dụng ý khác.'};
 for(const c of ['D','Q','M','X','F','S','U','Z'])descriptions['quoted_'+c]='Hình thức bên trong lời được trích dẫn, tách khỏi lớp lời bên ngoài. '+descriptions[c];
 const subtypes={y:'Hỏi có/không · có đảo trợ động từ/be',w:'Hỏi bằng từ/cụm hỏi',s:'Từ hỏi giữ vai người/vật được hỏi',d:'Trật tự câu kể có dấu hỏi · cần giọng',f:'Hỏi / phản ứng rút gọn',x:'Lời thốt lên rút gọn'};
 const subject='(?:i|you|he|she|it|we|they|there|this|that|these|those|someone|somebody|anyone|anybody|everyone|everybody|nobody|nothing|the|a|an|my|your|his|her|our|their)';
 const aux="(?:do|does|did|am|is|are|was|were|have|has|had|can|could|would|will|should|must|may|might|shall|can't|won't)(?:n't)?";
 const filler=/^\s*(?:(?:so|well|okay|ok|anyways?|all right|first|then|now|like|and|but|sometimes|jesus)[,\s]+)*/i;
 function analyze(value,context={}){
  const text=String(value||''),normalized=text.replace(/[’‘]/g,"'"),forms=[],quotes=[],negative=[],notes=[];
  const add=(type,start,end,subtype='',status='pattern',note='')=>{if(end>start)forms.push({type,start,end,subtype,status,note:note||descriptions[type]});};
  const masked=normalized.split('');
  for(const item of root.TBGrammar?.prepare(normalized).ignored||[])if(item.kind==='sound_note'){for(let i=item.start;i<item.end;i++)masked[i]=' ';notes.push('Có chú thích âm thanh; không dùng phần chú thích để suy dạng câu.');}
  if(!context.inQuote){
   const re=/["“]([^"“”]+)["”]/g;
   for(const m of normalized.matchAll(re)){
    const start=m.index+1,end=start+m[1].length,inner=analyze(text.slice(start,end),{inQuote:true});
    for(const f of inner.forms)quotes.push({...f,start:f.start+start,end:f.end+start,source:'explicit',note:'Trong lời dẫn: '+f.note});
    for(const n of inner.negative)negative.push({...n,start:n.start+start,end:n.end+start,scope:'quoted'});
    for(let i=m.index;i<m.index+m[0].length;i++)if(!/\s/.test(masked[i]))masked[i]=' ';
   }
   const quoteCount=(normalized.match(/["“”]/g)||[]).length;
   if(quoteCount%2)notes.push('Dấu nháy chưa khép trong vùng này; chưa tách chắc toàn bộ lời dẫn.');
  }
  const outer=masked.join('');
  for(const m of outer.matchAll(/\b(?:no one|nobody|nothing|neither|never|not|cannot|[a-z]+n't|no|nor)\b/gi)){
   const standalone=/^(?:no|nope|nah)$/i.test(m[0])&&/^\s*[,!.?]|^\s*$/.test(outer.slice(m.index+m[0].length));
   negative.push({start:m.index,end:m.index+m[0].length,text:text.slice(m.index,m.index+m[0].length),scope:context.inQuote?'quoted':'outer',kind:standalone?'response':'marker'});
  }
  const chunks=[];for(const m of outer.matchAll(/[^.!?]+[.!?]*/g)){let start=m.index,end=m.index+m[0].length;while(start<end&&/\s/.test(outer[start]))start++;while(end>start&&/\s/.test(outer[end-1]))end--;if(end>start)chunks.push({start,end,text:outer.slice(start,end)});}
  for(const chunk of chunks){
   const raw=chunk.text,prefix=raw.match(filler)?.[0]||'',stem=raw.slice(prefix.length),start=chunk.start+prefix.length;
   const trimmed=raw.trim();if(!/[a-z]/i.test(trimmed))continue;
   const questionPrefix="(?<boundary>^|[,;:]\\s*|\\b(?:and|but|like|because|cuz|don't)\\s+)";
   const wh=new RegExp(questionPrefix+"(?:what|which|whose|how|why|when|where|who)(?:\\s+(?!(?:i|you|he|she|it|we|they)\\b)[a-z]+){0,5}\\s+"+aux+'\\s+'+subject+'\\b','gi');
   const contracted=new RegExp(questionPrefix+"(?:what|who|where|when|how)'s\\s+[a-z]+",'gi');
   const identity=new RegExp(questionPrefix+'(?:what\\s+)?who\\s+(?:is|are|was|were)\\s+[a-z]+','gi');
   const named=new RegExp('(?:^|[,;:]\\s*)(?:Do|Does|Did|Is|Are|Was|Were|Have|Has|Had|Can|Could|Would|Will|Should)\\s+[A-Z][a-z]+\\s+[a-z]+','g');
   const who=new RegExp(questionPrefix+'(?:who|what)\\s+(?:the\\s+hell\\s+)?(?:knows|knew|happened|happens|called|calls|said|says|changed|changes|wants|needs)\\b','gi');
   const yesno=new RegExp(questionPrefix+aux+'\\s+(?:'+subject+'|(?:a\\s+lot\\s+of\\s+us))\\b','gi');
   let q=null;
   for(const [re,subtype]of [[wh,'w'],[contracted,'w'],[identity,'w'],[who,'s'],[yesno,'y'],[named,'y']]){
    for(const m of stem.matchAll(re)){if(subtype==='y'&&/^(?:have|has|had|do)\s+(?:a|an|the|my|your|his|her|our|their)\b/i.test(m[0])&&!/\?\s*$/.test(stem))continue;const pos=start+m.index+(m.groups?.boundary?.length||0);if(!q||pos<q.start)q={start:pos,subtype:/^what's\s+(?:happening|going)\b/i.test(m[0])?'s':subtype};}
   }
   if(q){
    const intro=outer.slice(chunk.start,q.start),quotedCandidate=/(?:['’](?:m|re|s)|\b(?:am|is|are|was|were|be))\s+(?:(?:just|still)\s+)?like\b[^.!?]{0,90}$/i.test(intro)||/\b(?:asking|asked|ask|telling|told|said|saying)\s+(?:(?:me|you|him|her|us|them)\s+)?like\b[^.!?]{0,90}$/i.test(intro)||/\bwith\s+(?:a\s+)?(?:and\s+)?$/i.test(intro);
    if(quotedCandidate){
     quotes.push({type:'Q',start:q.start,end:chunk.end,subtype:q.subtype,status:'context',source:'inferred',note:'Có khung câu hỏi sau dấu hiệu diễn lại lời; chưa có dấu nháy xác nhận. Đọc/nghe thêm để chốt lớp lời.'});
     if(/^\s*(?:(?:so|well|and|but|sometimes)\s+)*(?:if|unless|when|because|cuz)\b/i.test(intro))add('S',chunk.start,q.start,'','context');else add('D',chunk.start,q.start,'','context','Có thể đang dẫn lại lời; ranh giới cần đọc theo đoạn.');
     continue;
    }
    add('Q',q.start,chunk.end,q.subtype,'context','Nhận diện khung câu hỏi; ý định và giọng vẫn cần nghe trong đoạn.');
    const before=outer.slice(chunk.start,q.start).replace(/(?:,?\s*(?:and|but|like|because|cuz))\s*$/i,'');
    if(before.trim()&&!/^\s*(?:(?:so|well|and|but|sometimes)\s+)*(?:if|unless|when|because|cuz)\b/i.test(before)){
     let g=[];try{g=root.TBGrammar?.analyze(before)||[];}catch{}
     if((before.match(/\b(?:don't|do not|doesn't|didn't)\b/gi)||[]).length>=2){forms.at(-1).status='review';forms.at(-1).note+=' Có chuỗi mở đầu bị nói lại; chưa chốt phạm vi phần dở.';}else if(g.some(e=>!['other','imperative','uncertain'].includes(e.type)&&e.forms?.length))add('D',chunk.start,q.start,'','context','Có phần kể/nêu ý trước khung câu hỏi; đọc để kiểm tra ranh giới.');
    }
    continue;
   }
   // Exact conversational fragments can include a subordinate explanation without a main clause.
   if(/^(?:no|yeah|yes|okay|ok)[,\s]+(?:because|cuz)\b/i.test(trimmed)){
    const m=/\b(?:because|cuz)\b/i.exec(raw);add('F',chunk.start,chunk.start+m.index,'','context');add('S',chunk.start+m.index,chunk.end,'','context');continue;
   }
   if(/^(?:what\s+(?:a|an)\b|how\s+(?:very\s+)?[a-z]+\b)/i.test(stem)&&/!\s*$/.test(stem)&&/\b(?:i|you|he|she|it|we|they)\b[\s\S]+\b(?:am|is|are|was|were|have|has|had|did|do|does|made|saw|had)\b/i.test(stem)){
    add('X',start,chunk.end,'','context');continue;
   }
   if(/^(?:(?:hello|hi|bye|goodbye|thanks|thank you|all right|okay|ok|yes|yeah|no|hell no|never|simple|done|whatever|no problem|next question|sounds good|good morning|good evening|good night|how about that|sorry(?:\s+(?:if|about|to)\b[\s\S]*)?))[.!?]*$/i.test(trimmed)||/^what\s+(?:a|an)\s+/i.test(stem)&&!/[?]/.test(stem)){
    add('F',chunk.start,chunk.end,/\?$/.test(trimmed)?'f':/^what\s+(?:a|an)\b/i.test(stem)?'x':'','context');continue;
   }
   let g=[];try{g=root.TBGrammar?.analyze(raw)||[];}catch{}
   const meaningful=g.filter(e=>e.forms?.length).filter(e=>!e.forms.every(f=>/^know$/i.test(f.text||'')&&/\byou\s*$/i.test(raw.slice(0,f.start))&&/^\s*,/.test(raw.slice(f.end)))),commands=meaningful.filter(e=>e.type==='imperative'),finite=meaningful.filter(e=>!['imperative','other'].includes(e.type));
   const dep=/^(?:because|cuz|if|unless|when|while|before|after|although|until|since|even though)\b/i.test(stem);
   const commandStart=commands.some(e=>e.forms.some(f=>f.start<=prefix.length+8));
   const conditionalCommand=dep&&commands.some(e=>e.forms.some(f=>/,\s*$/.test(raw.slice(0,f.start))));
   if(commandStart||conditionalCommand){
    add('M',chunk.start,chunk.end,'','context');
    const tail=/,\s*(?:and\s+|but\s+)?((?:i|you|he|she|it|we|they|nothing|someone)\b[\s\S]*)$/i.exec(raw);
    if(commandStart&&tail&&!/^you\s+know\b/i.test(tail[1])&&finite.some(e=>e.forms.some(f=>f.start>=tail.index))){const pos=chunk.start+tail.index+tail[0].indexOf(tail[1]);forms.at(-1).end=pos;add('D',pos,chunk.end,'','context');}
    continue;
   }
   if(dep){
    const main=[...stem.matchAll(/,\s*(?:(?:maybe|probably|actually|just)\s+)?((?:i|you|he|she|it|we|they|the|this|that|my|your|his|her|our|their)\b[^.!?]*)/gi)].at(-1);
    if(main&&!/^you\s+know\b/i.test(main[1])){
     const pos=start+main.index+main[0].indexOf(main[1]);let mainGrammar=[];try{mainGrammar=root.TBGrammar?.analyze(main[1])||[];}catch{}
     if(mainGrammar.some(e=>!['other','uncertain'].includes(e.type)&&e.forms?.length)){add('D',pos,chunk.end,'','context','Có ứng viên khung chính sau dấu phẩy; phần trước là ý phụ. Cần kiểm tra cách ngắt.');continue;}
    }
    add('S',chunk.start,chunk.end,'','context');continue;
   }
   const unfinished=/^(?:i|you|he|she|it|we|they)(?:'m|'re|'s|\s+(?:am|is|are))\s+(?:just\s+|probably\s+)?(?:going\s+to|gonna)(?!\s+[a-z]+\s+to\b)\s*(?:as\b[\s\S]*)?[.!?]*$/i.test(stem)||/^(?:i|you|he|she|it|we|they)\s+(?:can|could|should|would)\s*[,;:-]\s*$/i.test(stem);
   if(unfinished){add('U',chunk.start,chunk.end,'','review');continue;}
   const firstComma=raw.indexOf(',');
   if(/^to\s+|^(?:just\s+)?to\s+/i.test(stem)&&!(firstComma>=0&&finite.some(e=>e.forms.some(f=>f.start>firstComma)))||/^(?:not\s+just|not\s+only)\b/i.test(stem)){
    add('F',chunk.start,chunk.end,'','context','Có thể là cụm không có khung chính ở lớp ngoài, dù phần bổ nghĩa bên trong có động từ.');continue;
   }
   const relative=/\b(?:that|who|which|where|why)\b/i.exec(raw),nominalPrefix=relative&&raw.slice(0,relative.index).replace(/^\s*you\s+know,?\s*/i,'');
   if(relative&&/^(?:all|the|a|an|my|your|our|some|those|these)\b/i.test(nominalPrefix.trim())&&finite.length&&finite.every(e=>e.forms.every(f=>f.start>relative.index))&&!/,\s*(?:i|you|he|she|it|we|they)\b/i.test(raw.slice(relative.index))&&!finite.some(e=>e.forms.some(f=>/^(?:is|are|was|were)$/i.test(f.text||'')&&f.start>relative.index&&finite.some(other=>other.forms.some(o=>o.start>relative.index&&o.end<=f.start))))){add('F',chunk.start,chunk.end,'','context','Phần trước là cụm danh từ; động từ đang thấy có thể chỉ thuộc phần nói thêm.');continue;}
   if(finite.length){
    const uncertain=finite.every(e=>e.type==='uncertain');
    add('D',chunk.start,chunk.end,/\?\s*$/.test(raw)?'d':'',uncertain?'context':'pattern',uncertain?'Khung kể/nêu ý nhận ra được nhưng động từ hoặc bản chép còn cần kiểm tra.':descriptions.D);
   }else{
    add('F',chunk.start,chunk.end,/\?\s*$/.test(raw)?'f':'','context');
   }
  }
  if(!forms.length&&!quotes.length&&text.trim())add('Z',0,text.length,'','review');
  const unique=new Map();
  for(const f of forms){if(!unique.has(f.type))unique.set(f.type,{type:f.type,forms:[],status:f.status,scope:'outer',note:f.note,subtypes:[]});const e=unique.get(f.type);e.forms.push({start:f.start,end:f.end});if(f.subtype&&!e.subtypes.includes(f.subtype))e.subtypes.push(f.subtype);if(f.status==='review')e.status='review';}
  for(const q of quotes){const type='quoted_'+q.type;if(!unique.has(type))unique.set(type,{type,forms:[],status:'context',scope:'quoted',note:descriptions[type],subtypes:[],sources:[]});const e=unique.get(type);if(q.source&&!e.sources.includes(q.source))e.sources.push(q.source);if(q.source==='inferred'&&!e.note.includes('chưa có dấu nháy'))e.note+=' Có phần suy từ dấu hiệu dẫn lời, chưa có dấu nháy xác nhận.';e.forms.push({start:q.start,end:q.end});if(q.subtype&&!e.subtypes.includes(q.subtype))e.subtypes.push(q.subtype);}
  if(negative.length)unique.set('negative',{type:'negative',forms:negative.map(n=>({start:n.start,end:n.end})),status:'context',scope:'component',components:negative,note:descriptions.negative});
  const declarative=forms.filter(f=>f.type==='D'&&f.subtype==='d');if(declarative.length)unique.set('declarative_question',{type:'declarative_question',forms:declarative.map(f=>({start:f.start,end:f.end})),status:'context',scope:'outer',note:descriptions.declarative_question});
  for(const n of notes)for(const e of unique.values()){e.status=e.status==='review'?'review':'context';e.note+=' '+n;}
  return {entries:[...unique.values()],forms,quotes,negative,notes,clauseStructure:{status:'not_measured',note:'Chưa tự chốt câu đơn/ghép/phức từ số cụm động từ; cần phân tích quan hệ các ý.'}};
 }
 const api={types,descriptions,subtypes,analyze,version:'sentence-forms-0.5.4'};if(typeof module!=='undefined')module.exports=api;else root.TBSentenceForms=api;
})(globalThis);
