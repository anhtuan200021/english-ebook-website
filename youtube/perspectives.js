'use strict';
// Pattern matches are study hints, not a claim to understand the speaker's intent.
(function(root){
 const axes={structures:{label:'Cấu trúc',hint:'Quan sát mẫu ngữ pháp để tập nói câu mới.',types:{modal:'Động từ can/could/should…',passive:'Bị động / trạng thái',conditional:'If / unless',wish:'Wish',used_to:'Used to · từng',accustomed:'Be / get used to · quen',relative:'Ý nhỏ trong câu quan hệ',reported:'Lời nói gián tiếp',comparison:'So sánh',infinitive:'Động từ + to + dạng như do/work',gerund:'Động từ + dạng như doing/working'}},
 forms:{label:'Loại câu',hint:'Quan sát hình thức của câu; một câu hỏi vẫn có thể là lời nhờ vả.',types:{statement:'Nói/kể',negative:'Cách nói không/chưa',yesno:'Câu hỏi Yes/No',wh:'Câu hỏi từ để hỏi',tag:'Câu hỏi đuôi',imperative:'Bảo/mời làm gì / yêu cầu trực tiếp',exclamation:'Cảm thán',fragment:'Câu rút gọn / đáp ngắn'}},
 intentions:{label:'Ý định giao tiếp',hint:'Gợi ý từ mẫu diễn đạt; cần nghe đoạn trước/sau để biết đúng ý người nói.',types:{request:'Nhờ vả',advice:'Lời khuyên',suggestion:'Gợi ý cùng làm',offer:'Mời / đề nghị',opinion:'Nêu ý kiến',feeling:'Bày tỏ cảm xúc',thanks:'Cảm ơn',apology:'Xin lỗi',agreement:'Đồng ý',disagreement:'Không đồng ý',question:'Hỏi thông tin'}},
 links:{label:'Cách nối ý',hint:'Tìm từ/cụm nối và đọc cả câu để xem các ý liên hệ thế nào.',types:{addition:'Thêm ý',contrast:'Đối lập / nhượng bộ',reason:'Nguyên nhân',result:'Kết quả',condition:'Điều kiện',sequence:'Trình tự',example:'Ví dụ',purpose:'Mục đích',time:'Thời gian',clarify:'Nói rõ / diễn đạt lại',ambiguous:'Since / while · tùy đoạn trước/sau'}}};
 function analyze(value,context={}){
  const text=String(value||''),plain=root.TBGrammar?.prepare(text).text||text.replace(/[’‘]/g,"'"),out={structures:[],forms:[],intentions:[],links:[]};
  let grammatical=[];try{grammatical=root.TBGrammar?.analyze(text)||[];}catch{}
  function add(axis,type,pattern,guard){
   const forms=[];for(const m of plain.matchAll(new RegExp(pattern,'gi'))){if(!guard||guard(m)){const start=m.index,end=start+m[0].length;forms.push({start,end});}}
   if(forms.length)out[axis].push({type,forms});return forms.length>0;
  }
  add('structures','modal',"\\b(?:can|could|should|must|might|may|would)(?:n't)?\\b");
  add('structures','passive',"\\b(?:(?:am|is|are|was|were|be|been|being)(?:\\s+not)?|(?:i|you|we|they|he|she|it)'(?:m|re|s))\\s+(?:(?:just|already|often|always|usually)\\s+)?(?:built|made|given|taken|seen|known|told|shown|written|sent|paid|bought|sold|found|caught|chosen|broken|[a-z]+ed)\\b",m=>!/(?:tired|worried|excited|interested|bored|used)$/i.test(m[0]));
  add('structures','conditional','\\b(?:if|unless)\\b',m=>!/(?:wonder|know|ask|asked|see|sure)\s*$/i.test(plain.slice(0,m.index)));
  add('structures','wish','\\bwish(?:es|ed)?\\b');
  add('structures','accustomed',"\\b(?:(?:am|is|are|was|were|be|been|being|get|gets|got|getting)(?:\\s+not)?|(?:i|you|we|they|he|she|it)'(?:m|re|s))\\s+used\\s+to\\b");
  add('structures','used_to','\\bused\\s+to\\s+[a-z]+',m=>!/(?:\b(?:am|is|are|was|were|be|been|being|get|gets|got|getting)(?:\s+not)?|\b(?:i|you|we|they|he|she|it)'(?:m|re|s))\s*$/i.test(plain.slice(0,m.index)));
  add('structures','relative','\\b(?:who|which|that)\\s+(?:(?:is|are|was|were|has|have|can|will|called|said|told|lives|works|knows|wants|needs|helped|made)\\b|(?:i|you|we|they|he|she|it)\\b)',m=>/\b(?:person|people|man|woman|boy|girl|friend|someone|anyone|something|anything|thing|things|book|video|house|place|way|one|ones|dog|cat|car|room|story|stories)\s*$/i.test(plain.slice(0,m.index)));
  add('structures','reported','\\b(?:(?:said|says|say)\\s+(?:that\\s+)?(?:i|you|we|they|he|she|it)|told\\s+(?:me|you|us|them|him|her)(?:\\s+that)?)\\b');
  add('structures','comparison','\\b(?:more|less)\\s+[a-z]+\\s+than\\b|\\b[a-z]+er\\s+than\\b|\\bas\\s+[a-z]+\\s+as\\b');
  add('structures','infinitive','\\b(?:want|wants|wanted|need|needs|needed|hope|hopes|hoped|plan|plans|planned|decide|decided|try|tries|tried|learn|learned|agree|agreed)\\s+to\\s+[a-z]+\\b');
  add('structures','gerund','\\b(?:enjoy|enjoys|enjoyed|avoid|avoids|avoided|keep|keeps|kept|finish|finished|mind|practice)\\s+[a-z]+ing\\b');
  add('structures','have_to','\\b(?:have|has|had)\\s+to\\s+[a-z]+\\b');
  add('structures','able_to','\\b(?:am|is|are|was|were|be|been)\\s+able\\s+to\\s+[a-z]+\\b');
  const negative=add('forms','negative',"\\b(?:not|never|no one|nobody|nothing|cannot|[a-z]+n't)\\b");
  const tag=add('forms','tag',",\\s*(?:is|are|was|were|do|does|did|have|has|had|will|would|can|could|should)(?:n't)?\\s+(?:i|you|we|they|he|she|it|there)\\s*\\?\\s*$");
  const wh=add('forms','wh',"^\\s*(?:why|when|where|how|what|which|who)(?:\\s+(?:much|many|long|often|old|far|time))?\\s+(?:do|does|did|is|are|am|was|were|have|has|had|will|would|can|could|should)(?:n't)?\\b|^\\s*(?:who|what)\\s+(?:called|said|told|knows|wants|needs|happened|changed)\\b");
  const yesno=!tag&&!wh&&add('forms','yesno',"^\\s*(?:do|does|did|is|are|am|was|were|have|has|had|will|would|can|could|should|may|might|must)(?:n't)?\\s+(?:i|you|we|they|he|she|it|there|the|a|an|your|our|his|her)\\b");
  const fragment=add('forms','fragment','^\\s*(?:sounds good|not yet|of course|no problem|me too|me neither|not really|yes|yeah|no|okay|ok|sure|exactly|absolutely|thanks)\\s*[.!?]*\\s*$');
  const imperative=!fragment&&!yesno&&!wh&&add('forms','imperative',"^\\s*(?:(?:so|well|okay|ok|anyway|anyways|first|then|now|like|all right)[,\\s]+)*(?:please\\s+)?(?:don't\\s+|do not\\s+)?(?:sit|stand|come|go|take|get|put|give|keep|wait|listen|look|try|stop|start|open|close|remember|relax|watch|tell|show|help|worry|forget|be|have|do|clean|wash|read|write|call|send|turn|leave|stay|make|check|use|eat|drink|say|ask|let's)\\b(?!\\s+(?:is|was|has|does)\\b)");
  const exclamation=add('forms','exclamation','^\\s*(?:what\\s+(?:a|an)\\s+|how\\s+(?:beautiful|wonderful|nice|great|amazing)\\b)');
  if(!tag&&!wh&&!yesno&&!fragment&&!imperative&&!exclamation){
   if(!add('forms','statement',"^\\s*(?:i|you|we|they|he|she|it|there|this|that|these|those)(?:'m|'re|'s|'ve|'d|'ll)?\\b")){}
  }
  add('intentions','request',"\\b(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:help|pass|give|send|show|tell|open|close|hold|wait|bring|take|check|turn|lend)\\b|\\bwould\\s+you\\s+mind\\b");
  add('intentions','advice',"\\b(?:you\\s+should(?:n't)?|you\\s+ought\\s+to|you(?:'d|\\s+had)\\s+better)\\b");
  add('intentions','suggestion',"\\blet's\\b|\\bwhy\\s+don't\\s+(?:you|we)\\b|\\bhow\\s+about\\b(?!\\s+that\\s*\\?)|\\bwhat\\s+about\\b|\\bshall\\s+we\\b");
  add('intentions','offer',"\\bwould\\s+you\\s+like\\b|\\b(?:can|shall)\\s+i\\s+(?:help|bring|get|give|make|carry)\\b");
  add('intentions','opinion',"\\bi\\s+(?:think|believe|guess|feel\\s+that)\\b|\\bin\\s+my\\s+opinion\\b|\\bi(?:'d|\\s+would)\\s+say\\b");
  add('intentions','feeling',"\\bi(?:'m|\\s+am|\\s+feel|\\s+was)\\s+(?:so\\s+|really\\s+|very\\s+)?(?:happy|sad|tired|worried|excited|angry|afraid|glad|sorry)\\b");
  add('intentions','thanks','\\bthank\\s+you\\b|\\bthanks\\b|\\bi\\s+appreciate\\b');
  add('intentions','apology',"\\bi(?:'m|\\s+am)\\s+sorry\\b|\\bi\\s+apologize\\b|\\bmy\\s+fault\\b");
  add('intentions','agreement',"\\bi\\s+agree\\b|\\byou(?:'re|\\s+are)\\s+right\\b|^\\s*(?:exactly|absolutely|of course)\\b");
  add('intentions','disagreement',"\\bi\\s+(?:disagree|don't\\s+agree|do\\s+not\\s+agree)\\b|\\bi\\s+see\\s+it\\s+differently\\b");
  if((wh||yesno)&&!out.intentions.some(t=>['request','offer','suggestion'].includes(t.type)))out.intentions.push({type:'question',forms:out.forms.filter(t=>['wh','yesno'].includes(t.type)).flatMap(t=>t.forms)});
  add('links','addition',"\\b(?:also|besides|in addition|what's more|as well as)\\b|\\band\\s+(?:then|i|you|we|they|he|she|it)\\b");
  add('links','contrast','\\b(?:but|however|although|even though|even if|on the other hand|instead|nevertheless)\\b');
  add('links','reason','\\b(?:because(?: of)?|cuz|due to)\\b');
  add('links','result',"\\b(?:therefore|as a result|that's why|that is why)\\b|\\bso(?=\\s+(?:i|you|we|they|he|she|it|there)\\b)");
  add('links','condition','\\b(?:if|unless|as long as|provided that)\\b',m=>!/(?:wonder|know|ask|asked|see|sure)\s*$/i.test(plain.slice(0,m.index)));
  add('links','sequence','(?:^|[,;.!?]\\s*|\\band\\s+)(?:first|second|next|then|finally)\\b|\\bafter that\\b|\\bto begin with\\b');
  add('links','example','\\b(?:for example|for instance|such as)\\b');
  add('links','purpose','\\b(?:so that|in order to|so as to)\\b');
  add('links','time','\\b(?:before|after|when|until|as soon as|once)\\b');
  add('links','clarify',"\\b(?:in other words|that means|what i mean is|i mean)\\b");
  add('links','ambiguous','\\b(?:since|while)\\b',m=>!/(?:have|has|had|['’]ve)\s*$/i.test(plain.slice(0,m.index)));

  const prefix=/^\s*(?:(?:so|well|okay|ok|anyways?|all right|first|then|now|like|and|but)[,\s]+)*/i.exec(plain)?.[0]||'';
  const stem=plain.slice(prefix.length),aux='(?:do|does|did|is|are|am|was|were|have|has|had|will|would|can|could|should|may|might|must)';
  const whShape=new RegExp("^(?:(?:why|where|when|how)(?:\\s+(?:much|many|long|often|old|far))?\\s+"+aux+"\\b|(?:what|which|whose)(?:\\s+(?!(?:i|you|we|they|he|she|it)\\b)[a-z]+){0,4}\\s+"+aux+"\\b|(?:what|where|who|how|when)'s\\b|(?:who|what)(?:\\s+the\\s+hell)?\\s+(?:knows|happened|called|said|told|changed|wants|needs)\\b)",'i');
  if(whShape.test(stem)&&!/^(?:what|who)\s+(?:i|you|we|they|he|she|it)\b/i.test(stem)){
   out.forms=out.forms.filter(e=>!['statement','yesno'].includes(e.type));
   out.forms.push({type:'wh',forms:[{start:prefix.length,end:plain.length}],status:/\?/.test(stem)?'pattern':'context',note:'Hỏi ai/gì/ở đâu…; câu có thể dùng để hỏi thật, nhắc lại lời hoặc nhấn mạnh.'});
  }
  if(/^how about that\s*\?/i.test(stem)){
   out.forms=out.forms.filter(e=>!['yesno','wh','statement'].includes(e.type));out.forms.push({type:'reaction',forms:[],status:'context',note:'Cách nói gợi phản ứng; nghe giọng và câu trước để biết sắc thái.'});
   out.intentions=out.intentions.filter(e=>!['suggestion','question'].includes(e.type));out.intentions.push({type:'reaction',forms:[],status:'context'});
  }
  const quoted=[...plain.matchAll(/["“]([^"”]+)["”]/g)];
  for(const m of quoted){const q=m[1].trim().replace(/^\s*(?:(?:so|well|okay|ok|anyways?|first|then|now|like)[,\s]+)*/i,'');let type=whShape.test(q)?'wh':new RegExp('^'+aux+'\\s','i').test(q)?'yesno':null;
   if(type)out.forms.push({type,forms:[{start:m.index+1,end:m.index+1+m[1].length}],status:'context',note:'Hình thức câu bên trong lời được nhắc lại hoặc giả giọng; chưa chắc đang hỏi người xem.'});
  }
  add('structures','supposed_to',"\\b(?:(?:am|is|are|was|were|be|been)(?:\\s+not)?|(?:i|you|we|they|he|she|it)'(?:m|re|s))\\s+supposed\\s+to\\s+[a-z]+\\b|\\b(?:am|is|are|was|were)\\s+(?:i|you|we|they|he|she|it)\\s+supposed\\s+to\\s+[a-z]+\\b");
  add('structures','object_infinitive','\\b(?:want|wants|wanted|need|needs|needed|ask|asked|tell|told|expect|expected)\\s+(?:me|you|him|her|us|them|people)\\s+to\\s+(?:(?:still|just|really)\\s+)?[a-z]+\\b');
  add('structures','make_object','\\b(?:make|makes|made|making|let|lets|letting|help|helps|helped|helping)\\s+(?:me|you|him|her|us|them)\\s+[a-z]+\\b');
  add('structures','rather','\\bwould\\s+rather\\s+[a-z]+\\b');
  add('structures','had_better','\\bhad\\s+better\\s+(?:not\\s+)?[a-z]+\\b');
  add('structures','feel_like','\\b(?:feel|feels|felt)\\s+like\\s+(?:i|you|we|they|he|she|it|this|that|my|your|the)\\b');
  add('structures','content_clause',"\\b(?:know|knows|knew|think|thought|understand|explain|tell|told|say|said)\\s+(?:that|what|why|how|whether|if)\\b|\\bwhat\\s+(?:my|your|our|his|her|i|you|we|they|he|she|it)\\b");
  add('structures','quote_frame',"\\b(?:i|you|we|they|he|she|it)(?:'m|'re|'s|\\s+(?:am|is|are|was|were))\\s+(?:just\\s+|still\\s+)?like\\b");
  add('structures','relative',"\\b(?:mother|father|mom|dad|aunt|person|people|friend|teacher|name|video|question|questions|place|thing|things)\\s*,?\\s+(?:who|which|that)\\s+(?:(?:actually|just|ever|always)\\s+)?(?:i|you|we|they|he|she|it|is|are|was|were|have|has|had|gave|called|said|teaches|makes|wants|asked|produce|provoke|annoy|irritate)\\b");
  add('structures','comparison','\\b(?:not\\s+)?as\\s+[a-z]+\\s+as\\b|\\bone thing to\\b|\\banother thing to\\b');
  add('structures','past_plan','\\b(?:was|were)\\s+(?:just\\s+|actually\\s+|probably\\s+)?going\\s+to\\b');
  add('structures','phrasal','\\b(?:sit|sits|sat)\\s+(?:back|down)\\b|\\b(?:go|goes|went|going)\\s+(?:by|back|off)\\b|\\b(?:get|gets|got)\\s+(?:up|back|out)\\b|\\b(?:take|takes|took|taken)\\s+down\\b|\\b(?:look|looks|looked)\\s+up\\b|\\bfigure\\s+(?:it|that|this)\\s+out\\b');
  add('intentions','explanation','\\b(?:the reason|another reason|that is why|that\'s why|because|cuz)\\b');
  add('intentions','clarification',"\\b(?:what i mean|i mean|i'm just saying|to be clear|in other words)\\b");
  add('intentions','reassurance',"\\b(?:that's (?:totally )?fine|it's (?:totally )?fine|no problem|don't worry|i'm not telling you you can't)\\b");
  add('intentions','permission','\\byou can (?:still )?(?:call|use|keep|choose|leave)\\b');
  add('intentions','boundary',"\\bi(?:'m| am) (?:just )?(?:not|never) going to share\\b|\\bdon't ask\\b");
  add('intentions','refusal',"\\bi (?:don't want to|won't|will not)\\b|\\bi'm not going to (?:answer|make|do|share)\\b");
  add('intentions','complaint',"\\bi (?:hate|don't like|can't stand)\\b|\\bi'm (?:just )?(?:like )?sick of\\b|\\b(?:annoys|irritates) me\\b|\\bwhat a pain\\b");
  add('intentions','announcement',"\\bi(?:'m| am) (?:officially )?changing my\\b|\\bmy (?:first |middle )?name is\\b|\\bi(?:'ve| have) decided\\b");
  add('intentions','humor',"\\bi'm (?:being dramatic|having fun|just kidding|joking)\\b|\\bit was a joke\\b");
  add('intentions','closing','^\\s*(?:bye|goodbye|see you|have a (?:good|great|wonderful|nice))\\b');
  add('intentions','attention','\\byou know what\\s*\\?');
  add('intentions','topic_change',"\\b(?:let's get back|back to the topic|a little side story|another thing|anyways|anyway)\\b");
  add('links','topic_change','^\\s*(?:well|okay|ok|anyways|anyway|so)\\b|\\b(?:back to the topic|side story)\\b');
  // A sentence-initial so may open a topic rather than express a result.
  out.links=out.links.filter(e=>e.type!=='result'||e.forms.some(f=>f.start>plain.search(/\S/)));
  // Purpose is only a suggestion when to + verb is not already owned by a
  // tense/obligation phrase or a want/need/try complement.
  add('links','purpose','\\bto\\s+(?:practice|learn|help|find|prove|protect|avoid|save|explain|understand)\\b',m=>{
   const before=plain.slice(0,m.index);return !/(?:want|wants|wanted|need|needs|needed|have|has|had|used|going|able|supposed|try|trying|decide|decided)\s*$/i.test(before)&&!grammatical.some(e=>e.forms.some(f=>f.start<=m.index&&f.end>=m.index+m[0].length));
  });
  if(quoted.length||context.quoted)out.structures.push({type:'quoted',forms:[],status:'context',note:'Có lời được trích, kể lại hoặc giả giọng. Ý trong dấu nháy có thể thuộc vai khác.'});
  if(context.previous&&/^\s*(?:i|you|we|they|he|she|it)(?:'m|'re|'s|\s+am|\s+are|\s+is)\b/i.test(stem)&&/^\s*if\b/i.test(context.previous))out.links.push({type:'context_link',forms:[],status:'context',note:'Câu trước mở bằng if; có thể đang nối điều kiện sang câu này. Đọc cả hai câu.'});
  // Broader sentence shapes complement the small set of special constructions.
  // Reuse the offline tense parser for verb evidence, not to infer intentions.
  let terms=[];
  const finite=grammatical.filter(e=>!['other','imperative'].includes(e.type)&&e.forms?.length);
  const bareCommand=grammatical.some(e=>e.type==='imperative');
  // Only inspect word classes again when the existing parser found no finite clause.
  try{if(!finite.length&&!bareCommand)terms=typeof root.nlp==='function'?root.nlp(plain).json().flatMap(s=>s.terms||[]):[];}catch{}
  const classify=(axis,type,forms=[],status='pattern',note='')=>{if(!out[axis].some(e=>e.type===type))out[axis].push({type,forms,status,note});};
  if(bareCommand&&!finite.length&&!/^\s*(?:thank you|thanks|hello|hi)\b/i.test(plain)){out.forms=out.forms.filter(e=>!['statement','yesno','question_context'].includes(e.type));classify('forms','imperative',grammatical.flatMap(e=>e.forms));}
  const verbForms=finite.flatMap(e=>e.forms.map(f=>({start:f.start,end:f.end})));
  const formula=/^\s*(?:thank you|thanks|hello|hi\b|good morning|good evening|good night|you're welcome|excuse me)\b/i.test(plain);
  if(formula)classify('forms','expression');
  if(!out.forms.some(e=>['statement','yesno','wh','tag','imperative','exclamation','fragment','expression','reaction'].includes(e.type))){
   if(/\?\s*$/.test(plain))classify('forms','question_context',[], 'context');
   else if(finite.length)classify('forms','statement',verbForms);
   else if(bareCommand)classify('forms','imperative',grammatical.flatMap(e=>e.forms));
   else if(/[A-Za-z]/.test(plain)&&terms.length&&terms.every(t=>!t.tags?.includes('Verb'))&&terms.some(t=>t.tags?.includes('Noun')))classify('forms','fragment',[], 'pattern','Cụm danh từ hoặc lời nói rút gọn; cần xem dòng phụ đề liền kề.');
   else if(/^\s*(?:to\s+\w+|[a-z]+ing\b)/i.test(plain)&&terms.some(t=>t.tags?.includes('Verb')))classify('forms','fragment',[], 'pattern','Cụm động từ chưa có động từ chia rõ.');
  }
  // A pronoun at the beginning alone is not proof of a complete statement.
  if(out.forms.some(e=>e.type==='statement')&&!finite.length&&terms.length&&!terms.some(t=>t.tags?.includes('Verb'))){out.forms=out.forms.filter(e=>e.type!=='statement');classify('forms','fragment');}
  if(/^\s*(?:because|although|if|unless|when|while|before|after|until|since|even though)\b/i.test(plain)&&grammatical.filter(e=>e.type!=='other'&&e.forms?.length).length===1&&!wh&&!yesno){out.forms=out.forms.filter(e=>e.type!=='statement');classify('forms','dependent',[],'context','Ý nhỏ trong câu mở đầu bằng từ phụ thuộc; xem thêm câu trước/sau để biết nó gắn vào ý nào.');}
  for(const entry of grammatical)if(entry.type==='future_going_to')classify('structures','going_to',entry.forms);
  if(!out.structures.length){
   if(formula||fragment||out.forms.some(e=>e.type==='reaction'))classify('structures','formula',[], 'pattern','Cụm/công thức giao tiếp không nhất thiết có đầy đủ người hoặc vật được nói tới và động từ.');
   else if(out.forms.some(e=>e.type==='imperative'))classify('structures','bare_command',grammatical.flatMap(e=>e.forms));
   else if(/^\s*there(?:\s+(?:is|are|was|were)|'s)\b/i.test(plain))classify('structures','existential',verbForms);
   else if(finite.some(e=>['present_simple','past_simple'].includes(e.type)&&e.forms.some(f=>/\b(?:am|is|are|was|were)\b|['’](?:m|re|s)\b/i.test(f.text||plain.slice(f.start,f.end)))))classify('structures','be_complement',verbForms);
   else if(finite.some(e=>['present_simple','past_simple'].includes(e.type)&&e.forms.some(f=>/^(?:have|has|had)$/i.test((f.text||plain.slice(f.start,f.end)).trim()))))classify('structures','have_noun',verbForms);
   else if(finite.length)classify('structures','basic_clause',verbForms,'pattern','Người hoặc vật được nói tới + cụm động từ; có thể kèm người hoặc vật nhận tác động, phần nói rõ đặc điểm hoặc danh tính hoặc phần nói thêm thời gian, nơi chốn hoặc cách làm.');
   else if(/^\s*(?:to\s+\w+|[a-z]+ing\b)/i.test(plain)&&terms.some(t=>t.tags?.includes('Verb')))classify('structures','nonfinite',[], 'pattern','Cụm to + dạng như do/work / dạng như doing/working chưa có động từ chia độc lập.');
   else if(out.forms.some(e=>e.type==='fragment'))classify('structures','phrase',[], 'pattern','Cụm từ hoặc câu rút gọn; xem thêm đoạn trước/sau.');
  }
  add('intentions','greeting','^\\s*(?:hello|hi|good morning|good evening|good night)\\b');
  if(/^\s*(?:i|we)(?:'m|'re|\s+am|\s+are)\b/i.test(plain)&&grammatical.some(e=>e.type==='future_going_to'))classify('intentions','plan',grammatical.filter(e=>e.type==='future_going_to').flatMap(e=>e.forms),'context','Going to ở đây là gợi ý về dự định; vẫn cần xét đoạn trước/sau.');
  add('intentions','encouragement',"\\bkeep going\\b|\\bdon't give up\\b|\\byou can do it\\b");
  if(!out.intentions.length&&out.forms.some(e=>['wh','yesno'].includes(e.type)))classify('intentions','question',[],'context','Có hình thức câu hỏi; có thể đang hỏi thật, nhắc lại lời hoặc nhấn mạnh.');
  if(!out.intentions.length&&out.forms.some(e=>e.type==='imperative'))classify('intentions','direct_request',[],'context','Mẫu yêu cầu/nhắc trực tiếp; sắc thái khuyên, động viên hay ra lệnh còn tùy đoạn trước/sau.');
  if(!out.intentions.length&&out.forms.some(e=>e.type==='statement'))classify('intentions','information',[],'context','Câu nói/kể đang nêu thông tin hoặc kể lại; ý định cụ thể có thể khác tùy đoạn trước/sau.');
  // Connectors can join words/phrases as well as clauses and sentences.
  add('links','addition','\\b(?:and|furthermore|moreover)\\b');
  add('links','alternative','\\b(?:or|either|neither|nor|otherwise)\\b');
  add('links','contrast','\\b(?:yet|whereas|nonetheless|despite|in spite of)\\b',m=>m[0].toLowerCase()!=='yet'||/[;,]\s*$/.test(plain.slice(0,m.index)));
  add('links','result','\\b(?:thus|hence|consequently)\\b');
  // Separate absence of an explicit marker from a failure to understand a sentence.
  if(!out.structures.length)classify('structures','review',[],'review','Bộ nhận diện chưa xác định được cấu trúc; câu vẫn có thể có cấu trúc hợp lệ.');
  if(!out.forms.length||out.forms.every(e=>e.type==='negative'))classify('forms','review',[],'review','Chưa đủ căn cứ về loại câu; phụ đề có thể bị ngắt hoặc thiếu dấu câu.');
  if(!out.intentions.length)classify('intentions','context',[],'context','Cần nghe câu trước/sau để xác định mục đích nói; không gán ý định chỉ từ vài từ khóa.');
  if(!out.links.length)classify('links','no_marker',[],'not_detected','Không nhận diện từ nối rõ trong câu này. Ý vẫn có thể nối với câu trước bằng đoạn trước/sau; bộ nhận diện cũng có thể bỏ sót mẫu.');
  if(out.forms.some(e=>e.type==='reaction'))out.intentions=out.intentions.filter(e=>!['suggestion','question'].includes(e.type));
  for(const e of out.intentions)if(!['greeting','thanks','closing'].includes(e.type)){e.status='context';e.note=e.note||(quoted.length||context.quoted?'Dấu hiệu trong lời có trích dẫn/giả giọng; chưa chắc là lời trực tiếp nói với người xem.':'Gợi ý theo cách nói; cần nghe cả đoạn để hiểu đúng ý.');}
  for(const e of out.links)if(['purpose','result','topic_change','context_link','ambiguous'].includes(e.type)){e.status='context';e.note=e.note||'Gợi ý quan hệ giữa các ý; cần đọc câu trước/sau.';}
  for(const axis of Object.keys(out)){
   const unique=new Map();for(const entry of out[axis]){if(!unique.has(entry.type))unique.set(entry.type,{...entry,forms:[]});unique.get(entry.type).forms.push(...entry.forms);}
   out[axis]=[...unique.values()].map(entry=>({...entry,forms:[...new Map(entry.forms.map(f=>[f.start+':'+f.end,f])).values()]}));
  }
  if(root.TBPatterns)out.structures=root.TBPatterns.analyze(text,{...context,grammar:grammatical});
  return out;
 }
 Object.assign(axes.structures.types,{basic_clause:'Người hoặc vật được nói tới + cụm động từ',be_complement:'Be + phần nói rõ đặc điểm hoặc danh tính',have_noun:'Have + danh từ',have_to:'Have to + V',able_to:'Be able to + V',existential:'There is / are',bare_command:'Động từ · lược người hoặc vật được nói tới',formula:'Công thức giao tiếp',phrase:'Cụm từ / câu rút gọn',nonfinite:'Cụm to + dạng như do/work / dạng như doing/working',review:'Cần phân tích thêm'});
 Object.assign(axes.forms.types,{expression:'Công thức giao tiếp',question_context:'Câu hỏi · cần đoạn trước/sau',dependent:'Ý nhỏ trong câu phụ / câu chưa trọn',review:'Cần xem thêm câu/phụ đề'});
 Object.assign(axes.intentions.types,{greeting:'Chào hỏi',plan:'Nêu dự định · going to',encouragement:'Động viên',direct_request:'Yêu cầu / nhắc trực tiếp · gợi ý',information:'Nêu thông tin / kể lại · gợi ý',context:'Cần đoạn trước/sau để rõ ý định'});
 Object.assign(axes.links.types,{alternative:'Lựa chọn · or…',no_marker:'Không nhận diện từ nối rõ'});
 axes.structures.hint='Gồm cả cấu trúc cơ bản và mẫu đặc biệt. Cụm từ/câu rút gọn cũng có cấu tạo, dù chưa có động từ chia.';
 axes.forms.hint='Loại câu khác với thì. Câu nói/kể có thể cách nói có/đúng hoặc cách nói không/chưa; câu hỏi có thể dùng để nhờ vả.';
 axes.intentions.hint='Đây là gợi ý, không phải kết luận về mục đích nói. Câu nêu thông tin vẫn có thể mang ý khác trong đoạn trước/sau.';
 axes.links.hint='Từ nối có thể nối từ, cụm hoặc ý. Không thấy từ nối không có nghĩa câu không liên quan đến nội dung trước đó.';
 const descriptions={
  basic_clause:'Có người hoặc vật được nói tới và cụm động từ; phía sau có thể có người hoặc vật nhận tác động, phần nói rõ đặc điểm hoặc danh tính hoặc phần nói thêm thời gian, nơi chốn hoặc cách làm. Không phải câu nào cũng cần một mẫu đặc biệt.',
  be_complement:'Be nối người hoặc vật được nói tới với đặc điểm, danh tính hoặc vị trí. Ví dụ: I am tired. Không tự coi đây là tiếp diễn.',
  have_noun:'Have ở đây đi với danh từ, chẳng hạn I have a bike; không tự coi have là hiện tại hoàn thành.',
  formula:'Công thức như Hello, Thank you, Sounds good thường được dùng độc lập mà không cần đủ người hoặc vật được nói tới + động từ.',
  phrase:'Cụm từ/câu rút gọn vẫn có nghĩa trong hội thoại; cũng có thể chỉ là một phần câu bị phụ đề ngắt ra.',
  nonfinite:'To + dạng như do/work / dạng như doing/working đứng riêng chưa xác lập thì. Xem dòng trước/sau để biết nó là một phần của câu nào.',
  review:'Bộ nhận diện chưa đủ căn cứ, không có nghĩa câu không có cấu trúc. Hãy đối chiếu với bản chép lời và đoạn trước/sau.',
  information:'Đây là gợi ý rộng cho câu nói/kể nêu thông tin hoặc kể lại. Mục đích thực tế có thể là giải thích, trả lời, nhắc nhở… tùy đoạn trước/sau.',
  context:'Chưa suy ra được mục đích nói từ riêng câu này. Không gán một ý định cụ thể chỉ để mọi câu có nhãn.',
  direct_request:'Hình thức yêu cầu/nhắc trực tiếp có thể mang sắc thái nhờ vả, khuyên, động viên hay ra lệnh tùy tình huống.',
  no_marker:'Không nhận diện được từ nối rõ trong câu này. Ý vẫn có thể nối bằng đoạn trước/sau, hoặc bộ nhận diện còn bỏ sót mẫu.',
  addition:'And / also… có thể nối từ, cụm từ, ý nhỏ trong câu hoặc các ý; không phải lúc nào cũng nối hai câu hoàn chỉnh.',
  alternative:'Or / either / neither… thể hiện lựa chọn hoặc nối các từ/cụm/câu theo quan hệ lựa chọn.'
 };

 // Learner-facing names are deliberately plain. Type codes stay stable for saved data.
 const friendly={
  structures:{modal:'Can / could / should…',passive:'Được làm / trạng thái',conditional:'If / unless · điều kiện',wish:'Wish · điều ước',used_to:'Used to · trước đây từng',accustomed:'Be used to · đã quen',relative:'Who / which / that · nói thêm',reported:'Kể lại lời người khác',comparison:'So sánh hai điều',infinitive:'Động từ + to do',gerund:'Động từ + doing',basic_clause:'Ai / cái gì + làm / là',be_complement:'Be · là / ở / có đặc điểm',have_noun:'Have · có gì',have_to:'Have to · cần / phải làm',able_to:'Be able to · có thể làm',existential:'There is / are · có gì',bare_command:'Bảo / mời làm gì',formula:'Cách nói quen dùng',phrase:'Lời ngắn theo câu trước',nonfinite:'To do / doing · chưa có thì riêng',review:'App chưa hiểu rõ mẫu câu',supposed_to:'Be supposed to · được mong đợi làm',object_infinitive:'Muốn / nhờ ai làm gì',make_object:'Make / let / help · khiến / để / giúp ai làm',rather:'Would rather · thích lựa chọn nào hơn',had_better:'Had better · nên làm',feel_like:'Feel like · cảm thấy rằng',content_clause:'Một ý nằm trong câu lớn',quote_frame:'Be like · chêm / dẫn lời',quoted:'Có lời được nhắc lại',past_plan:'Was going to · đã định làm',phrasal:'Cụm như sit back / go by'},
  forms:{statement:'Câu nói / kể',negative:'Có không / chưa / chẳng…',yesno:'Hỏi có / không',wh:'Hỏi ai / gì / ở đâu…',tag:'Hỏi xác nhận ở cuối câu',imperative:'Bảo / mời làm gì',exclamation:'Câu thốt lên',fragment:'Câu nói ngắn theo đoạn trước',expression:'Cách nói quen dùng',question_context:'Câu hỏi · cần đọc thêm',dependent:'Một ý còn nối với câu khác',reaction:'Cách nói gợi phản ứng',review:'App chưa rõ loại câu'},
  intentions:{request:'Nhờ giúp đỡ',advice:'Khuyên làm gì',suggestion:'Rủ / gợi ý cùng làm',offer:'Mời / đề nghị giúp',opinion:'Nêu ý kiến',feeling:'Bày tỏ cảm xúc',thanks:'Cảm ơn',apology:'Xin lỗi',agreement:'Đồng ý',disagreement:'Không đồng ý',question:'Có thể đang hỏi thông tin',greeting:'Chào hỏi',plan:'Nói dự định · gợi ý',encouragement:'Động viên',direct_request:'Bảo / nhắc làm gì · gợi ý',information:'Nêu thông tin / kể lại · gợi ý',context:'Cần đọc / nghe thêm để rõ ý',reaction:'Gợi phản ứng · cần nghe giọng',explanation:'Giải thích / nêu lý do',clarification:'Nói rõ / sửa cách diễn đạt',reassurance:'Trấn an / nói không sao',permission:'Cho phép / để người khác chọn',boundary:'Nói giới hạn của mình',refusal:'Từ chối / không muốn làm',complaint:'Phàn nàn / bày tỏ không thích',announcement:'Thông báo / công bố',humor:'Nói đùa / làm quá · gợi ý',closing:'Chúc / chào kết thúc',attention:'Gây chú ý / mở thêm ý',topic_change:'Quay lại / chuyển chủ đề'},
  links:{addition:'Thêm ý',contrast:'Đối chiếu / ý khác với trước',reason:'Nêu lý do',result:'Nói kết quả · gợi ý',condition:'Nếu / trừ khi',sequence:'Trước / sau / tiếp theo',example:'Đưa ví dụ',purpose:'Để làm gì · gợi ý',time:'Nối theo thời gian',clarify:'Nói lại cho rõ',ambiguous:'Since / while · cần đọc thêm',alternative:'Hoặc / lựa chọn',no_marker:'Chưa thấy từ nối rõ',topic_change:'Mở / chuyển ý',context_link:'Có thể nối ý từ câu trước'}
 };
 for(const axis of Object.keys(friendly))Object.assign(axes[axis].types,friendly[axis]);
 axes.structures.hint='Người nói ráp câu bằng mẫu nào? Một câu có thể chứa nhiều mẫu nhỏ để bạn học theo.';
 axes.forms.hint='Câu có hình thức nào? Hỏi, nói/kể, bảo/mời hay thốt lên. Cách nói không/chưa được ghi thêm.';
 axes.intentions.hint='Người nói có thể đang muốn làm gì? Đây là gợi ý; lời được nhắc lại hoặc câu nói đùa cần nghe cả đoạn.';
 axes.links.hint='Ý này nối với ý khác ra sao? Không thấy từ nối rõ vẫn có thể hiểu liên hệ từ câu trước.';
 Object.assign(descriptions,{
  basic_clause:'Ai hoặc cái gì đang làm gì, là gì, ở đâu hoặc có đặc điểm nào. Câu có thể chứa thêm các mẫu nhỏ khác.',
  be_complement:'Am/is/are/was/were nối người hoặc vật với danh tính, đặc điểm hoặc vị trí. Ví dụ I am tired không có nghĩa đang làm việc gì.',
  have_noun:'Have nói có gì, như I have a bike. Khác have to (phải làm) và have done (đã làm, còn liên hệ hiện tại).',
  formula:'Lời quen dùng như Hello, Thank you, Sounds good. Có thể nói độc lập và không cần ép vào một thì.',
  phrase:'Lời ngắn có thể đủ nghĩa khi đọc câu trước, như Blue trả lời câu hỏi màu yêu thích. Cũng có thể là phụ đề cắt giữa câu.',
  nonfinite:'To do hoặc doing có thể là phần phụ của câu. Không tự gán một thì riêng cho mỗi từ đó.',
  review:'App chưa hiểu rõ chỗ này, không có nghĩa lời người nói sai. Đọc câu trước/sau hoặc nghe lại.',
  information:'Gợi ý rộng rằng câu đang nêu thông tin hoặc kể lại. Trong cả đoạn, người nói còn có thể đang giải thích, đùa hay trấn an.',
  context:'Chưa đủ căn cứ để hiểu đúng ý người nói. App không tự gán một ý định chỉ để câu nào cũng có nhãn.',
  direct_request:'Có hình thức bảo, mời hoặc nhắc làm gì. Giọng nói và tình huống giúp phân biệt nhờ, khuyên, đùa hay ra lệnh.',
  no_marker:'App chưa thấy từ nối rõ. Ý vẫn có thể liên hệ với câu trước, hoặc app còn bỏ sót cách nối.',
  addition:'And/also có thể nối các từ, cụm hoặc ý. Không nhất thiết đang nối hai câu hoàn chỉnh.',
  alternative:'Or/either/neither đưa ra lựa chọn hoặc nối những điều có thể thay nhau.',
  negative:'Có cách nói không, chưa, chẳng hoặc không bao giờ. Một câu hỏi hay câu bảo làm gì cũng có thể mang cách nói này.',
  wh:'Hỏi ai, gì, ở đâu, vì sao, thế nào… Phải xét cả cách ráp câu; thấy What ở đầu chưa đủ kết luận là câu hỏi.',
  yesno:'Câu có hình thức hỏi có/không. Người nói có thể dùng để hỏi thật, nhờ giúp hoặc nhấn mạnh một ý.',
  reaction:'Cách nói như How about that? có thể gợi người nghe phản ứng. Cần giọng nói và câu trước để biết là đùa, ngạc nhiên hay hỏi thật.',
  relative:'Who/which/that có thể nối phần nói thêm về người, vật hoặc điều vừa nhắc. Không phải mọi who/that đều dùng theo cách này.',
  passive:'Nói việc được làm hoặc mô tả trạng thái. Be + từ như closed/confused có thể có nhiều cách hiểu, nên đọc cả câu.',
  supposed_to:'Be supposed to nói điều được mong đợi hoặc cho là nên làm, như What am I supposed to say?',
  object_infinitive:'Muốn hoặc nhờ ai làm việc gì, như I want you to help. Phần to help không có một thì riêng.',
  make_object:'Make/let/help và người theo sau rồi tới hành động: made me think, let me go. Think/go ở đây không có thì riêng.',
  rather:'Would rather nói thích lựa chọn nào hơn. Không tách would và phần hành động thành các thì độc lập.',
  had_better:'Had better dùng để khuyên hoặc nhắc nên làm gì. Had ở đây không tự mang nghĩa một việc đã xảy ra.',
  feel_like:'Feel like và một ý theo sau có thể nêu cảm nhận. Khác feel like doing diễn đạt muốn làm gì.',
  content_clause:'Một câu lớn có thể chứa một ý nhỏ như what my mom told me hoặc why it is hard. Phải xét cả câu, không gán chỉ từ một từ hỏi.',
  quote_frame:'Be like có thể là cách chêm khi nói hoặc mở lời/phản ứng được kể lại. Like không có nghĩa thích trong những cách dùng này.',
  quoted:'Có lời được nhắc lại hoặc giả giọng. Câu bên trong có thể thuộc một vai khác, không phải lời trực tiếp hỏi người xem.',
  past_plan:'Was/were going to + hành động: một dự định từ thời điểm quá khứ, có thể đã thay đổi sau đó.',
  phrasal:'Học cả cụm như sit back, go by, get up, figure it out. Các từ back/by/up/out trong cụm không tự có thì riêng.',
  topic_change:'Có dấu hiệu mở, chuyển hoặc quay lại một ý, như well/anyway/so. Không phải mọi so đều nêu kết quả.',
  context_link:'Câu trước có thể đang mở một ý chưa nói hết. Đọc cả hai trước khi kết luận cách chúng nối với nhau.'
 });
 Object.assign(descriptions,{
  modal:'Can/could/should/must… giúp nói có thể, nên, phải hoặc có lẽ. Ví dụ You should rest là lời khuyên; không phải một thì riêng.',
  conditional:'If là nếu; unless gần nghĩa trừ khi. Xem điều kiện và điều xảy ra theo nó; không phải mọi if đều dùng để nêu điều kiện.',
  wish:'Wish nói điều ước hoặc điều mong khác thực tế, như I wish I knew. Dạng quá khứ trong mẫu này có thể nói về hiện tại.',
  used_to:'Used to + hành động nói việc từng thường làm hoặc trạng thái trước đây; nay thường đã khác. Ví dụ I used to live here.',
  accustomed:'Be/get used to nói đã quen hoặc dần quen với điều gì, như I am used to working late. Khác I used to work late (trước đây từng làm).',
  reported:'Kể lại lời người khác, như She told me she was busy. Cần phân biệt người đang kể với người được nhắc lời.',
  comparison:'So sánh hai điều, như bigger than (lớn hơn) hoặc as good as (tốt ngang). Đọc cả hai phần để biết đang so sánh gì.',
  infinitive:'Động từ theo sau bằng to + dạng như do/work, như want to learn (muốn học). To learn không tự mang một thì riêng.',
  gerund:'Một số động từ đi với dạng doing, như enjoy learning (thích việc học). Learning ở đây không tự là thì tiếp diễn.',
  have_to:'Have to nói cần hoặc phải làm gì, như I have to go. Khác have a bike (có xe) và have gone (đã đi).',
  able_to:'Be able to nói có thể làm được gì, như She is able to swim. Dạng is/was/will be giúp xác định cách nói về thời gian.',
  existential:'There is/are nói có hoặc tồn tại điều gì ở đâu, như There is a book on the table. There không nhất thiết chỉ nơi chốn ở đây.',
  bare_command:'Bắt đầu bằng hành động và thường không nói ra you, như Sit down. Có thể là lời bảo, mời, nhờ hoặc hướng dẫn.',
  statement:'Câu nói hoặc kể một điều, như I work here. Hình thức này cũng có thể dùng để giải thích, nhắc nhở hay nói đùa.',
  tag:'Phần hỏi ngắn ở cuối, như You like it, don’t you? Thường để hỏi xác nhận hoặc mời người nghe phản hồi.',
  imperative:'Bảo, mời hoặc nhắc làm gì, như Please sit down hoặc Don’t worry. Ý thân thiện hay ra lệnh còn tùy giọng và tình huống.',
  exclamation:'Câu thốt lên để nhấn mạnh cảm xúc, như What a beautiful day! Dấu chấm than riêng lẻ chưa đủ xác định loại câu.',
  fragment:'Lời ngắn có thể đủ nghĩa khi trả lời câu trước, như Not yet. Cũng có thể là phụ đề cắt giữa câu; nghe đoạn liền kề để phân biệt.',
  expression:'Cách nói quen dùng, như Thank you hoặc Hello. Có thể nói độc lập mà không cần xếp vào một thì.',
  question_context:'Có dấu hiệu hỏi nhưng app chưa rõ cách ráp câu hoặc phụ đề chưa đủ. Nghe giọng và đọc câu trước/sau.',
  dependent:'Ý chưa đứng riêng đầy đủ, như Because I was tired. Đọc ý trước hoặc sau để biết phần này giải thích hay nối với điều gì.',
  request:'Có thể đang nhờ ai làm giúp, như Could you help me? Hình thức là câu hỏi nhưng mục đích có thể là nhờ giúp.',
  advice:'Có thể đang khuyên nên làm gì, như You should rest. Cần nghe cả đoạn vì cùng mẫu còn dùng để nhắc hoặc phê bình.',
  suggestion:'Có thể đang rủ hoặc đề xuất một việc, như Let’s go hoặc Why don’t we try? Không ép mọi How about… vào ý này.',
  offer:'Có thể đang mời hoặc đề nghị giúp, như Shall I help? Phân biệt với nhờ người khác giúp bằng vai người làm hành động.',
  opinion:'Nêu cách nhìn hoặc nhận xét, như I think it is useful. Mẫu câu là dấu hiệu, chưa bảo đảm hiểu hết ý người nói.',
  feeling:'Nói cảm giác hoặc cảm xúc, như I feel happy. Có thể cùng lúc đang giải thích, than phiền hoặc trấn an.',
  thanks:'Bày tỏ cảm ơn, như Thank you. Nếu nằm trong lời được kể lại thì có thể là lời của người khác.',
  apology:'Có thể đang xin lỗi, như I’m sorry. Trong một số tình huống còn là lời tiếc nuối hoặc mở đầu ý không đồng ý.',
  agreement:'Có thể đang tán thành hoặc xác nhận, như I agree. Đọc ý được nhắc tới để biết đang đồng ý với điều gì.',
  disagreement:'Có thể đang không đồng ý, như I don’t agree. Cần đoạn trước để hiểu điều bị phản đối.',
  question:'Có hình thức hỏi thông tin; cũng có thể đang hỏi lại, nhấn mạnh hoặc nhắc lời người khác. Cần nghe cả đoạn.',
  greeting:'Lời chào như Hi, Hello, Good morning. Có thể xuất hiện trong ví dụ hoặc lời được kể lại.',
  plan:'Có thể đang nêu dự định, như I am going to study. Going to còn dùng để dự đoán nên cần xét cả câu.',
  encouragement:'Có thể đang động viên, như Keep going hoặc You can do it. Giọng nói và đoạn trước giúp hiểu đúng sắc thái.',
  explanation:'Có thể đang giải thích hoặc đưa lý do cho điều vừa nói. Không phải mọi because đều thể hiện toàn bộ mục đích của câu.',
  clarification:'Có thể đang nói lại cho rõ hoặc sửa cách diễn đạt, như I mean… hoặc In other words…',
  reassurance:'Có thể đang trấn an, như Don’t worry hoặc It’s okay. Nghe thêm để phân biệt trấn an thật với lời đùa.',
  permission:'Có thể đang cho phép hoặc để người khác chọn, như You can leave. Can cũng có thể nói khả năng nên chưa kết luận chỉ từ một từ.',
  boundary:'Có thể đang nói điều mình chấp nhận, không chấp nhận hoặc giới hạn của mình. Cần cả tình huống để hiểu.',
  refusal:'Có thể đang từ chối hoặc không muốn làm gì. Một câu có not không tự động là lời từ chối.',
  complaint:'Có thể đang bày tỏ điều không thích hoặc phàn nàn. Cần giọng nói và tình huống, đặc biệt khi người nói đùa.',
  announcement:'Có thể đang công bố hoặc thông báo điều sắp chia sẻ. Dấu hiệu từ ngữ chưa đủ xác định toàn bộ ý định.',
  humor:'Có dấu hiệu có thể đang nói đùa, giả giọng hoặc làm quá. App không xác nhận được sự hài hước chỉ từ phụ đề.',
  closing:'Có thể là lời chúc hoặc chào kết thúc, như See you hoặc Have a good day. Cần xem vị trí trong cuộc nói chuyện.',
  attention:'Có thể đang gọi sự chú ý hoặc mở thêm một ý, như Listen hoặc Look. Những từ này còn có nghĩa hành động thật.',
  contrast:'Nối hai ý khác nhau hoặc trái với điều dự đoán, như but/although/however. Đọc hai phía để biết điểm khác nhau.',
  reason:'Because/cuz có thể nêu lý do. Xem ý được giải thích và phần lý do; cuz là cách nói thân mật của because.',
  result:'Có thể nối với kết quả, như It rained, so I stayed home. So ở đầu câu cũng có thể chỉ mở ý, không nhất thiết là kết quả.',
  condition:'If/unless mở điều kiện cho ý khác, như If it rains, stay home. If sau know/wonder có thể mang nghĩa liệu… thay vì điều kiện.',
  sequence:'First/then/next/finally giúp theo thứ tự các bước hoặc sự việc. Một số từ còn có cách dùng khác tùy câu.',
  example:'For example/for instance mở một ví dụ để làm rõ ý vừa nói.',
  purpose:'Có thể nói để làm gì, như I came to help. To sau want/need có thể chỉ là phần của mẫu động từ, không tự là quan hệ mục đích.',
  time:'When/before/after/until có thể nối theo thời gian. Đọc cả hai ý để hiểu sự việc xảy ra lúc nào và theo thứ tự nào.',
  clarify:'I mean/in other words có thể mở cách nói lại hoặc giải thích rõ điều vừa nêu.',
  ambiguous:'Since có thể là từ khi hoặc bởi vì; while có thể là trong khi hoặc đối chiếu hai ý. Cần đọc cả câu để chọn nghĩa.'
 });
 for(const axis of Object.keys(axes))for(const [id,label] of Object.entries(axes[axis].types))if(!descriptions[id])descriptions[id]=label+'. Xem cả câu và nghe đoạn trước/sau để hiểu cách dùng.';
 axes.structures.types.going_to='Going to / gonna · dự định, dự đoán';
 descriptions.going_to='Am/is/are going to hoặc gonna đi với hành động; có thể nói dự định hoặc dự đoán. Không tự tách phần hành động thành một thì khác.';
 if(root.TBPatterns){axes.structures.label='Mẫu câu';axes.structures.types=root.TBPatterns.types;axes.structures.hint='Khung lớn và mẫu nhỏ có thể cùng xuất hiện. Mỗi bộ lọc đếm vùng nội dung có mẫu đó; không cộng các nhóm để suy ra số câu. Mở chi tiết để xem cụm chữ và mẫu ráp câu.';Object.assign(descriptions,root.TBPatterns.descriptions);}
 const fallbackType=axis=>({structures:'review',forms:'review',intentions:'context',links:'no_marker'})[axis];
 const api={axes,analyze,descriptions,fallbackType};if(typeof module!=='undefined')module.exports=api;else root.TBPerspectives=api;
})(globalThis);
