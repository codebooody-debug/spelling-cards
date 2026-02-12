-- Supabase 数据库更新：添加单词媒体资源表

-- 1. 创建单词媒体资源表（每个单词的图片和音频）
CREATE TABLE IF NOT EXISTS word_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  word TEXT NOT NULL,
  study_record_id UUID REFERENCES study_records(id) ON DELETE CASCADE,
  
  -- 图片信息
  image_url TEXT,                    -- Supabase Storage 图片路径
  image_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- 音频信息（存储在 content JSONB 中）
  -- 音频文件较小且需要快速播放，我们仍然实时生成，但会缓存到 Supabase
  
  -- 单词详细信息
  meaning TEXT,                      -- 中文释义
  word_type TEXT,                    -- 词性
  phonetic TEXT DEFAULT '/fəˈnetɪk/', -- 音标
  synonyms TEXT[],                   -- 同义词数组
  antonyms TEXT[],                   -- 反义词数组
  practice_sentences TEXT[],         -- 练习例句
  memory_tip TEXT,                   -- 记忆技巧
  sentence TEXT,                     -- 原句子
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 唯一约束：一个用户的同一个单词在同一记录中只保存一份
  UNIQUE(user_id, study_record_id, word)
);

-- 2. 启用 RLS
ALTER TABLE word_media ENABLE ROW LEVEL SECURITY;

-- 3. 创建策略
CREATE POLICY "Users can only see their own word media"
  ON word_media
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own word media"
  ON word_media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own word media"
  ON word_media
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own word media"
  ON word_media
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 创建索引
CREATE INDEX idx_word_media_user_id ON word_media(user_id);
CREATE INDEX idx_word_media_record_id ON word_media(study_record_id);
CREATE INDEX idx_word_media_word ON word_media(word);

-- 5. 创建 Storage Buckets（需要在 Supabase Dashboard 中执行或通过 API 创建）
-- Bucket: word-images (公开读取，需要认证写入)
-- Bucket: word-audios (公开读取，需要认证写入)

-- Storage 策略示例（需要在 Supabase Dashboard 中配置）：
-- 1. word-images bucket: 允许任何人读取，只允许认证用户写入自己的文件夹
-- 2. word-audios bucket: 同上

COMMENT ON TABLE word_media IS '存储每个单词的媒体资源和详细信息，支持跨设备同步';
