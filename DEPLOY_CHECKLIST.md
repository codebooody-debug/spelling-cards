# 🚀 发布检查清单

## 1. Supabase 配置

### 1.1 Edge Functions 部署
确保以下 Edge Functions 已部署到 Supabase：
- [ ] `extract-spelling` - OCR识别
- [ ] `generate-image` - AI图片生成
- [ ] `enrich-word` - 单词信息丰富

部署命令：
```bash
supabase functions deploy extract-spelling
supabase functions deploy generate-image
supabase functions deploy enrich-word
```

### 1.2 环境变量配置
在 Supabase Dashboard → Project Settings → Edge Functions 中设置：
- [ ] `GOOGLE_API_KEY` - Gemini API Key

### 1.3 数据库设置
在 Supabase SQL Editor 中执行 `schema.sql`：
- [ ] 创建 `study_records` 表
- [ ] 启用 RLS
- [ ] 创建访问策略

### 1.4 Storage 存储桶
- [ ] 创建 `spelling-images` 存储桶
- [ ] 设置公开访问权限

## 2. 前端部署

### 2.1 环境变量
创建 `.env` 文件：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2.2 构建
```bash
npm run build
```

### 2.3 部署到 Supabase Hosting
```bash
supabase hosting publish
```

或部署到 Vercel/Netlify：
```bash
# 上传 dist/ 文件夹
```

## 3. TTS 代理服务器（可选）

如果需要本地 TTS 服务，在服务器上运行：
```bash
cd proxy
npm install
# 创建 .env 文件
node server.js
```

### 代理服务器环境变量
```env
MINIMAX_API_KEY=your-minimax-key
GOOGLE_API_KEY=your-google-key
PORT=3001
```

## 4. 功能测试

### 4.1 基础功能
- [ ] 上传图片识别
- [ ] 生成学习卡片
- [ ] 翻转卡片查看背面
- [ ] 语音播放（单词/句子）
- [ ] AI图片生成

### 4.2 数据持久化
- [ ] 刷新页面后记录仍在
- [ ] 删除记录正常
- [ ] 图片正确显示

### 4.3 离线功能
- [ ] 无网络时降级到浏览器TTS
- [ ] localStorage 数据保存

## 5. 已知限制

1. **TTS 服务**：需要单独部署代理服务器或使用浏览器语音
2. **图片生成**：依赖 Gemini API，可能偶尔失败
3. **首次加载**：Edge Functions 冷启动可能较慢

## 6. 文件清单

```
spelling-cards/
├── dist/                      # 构建输出
├── src/
│   ├── pages/                 # 页面组件
│   ├── components/            # 组件
│   ├── context/               # 状态管理
│   ├── services/              # 服务
│   ├── lib/                   # 工具库
│   └── ...
├── supabase/
│   ├── functions/             # Edge Functions
│   │   ├── extract-spelling/
│   │   ├── generate-image/
│   │   └── enrich-word/
│   └── schema.sql             # 数据库架构
├── proxy/                     # TTS代理服务器
└── .env.example               # 环境变量模板
```
