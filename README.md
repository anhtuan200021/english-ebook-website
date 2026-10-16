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

| Tệp                      | Nội dung                                             |
| ------------------------ | ---------------------------------------------------- |
| `index.html`             | Văn bản, mục lục, giá, tác giả và thông báo mua hàng |
| `styles.css`             | Màu sắc, phông chữ, bố cục máy tính và điện thoại    |
| `script.js`              | Năm hiện tại và thao tác mở/đóng thông báo mua ebook |
| `assets/ebook-cover.svg` | Bìa ebook minh họa có thể thay thế                   |

Mở tệp bằng trình soạn thảo văn bản (ví dụ VS Code miễn phí), sửa rồi lưu. Tải lại trang để xem thay đổi. Nên sao lưu trước khi sửa, chỉ thay từng phần nhỏ.

- **Tên sách, giới thiệu, mục lục:** tìm đoạn chữ tương ứng trong `index.html`, sửa văn bản giữa các thẻ. Giữ nguyên các thẻ như `<p>` và `</p>`.
- **Giá:** tìm `149.000`, thay bằng giá thực tế. Xóa chữ “GIÁ MINH HỌA” khi sẵn sàng mở bán.
- **Tác giả:** thay tên “Anh Minh” và câu chuyện minh họa bằng thông tin thật.
- **Bìa:** đặt ảnh mới, ví dụ `bia-ebook.jpg`, trong thư mục `assets`. Ở ảnh có `class="book-cover"` trong `index.html`, đổi `src="assets/ebook-cover.svg"` thành `src="assets/bia-ebook.jpg"`. Cập nhật `alt` theo ảnh thật. Ảnh dọc tỉ lệ 3:4 phù hợp nhất. Biểu tượng tab vẫn dùng SVG cũ; có thể đổi riêng dòng `rel="icon"` nếu muốn.
- **Màu:** sửa các mã màu trong `:root` ở đầu `styles.css`. `--green` là màu xanh chính, `--cream` là màu nền.

## 3. Nút mua và việc bán ebook thực tế

Hiện nút “Mua ebook” mở thông báo minh họa. Trang **không thu tiền, không gửi đơn và không gửi ebook tự động**. Không có dữ liệu khách hàng được lưu hay gửi đi.

Cách mở bán đơn giản không cần backend: dùng email/kênh liên hệ để nhận yêu cầu, tự xác nhận thanh toán và gửi PDF. Trong `index.html`, thay toàn bộ nút có `id="buy-button"` (từ `<button` đến `</button>`) bằng liên kết sau, nhớ thay email thật:

```html
<a
  class="button button-light"
  href="mailto:ban@example.com?subject=Dat%20mua%20ebook"
>
  Liên hệ mua ebook ↗
</a>
```

Sau đó xóa phần JavaScript từ dòng `const purchaseDialog` đến hết `script.js`, giữ phần cập nhật năm. Có thể xóa cả khối `<dialog>...</dialog>` trong `index.html`. Liên kết email cần ứng dụng email đã cấu hình; nên hiển thị thêm địa chỉ email dạng chữ để người đọc sao chép.

Trước khi mở bán, cập nhật giá, nội dung, định dạng thật, cách liên hệ, phương thức thanh toán, thời gian giao ebook và chính sách hỗ trợ/hoàn tiền phù hợp. Sửa câu hỏi thường gặp và bỏ các ghi chú minh họa sau khi thông tin đã chính xác. Không đưa ebook trả phí hoặc thông tin khách hàng lên repository công khai: các tệp của website tĩnh đều có thể truy cập công khai.

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
- Bấm “Mua ebook”; thử nút đóng, “Tôi đã hiểu” và phím Escape.
- Dùng phím Tab để kiểm tra liên kết/nút và viền focus.
- Kiểm tra ảnh, giá, thông tin liên hệ trước khi công khai.

Không có bước build hoặc cài dependency. Nếu có Node.js, kiểm tra cú pháp JavaScript bằng `node --check script.js`.
