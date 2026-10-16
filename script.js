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
