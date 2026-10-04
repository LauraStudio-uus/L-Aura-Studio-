# L’AURA STUDIO — bản triển khai đầy đủ

Gói này gồm giao diện trong `public/`, Node.js API trong `server.js`, PostgreSQL schema trong `database/schema.sql`, thư mục ảnh tải lên `uploads/` và file cấu hình mẫu `.env.example`.

## Chạy trên máy

1. Cài Node.js 20+ và PostgreSQL 15+.
2. Sao chép `.env.example` thành `.env`, thay toàn bộ mật khẩu và chuỗi bí mật.
3. Chạy `npm install`.
4. Chạy `npm run db:init` để tạo bảng và sáu concept.
5. Chạy `npm start`, sau đó mở `http://localhost:3000`.

## Đưa lên Railway với database Supabase

1. Tạo Supabase project và chạy `database/schema.sql` trong SQL Editor.
2. Tại nút Connect của Supabase, sao chép Session pooler URI cổng `5432`.
3. Đưa toàn bộ nội dung thư mục này lên thư mục gốc của một GitHub repository.
4. Trong Railway, chọn **New Project → Deploy from GitHub repo** và chọn repository vừa tạo.
5. Thêm các biến `NODE_ENV`, `DATABASE_URL`, `DATABASE_SSL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` và `SESSION_SECRET` trong tab Variables.
6. Gắn Railway Volume tại `/app/uploads` để giữ ảnh album qua các lần triển khai.
7. Vào Settings → Networking → Generate Domain để lấy địa chỉ HTTPS công khai.

Railway tự nhận `Dockerfile` và chạy `npm start`. Không cần tự đặt biến `PORT` vì Railway cung cấp biến này khi ứng dụng chạy. Bắt buộc đổi `ADMIN_EMAIL`, `ADMIN_PASSWORD` và `SESSION_SECRET` trước khi công khai website.

## Dữ liệu

- `concepts`, `concept_images`: album sáu concept, hiển thị trên trang chủ và trang concept.
- `bookings`: yêu cầu đặt lịch và trạng thái xử lý.
- `portfolio_items`, `posts`, `comments`: cấu trúc database sẵn cho các phần nội dung mở rộng.

Khi API hoạt động, album và booking được lưu trong PostgreSQL. Nếu chỉ mở thư mục `public/` như website tĩnh, giao diện vẫn chạy với localStorage để xem thử nhưng dữ liệu sẽ chỉ tồn tại trên trình duyệt đang dùng.
