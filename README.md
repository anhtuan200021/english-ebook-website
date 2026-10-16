# Hành trình tự học tiếng Anh

Website giới thiệu ebook bằng tiếng Việt, dùng HTML, CSS và JavaScript thuần. Không cần cài thư viện, không backend, không cơ sở dữ liệu. Hình minh họa nằm trong repository, không phụ thuộc dịch vụ bên ngoài.

## 1. Xem trước website

**Dễ nhất:** tải repository về máy và giải nén, sau đó nhấp đúp vào `index.html`. Website mở trong trình duyệt, không cần cài công cụ lập trình.

**Nếu đã có Python:** mở terminal tại thư mục repository rồi chạy:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Trên Windows có thể dùng `py -m http.server 8000 --bind 127.0.0.1`. Mở trình duyệt trên chính máy đang chạy lệnh, nhập `http://127.0.0.1:8000`. Nhấn `Ctrl+C` trong terminal để dừng. Trong môi trường cloud, lệnh này chỉ phục vụ kiểm tra nội bộ, không tạo địa chỉ website công khai.

## 2. Các tệp và cách sửa

| Tệp                      | Nội dung                                                 |
| ------------------------ | -------------------------------------------------------- |
| `index.html`             | Văn bản, mục lục, giá, tác giả và hướng dẫn chuyển khoản |
| `styles.css`             | Màu sắc, phông chữ, bố cục máy tính và điện thoại        |
| `script.js`              | Năm hiện tại và hiển thị ảnh QR khi tải được             |
| `assets/ebook-cover.svg` | Bìa ebook minh họa có thể thay thế                       |

Mở tệp bằng trình soạn thảo văn bản (ví dụ VS Code miễn phí), sửa rồi lưu. Tải lại trang để xem thay đổi. Nên sao lưu trước khi sửa, chỉ thay từng phần nhỏ.

- **Tên sách, giới thiệu, mục lục:** tìm đoạn chữ tương ứng trong `index.html`, sửa văn bản giữa các thẻ. Giữ nguyên các thẻ như `<p>` và `</p>`.
- **Giá:** giá hiện tại là `59.000đ`. Nếu thay giá, sửa đồng thời giá bán và các hướng dẫn chuyển khoản trong `index.html`.
- **Tác giả:** thay tên “Anh Minh” và câu chuyện minh họa bằng thông tin thật.
- **Bìa:** đặt ảnh mới, ví dụ `bia-ebook.jpg`, trong thư mục `assets`. Ở ảnh có `class="book-cover"` trong `index.html`, đổi `src="assets/ebook-cover.svg"` thành `src="assets/bia-ebook.jpg"`. Cập nhật `alt` theo ảnh thật. Ảnh dọc tỉ lệ 3:4 phù hợp nhất. Biểu tượng tab vẫn dùng SVG cũ; có thể đổi riêng dòng `rel="icon"` nếu muốn.
- **Màu:** sửa các mã màu trong `:root` ở đầu `styles.css`. `--green` là màu xanh chính, `--cream` là màu nền.

## 3. Thanh toán MB Bank và nhận ebook

Khách chuyển **59.000đ** đến MB Bank, tài khoản **0332441322**, chủ tài khoản **ALANG MINH TUAN**. Khách cần kiểm tra thông tin người nhận trong ứng dụng ngân hàng trước khi xác nhận.

Sau đó khách bấm “Tôi đã chuyển khoản – Điền thông tin nhận ebook” để mở Google Forms ở tab mới. Người bán tự kiểm tra giao dịch, đối chiếu đơn hàng và gửi ebook qua email. Website không kiểm tra thanh toán tự động, không báo thành công và không lưu dữ liệu đơn hàng; dữ liệu biểu mẫu được xử lý trên Google Forms.

**Ảnh QR còn chờ tệp gốc:** ảnh trong tin nhắn chưa được cung cấp dưới dạng tệp có thể lưu trong môi trường. Cần thêm đúng ảnh gốc vào `assets/mb-bank-qr.jpg` (nếu dùng PNG, sửa cả đuôi trong `src` ở `index.html`). Hiện website hiển thị hướng dẫn nhập tài khoản thay vì ảnh lỗi. Không tự tạo QR thay thế. Sau khi thêm ảnh, kiểm tra ảnh hiển thị và quét thử để đối chiếu tài khoản trước khi xuất bản; không cần thực hiện giao dịch kiểm tra.

Đường dẫn QR là đường dẫn tương đối `assets/mb-bank-qr.jpg`, dùng được trên hosting tĩnh. Không thêm PDF trả phí hoặc liên kết tải ebook công khai vào repository. Người bán gửi riêng qua email sau khi xác minh thanh toán.

### Cloudflare Pages

Website không cần build. Với dự án Pages liên kết Git, chọn đúng repository và nhánh muốn triển khai, framework **None**, bỏ trống lệnh build và chọn thư mục đầu ra gốc chứa `index.html` (thường là `.`). Nếu giao diện yêu cầu lệnh build, có thể dùng `exit 0`. Không cần biến môi trường hoặc backend. Có thể giữ repository ở chế độ riêng tư nếu đã cấp quyền phù hợp cho Cloudflare.

Chỉ xuất bản bản có QR sau khi đã thêm ảnh thật vào `assets` và kiểm tra trên địa chỉ triển khai. Đổi nhánh triển khai trên Cloudflare nếu mã mới vẫn ở nhánh `work`; cập nhật nhánh khác không tự cập nhật bản đang triển khai từ `main`.

## 4. Đưa lên mạng miễn phí với GitHub Pages

1. Lưu các tệp lên nhánh `main` trên GitHub của repository `anhtuan200021/english-ebook-website`. Nếu chỉnh trên máy, có thể chọn **Add file → Upload files**, kéo các tệp và thư mục `assets` vào, sau đó **Commit changes**. Giữ `index.html` ở thư mục gốc repository.
2. Với GitHub Free, repository cần ở chế độ **Public** để dùng Pages miễn phí. Chỉ chuyển sang Public khi bạn đồng ý công khai các tệp trong đó.
3. Vào repository → **Settings → Pages**.
4. Trong **Build and deployment**, chọn **Deploy from a branch**.
5. Chọn nhánh **main**, thư mục **/ (root)** rồi **Save**.
6. Đợi triển khai hoàn tất (có thể vài phút). GitHub sẽ hiển thị địa chỉ website tại trang Pages. Địa chỉ dự kiến sau khi triển khai thành công: `https://anhtuan200021.github.io/english-ebook-website/`.
7. Sau này chỉ cần cập nhật tệp trên `main`, Pages sẽ tự triển khai lại. Nếu chưa thấy thay đổi, xem trạng thái ở tab **Actions** rồi tải lại trình duyệt.

Không cần mua tên miền, hosting hay khai báo khóa API. Việc tạo tệp trong repository chưa tự xuất bản website.

## 5. Kiểm tra sau khi chỉnh sửa

- Mở trang trên máy tính và điện thoại; kiểm tra chữ không tràn ngang.
- Thử các liên kết điều hướng, mở từng chương và câu hỏi.
- Bấm “Mua ebook” để đến phần chuyển khoản; kiểm tra QR thật hiển thị và quét đúng tài khoản.
- Thử nút nhận ebook: mở đúng Google Forms ở tab mới, không hiển thị xác nhận thanh toán.
- Dùng phím Tab để kiểm tra liên kết/nút và viền focus.
- Kiểm tra ảnh, giá, thông tin liên hệ trước khi công khai.

Không có bước build hoặc cài dependency. Nếu có Node.js, kiểm tra cú pháp JavaScript bằng `node --check script.js`.
