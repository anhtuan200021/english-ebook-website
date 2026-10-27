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
      <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 22v-9h3l.5-3.5H14V7.3c0-1 .3-1.8 1.8-1.8H18V2.3c-.4-.1-1.7-.3-3.1-.3-3.1 0-5.2 1.9-5.2 5.3v2.2H7V13h2.7v9Z"/></svg>
      <span class="tb-contact-tooltip" aria-hidden="true">Facebook</span>
    </a>
    <a class="tb-contact-link tb-contact-zalo" href="https://zalo.me/0332441322" target="_blank" rel="noopener noreferrer" aria-label="Liên hệ TuanBong qua Zalo" title="Zalo: 0332441322">
      <svg viewBox="0 0 48 48" width="39" height="39" aria-hidden="true" focusable="false"><path d="M10 9h28a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H14l-8 4 2-8a6 6 0 0 1-4-6V15a6 6 0 0 1 6-6Z" fill="currentColor" opacity=".1"/><text x="24" y="29" text-anchor="middle" fill="currentColor" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" letter-spacing="-.7">Zalo</text></svg>
      <span class="tb-contact-tooltip" aria-hidden="true">Zalo</span>
    </a>
  `;
  document.body.append(dock);
}
