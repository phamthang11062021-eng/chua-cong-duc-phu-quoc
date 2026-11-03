# CHÙA CÔNG ĐỨC – PHÚ QUỐC EDITION ⛩️

Trò chơi cuối giờ dành cho **BITI TOURIST – Nhóm 10**, bám bài thuyết trình **Thiết kế chương trình tour Hà Tiên – Phú Quốc – Cà Mau (tuyến thể hiện trên slide: TP.HCM – Hà Tiên – Phú Quốc – Hà Tiên – TP.HCM), 3 ngày 2 đêm**. Dự kiến **80 sinh viên** cùng chơi bằng điện thoại, có room chung, MC điều khiển, QR và Top 10 trực tiếp.

## Tính năng
- Mỗi người nhập biệt danh, kết nối real-time qua Socket.IO; có thể vào lại bằng cùng trình duyệt khi mất mạng.
- Mở gõ mõ: +1 điểm/lần; tối đa 5 lần/giây, 200 lần/người nhằm hạn chế spam.
- 8 thử thách: mỗi câu tối đa 20 giây, +200 điểm nếu đúng và thưởng tốc độ tối đa +100 điểm; sai không bị trừ điểm.
- MC chuyển câu thủ công, câu hỏi tự hết giờ và hiện đáp án theo lệnh MC, điều khiển kết thúc/reset.
- Bảng vàng Top 10 và tổng gõ mõ; QR tạo bằng URL website thực tế.
- Giao diện mobile, không yêu cầu đăng ký tài khoản, âm thanh mõ tổng hợp trong trình duyệt.

## Chạy thử trên máy

Yêu cầu Node.js 20+.

```bash
npm install
cp .env.example .env
# ĐỔI MC_PIN thành mã bí mật của nhóm
npm start
```

- Người chơi: `http://localhost:3000/`
- MC: `http://localhost:3000/mc`
- Mã MC: giá trị `MC_PIN` trong `.env` (mặc định demo 482916 nếu chưa đặt).

Để cho điện thoại cùng Wi-Fi chơi trên mạng LAN: mở `http://DIA_CHI_IP_MAY_CHU:3000/` (đảm bảo firewall cho phép port 3000). Nếu dùng hosting, bỏ qua bước LAN.

## Đưa lên mạng tạo link thật bằng Render

1. Tạo một kho GitHub mới và tải toàn bộ các file trong thư mục này lên (không đẩy `.env`).
2. Đăng nhập [render.com](https://render.com), chọn **New → Web Service**, kết nối repo GitHub đó.
3. Runtime **Node**, Build command `npm install`, Start command `npm start`. Chọn gói phù hợp với 80 kết nối WebSocket đồng thời; cần thử tải trước giờ học. Chế độ miễn phí, nếu có, có thể ngủ hoặc bị giới hạn.
4. Trong **Environment**, đặt `MC_PIN` là mật mã riêng khó đoán. Tuỳ chọn đặt `PUBLIC_URL` bằng link Render dạng `https://ten-website.onrender.com` để QR luôn trỏ chính xác link đó.
5. Deploy. Mở link `https://ten-website.onrender.com/` cho người chơi và `https://ten-website.onrender.com/mc` cho MC. QR sẽ tự xuất hiện ở trang MC.
6. Trước giờ học: dùng 2–5 điện thoại thử vào phòng, chơi đủ 1 câu, kiểm tra bảng điểm; nếu dự kiến 80 người, nên thử tải gần 80 thiết bị/kết nối hoặc dùng gói có đủ tài nguyên. Ưu tiên lớp có Wi-Fi ổn định.

**Lưu ý:** Không thể tự tạo link thật trước khi mã nguồn được triển khai trên tài khoản hosting của bạn. Không có dịch vụ database trong bản này: **điểm được giữ trong RAM**; server restart hoặc hosting sleep sẽ mất toàn bộ điểm. Chỉ chạy **1 instance** máy chủ (không tự động scale nhiều máy) vì Socket.IO và trạng thái đang lưu trên một tiến trình. Không phù hợp với kỳ thi nghiêm túc, giải thưởng giá trị cao vì người chơi chưa có cơ chế chống đa tài khoản. `MC_PIN` là cơ chế bảo vệ đơn giản cho một buổi thuyết trình.

## Kịch bản MC (5–8 phút)

1. Mở `/mc` trên máy chiếu và dùng QR mời cả lớp vào (30–60 giây). Giữ PIN kín; khi cần có thể chiếu cửa sổ người chơi thay vì bảng MC.
2. Nhấn **MỞ GÕ MÕ** và dẫn: “Mỗi cái gõ được 1 điểm, nhưng đừng tưởng gõ nhanh là thắng — kiến thức mới là công đức xịn!” (30–45 giây).
3. Bấm **CÂU TIẾP THEO**; cả lớp trả lời 20 giây. Đọc đáp án qua nút **HIỆN ĐÁP ÁN**, liên hệ slide và chuyển câu tiếp theo. Tổng cộng 8 câu, nên dành 20–30 giây/câu + 10–15 giây MC dẫn.
4. Bấm **KẾT THÚC** để chốt Top 3 và trao quà. Nếu muốn chơi lại, dùng **RESET GAME** (sẽ xóa điểm và người chơi).

## Câu hỏi và nguồn trên PDF (37 trang)

| Câu | Chủ đề | Slide | Đáp án |
|---|---|---:|---|
| 1 | Điểm chùa ngày 1 ở Hà Tiên | 12 | Chùa Phù Dung |
| 2 | Grand World | 13 | Nhà Tre |
| 3 | Thăm Chùa Hộ Quốc ngày nào | 14 | Ngày 2 |
| 4 | Hoạt động phụ thuộc điều kiện an toàn | 15 | Ngắm san hô |
| 5 | Sunset Town | 16 | Quảng trường Con Sò |
| 6 | Quy mô đoàn dự kiến | 9 | 40 khách |
| 7 | Tổng chi phí dự toán | 19 | 132.550.000đ |
| 8 | Điểm hòa vốn mô hình | 22 | 19 khách |

Tài liệu nguồn do người dùng cung cấp: `N10-PPT (2)(1).pdf`. Các điểm số/tình tiết “công đức” là **cơ chế hư cấu của game**, không phải nội dung trong slide hay thực hành tôn giáo.

## Cấu trúc

- `server.js`: Express + Socket.IO + luật chơi và bộ câu hỏi.
- `public/index.html`, `app.js`: màn hình người chơi.
- `public/mc.html`, `mc.js`: bảng điều khiển MC.
- `public/style.css`: giao diện responsive, minh hoạ chùa bằng CSS.

## Nếu muốn chỉnh

- Đổi câu hỏi trong mảng `questions` ở `server.js`.
- Đổi thời gian ở `deadline=Date.now()+20000` và `setTimeout(reveal,20050)`.
- Đổi điểm trả lời ở `p.score+=200+...`; giới hạn gõ ở `p.taps>=200`.
- Đổi tên, thông điệp và màu ở `public/index.html`, `public/style.css`.
