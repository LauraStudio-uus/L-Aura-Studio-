# L’AURA STUDIO — GitHub Pages + Supabase

Gói này không cần Render, Railway, VPS hoặc backend Node.js.

- GitHub Pages xuất bản HTML/CSS/JavaScript.
- Supabase Database lưu album concept và yêu cầu đặt lịch.
- Supabase Storage lưu ảnh concept.
- Supabase Auth xác thực tài khoản Admin.
- Row Level Security giới hạn quyền đọc/ghi trực tiếp từ trình duyệt.

## 1. Khởi tạo Supabase

1. Tạo hoặc mở project Supabase.
2. Mở **SQL Editor → New query**.
3. Sao chép toàn bộ `database/schema.sql`, dán vào SQL Editor và bấm **Run**.
4. Kiểm tra **Table Editor** có `admin_users`, `concepts`, `concept_images` và `bookings`.
5. Kiểm tra **Storage** có bucket công khai `concept-images`.

## 2. Tạo tài khoản Admin

1. Mở **Authentication → Users → Add user → Create new user**.
2. Nhập email và mật khẩu Admin; bật xác nhận email nếu Dashboard cung cấp lựa chọn này.
3. Mở `database/create-admin.sql`.
4. Thay cả hai chỗ `YOUR_ADMIN_EMAIL` bằng email vừa tạo.
5. Chạy file trong SQL Editor. Câu `select` cuối phải trả về đúng một dòng.

## 3. Kết nối website với Supabase

1. Trong Supabase mở **Settings → API Keys**.
2. Sao chép **Project URL** và **Publishable key** (`sb_publishable_...`). Legacy `anon` key cũng chạy được.
3. Mở `supabase-config.js` và thay hai giá trị mẫu:

```js
window.LAURA_SUPABASE = {
  url: "https://MA_PROJECT.supabase.co",
  publishableKey: "sb_publishable_...",
  storageBucket: "concept-images"
};
```

Không dùng `secret key` hoặc `service_role key` trong website/GitHub.

## 4. Đưa lên GitHub Pages

1. Tạo GitHub repository mới hoặc xóa nội dung repository thử nghiệm.
2. Tải **toàn bộ nội dung bên trong thư mục này** lên thư mục gốc repository. `index.html` phải nằm ngay ở trang đầu repository.
3. Mở **Settings → Pages** của repository.
4. Ở **Build and deployment**, chọn **Deploy from a branch**.
5. Chọn branch `main`, thư mục `/(root)` và bấm **Save**.
6. Chờ mục Pages hiện liên kết `https://TEN_GITHUB.github.io/TEN_REPOSITORY/`.

## 5. Kiểm tra

1. Mở website GitHub Pages và gửi thử một yêu cầu đặt lịch.
2. Trong Supabase **Table Editor → bookings**, kiểm tra yêu cầu đã xuất hiện.
3. Trên website nhấn biểu tượng Admin và đăng nhập bằng tài khoản đã tạo trong Supabase Auth.
4. Mở tab **6 Concept**, tải nhiều ảnh và lưu album.
5. Kiểm tra `concept_images` có dữ liệu và Storage bucket `concept-images` có file.
6. Đăng xuất hoặc mở cửa sổ ẩn danh để xác nhận album vẫn hiển thị ngoài trang chủ và các trang concept.

## Phạm vi đồng bộ

Album 6 concept và yêu cầu đặt lịch được đồng bộ qua Supabase trên mọi thiết bị. Các mô-đun nội dung mẫu cũ như bài viết, portfolio phụ và tài khoản khách vẫn chạy cục bộ trong trình duyệt; chúng không có quyền truy cập dữ liệu Admin hoặc Storage.
