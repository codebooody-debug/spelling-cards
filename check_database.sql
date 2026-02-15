-- 检查并创建必要的数据库表
-- 在 Supabase Dashboard SQL Editor 中执行

-- 1. 检查 study_records 表是否存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'study_records') THEN
    RAISE NOTICE 'study_records 表不存在，需要创建';
  ELSE
    RAISE NOTICE 'study_records 表已存在';
  END IF;
END $$;

-- 2. 检查 word_media 表是否存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'word_media') THEN
    RAISE NOTICE 'word_media 表不存在，需要创建';
  ELSE
    RAISE NOTICE 'word_media 表已存在';
  END IF;
END $$;

-- 3. 检查 storage buckets 是否存在
SELECT name, public 
FROM storage.buckets 
WHERE name IN ('spelling-images', 'word-images');
