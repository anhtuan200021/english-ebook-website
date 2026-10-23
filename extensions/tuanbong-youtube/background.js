'use strict';
const APP='https://english-ebook-website.pages.dev/youtube/';
function youtubeVideo(url){
 const u=new URL(url);if(u.protocol!=='https:'||!['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)||u.pathname!=='/watch'||!/^[\w-]{11}$/.test(u.searchParams.get('v')||''))throw Error('Hãy mở một video YouTube trước.');return u.searchParams.get('v');
}
async function openLesson(message,sender){
 const id=youtubeVideo(sender.url||'');
 if(!sender.tab?.id)throw Error('Không tìm thấy tab YouTube.');
 const data=message.payload;
 if(!data||data.version!==1||youtubeVideo(data.url)!==id||typeof data.transcript!=='string'||!data.transcript.trim()||data.transcript.length>1500000||!Number.isInteger(data.count)||data.count<1||data.count>12000)throw Error('Gói phụ đề không hợp lệ. Hãy thử lại trên video hiện tại.');
 // Check the source tab again after extraction, including navigation races.
 const tab=await chrome.tabs.get(sender.tab.id);if(youtubeVideo(tab.url)!==id)throw Error('Video đã thay đổi. Bấm lại ở video bạn muốn học.');
 const payload={version:1,url:'https://www.youtube.com/watch?v='+id,title:String(data.title||'').slice(0,300),transcript:data.transcript,count:data.count,autoOpen:true,transferId:crypto.randomUUID(),createdAt:Date.now()};
 const key='tuanbongTransfer:'+payload.transferId;
 // Each launch has its own storage key, so two video launches cannot overwrite one another.
 const stored=await chrome.storage.local.get(null);
 const expired=Object.entries(stored).filter(([k,p])=>k.startsWith('tuanbongTransfer:')&&(!Number.isFinite(p?.createdAt)||Date.now()-p.createdAt>86400000)).map(([k])=>k);
 if(expired.length)await chrome.storage.local.remove(expired);
 await chrome.storage.local.set({[key]:payload});
 try{await chrome.tabs.create({url:APP+'?video='+id+'&transfer='+encodeURIComponent(payload.transferId)});}catch(error){await chrome.storage.local.remove(key);throw error;}
 return {ok:true,count:payload.count};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=='tuanbong-open-lesson')return;
 openLesson(message,sender).then(respond,error=>respond({ok:false,error:error.message||'Chưa mở được bài học.'}));return true;
});
