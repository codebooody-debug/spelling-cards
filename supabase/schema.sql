-- Supabase 数据库初始化脚本

-- 1. 创建学习记录表
CREATE TABLE IF NOT EXISTS study_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  grade TEXT NOT NULL,
  term TEXT NOT NULL,
  spelling_number TEXT,
  subject TEXT DEFAULT 'Spelling',
  title TEXT,
  source_image_url TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用 RLS（行级安全）
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- 3. 创建策略：用户只能操作自己的数据
CREATE POLICY "Users can only see their own records"
  ON study_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own records"
  ON study_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own records"
  ON study_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own records"
  ON study_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 创建 Storage 存储桶（用于存储图片）
-- 在 Supabase Dashboard 中手动创建名为 'spelling-images' 的存储桶

-- 5. 启用 Storage 的 RLS
-- 在 Supabase Dashboard 中设置 Storage 的访问策略

-- 6. 创建索引（优化查询）
CREATE INDEX idx_study_records_user_id ON study_records(user_id);
CREATE INDEX idx_study_records_grade_term ON study_records(grade, term);
CREATE INDEX idx_study_records_created_at ON study_records(created_at DESC);
