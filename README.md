# TuanBong

Website tiếng Việt gồm **bốn trang nội dung chính** và các trang phụ Donate, Liên hệ, dùng HTML, CSS và JavaScript thuần. Giữ phong cách xanh lá, nền kem; Các trang giới thiệu không cần bước build hay thư viện ứng dụng phải cài; riêng Shorts dùng Cloudflare Pages Function để kiểm tra mật khẩu.

| Địa chỉ       | Tệp                    | Nội dung                                                          |
| ------------- | ---------------------- | ----------------------------------------------------------------- |
| `/`           | `index.html`           | Thông điệp TuanBong, câu chuyện tác giả và liên kết đến các trang |
| `/ebook/`     | `ebook/index.html`     | Giới thiệu ebook và toàn bộ quy trình mua hàng                    |
| `/courses/`   | `courses/index.html`   | Định hướng coaching 1:1 và khóa học video                         |
| `/community/` | `community/index.html` | YouTube và Facebook cá nhân chính thức được cung cấp              |

**Trang phụ:** `/donate/` (`donate/index.html`) dành cho ủng hộ tự nguyện qua QR MB Bank, tách biệt với thanh toán ebook. `/contact/` (`contact/index.html`) có liên kết Zalo, Facebook cá nhân và TikTok `@tuanwinds`. Do việc mở link Zalo theo số điện thoại tùy ứng dụng và quyền riêng tư của tài khoản, trang Liên hệ và khung Coaching 1:1 đều có nút sao chép số Zalo `0332441322` để tìm trong ứng dụng. Cả hai trang đều xuất hiện trong menu và footer.

## Xem trước

Mở terminal tại thư mục repository rồi chạy:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Trên Windows có thể dùng `py` thay cho `python3`. Mở trình duyệt trên máy chạy lệnh, nhập `http://127.0.0.1:8000`, sau đó dùng menu để đi giữa các trang. Nhấn `Ctrl+C` để dừng. Trong môi trường cloud, đây là máy chủ kiểm tra nội bộ, không phải địa chỉ công khai.

Nên dùng máy chủ tĩnh để xem trước cấu trúc thư mục `/ebook/`, `/courses/`, `/community/`, `/donate/`, `/contact/` giống khi triển khai. Không cần chạy npm hoặc cài dependency.

## Chỉnh sửa

- **Văn bản:** mở tệp HTML tương ứng và sửa phần chữ giữa các thẻ, giữ nguyên các thẻ HTML.
- **Giao diện:** `styles.css` dùng chung cho mọi trang. Các biến màu nằm ở `:root` đầu tệp.
- **Menu/footer:** nội dung giống nhau ở sáu tệp HTML; nếu thêm/sửa mục chung, cập nhật cả sáu tệp. Mỗi trang có đúng một mục menu dùng `aria-current="page"`.
- **JavaScript:** `script.js` dùng chung, chỉ chạy chức năng QR và mã chuyển khoản nếu có thành phần tương ứng trên trang Ebook.
- **Tài nguyên:** giữ ảnh trong `assets`. Trang con dùng `../assets/...`, `../styles.css`, `../script.js`; trang chủ dùng `./...`. Liên kết tương đối hoạt động cả khi triển khai dưới một thư mục con.

### Logo và hình minh họa

Logo gốc đã được tích hợp ở header, footer và favicon của bốn trang. Tệp do chủ repository cung cấp được đổi tên từ `Pink Cute Simple Flower Shop Circle Logo.png` thành `assets/tuanbong-logo.png`; dữ liệu ảnh giữ nguyên. PNG có kênh trong suốt, nên được đặt trực tiếp trên nền kem, không cắt hoặc kéo méo. Favicon dùng chính PNG gốc, không vẽ logo khác; logo nhiều chi tiết nên có thể khó đọc ở kích thước tab rất nhỏ.

Năm hình mới trong `assets/illustrations/` là **SVG tự thiết kế**, không phải ảnh thật hoặc hình học viên/lớp học đã diễn ra. Tổng dung lượng khoảng 8 KB, không có phông chữ, script hoặc tài nguyên bên ngoài. Xem `assets/README.md` để biết nguồn từng hình. Các ảnh dưới đầu trang được tải chậm bằng `loading="lazy"`; chiều rộng/chiều cao khai báo trước và CSS giữ đúng tỉ lệ.

### Nội dung còn chờ

Bìa ebook hiện vẫn là hình minh họa `assets/ebook-cover.svg`, có ghi rõ. Mục lục chi tiết và tác giả giả trong bản minh họa cũ đã được bỏ; chờ nội dung chính thức nếu muốn bổ sung. Trang khóa học chỉ dùng thông tin định hướng đã cung cấp, không đặt học phí, lịch hoặc chức năng thanh toán giả.

## Quy trình mua ebook được giữ nguyên

1. Khách mua **Hành trình tự học tiếng Anh — 59.000đ** trên `/ebook/`.
2. Quét ảnh QR gốc `assets/mb-bank-qr.jpg` hoặc nhập tài khoản **0332441322**, **MB Bank**, người nhận **ALANG MINH TUAN**. Kiểm tra người nhận và số tiền trước khi xác nhận.
3. Dùng đúng mã **EBOOK + 6 chữ số** hiển thị trên trang làm nội dung chuyển khoản. Nút **Sao chép** lấy mã đang hiển thị.
4. Mã lưu trong `sessionStorage` với khóa `ebook-transfer-reference` để giữ khi tải lại hoặc đi giữa các trang trong cùng phiên. Nếu lưu trữ bị chặn, trang vẫn tạo mã cho lần mở hiện tại; khách cần ghi lại mã đã chuyển. Mã hỗ trợ đối chiếu, không bảo đảm duy nhất.
5. Khách mở Google Forms ở tab mới, nhập đúng email và nội dung giao dịch đã dùng. Người bán **tự kiểm tra thanh toán rồi gửi ebook qua email**. Website không xác nhận giao dịch hoặc gửi ebook tự động.

Clipboard cần trình duyệt cho phép (thường qua HTTPS hoặc localhost). Nếu không sao chép được, trang hướng dẫn khách chọn/nhập mã thủ công. Không đưa PDF trả phí hoặc đường dẫn tải ebook công khai vào repository. Dữ liệu đơn hàng nằm trong Google Forms, không được website này lưu trữ.

Link Google Forms giữ nguyên:
https://docs.google.com/forms/d/e/1FAIpQLSfZYGLdzJygxy6Sw9VP6gt-YRSRBJHTgCriQAezOfFXbFeNBg/viewform?usp=dialog

Liên kết mua cũ ở trang chủ `/#mua-ebook` và `/#thanh-toan` được chuyển sang phần tương ứng trên `/ebook/` khi JavaScript hoạt động.

## Triển khai Cloudflare Pages

1. Kết nối đúng repository và chọn nhánh cần xem trước. Không cần chuyển repository sang Public.
2. Chọn framework **None**, bỏ trống lệnh build (nếu giao diện yêu cầu, dùng `exit 0`).
3. Chọn thư mục đầu ra gốc chứa `index.html`, thường là **`.`**. Không chọn riêng thư mục `ebook`.
4. Triển khai, rồi mở trực tiếp cả `/`, `/ebook/`, `/courses/`, `/community/` và tải lại từng trang. Mỗi thư mục có `index.html`, không cần quy tắc SPA hay chuyển mọi đường dẫn về trang chủ.
5. Kiểm tra QR, sao chép và Google Forms trên địa chỉ triển khai. Link Forms, YouTube và Facebook mở ở tab mới.

Không cần biến môi trường, dịch vụ trả phí hay thêm script build. Nếu đang dùng Pages preview theo nhánh, nhánh mới chỉ phục vụ kiểm tra; không tự cập nhật bản triển khai từ `main` cho đến khi PR được merge. Không đổi cài đặt production hoặc merge nếu chưa được chủ repository duyệt.

## Kiểm tra sau khi chỉnh sửa

- Trên `/donate/`: QR giữ đúng mã gốc, thông tin chủ tài khoản/ngân hàng khớp trang Ebook, có thể sao chép số tài khoản, số tiền hoàn toàn tự nguyện và không hiển thị quy trình mua ebook.

- Mở trực tiếp và tải lại cả bốn trang; kiểm tra menu và footer dẫn đúng, mục đang mở được đánh dấu.
- Thử trên điện thoại và máy tính, kiểm tra không tràn ngang, ảnh giữ tỉ lệ.
- Trên Ebook: nút Mua đến phần chuyển khoản, QR tải được, giá 59.000đ, mã có sáu chữ số, tải lại vẫn giữ mã và Sao chép lấy đúng mã.
- Đi từ Ebook sang trang khác rồi quay lại; thử trong trình duyệt chặn lưu trữ/clipboard để kiểm tra hướng dẫn dự phòng.
- Google Forms phải mở đúng URL trong tab mới; không gửi đơn hoặc chuyển tiền chỉ để kiểm tra giao diện.
- Các liên kết YouTube/Facebook phải đúng địa chỉ được cung cấp; Facebook được ghi là tài khoản cá nhân.
- Nếu có Node.js, chạy `node --check script.js`; chạy `git diff --check` để phát hiện lỗi khoảng trắng.


## Shorts riêng tư trên Cloudflare Pages

`/shorts/` và mọi tài nguyên của Shorts được bảo vệ bằng Pages Function. Đặt `SHORTS_PASSWORD` dưới dạng Secret trong môi trường Production: mật khẩu riêng dài 20–256 ký tự, không ghi vào Git hay gửi qua chat. Sau khi thay Secret, triển khai lại để áp dụng cấu hình mới. Chưa có cấu hình hợp lệ thì route trả 503 và giữ khóa. Các trang giới thiệu và công cụ khác vẫn truy cập công khai.

Mật khẩu mới làm mất hiệu lực các phiên đăng nhập cũ. Không tạo thư mục Shorts tĩnh để tránh bỏ qua lớp kiểm tra trên máy chủ. Dữ liệu bài học cá nhân không nằm trong repository.
