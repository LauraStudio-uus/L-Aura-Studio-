# L'Aura Studio V2 — Production-ready static frontend + Supabase backend

Bản này thay kiến trúc localStorage-only bằng **backend adapter**:

- Không cấu hình Supabase → **Local Demo** để mở và thử ngay.
- Có Supabase URL + Publishable/Anon Key → Auth, database, comments, booking pipeline, CMS và Storage dùng chung trên mọi thiết bị.
- Không còn hard-code email/mật khẩu Admin trong `app.js`.
- Local Demo tạo Admin lần đầu bằng chính email/mật khẩu bạn nhập; mật khẩu local được hash SHA-256 + salt để tránh lưu plain text. Đây vẫn chỉ là demo phía client, không phải bảo mật production.

## 1) Chạy ngay ở Local Demo

Mở `index.html` bằng Live Server hoặc deploy lên GitHub Pages. Vào **Admin** → nhập email + mật khẩu >= 8 ký tự → bấm **Khởi tạo Admin demo** (chỉ xuất hiện khi chưa có Admin local).

Dữ liệu local cũ từ các key `lauraStudioPortfolio`, `lauraStudioVideos`, `ddStudioPosts`, `ddStudioComments`, `ddStudioContacts` sẽ được migrate một lần sang V2 nếu có.

## 2) Bật Supabase production

1. Tạo Supabase project.
2. Mở SQL Editor, chạy `supabase-schema.sql`.
3. Nếu muốn dữ liệu mẫu, chạy `supabase-seed.sql`.
4. Trong Authentication, tạo/đăng ký tài khoản Admin.
5. Promote tài khoản đó bằng SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'email-cua-ban@example.com';
```

6. Mở `config.js` và điền:

```js
supabase: {
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "YOUR_PUBLISHABLE_OR_ANON_KEY",
  mediaBucket: "laura-media"
}
```

**Không bao giờ đưa `service_role` key vào frontend.** Chỉ dùng publishable/anon key; RLS trong SQL chịu trách nhiệm phân quyền.

## 3) Những gì đã hoàn thiện

### Auth & Security
- Supabase Auth dùng email/password.
- Admin xác định bằng `profiles.role = 'admin'`.
- RLS cho từng bảng và từng thao tác.
- Người dùng chỉ xóa comment của mình; Admin xóa mọi comment.
- Booking public chỉ được INSERT với status `new`; chỉ Admin đọc/update/delete.
- Portfolio / Video / Post: public chỉ đọc nội dung `published`; Admin CRUD.

### Studio OS / Admin
- Overview thống kê.
- Booking CRM pipeline: Mới → Đã liên hệ → Đã cọc → Đã chốt lịch → Đang sản xuất → Hậu kỳ → Hoàn thành / Hủy.
- Portfolio CMS: URL hoặc upload ảnh.
- Video CMS: YouTube/Vimeo/MP4 + thumbnail URL/upload.
- Journal CMS: cover URL/upload, draft/publish.
- Comment moderation.
- Media Library + copy URL.

### Media
- Supabase mode: upload file vào public bucket `laura-media` và metadata vào table `media`.
- Local Demo: chỉ cho ảnh <4 MB dạng Data URL; không lưu video file trực tiếp.

### SEO / Performance
- Canonical, OG/Twitter meta, JSON-LD `ProfessionalService`.
- `robots.txt`, `sitemap.xml`, 6 landing page dịch vụ riêng.
- Lazy loading/async decode cho ảnh không critical.
- Hero image `fetchpriority=high`.
- `content-visibility:auto`, reduced motion, responsive mobile.

## 4) Trước khi đưa domain thật lên Google

Tìm và thay `https://YOUR-DOMAIN.example/` trong:
- `config.js`
- `index.html`
- 6 file `service-*.html`
- `robots.txt`
- `sitemap.xml`

Sau đó upload sitemap lên Google Search Console.

## 5) Supabase Storage limits

Bạn có thể đặt giới hạn MIME/file size trong Supabase Dashboard cho bucket `laura-media`. Với studio ảnh nên dùng WebP/AVIF/JPEG tối ưu thay vì upload RAW/TIFF trực tiếp. Video dài nên ưu tiên Vimeo/YouTube hoặc CDN video chuyên dụng thay vì serve file rất lớn từ frontend.

## 6) Cấu trúc

- `index.html` — website + modals + Studio OS.
- `style.css` — giao diện sáng/tối, responsive, admin.
- `config.js` — cấu hình site/Supabase/contact.
- `app.js` — backend adapter + UI/CMS logic cho trang chính.
- `site.js` — theme/nav nhẹ cho landing pages dịch vụ.
- `supabase-schema.sql` — schema, RLS, Storage policies.
- `supabase-seed.sql` — dữ liệu mẫu tùy chọn.
- `robots.txt`, `sitemap.xml`, `404.html` — SEO/deploy.
- `service-*.html` — landing pages dịch vụ.

## Lưu ý production

Frontend không thể tự tạo một backend bảo mật nếu chưa có Supabase project của bạn. Vì vậy package này đã hoàn thiện code + schema + policies, nhưng bạn vẫn phải tạo project và dán 2 giá trị public trong `config.js` để chuyển từ Local Demo sang Production Backend.
