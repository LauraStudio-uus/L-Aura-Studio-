# L’AURA STUDIO — GitHub Pages + Supabase

Gói này không cần Render, Railway, VPS hoặc backend Node.js.

- GitHub Pages xuất bản HTML/CSS/JavaScript.
- Supabase Database lưu album concept, Portfolio, bài viết và yêu cầu đặt lịch.
- Supabase Storage lưu ảnh concept, Portfolio và bài viết.
- Trong Admin → Bài viết, đặt con trỏ trong ô Nội dung rồi chọn một hoặc nhiều ảnh từ máy (tối đa 10 ảnh/lần, mỗi ảnh tối đa 12 MB) hoặc chèn URL ảnh HTTPS trực tiếp. Ảnh nằm giữa các đoạn văn trong bài sau khi bấm Đăng bài/Lưu bài. Ảnh từ máy được tải vào bucket `site-images` hiện có; không cần chạy thêm SQL. Ảnh đại diện vẫn được chọn riêng.
- Trong Admin → Bài viết → **Liên kết nội bộ**, bôi đen chữ trong ô Nội dung (hoặc nhập chữ hiển thị), chọn một trang của L’AURA hay bài viết đã đăng, rồi bấm **Chèn liên kết**. Liên kết tới bài viết dùng địa chỉ `journal.html?post=ID`, mở đúng bài khi khách truy cập trực tiếp. Bấm lưu bài sau khi chèn; không cần thay đổi database.
- Supabase Auth xác thực tài khoản Admin.
- Row Level Security giới hạn quyền đọc/ghi trực tiếp từ trình duyệt.
- Nút ở đầu trang cho phép đổi giao diện sáng/tối; lựa chọn được ghi nhớ trên thiết bị.
- Logo nằm giữa mép trên trong header dạng Dynamic Island. Trên máy có chuột, header thu về đảo logo ở giữa và trượt mở đều hai phía khi rê vào hoặc dùng bàn phím. Trên thiết bị cảm ứng, logo vẫn ở giữa và menu mở bằng nút chạm.
- Trang chủ có công cụ gợi ý 3 concept miễn phí theo phong cách bạn chọn, mô tả và bảng màu ảnh (nếu thêm ảnh). Công cụ chạy trong trình duyệt, không dùng AI/API và không tải ảnh lên máy chủ.
- Nhạc nền có trên mọi trang. Admin có thể tải MP3 hoặc dán URL âm thanh trực tiếp; khách có nút bật/tắt và thanh chỉnh âm lượng. Website có sẵn một bản nhạc mặc định.
- `design-system.css` là lớp giao diện mới; cần tải lên cùng `style.css` để giữ đúng kiểu chữ, khoảng cách và thẻ nội dung.

## 1. Khởi tạo Supabase

1. Tạo hoặc mở project Supabase.
2. Mở **SQL Editor → New query**.
3. Sao chép toàn bộ `database/schema.sql`, dán vào SQL Editor và bấm **Run**.
4. Kiểm tra **Table Editor** có `admin_users`, `concepts`, `concept_images` và `bookings`.
5. Kiểm tra **Storage** có bucket công khai `concept-images` và `site-images`.

Nếu project đã chạy phiên bản SQL cũ, chỉ cần chạy `database/update-content-sync.sql` để thêm cột trang Portfolio và bucket ảnh mới.
Để bật quyền Admin thay nhạc nền trên project đã có, chạy thêm `database/background-music.sql` một lần. Project mới chạy `schema.sql` đã bao gồm phần này.

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
6. Thử tạo bài viết có ảnh chèn trong Nội dung, tải ảnh Portfolio, sau đó mở cửa sổ ẩn danh để xác nhận ảnh và thay đổi xuất hiện giống nhau.
7. Đăng xuất hoặc mở cửa sổ ẩn danh để xác nhận album vẫn hiển thị ngoài trang chủ và các trang concept.
8. Trong Admin → **Nhạc nền**, tải MP3 (tối đa 15 MB) hoặc dán URL âm thanh trực tiếp, rồi mở một trang khác để kiểm tra. Có thể bấm **Dùng nhạc mặc định** để khôi phục.

## Phạm vi đồng bộ

Album 6 concept, Portfolio, bài viết và yêu cầu đặt lịch được đồng bộ qua Supabase trên mọi thiết bị. Tài khoản khách và bình luận cũ vẫn lưu cục bộ trong trình duyệt. Bài viết/ảnh Portfolio từng lưu trong trình duyệt trước bản cập nhật này không tự chuyển vào Supabase; hãy đăng lại nội dung muốn giữ qua Admin.

## 6. Gợi ý concept miễn phí trên trang chủ

Mở phần **Khám phá concept**, chọn phong cách hoặc nhập mô tả; bạn cũng có thể thêm ảnh tham khảo JPG/PNG/WebP dưới 8 MB. Nhấn **Xem gợi ý concept** để nhận 3 hướng tạo hình và mở album tương ứng. Ảnh chỉ được đọc tạm trên thiết bị để lấy màu sắc, độ sáng tổng thể; công cụ không phân tích khuôn mặt, không lưu ảnh và không gửi ảnh lên mạng. Có thể dùng cả khi mở `index.html` bằng `file://`.

Tính năng này không cần OpenAI, Supabase Edge Function, API key hay SQL riêng. Supabase vẫn cần cho album, Portfolio, bài viết, đặt lịch và Admin theo các bước 1–5.

## 7. Nhạc nền trên mọi trang

Website đã kèm bản nhạc mặc định trong `assets/laura-ambient.wav`. Admin có thể thay bằng MP3 tải từ máy hoặc URL âm thanh trực tiếp ở tab **Nhạc nền**. MP3 tải từ máy được lưu trong Supabase Storage bucket `site-audio`; URL chỉ được ghi vào `site_settings`, không sao chép file vào Storage. Link phải là HTTPS trỏ thẳng tới file nhạc có đuôi như `.mp3`, `.ogg`, `.wav`, `.m4a`, `.aac` hoặc `.opus` (có thể kèm tham số `?...`). Link trang bài hát Zing MP3 dạng `.html`, YouTube hay Spotify không phải file âm thanh nên không phát được. Nguồn URL bên ngoài phải tiếp tục hoạt động và cho phép website phát nhạc. Sau khi tải đủ các file website lên GitHub Pages, chạy `database/background-music.sql` trong SQL Editor nếu dùng project cũ. Không cần dịch vụ âm nhạc trả phí.

Trình duyệt có thể chặn nhạc có tiếng tự phát. Website sẽ thử phát khi mở trang và tự bắt đầu sau thao tác đầu tiên của khách nếu bị chặn. Chỉ nút **♫ Bật nhạc / Nhạc nền** hiện ở góc dưới; bấm nút để mở thanh âm lượng 0–100%. Khi thanh đang mở, bấm **♫ Tắt nhạc** để tắt; bấm ra ngoài để thu gọn thanh mà vẫn phát. Cả lựa chọn bật/tắt và mức âm lượng được ghi nhớ trên thiết bị.
