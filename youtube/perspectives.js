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
  // "So that" introduces purpose, not the result pattern "so + subject".
  return out;
 }
 const api={axes,analyze};if(typeof module!=='undefined')module.exports=api;else root.TBPerspectives=api;
})(globalThis);
