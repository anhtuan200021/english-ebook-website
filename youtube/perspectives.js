'use strict';
// Pattern matches are study hints, not a claim to understand the speaker's intent.
(function(root){
 const axes={structures:{label:'Cấu trúc',hint:'Quan sát mẫu ngữ pháp để tập nói câu mới.',types:{modal:'Động từ khuyết thiếu',passive:'Bị động / trạng thái',conditional:'If / unless',wish:'Wish',used_to:'Used to · từng',accustomed:'Be / get used to · quen',relative:'Mệnh đề quan hệ',reported:'Lời nói gián tiếp',comparison:'So sánh',infinitive:'Động từ + to V',gerund:'Động từ + V-ing'}},
 forms:{label:'Loại câu',hint:'Quan sát hình thức của câu; một câu hỏi vẫn có thể là lời nhờ vả.',types:{statement:'Trần thuật',negative:'Phủ định',yesno:'Câu hỏi Yes/No',wh:'Câu hỏi từ để hỏi',tag:'Câu hỏi đuôi',imperative:'Mệnh lệnh / yêu cầu trực tiếp',exclamation:'Cảm thán',fragment:'Câu rút gọn / đáp ngắn'}},
 intentions:{label:'Ý định giao tiếp',hint:'Gợi ý từ mẫu diễn đạt; cần nghe ngữ cảnh để biết đúng ý người nói.',types:{request:'Nhờ vả',advice:'Lời khuyên',suggestion:'Gợi ý cùng làm',offer:'Mời / đề nghị',opinion:'Nêu ý kiến',feeling:'Bày tỏ cảm xúc',thanks:'Cảm ơn',apology:'Xin lỗi',agreement:'Đồng ý',disagreement:'Không đồng ý',question:'Hỏi thông tin'}},
 links:{label:'Cách nối ý',hint:'Tìm từ/cụm nối và đọc cả câu để xem các ý liên hệ thế nào.',types:{addition:'Thêm ý',contrast:'Đối lập / nhượng bộ',reason:'Nguyên nhân',result:'Kết quả',condition:'Điều kiện',sequence:'Trình tự',example:'Ví dụ',purpose:'Mục đích',time:'Thời gian',clarify:'Nói rõ / diễn đạt lại',ambiguous:'Since / while · tùy ngữ cảnh'}}};
 function analyze(value){
  const text=String(value||''),plain=text.replace(/[’‘]/g,"'"),out={structures:[],forms:[],intentions:[],links:[]};
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
  const imperative=!fragment&&!yesno&&!wh&&add('forms','imperative',"^\\s*(?:please\\s+)?(?:don't\\s+|do not\\s+)?(?:sit|stand|come|go|take|get|put|give|keep|wait|listen|look|try|stop|start|open|close|remember|relax|watch|tell|show|help|worry|forget|be|have|do|clean|wash|read|write|call|send|turn|leave|stay|make|check|use|eat|drink|say|ask|let's)\\b(?!\\s+(?:is|was|has|does)\\b)");
  const exclamation=add('forms','exclamation','^\\s*(?:what\\s+(?:a|an)\\s+|how\\s+(?:beautiful|wonderful|nice|great|amazing)\\b)');
  if(!tag&&!wh&&!yesno&&!fragment&&!imperative&&!exclamation){
   if(!add('forms','statement',"^\\s*(?:i|you|we|they|he|she|it|there|this|that|these|those)(?:'m|'re|'s|'ve|'d|'ll)?\\b")&&/\?\s*$/.test(plain))add('forms','yesno','\\?\\s*$');
  }
  add('intentions','request',"\\b(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:help|pass|give|send|show|tell|open|close|hold|wait|bring|take|check|turn|lend)\\b|\\bwould\\s+you\\s+mind\\b");
  add('intentions','advice',"\\b(?:you\\s+should(?:n't)?|you\\s+ought\\s+to|you(?:'d|\\s+had)\\s+better)\\b");
  add('intentions','suggestion',"\\blet's\\b|\\bwhy\\s+don't\\s+(?:you|we)\\b|\\bhow\\s+about\\b|\\bwhat\\s+about\\b|\\bshall\\s+we\\b");
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
  add('links','reason','\\b(?:because(?: of)?|due to)\\b');
  add('links','result',"\\b(?:therefore|as a result|that's why|that is why)\\b|\\bso(?=\\s+(?:i|you|we|they|he|she|it|there)\\b)");
  add('links','condition','\\b(?:if|unless|as long as|provided that)\\b',m=>!/(?:wonder|know|ask|asked|see|sure)\s*$/i.test(plain.slice(0,m.index)));
  add('links','sequence','(?:^|[,;.!?]\\s*|\\band\\s+)(?:first|second|next|then|finally)\\b|\\bafter that\\b|\\bto begin with\\b');
  add('links','example','\\b(?:for example|for instance|such as)\\b');
  add('links','purpose','\\b(?:so that|in order to|so as to)\\b');
  add('links','time','\\b(?:before|after|when|until|as soon as|once)\\b');
  add('links','clarify',"\\b(?:in other words|that means|what i mean is|i mean)\\b");
  add('links','ambiguous','\\b(?:since|while)\\b');
  // Broader sentence shapes complement the small set of special constructions.
  // Reuse the offline tense parser for verb evidence, not to infer intentions.
  let grammatical=[];let terms=[];
  try{grammatical=root.TBGrammar?.analyze(plain)||[];}catch{}
  const finite=grammatical.filter(e=>!['other','imperative'].includes(e.type)&&e.forms?.length);
  const bareCommand=grammatical.some(e=>e.type==='imperative');
  // Only inspect word classes again when the existing parser found no finite clause.
  try{if(!finite.length&&!bareCommand)terms=typeof root.nlp==='function'?root.nlp(plain).json().flatMap(s=>s.terms||[]):[];}catch{}
  const classify=(axis,type,forms=[],status='pattern',note='')=>{if(!out[axis].some(e=>e.type===type))out[axis].push({type,forms,status,note});};
  const verbForms=finite.flatMap(e=>e.forms.map(f=>({start:f.start,end:f.end})));
  const formula=/^\s*(?:thank you|thanks|hello|hi\b|good morning|good evening|good night|you're welcome|excuse me)\b/i.test(plain);
  if(formula)classify('forms','expression');
  if(!out.forms.some(e=>['statement','yesno','wh','tag','imperative','exclamation','fragment','expression'].includes(e.type))){
   if(/\?\s*$/.test(plain))classify('forms','question_context',[], 'context');
   else if(finite.length)classify('forms','statement',verbForms);
   else if(bareCommand)classify('forms','imperative',grammatical.flatMap(e=>e.forms));
   else if(/[A-Za-z]/.test(plain)&&terms.length&&terms.every(t=>!t.tags?.includes('Verb'))&&terms.some(t=>t.tags?.includes('Noun')))classify('forms','fragment',[], 'pattern','Cụm danh từ hoặc lời nói rút gọn; cần xem dòng phụ đề liền kề.');
   else if(/^\s*(?:to\s+\w+|[a-z]+ing\b)/i.test(plain)&&terms.some(t=>t.tags?.includes('Verb')))classify('forms','fragment',[], 'pattern','Cụm động từ chưa có động từ chia rõ.');
  }
  // A pronoun at the beginning alone is not proof of a complete statement.
  if(out.forms.some(e=>e.type==='statement')&&!finite.length&&terms.length&&!terms.some(t=>t.tags?.includes('Verb'))){out.forms=out.forms.filter(e=>e.type!=='statement');classify('forms','fragment');}
  if(/^\s*(?:because|although|if|unless|when|while|before|after|until|since|even though)\b/i.test(plain)&&grammatical.filter(e=>e.type!=='other'&&e.forms?.length).length===1&&!wh&&!yesno){out.forms=out.forms.filter(e=>e.type!=='statement');classify('forms','dependent',[],'context','Mệnh đề mở đầu bằng từ phụ thuộc; xem thêm câu trước/sau để biết nó gắn vào ý nào.');}
  if(!out.structures.length){
   if(formula||fragment)classify('structures','formula',[], 'pattern','Cụm/công thức giao tiếp không nhất thiết có đầy đủ chủ ngữ và động từ.');
   else if(out.forms.some(e=>e.type==='imperative'))classify('structures','bare_command',grammatical.flatMap(e=>e.forms));
   else if(/^\s*there(?:\s+(?:is|are|was|were)|'s)\b/i.test(plain))classify('structures','existential',verbForms);
   else if(finite.some(e=>['present_simple','past_simple'].includes(e.type)&&e.forms.some(f=>/\b(?:am|is|are|was|were)\b|['’](?:m|re|s)\b/i.test(f.text||plain.slice(f.start,f.end)))))classify('structures','be_complement',verbForms);
   else if(finite.some(e=>['present_simple','past_simple'].includes(e.type)&&e.forms.some(f=>/^(?:have|has|had)$/i.test((f.text||plain.slice(f.start,f.end)).trim()))))classify('structures','have_noun',verbForms);
   else if(finite.length)classify('structures','basic_clause',verbForms,'pattern','Chủ ngữ + cụm động từ; có thể kèm tân ngữ, bổ ngữ hoặc trạng ngữ.');
   else if(/^\s*(?:to\s+\w+|[a-z]+ing\b)/i.test(plain)&&terms.some(t=>t.tags?.includes('Verb')))classify('structures','nonfinite',[], 'pattern','Cụm to V / V-ing chưa có động từ chia độc lập.');
   else if(out.forms.some(e=>e.type==='fragment'))classify('structures','phrase',[], 'pattern','Cụm từ hoặc câu rút gọn; xem thêm ngữ cảnh.');
  }
  add('intentions','greeting','^\\s*(?:hello|hi|good morning|good evening|good night)\\b');
  if(/^\s*(?:i|we)(?:'m|'re|\s+am|\s+are)\b/i.test(plain)&&grammatical.some(e=>e.type==='future_going_to'))classify('intentions','plan',grammatical.filter(e=>e.type==='future_going_to').flatMap(e=>e.forms),'context','Going to ở đây là gợi ý về dự định; vẫn cần xét ngữ cảnh.');
  add('intentions','encouragement',"\\bkeep going\\b|\\bdon't give up\\b|\\byou can do it\\b");
  if(!out.intentions.length&&out.forms.some(e=>e.type==='imperative'))classify('intentions','direct_request',[],'context','Mẫu yêu cầu/nhắc trực tiếp; sắc thái khuyên, động viên hay ra lệnh còn tùy ngữ cảnh.');
  if(!out.intentions.length&&out.forms.some(e=>e.type==='statement'))classify('intentions','information',[],'context','Câu trần thuật đang nêu thông tin hoặc kể lại; ý định cụ thể có thể khác tùy ngữ cảnh.');
  // Connectors can join words/phrases as well as clauses and sentences.
  add('links','addition','\\b(?:and|furthermore|moreover)\\b');
  add('links','alternative','\\b(?:or|either|neither|nor|otherwise)\\b');
  add('links','contrast','\\b(?:yet|whereas|nonetheless|despite|in spite of)\\b',m=>m[0].toLowerCase()!=='yet'||/[;,]\s*$/.test(plain.slice(0,m.index)));
  add('links','result','\\b(?:thus|hence|consequently)\\b');
  // Separate absence of an explicit marker from a failure to understand a sentence.
  if(!out.structures.length)classify('structures','review',[],'review','Bộ nhận diện chưa xác định được cấu trúc; câu vẫn có thể có cấu trúc hợp lệ.');
  if(!out.forms.length||out.forms.every(e=>e.type==='negative'))classify('forms','review',[],'review','Chưa đủ căn cứ về loại câu; phụ đề có thể bị ngắt hoặc thiếu dấu câu.');
  if(!out.intentions.length)classify('intentions','context',[],'context','Cần nghe câu trước/sau để xác định mục đích nói; không gán ý định chỉ từ vài từ khóa.');
  if(!out.links.length)classify('links','no_marker',[],'not_detected','Không nhận diện từ nối rõ trong câu này. Ý vẫn có thể nối với câu trước bằng ngữ cảnh; bộ nhận diện cũng có thể bỏ sót mẫu.');
  for(const axis of Object.keys(out)){
   const unique=new Map();for(const entry of out[axis]){if(!unique.has(entry.type))unique.set(entry.type,{...entry,forms:[]});unique.get(entry.type).forms.push(...entry.forms);}
   out[axis]=[...unique.values()].map(entry=>({...entry,forms:[...new Map(entry.forms.map(f=>[f.start+':'+f.end,f])).values()]}));
  }
  return out;
 }
 Object.assign(axes.structures.types,{basic_clause:'Chủ ngữ + cụm động từ',be_complement:'Be + bổ ngữ',have_noun:'Have + danh từ',have_to:'Have to + V',able_to:'Be able to + V',existential:'There is / are',bare_command:'Động từ · lược chủ ngữ',formula:'Công thức giao tiếp',phrase:'Cụm từ / câu rút gọn',nonfinite:'Cụm to V / V-ing',review:'Cần phân tích thêm'});
 Object.assign(axes.forms.types,{expression:'Công thức giao tiếp',question_context:'Câu hỏi · cần ngữ cảnh',dependent:'Mệnh đề phụ / câu chưa trọn',review:'Cần xem thêm câu/phụ đề'});
 Object.assign(axes.intentions.types,{greeting:'Chào hỏi',plan:'Nêu dự định · going to',encouragement:'Động viên',direct_request:'Yêu cầu / nhắc trực tiếp · gợi ý',information:'Nêu thông tin / kể lại · gợi ý',context:'Cần ngữ cảnh để rõ ý định'});
 Object.assign(axes.links.types,{alternative:'Lựa chọn · or…',no_marker:'Không nhận diện từ nối rõ'});
 axes.structures.hint='Gồm cả cấu trúc cơ bản và mẫu đặc biệt. Cụm từ/câu rút gọn cũng có cấu tạo, dù chưa có động từ chia.';
 axes.forms.hint='Loại câu khác với thì. Câu trần thuật có thể khẳng định hoặc phủ định; câu hỏi có thể dùng để nhờ vả.';
 axes.intentions.hint='Đây là gợi ý, không phải kết luận về mục đích nói. Câu nêu thông tin vẫn có thể mang ý khác trong ngữ cảnh.';
 axes.links.hint='Từ nối có thể nối từ, cụm hoặc ý. Không thấy từ nối không có nghĩa câu không liên quan đến nội dung trước đó.';
 const descriptions={
  basic_clause:'Có chủ ngữ và cụm động từ; phía sau có thể có tân ngữ, bổ ngữ hoặc trạng ngữ. Không phải câu nào cũng cần một mẫu đặc biệt.',
  be_complement:'Be nối chủ ngữ với đặc điểm, danh tính hoặc vị trí. Ví dụ: I am tired. Không tự coi đây là tiếp diễn.',
  have_noun:'Have ở đây đi với danh từ, chẳng hạn I have a bike; không tự coi have là hiện tại hoàn thành.',
  formula:'Công thức như Hello, Thank you, Sounds good thường được dùng độc lập mà không cần đủ chủ ngữ + động từ.',
  phrase:'Cụm từ/câu rút gọn vẫn có nghĩa trong hội thoại; cũng có thể chỉ là một phần câu bị phụ đề ngắt ra.',
  nonfinite:'To V / V-ing đứng riêng chưa xác lập thì. Xem dòng trước/sau để biết nó là một phần của câu nào.',
  review:'Bộ nhận diện chưa đủ căn cứ, không có nghĩa câu không có cấu trúc. Hãy đối chiếu với bản chép lời và ngữ cảnh.',
  information:'Đây là gợi ý rộng cho câu trần thuật nêu thông tin hoặc kể lại. Mục đích thực tế có thể là giải thích, trả lời, nhắc nhở… tùy ngữ cảnh.',
  context:'Chưa suy ra được mục đích nói từ riêng câu này. Không gán một ý định cụ thể chỉ để mọi câu có nhãn.',
  direct_request:'Hình thức yêu cầu/nhắc trực tiếp có thể mang sắc thái nhờ vả, khuyên, động viên hay ra lệnh tùy tình huống.',
  no_marker:'Không nhận diện được từ nối rõ trong câu này. Ý vẫn có thể nối bằng ngữ cảnh, hoặc bộ nhận diện còn bỏ sót mẫu.',
  addition:'And / also… có thể nối từ, cụm từ, mệnh đề hoặc các ý; không phải lúc nào cũng nối hai câu hoàn chỉnh.',
  alternative:'Or / either / neither… thể hiện lựa chọn hoặc nối các từ/cụm/câu theo quan hệ lựa chọn.'
 };
 const fallbackType=axis=>({structures:'review',forms:'review',intentions:'context',links:'no_marker'})[axis];
 const api={axes,analyze,descriptions,fallbackType};if(typeof module!=='undefined')module.exports=api;else root.TBPerspectives=api;
})(globalThis);
