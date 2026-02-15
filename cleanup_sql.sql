-- Supabase数据清理SQL命令
-- 请在Supabase Dashboard的SQL编辑器中执行

-- 1. 清空word_media表
DELETE FROM word_media;

-- 2. 清空study_records表  
DELETE FROM study_records;

-- 3. 检查是否还有其他测试数据
SELECT COUNT(*) FROM word_media;
SELECT COUNT(*) FROM study_records;

-- 4. 如果需要重置序列（如果表中有自增ID）
-- SELECT setval('word_media_id_seq', 1, false);
-- SELECT setval('study_records_id_seq', 1, false);

-- Storage文件需要在Supabase Dashboard的Storage部分手动删除
-- 或者通过API使用Service Role Key删除