(() => {
  'use strict';
  const services = {
    consult30: {name: 'Tìm hướng học phù hợp', minutes: 30, price: 100000},
    consult60: {name: 'Tìm hướng học phù hợp', minutes: 60, price: 150000},
    trial60: {name: 'Cùng luyện tiếng Anh 1:1', minutes: 60, price: 200000}
  };
  const money = n => n.toLocaleString('vi-VN') + 'đ';
  const pad = n => String(n).padStart(2, '0');
  function vietnamNow(now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).map(p => [p.type, p.value]));
    return {date: `${parts.year}-${parts.month}-${parts.day}`, minutes: +parts.hour * 60 + +parts.minute};
  }
  function availableTimes(date, duration, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const d = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== date) return [];
    const today = vietnamNow(now);
    if (date < today.date) return [];
    const weekday = d.getUTCDay();
    const windows = [1, 3, 5].includes(weekday) ? [[480, 660], [840, 1020], [1140, 1320]]
      : weekday === 6 ? [[480, 660], [840, 1020]] : [];
    const times = [];
    for (const [start, end] of windows) for (let t = start; t + duration <= end; t += 30) {
      if (date === today.date && t <= today.minutes) continue;
      times.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
    }
    return times;
  }
  // Expose pure scheduling rules only to the Node verification script.
  if (typeof module !== 'undefined' && module.exports) module.exports = {availableTimes, vietnamNow, services};
  if (typeof document === 'undefined') return;
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const date = $('booking-date'), time = $('booking-time'), note = $('time-note');
  const result = $('booking-result'), payment = $('booking-payment');
  let current = null;
  const selectedService = () => services[form.elements.service.value];
  function resetResult() {
    current = null;
    result.hidden = true;
    payment.hidden = true;
    $('request-copy-status').textContent = '';
    $('payment-copy-status').textContent = '';
  }
  function updateTimes() {
    const previous = time.value;
    date.min = vietnamNow().date;
    const slots = availableTimes(date.value, selectedService().minutes);
    time.replaceChildren(new Option('Chọn giờ bắt đầu', ''));
    for (const slot of slots) time.add(new Option(slot, slot));
    time.disabled = !slots.length;
    if (slots.includes(previous)) time.value = previous;
    note.textContent = !date.value ? 'Chọn ngày để xem giờ có thể nhận lịch.' : slots.length
      ? 'Chọn giờ trong lịch nhận khách và thanh toán trực tiếp. Website chưa tự khóa giờ đã có người đặt.'
      : 'Ngày này không còn giờ phù hợp hoặc không nhận lịch. Bạn chọn ngày khác nhé.';
    $('selected-price').textContent = money(selectedService().price);
    resetResult();
  }
  function requestIsCurrent() {
    if (!current || !availableTimes(current.date, current.service.minutes).includes(current.time)) {
      resetResult();
      updateTimes();
      $('booking-error').textContent = 'Giờ đã chọn không còn phù hợp. Vui lòng chọn lại giờ và tạo nội dung mới.';
      return false;
    }
    return true;
  }
  form.addEventListener('input', () => { resetResult(); $('booking-error').textContent = ''; });
  date.addEventListener('change', updateTimes);
  for (const radio of form.querySelectorAll('[name="service"]')) radio.addEventListener('change', updateTimes);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const service = selectedService();
    if (!form.reportValidity()) return;
    if (!availableTimes(date.value, service.minutes).includes(time.value)) {
      updateTimes();
      $('booking-error').textContent = 'Vui lòng chọn một ngày và giờ hợp lệ trong lịch nhận khách.';
      return;
    }
    const name = form.elements.fullname.value.trim(), phone = form.elements.phone.value.trim();
    if (!name || !phone) { $('booking-error').textContent = 'Bạn vui lòng điền tên và số Zalo.'; return; }
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const code = 'TB ' + [...bytes].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
    const endMinutes = +time.value.slice(0, 2) * 60 + +time.value.slice(3) + service.minutes;
    const endTime = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`;
    const dayText = date.value.split('-').reverse().join('/');
    const message = [
      'Chào TuanBong, mình gửi thông tin đặt lịch:',
      `Mã tham chiếu: ${code}`,
      `Họ tên: ${name}`, `Số Zalo: ${phone}`,
      `Hình thức: ${service.name} · ${service.minutes} phút · ${money(service.price)}`,
      `Lịch mong muốn: ${dayText}, ${time.value}–${endTime} (giờ Việt Nam)`,
      `Gặp qua: ${form.elements.platform.value}`,
      form.elements.goal.value.trim() ? `Điều muốn trao đổi: ${form.elements.goal.value.trim()}` : '',
      'Mình đã đọc chính sách hủy lịch. Mình sẽ gửi kèm ảnh giao dịch để bạn đối chiếu và gửi link buổi hẹn.'
    ].filter(Boolean).join('\n');
    current = {date: date.value, time: time.value, service, code};
    $('request-text').value = message;
    $('payment-amount-booking').textContent = money(service.price);
    $('payment-code-booking').textContent = code;
    $('payment-slot').textContent = `${service.name} · ${service.minutes} phút · ${dayText}, ${time.value}–${endTime}`;
    result.hidden = false;
    payment.hidden = false;
    $('booking-error').textContent = '';
    result.scrollIntoView({behavior: 'smooth', block: 'start'});
    $('result-title').focus({preventScroll: true});
  });
  async function copy(text, status, fallback, success = 'Đã sao chép. Bạn mở Zalo, dán và gửi cho TuanBong nhé.') {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = success;
    } catch { status.textContent = fallback; }
  }
  $('copy-request').addEventListener('click', () => {
    if (!requestIsCurrent()) return;
    copy($('request-text').value, $('request-copy-status'), 'Chưa sao chép được. Hãy chọn và sao chép nội dung trong ô phía trên, rồi dán vào Zalo.');
  });
  $('copy-payment-code').addEventListener('click', () => {
    if (!requestIsCurrent()) return;
    copy(current.code, $('payment-copy-status'), 'Bạn hãy sao chép mã đang hiển thị và nhập vào nội dung chuyển khoản.', 'Đã sao chép mã. Bạn dùng đúng mã này làm nội dung chuyển khoản nhé.');
  });
  $('copy-bank-account').addEventListener('click', () => {
    copy('0332441322', $('payment-copy-status'), 'Bạn nhập số tài khoản 0332441322 trong ứng dụng ngân hàng nhé.', 'Đã sao chép số tài khoản MB Bank: 0332441322.');
  });
  $('booking-submit').disabled = false;
  updateTimes();
})();
