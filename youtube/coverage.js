(function(root){
 'use strict';
 const labels={pattern:'Có nhãn theo quy tắc',review:'Có dấu hiệu cần kiểm tra',context:'Cần ngữ cảnh',not_detected:'Chưa nhận diện từ nối rõ',no_finite:'Chưa nhận diện động từ chia',other_form:'Khuyết thiếu / mệnh lệnh',pending:'Chưa xử lý'};
 function status(entries,axis){
  if(!Array.isArray(entries))return 'pending';
  if(!entries.length)return 'review';
  if(axis==='grammar'){
   if(entries.some(e=>e.type==='uncertain'||e.type!=='other'&&e.confidence==='review'))return 'review';
   if(entries.some(e=>!['other','modal','imperative'].includes(e.type)))return 'pattern';
   if(entries.some(e=>['modal','imperative'].includes(e.type)))return 'other_form';
   return 'no_finite';
  }
  if(entries.some(e=>e.status==='review'||e.type==='review'))return 'review';
  if(entries.some(e=>e.status==='context'||e.type==='context'))return 'context';
  if(entries.every(e=>e.status==='not_detected'||e.type==='no_marker'))return 'not_detected';
  return 'pattern';
 }
 function summarize(rows,getEntries,axis){
  const unique=[...new Map(rows.map(s=>[s.id,s])).values()],counts=Object.fromEntries(Object.keys(labels).map(k=>[k,0]));
  for(const row of unique)counts[status(getEntries(row),axis)]++;
  return {total:unique.length,processed:unique.length-counts.pending,counts};
 }
 function renderCoverage(selector,rows,getEntries,axis){
  const el=root.document.querySelector(selector);if(!el)return;
  const s=summarize(rows,getEntries,axis),pct=n=>s.total?(100*n/s.total).toLocaleString('vi-VN',{maximumFractionDigits:1}):'0';
  el.innerHTML='<p>Đã xử lý <strong>'+s.processed+'/'+s.total+'</strong> câu/đoạn. Mỗi câu chỉ tính một lần trong bảng này.</p><div class="coverage-counts">'+Object.entries(s.counts).filter(([,n])=>n).map(([k,n])=>'<span>'+labels[k]+': <strong>'+n+'</strong> ('+pct(n)+'%)</span>').join('')+'</div><p><strong>Chưa đo tỷ lệ đúng/sai.</strong> Có nhãn vẫn có thể sai hoặc thiếu nhãn. “Cần kiểm tra”, “cần ngữ cảnh” và “chưa nhận diện” không đồng nghĩa với sai; cần đối chiếu từng câu với bản phân tích được kiểm chứng.</p><p>Các bộ lọc đếm câu/đoạn; một câu có thể thuộc nhiều nhóm nên không cộng các nhóm để suy ra tổng. Phụ đề và việc ghép câu cũng có thể có sai sót.</p>';
 }
 root.renderCoverage=renderCoverage;
 if(typeof module!=='undefined')module.exports={status,summarize};
})(globalThis);
