(() => {
  const lines = [...document.querySelectorAll('.sample-line')];
  const save = document.getElementById('sample-save');
  const feedback = document.getElementById('sample-feedback');
  const kept = new Set();
  let selected = 0;
  function update() {
    lines.forEach((line, index) => {
      line.classList.toggle('active', selected === index);
      line.setAttribute('aria-pressed', String(selected === index));
    });
    const saved = kept.has(selected);
    save.setAttribute('aria-pressed', String(saved));
    save.textContent = saved ? '★ Đã giữ câu này' : '☆ Giữ câu này';
    feedback.textContent = saved ? 'Đã chọn trong bản minh họa' : 'Câu ' + (selected + 1) + ' đang được chọn';
  }
  lines.forEach((line, index) => line.addEventListener('click', () => { selected = index; update(); }));
  save.addEventListener('click', () => { kept.has(selected) ? kept.delete(selected) : kept.add(selected); update(); });
  update();
})();
