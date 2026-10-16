// Năm bản quyền tự cập nhật.
const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

// Cửa sổ mua hàng minh họa. Chưa có chức năng thanh toán.
const purchaseDialog = document.querySelector("#purchase-dialog");
const buyButton = document.querySelector("#buy-button");
const closeButton = document.querySelector(".dialog-close");

buyButton.addEventListener("click", () => purchaseDialog.showModal());
closeButton.addEventListener("click", () => purchaseDialog.close());
// Escape và nút “Tôi đã hiểu” cũng đóng cửa sổ bằng hành vi HTML gốc.
purchaseDialog.addEventListener("click", (event) => {
  if (event.target === purchaseDialog) {
    const bounds = purchaseDialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      purchaseDialog.close();
    }
  }
});
