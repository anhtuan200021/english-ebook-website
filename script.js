// Giữ các liên kết mua hàng cũ khi phần thanh toán chuyển sang /ebook/.
if (
  document.body.dataset.page === "home" &&
  ["#mua-ebook", "#thanh-toan"].includes(window.location.hash)
) {
  window.location.replace(
    new URL(`./ebook/${window.location.hash}`, window.location.href),
  );
}

// Năm bản quyền tự cập nhật.
const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

// Chỉ hiển thị QR khi ảnh tải được. Không xác minh hay giả lập thanh toán.
const qrImage = document.querySelector("#payment-qr");
const qrStatus = document.querySelector("#qr-status");
if (qrImage && qrStatus) {
  function showQr() {
    qrImage.hidden = false;
    qrStatus.hidden = true;
  }
  function hideQr() {
    qrImage.hidden = true;
    qrStatus.hidden = false;
  }
  qrImage.addEventListener("load", showQr);
  qrImage.addEventListener("error", hideQr);
  if (qrImage.complete) {
    if (qrImage.naturalWidth > 0) showQr();
    else hideQr();
  }
}

// Mã ngẫu nhiên chỉ hỗ trợ đối chiếu thủ công, không phải mã giao dịch duy nhất.
const referenceKey = "ebook-transfer-reference";
const referencePattern = /^EBOOK [0-9]{6}$/;
const transferCode = document.querySelector("#transfer-code");
if (transferCode) {
  let reference = null;
  try {
    reference = sessionStorage.getItem(referenceKey);
  } catch {
    // Vẫn tạo mã khi trình duyệt chặn sessionStorage.
  }
  if (!referencePattern.test(reference)) {
    reference = `EBOOK ${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      sessionStorage.setItem(referenceKey, reference);
    } catch {
      // Mã vẫn dùng được trong lần mở trang hiện tại nếu không lưu được.
    }
  }
  transferCode.textContent = reference;

  // Chỉ sao chép mã đang hiển thị, không tạo đơn hay xác nhận thanh toán.
  const copyButton = document.querySelector("#copy-reference");
  const copyStatus = document.querySelector("#copy-status");
  copyButton.disabled = false;
  copyButton.addEventListener("click", async () => {
    copyStatus.textContent = "";
    try {
      await navigator.clipboard.writeText(transferCode.textContent);
      copyStatus.textContent = `Đã sao chép ${transferCode.textContent}. Giữ nguyên mã khi chuyển khoản và gửi mã qua Google Form hoặc Zalo.`;
    } catch {
      copyStatus.textContent = `Không thể sao chép tự động. Hãy chọn và sao chép hoặc nhập thủ công đúng mã ${transferCode.textContent}, không sửa mã.`;
    }
  });
}


// Dự phòng khi đường dẫn mở Zalo không hoạt động trên trình duyệt.
// Chỉ sao chép số liên hệ công khai, không gửi hay lưu dữ liệu người dùng.
for (const button of document.querySelectorAll("[data-copy-zalo]")) {
  button.addEventListener("click", async () => {
    const section = button.closest(".contact-card, .course-contact");
    const status = section?.querySelector("[data-zalo-status]");
    if (!status) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText("0332441322");
      status.textContent = "Đã sao chép 0332441322. Hãy mở Zalo và tìm theo số này nhé!";
    } catch {
      status.textContent = "Không thể sao chép tự động. Bạn có thể nhập số 0332441322 trực tiếp vào ô tìm kiếm Zalo.";
    }
  });
}


// Keep one dropdown open and allow dismissal by outside click or Escape.
const navGroups = [...document.querySelectorAll(".primary-nav .nav-dropdown")];
for (const group of navGroups) {
  group.addEventListener("toggle", () => {
    if (group.open) for (const other of navGroups) if (other !== group) other.open = false;
  });
}
document.addEventListener("click", event => {
  if (!event.target.closest(".nav-dropdown")) for (const group of navGroups) group.open = false;
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const open = navGroups.find(group => group.open);
  if (open) { open.open = false; open.querySelector("summary").focus(); }
});


// Same-site Shorts route; the server password gate enforces private access.
const shortsToolMenu = navGroups
  .find(group => group.querySelector('a[href*="/speak-lab/"]'))
  ?.querySelector(".nav-submenu");
if (shortsToolMenu && !shortsToolMenu.querySelector("[data-shorts-private]")) {
  const shortsLink = document.createElement("a");
  shortsLink.href = "/shorts/";
  shortsLink.dataset.shortsPrivate = "true";
  shortsLink.title = "Học qua video ngắn · Cần mật khẩu riêng để mở góc học";
  shortsLink.append(document.createTextNode("TuanBong Shorts"));
  const privateLabel = document.createElement("span");
  privateLabel.textContent = "🔒 Riêng tư";
  shortsLink.append(privateLabel);
  shortsToolMenu.append(shortsLink);
}


// Lightweight contact shortcuts for the public website: no chat widget or tracking.
if (document.querySelector(".site-header") && !document.querySelector(".tb-contact-dock")) {
  const dock = document.createElement("nav");
  dock.className = "tb-contact-dock";
  dock.setAttribute("aria-label", "Liên hệ nhanh");
  dock.innerHTML = `
    <a class="tb-contact-link tb-contact-facebook" href="https://www.facebook.com/tuan.winds.thuybaby/" target="_blank" rel="noopener noreferrer" aria-label="Mở Facebook cá nhân TuanBong" title="Facebook cá nhân TuanBong">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>
      <span class="tb-contact-tooltip" aria-hidden="true">Facebook</span>
    </a>
    <a class="tb-contact-link tb-contact-zalo" href="https://zalo.me/0332441322" target="_blank" rel="noopener noreferrer" aria-label="Liên hệ TuanBong qua Zalo" title="Zalo: 0332441322">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/></svg>
      <span class="tb-contact-tooltip" aria-hidden="true">Zalo</span>
    </a>
  `;
  document.body.append(dock);
}
