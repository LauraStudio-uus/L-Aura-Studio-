-- Bước 1: tạo người dùng trong Supabase Dashboard → Authentication → Users.
-- Bước 2: thay email bên dưới bằng email Admin vừa tạo rồi chạy câu lệnh này.

insert into public.admin_users (user_id)
select id from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id) do nothing;

-- Kết quả phải trả về một dòng:
select u.id, u.email, a.created_at
from auth.users u
join public.admin_users a on a.user_id = u.id
where lower(u.email) = lower('YOUR_ADMIN_EMAIL');
