'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');global.nlp=require('../youtube/vendor/compromise.js');const G=global.TBGrammar=require('../youtube/grammar.js'),P=require('../youtube/perspectives.js'),TB=require('../youtube/core.js');
const forms=s=>G.analyze(s).flatMap(e=>e.forms.map(f=>f.text));
const has=(s,axis,type)=>P.analyze(s)[axis].some(e=>e.type===type);
for(const [s,expected]of [
 ["I'm literally gonna be talking about it.",['future_going_to']],
 ['I was going to tell you.',['future_in_past']],
 ['He used to work here.',['past_simple']],
 ['You had better leave.',['modal']],
 ['I would rather stay.',['modal']],
 ['She has already been working.',['present_perfect_continuous']],
 ['We will have been studying.',['future_perfect_continuous']],
 ['I want you to still remember that.',['present_simple']],
 ['I think you know.',['present_simple','present_simple']],
 ['I know you work here.',['present_simple','present_simple']],
 ['It makes you feel better.',['present_simple']],
 ['So sit back, relax, and enjoy.',['imperative','imperative','imperative']],
 ['Hi, I work here.',['present_simple']],
 ['Thank you.',['other']],
 ['Thank you for your help.',['other']],
 ['Hello, I work here.',['present_simple']],
 ['Money, food, time.',['other']],
 ['The questions actually are funny.',['present_simple']],
 ["I can't.",['modal']],
 ['I probably will not.',['future_will']]
])test('verb ownership: '+s,()=>assert.deepEqual(G.analyze(s).map(e=>e.type),expected));
for(const [s,expected]of [
 ['I sound tired.','sound'],['She names her dog Max.','names'],['We question the decision.','question'],['They time the race.','time'],['I back your plan.','back'],['I cool the soup.','cool'],['The dog eats food.','eats'],['A teacher names the groups.','names'],['I like this video.','like'],['Like my page.','Like']
])test('the same word can still be a real verb: '+s,()=>assert.ok(forms(s).includes(expected)));
for(const [s,excluded]of [
 ["I'm gonna give you more context and related information.",['context','related','information']],
 ['Unless like the actual dragon and unicorn questions actually are kind of funny.',['like','questions']],
 ['It makes you like a real teacher.',['like']],
 ['It is something like that.',['like']],
 ['Money, food, time.',['time']],
 ['We go by the house.',['by']],
 ['I want to live here.',['to','live']],
 ['I go to school to learn and study.',['learn','study']]
])test('do not manufacture finite verbs: '+s,()=>{for(const word of excluded)assert.equal(forms(s).some(f=>f.toLowerCase()===word),false,word);});
test('repeated words are tagged by position rather than the first identical spelling',()=>{
 const s='I like it, like, a lot, and I like this too.';assert.deepEqual(G.analyze(s).flatMap(e=>e.forms).filter(f=>f.text==='like').map(f=>f.start),[2,30]);
});
test('analysis-only cleanup preserves source and exact source positions',()=>{
 const s="[Music] I I don't don't want to go. I had had that that day. Focus, focus.";
 const before=String(s),r=G.inspect(s);assert.equal(s,before);assert.equal(r.analysisText.length,s.length);assert.ok(r.ignored.some(x=>x.kind==='sound_note'));assert.ok(r.ignored.some(x=>x.kind==='restart'));
 assert.ok(r.analysisText.includes('had had'));assert.ok(r.analysisText.includes('that that'));assert.ok(r.analysisText.includes('Focus, focus'));
 for(const e of r.entries)for(const f of e.forms)assert.equal(f.text,s.slice(f.start,f.end));
 for(const x of r.ignored)assert.equal(x.text,s.slice(x.start,x.end));
 assert.equal(G.prepare('[I agree] is written here.').ignored.length,0);
});
test('an unfinished restart is omitted only in the analysis copy',()=>{
 const s="I'm going to I'm going to explain it.";assert.equal(forms(s).length,1);assert.equal(forms(s)[0],"I'm going to explain");assert.equal(G.prepare(s).original,s);
});
for(const [s,axis,type]of [
 ['What kind of food do you like?','forms','wh'],["What's your name?",'forms','wh'],['Who knows the answer?','forms','wh'],
 ['What am I supposed to say?','structures','supposed_to'],['I want you to still remember.','structures','object_infinitive'],['It makes you feel better.','structures','make_object'],
 ['I would rather stay.','structures','rather'],['You had better leave.','structures','had_better'],['I was going to tell you.','structures','past_plan'],["I'm literally gonna be talking about it.",'structures','going_to'],
 ['So sit back, relax, and enjoy.','structures','phrasal'],['I feel like this is important.','structures','feel_like'],['I know what my mom told me.','structures','content_clause'],
 ['I was like, "Okay, what are you doing?"','structures','quoted'],['I was like, "Okay, what are you doing?"','forms','wh'],['How about that?','forms','reaction'],
 ['So I started the video.','links','topic_change'],['I stayed cuz it rained.','links','reason']
])test('a separate learning view: '+s+' / '+type,()=>assert.ok(has(s,axis,type)));
test('surface form does not assert the speaker intention',()=>{
 assert.equal(has('What you said is true.','forms','wh'),false);
 assert.equal(has('How about that?','intentions','suggestion'),false);
 assert.equal(has('So I started the video.','links','result'),false);
 assert.ok(has('It was late, so I went home.','links','result'));
 for(const s of ['How about that?','Could you help me?','I was like, "Are you serious?"'])for(const e of P.analyze(s).intentions)assert.equal(e.status,'context');
});
test('every displayed tag has an understandable label and explanation',()=>{
 for(const axis of Object.values(P.axes))for(const [id,label]of Object.entries(axis.types)){assert.ok(label&&P.descriptions[id],id);assert.doesNotMatch(label,/\bV3\b|\bV-ing\b|khuyết thiếu|mệnh đề|trần thuật|bổ ngữ|tân ngữ/i);}
 const source=fs.readFileSync(path.join(root,'youtube/app.js'),'utf8'),ctx={};vm.createContext(ctx);const a=source.indexOf('const TYPES='),b=source.indexOf('\n',a);vm.runInContext(source.slice(a,b)+';globalThis.types=TYPES;',ctx);assert.equal(JSON.stringify(ctx.types),JSON.stringify(G.TYPES));
});
test('quoted analysis may join while playback captions remain unchanged',()=>{
 const cues=[{id:'a',start:0,end:3,text:'She said, "Hello.'},{id:'b',start:3,end:6,text:'How are you?"'},{id:'c',start:6,end:9,text:'Then she left.'}],copy=JSON.stringify(cues),play=TB.sentences(cues),before=JSON.stringify(play),units=TB.analysisUnits(cues);
 assert.equal(units.length,2);assert.equal(units[0].text,'She said, "Hello. How are you?"');assert.deepEqual(units[0].sourceCueIds,['a','b']);assert.equal(units[0].start,0);assert.equal(units[0].end,6);assert.equal(JSON.stringify(TB.sentences(cues)),before);assert.equal(JSON.stringify(cues),copy);
 assert.equal(JSON.stringify(units),JSON.stringify(TB.analysisUnits(cues)));
});
test('an unclosed quote cannot join the whole lesson',()=>{
 const cues=Array.from({length:100},(_,i)=>({id:'c'+i,start:i*4,end:i*4+4,text:(i===0?'He said, "':'')+'This is a sentence.'}));const units=TB.analysisUnits(cues);assert.ok(units.length>5);for(const u of units)assert.ok(u.end-u.start<=45);assert.equal(units.flatMap(u=>u.sourceCueIds).length,100);
});

// Preserve the original tense examples as regressions for the revised parser.
for(const [text,expected] of [
 [
  "I have a bike.",
  [
   "present_simple"
  ]
 ],
 [
  "I'm tired.",
  [
   "present_simple"
  ]
 ],
 [
  "The door is closed.",
  [
   "present_simple"
  ]
 ],
 [
  "I'm leaving tomorrow.",
  [
   "present_continuous"
  ]
 ],
 [
  "I have finished my work.",
  [
   "present_perfect"
  ]
 ],
 [
  "She has been working here for years.",
  [
   "present_perfect_continuous"
  ]
 ],
 [
  "I visited my friend yesterday.",
  [
   "past_simple"
  ]
 ],
 [
  "I was cooking when he arrived.",
  [
   "past_continuous",
   "past_simple"
  ]
 ],
 [
  "They had left before I got there.",
  [
   "past_perfect",
   "past_simple"
  ]
 ],
 [
  "He had been waiting for an hour.",
  [
   "past_perfect_continuous"
  ]
 ],
 [
  "I will call you tonight.",
  [
   "future_will"
  ]
 ],
 [
  "We are going to visit our friends.",
  [
   "future_going_to"
  ]
 ],
 [
  "I will be travelling tomorrow.",
  [
   "future_continuous"
  ]
 ],
 [
  "I will have finished by Friday.",
  [
   "future_perfect"
  ]
 ],
 [
  "She will have been working for hours.",
  [
   "future_perfect_continuous"
  ]
 ],
 [
  "You should take a break.",
  [
   "modal"
  ]
 ],
 [
  "Please keep going.",
  [
   "imperative"
  ]
 ],
 [
  "A lot of interesting ideas.",
  [
   "other"
  ]
 ],
 [
  "She's finished her work.",
  [
   "present_perfect"
  ]
 ],
 [
  "She's working now.",
  [
   "present_continuous"
  ]
 ],
 [
  "I've been waiting.",
  [
   "present_perfect_continuous"
  ]
 ],
 [
  "He'd gone home.",
  [
   "past_perfect"
  ]
 ],
 [
  "I'd like a coffee.",
  [
   "modal"
  ]
 ],
 [
  "I don't like coffee.",
  [
   "present_simple"
  ]
 ],
 [
  "She doesn't work here.",
  [
   "present_simple"
  ]
 ],
 [
  "We didn't go out.",
  [
   "past_simple"
  ]
 ],
 [
  "I won't give up.",
  [
   "future_will"
  ]
 ],
 [
  "I can't swim.",
  [
   "modal"
  ]
 ],
 [
  "Do you speak English?",
  [
   "present_simple"
  ]
 ],
 [
  "Did she call you?",
  [
   "past_simple"
  ]
 ],
 [
  "Are you learning English?",
  [
   "present_continuous"
  ]
 ],
 [
  "Has he finished?",
  [
   "present_perfect"
  ]
 ],
 [
  "I work and study.",
  [
   "present_simple"
  ]
 ],
 [
  "I work, and she studies.",
  [
   "present_simple",
   "present_simple"
  ]
 ],
 [
  "I run every day.",
  [
   "present_simple"
  ]
 ],
 [
  "I come here often.",
  [
   "present_simple"
  ]
 ],
 [
  "She likes music.",
  [
   "present_simple"
  ]
 ],
 [
  "They were happy.",
  [
   "past_simple"
  ]
 ],
 [
  "The house was built in 1990.",
  [
   "past_simple"
  ]
 ],
 [
  "It is being repaired.",
  [
   "present_continuous"
  ]
 ],
 [
  "The work has been completed.",
  [
   "present_perfect"
  ]
 ],
 [
  "I would have called.",
  [
   "modal"
  ]
 ],
 [
  "If I had known, I would have called.",
  [
   "past_perfect",
   "modal"
  ]
 ],
 [
  "Don't forget your keys.",
  [
   "imperative"
  ]
 ],
 [
  "Open the door.",
  [
   "imperative"
  ]
 ],
 [
  "Having finished, I went home.",
  [
   "past_simple"
  ]
 ],
 [
  "I read the book.",
  [
   "uncertain"
  ]
 ],
 [
  "He's gone.",
  [
   "uncertain"
  ]
 ],
 [
  "I am going to work.",
  [
   "uncertain"
  ]
 ],
 [
  "Good morning!",
  [
   "other"
  ]
 ]
])test("original tense example: "+text,()=>assert.deepEqual(G.analyze(text).map(e=>e.type),expected));
