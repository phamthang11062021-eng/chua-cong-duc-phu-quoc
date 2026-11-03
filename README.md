# CHÙA CÔNG ĐỨC – PHÚ QUỐC | BẢN ĐẦY ĐỦ V6

Website Node.js/Socket.IO của BITI TOURIST – Nhóm 10. **Đây là toàn bộ dự án**, không phải bản vá.

## Chức năng
- Người chơi: chọn sư chú/ni cô, nhập tên; sảnh chờ có hình 2D, chat chung + bong bóng trên nhân vật.
- Điện thoại: **6 nhân vật/dãy, 2 cột × 3 hàng**; dùng `Trước`, `Sau`, `Chỗ tôi`, hoặc danh sách tên 80 người. Desktop: 12/dãy.
- 8 câu hỏi bám sát slide 9, 12–16, 19, 22 của bài tour Hà Tiên–Phú Quốc.
- Điểm: đúng +200 đến +300; sai **−100, được phép âm** (−100, −200...). Không còn gõ mõ.
- MC `/mc`: đăng nhập PIN, điều khiển trò chơi, xem trước câu hỏi. Màn hình máy chiếu `/screen` không cần PIN và chỉ hiện nội dung.
- Bảng phong thần Top 3 và Bottom 3 có 6 ảnh SVG trang trí riêng trên điện thoại và máy chiếu.

## Dùng ngay với GitHub/Render đang có
Repo hiện tại của bạn có hai thư mục con lồng nhau. Tìm **thư mục hiện chứa `package.json`, `server.js` và `public/`** rồi cập nhật **toàn bộ file trong ZIP này vào đúng thư mục ấy**. Khi tải bằng giao diện GitHub web, nên tải từng nhóm file vào đúng folder, không đưa ZIP nguyên lên repo.

Giữ nguyên Render Root Directory đang hoạt động, ví dụ `chua-cong-duc-phu-quoc/chua-cong-duc-phu-quoc` nếu repo chưa đổi cách đặt folder.
- Build command: `npm install`
- Start command: `npm start`
- Environment: `MC_PIN` = mã PIN bí mật tự đặt. **Không đưa mã lên GitHub**.
- Deploy: Auto Deploy hoặc Manual Deploy → Deploy latest commit.
- Người chơi: `https://chua-cong-duc-phu-quoc.onrender.com/`
- MC: `https://chua-cong-duc-phu-quoc.onrender.com/mc`
- Máy chiếu: `https://chua-cong-duc-phu-quoc.onrender.com/screen`

**Để tránh lỗi trộn V5/V6:** chỉ một bản của `server.js`, `index.html`, `app.js`, `style.css` đúng đường dẫn; đồng thời giữ tất cả file SVG/WebP trong `public/assets`.

## Kiểm thử
- Kiểm tra cú pháp: `npm run check`
- Chạy thử trên máy: `npm install && npm start`
- Mở hai tab điện thoại (hoặc tab trình duyệt desktop có kích thước 375px) và một tab `/mc`.
- Để kiểm thử âm điểm: Reset từ MC; vào người chơi; bắt đầu câu 1; chọn phương án sai; điểm phải thành **−100**; tiếp tục sai câu 2 thành **−200**.
- Kiểm thử 80 người: có thể dùng bộ test cũ, nhưng phải kiểm tra thêm giao diện điện thoại, và reset phòng sau khi thử.

## Lưu ý kỹ thuật
- Dữ liệu điểm, chat và người chơi **chỉ lưu trong RAM**. Render Free khởi động lại là mất dữ liệu. Không cập nhật giữa trận.
- Giới hạn 80 phiên trong code không chứng minh Render Free chạy mượt 80 điện thoại thật. Cần thử trước trong điều kiện Wi-Fi lớp.
- Trang `/screen` là trang trình chiếu công khai, không chứa điều khiển quản trị.
- File `.env.example` chỉ là mẫu; dùng Environment Variables trên Render, không upload file `.env` chứa PIN thật.
