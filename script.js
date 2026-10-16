// Năm bản quyền tự cập nhật.
const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

// Chỉ hiển thị QR khi ảnh tải được. Không xác minh hay giả lập thanh toán.
const qrImage = document.querySelector("#payment-qr");
const qrStatus = document.querySelector("#qr-status");
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

// Chỉ sao chép ví dụ, không tạo đơn hay xác nhận thanh toán.
const copyButton = document.querySelector("#copy-reference");
const copyStatus = document.querySelector("#copy-status");
copyButton.addEventListener("click", async () => {
  copyStatus.textContent = "";
  try {
    await navigator.clipboard.writeText(
      document.querySelector("#transfer-example").textContent,
    );
    copyStatus.textContent = "Đã sao chép ví dụ EBOOK 1234. Hãy thay 1234 bằng 4 chữ số riêng trước khi chuyển khoản.";
  } catch {
    copyStatus.textContent = "Không thể sao chép tự động. Hãy chọn và sao chép EBOOK 1234 hoặc nhập thủ công, rồi thay 1234 bằng 4 chữ số riêng.";
  }
});
