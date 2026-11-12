-- Ảnh đề bài của trang "Luyện Task 1" (biểu đồ, bảng, bản đồ, quy trình...).
-- Ảnh nằm ở Supabase Storage, bucket riêng tư task1-images; bài trong task1_essays chỉ giữ
-- đường dẫn ảnh. Mỗi người một thư mục <user_id>/<id bài>/, chỉ chủ thư mục xem và sửa được.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

-- Bucket: riêng tư (xem qua link ký tạm), tối đa 10 MB một ảnh, chỉ nhận PNG / JPG / WEBP.
-- App tự thu nhỏ ảnh trước khi tải lên nên ảnh thường chỉ vài trăm KB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task1-images', 'task1-images', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- RLS trên storage.objects: thư mục đầu của đường dẫn phải là id người đang đăng nhập
drop policy if exists task1_images_owner_select on storage.objects;
drop policy if exists task1_images_owner_insert on storage.objects;
drop policy if exists task1_images_owner_update on storage.objects;
drop policy if exists task1_images_owner_delete on storage.objects;

create policy task1_images_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'task1-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy task1_images_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'task1-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy task1_images_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'task1-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'task1-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy task1_images_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'task1-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Kiểm tra: phải thấy 1 dòng task1-images, public = false
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'task1-images';
