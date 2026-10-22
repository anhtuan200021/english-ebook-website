(function(root){
 function decode(p,expectedId){
  if(!p||p.version!==1||typeof p.transferId!=='string'||p.transferId!==expectedId||!/^[a-f0-9-]{36}$/.test(p.transferId))throw Error('Gói chuyển không hợp lệ.');
  if(!Number.isFinite(p.createdAt)||Math.abs(Date.now()-p.createdAt)>86400000)throw Error('Gói chuyển đã hết hạn. Bấm tiện ích lại trên YouTube.');
  const parsed=root.TB.videoURL(p.url||'');
  if(typeof p.transcript!=='string')throw Error('Thiếu bản chép lời.');
  const result=root.TB.parse(p.transcript);if(result.cues.some(c=>c.end>86400))throw Error('Phụ đề tối đa 24 giờ.');
  return {transferId:p.transferId,id:parsed.id,url:parsed.url,title:typeof p.title==='string'&&p.title.trim()?p.title.trim().slice(0,300):'YouTube · '+parsed.id,cues:result.cues};
 }
 if(typeof module!=='undefined')module.exports={decode};else root.TBTransfer={decode};
})(globalThis);
