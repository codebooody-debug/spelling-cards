-- 创建 Storage Buckets SQL
-- 在 Supabase Dashboard SQL Editor 中执行

-- 创建 spelling-images bucket（用于存储上传的作业照片）
insert into storage.buckets (id, name, public)
values ('spelling-images', 'spelling-images', true);

-- 创建 word-images bucket（用于存储AI生成的单词图片）
insert into storage.buckets (id, name, public)
values ('word-images', 'word-images', true);

-- 为 spelling-images 设置访问策略
-- 允许认证用户上传到自己的文件夹
CREATE POLICY "Allow authenticated uploads to spelling-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'spelling-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许任何人读取（或改为只允许认证用户读取）
CREATE POLICY "Allow public read access to spelling-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'spelling-images');

-- 为 word-images 设置访问策略
-- 允许认证用户上传到自己的文件夹
CREATE POLICY "Allow authenticated uploads to word-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'word-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许任何人读取
CREATE POLICY "Allow public read access to word-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'word-images');
