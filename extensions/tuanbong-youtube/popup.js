'use strict';
document.querySelector('#send').onclick=async()=>{
 const button=document.querySelector('#send'),status=document.querySelector('#status');button.disabled=true;status.textContent='Đang mở phụ đề và chuẩn bị bài học…';
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!/^https:\/\/(www\.|m\.)?youtube\.com\/watch\?/.test(tab.url||''))throw Error('Hãy mở video trên trang YouTube, rồi bấm tiện ích ở tab đó.');
  // Also works immediately after an update, before the user refreshes YouTube.
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['extract.js','youtube.js']});
  const result=await chrome.tabs.sendMessage(tab.id,{type:'tuanbong-start'});
  if(!result?.ok)throw Error(result?.error||'Chưa mở được bài học. Tải lại YouTube rồi thử lại.');
  status.textContent='Đã mở bài học với '+result.count+' dòng phụ đề.';
 }catch(e){status.textContent=e.message||'Chưa chuyển được. Bạn thử lại nhé.';}
 finally{button.disabled=false;}
};
