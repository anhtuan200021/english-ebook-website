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
(() => {
  const root = document.getElementById('slide-kham-pha');
  if (!root) return;
  const slides = [...root.querySelectorAll('.compact-slide')];
  const dots = [...root.querySelectorAll('.compact-dot')];
  const pause = root.querySelector('.compact-pause');
  const announcement = root.querySelector('.compact-announcement');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, paused = reduced.matches, focused = false, visible = true;
  function render(manual = false) {
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
      dots[i].setAttribute('aria-pressed', String(i === index));
    });
    root.querySelector('.compact-counter').textContent = String(index + 1).padStart(2,'0') + ' / 04';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Tiếp tục tự chuyển slide' : 'Tạm dừng tự chuyển slide');
    pause.innerHTML = paused ? '▶ <span>Tiếp tục</span>' : 'Ⅱ <span>Tạm dừng</span>';
    if (manual) announcement.textContent = 'Slide ' + (index + 1) + ': ' + slides[index].querySelector('h2').textContent;
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || focused || !visible || document.hidden) return;
    timer = setTimeout(() => { index = (index + 1) % slides.length; render(); schedule(); }, matchMedia('(max-width:650px)').matches ? 1500 : 2500);
  }
  function move(next) { index = (next + slides.length) % slides.length; render(true); schedule(); }
  dots.forEach((dot,i) => dot.addEventListener('click', () => move(i)));
  root.querySelector('.compact-prev').addEventListener('click', () => move(index - 1));
  root.querySelector('.compact-next').addEventListener('click', () => move(index + 1));
  pause.addEventListener('click', () => { paused = !paused; render(); schedule(); });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); schedule(); });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(index + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pageshow', schedule);
  reduced.addEventListener('change', () => { if (reduced.matches) { paused = true; render(); schedule(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(root);
  render(); schedule();
})();
