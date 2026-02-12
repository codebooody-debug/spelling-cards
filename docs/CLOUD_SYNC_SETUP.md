# 跨设备媒体同步部署指南

## 新增功能

- ✅ 图片和单词信息存储到 Supabase，支持跨设备同步
- ✅ 本地 IndexedDB 缓存，加速重复访问
- ✅ 云端优先加载策略

## 部署步骤

### 1. 更新数据库 Schema

在 Supabase Dashboard 中执行 SQL：

```bash
# 文件位置：supabase/migrations/001_add_word_media.sql
```

或直接复制 SQL 内容到 SQL Editor 执行。

### 2. 创建 Storage Buckets

在 Supabase Dashboard → Storage 中创建两个公开的 bucket：

#### Bucket 1: `word-images`
- **Public**: ✅ 开启（允许公开访问图片）
- **File size limit**: 5MB
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`

#### Bucket 2: `word-audios`
- **Public**: ✅ 开启（允许公开访问音频）
- **File size limit**: 1MB
- **Allowed MIME types**: `audio/mpeg`, `audio/mp3`

### 3. 配置 Storage 访问策略

为两个 bucket 添加以下策略：

#### Select (读取) 策略
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('word-images', 'word-audios'));
```

#### Insert (上传) 策略
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('word-images', 'word-audios')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Update/Delete 策略
```sql
CREATE POLICY "Allow users to manage their own files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id IN ('word-images', 'word-audios')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. 重新部署应用

```bash
cd spelling-cards
npm run build
vercel --prod
```

### 5. 验证功能

1. 上传一张新的听写作业
2. 确认图片生成进度显示正常
3. 在另一个设备/浏览器登录同一账号
4. 打开相同的学习记录，图片应该能从云端加载

## 数据流向

```
用户上传图片
    ↓
AI 识别单词和句子
    ↓
生成单词信息（释义、同义词、反义词、例句）
    ↓
生成 AI 图片
    ↓
上传到 Supabase Storage (word-images bucket)
    ↓
保存图片 URL 到 word_media 表
    ↓
用户在其他设备打开
    ↓
优先从 Supabase Storage 加载图片 URL
    ↓
同时缓存到本地 IndexedDB
```

## 注意事项

1. **Storage 费用**: Supabase 免费版有 1GB 存储限制，注意监控使用量
2. **图片大小**: AI 生成的图片约 100-300KB，1000 张图片约 200-300MB
3. **加载速度**: 云端图片首次加载可能比本地慢，但有 CDN 加速
4. **隐私**: 图片存储在 Supabase，只有拥有链接的人可以访问

## 故障排查

### 图片无法加载
1. 检查 bucket 是否为 public
2. 检查图片 URL 是否正确生成
3. 查看浏览器网络请求是否有 403/404 错误

### 上传失败
1. 检查用户是否已登录
2. 检查 Storage 策略是否正确配置
3. 查看 Supabase 日志

### 数据不同步
1. 确认所有设备登录的是同一账号
2. 检查 word_media 表中是否有对应记录
3. 尝试清除浏览器缓存后重新加载
