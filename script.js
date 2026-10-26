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
