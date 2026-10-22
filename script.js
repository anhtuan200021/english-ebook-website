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
