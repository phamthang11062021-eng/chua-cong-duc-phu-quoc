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


## V7 - màn chiếu đủ 80 thí chủ
- Trang `/screen` hiển thị 80 chỗ trong **1 màn hình máy chiếu** (10 cột × 8 hàng), không chuyển dãy; avatar, tên, bong bóng chat mới nhất nằm trên đúng nhân vật.
- Chat chung chiếm cột bên trái và cập nhật thời gian thực; chỉ tối đa 3 bong bóng chat mới nhất hiển thị cùng lúc để hạn chế che nhau.
- Bộ đếm ở góc trên dùng số **người đang kết nối (onlineCount)**; số đã ghi danh được hiển thị riêng, vì người rớt mạng có thể vẫn có điểm và tên trong game.
- `/screen` được thiết kế cho máy chiếu/laptop 16:9; màn điện thoại sinh viên vẫn giữ 6 người/dãy để đọc được tên.
- Các dòng tin nhắn vẫn có thể bị rút gọn trên máy chiếu nếu gửi nhiều hoặc quá dài, nhưng dữ liệu trò chuyện lưu ở server có giới hạn 50 tin nhắn.
- `MC_PIN` tiếp tục thiết lập qua Render Environment Variables.


## V8 - Podium tu tiên, nhạc thiền gốc và tiêu đề desktop
- `/screen`: Top 3 theo bục 2–1–3; Top 1 giữa, lớn nhất, Top 2 và Top 3 bằng kích thước; hào quang CSS chuyển động liên tục.
- Trang người chơi: cũng hiện bục 2–1–3 trên điện thoại.
- Sửa tiêu đề `/screen` bị ký tự vuông/cắt dòng trên máy tính.
- Nút **Bật nhạc thiền** trên `/`, `/mc`, `/screen`; âm thanh gốc được tổng hợp bằng WebAudio từ các âm ngân, chuông và sáo tổng hợp. Không lấy bài nhạc từ video của người dùng. Nhạc tiếp tục xuyên suốt từng trang sau khi bật; khi điều hướng sang trang khác, phải bật lại do giới hạn autoplay của trình duyệt.
- Để tránh hai nguồn âm thanh phát đè nhau, chỉ bật nhạc trên máy/cửa sổ muốn nghe (thường là máy chiếu của MC).
- Khi deploy, giữ `MC_PIN` trong Render Environment. Điểm vẫn lưu RAM và có thể mất khi Render khởi động lại.
- Test thử trên điện thoại + `/screen` trước khi dùng cho lớp đông.
