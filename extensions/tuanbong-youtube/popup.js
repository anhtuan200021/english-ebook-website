'use strict';
const APP='https://english-ebook-website.pages.dev/youtube/';
document.querySelector('#send').onclick=async()=>{
 const button=document.querySelector('#send'),status=document.querySelector('#status');button.disabled=true;status.textContent='Đang đọc bản chép lời…';
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!/^https:\/\/(www\.|m\.)?youtube\.com\/watch\?/.test(tab.url||''))throw Error('Hãy mở video trên trang YouTube, rồi bấm tiện ích ở tab đó.');
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:extractYouTubeTranscript});
  if(!result?.result)throw Error('Không đọc được phụ đề. Bạn thử tải lại YouTube rồi mở bản chép lời nhé.');
  const payload={...result.result,transferId:crypto.randomUUID(),createdAt:Date.now()};
  await chrome.storage.local.set({tuanbongTransfer:payload});
  await chrome.tabs.create({url:APP+'?transfer='+encodeURIComponent(payload.transferId)});
  status.textContent='Đã chuyển '+payload.count+' dòng. Kiểm tra và bấm “Nhập và mở bài học” ở tab TuanBong.';
 }catch(e){status.textContent=e.message||'Chưa chuyển được. Bạn thử lại nhé.';}
 finally{button.disabled=false;}
};
