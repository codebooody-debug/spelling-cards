# 📝 单词听写助手

一个智能的英文单词听写学习工具，通过拍照识别听写内容，生成精美的学习卡片。

## ✨ 功能特点

- 📸 **拍照识别** - 上传听写照片，AI自动识别单词和句子
- 🎴 **学习卡片** - 每个单词生成精美卡片，正面例句，背面练习
- 🎨 **AI插图** - 为每个单词自动生成情境插图
- 🔊 **智能朗读** - 支持单词和句子语音播放（MiniMax AI / Google Cloud / 浏览器）
- 📚 **单词信息** - 中文释义、同义词、反义词、记忆技巧
- 💾 **数据同步** - 支持 Supabase 云端存储 + localStorage 本地存储

## 🛠️ 技术栈

- React 19 + Vite
- Tailwind CSS
- Supabase (Auth + Database + Edge Functions)
- Gemini AI (OCR + 图片生成 + 文本生成)
- MiniMax TTS

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 Supabase 配置
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 启动 TTS 代理（可选）

如需使用 MiniMax 或 Google Cloud TTS：

```bash
cd proxy
npm install
cp .env.example .env  # 填入 API Keys
node server.js
```

## 📁 项目结构

```
src/
├── pages/           # 页面组件
│   ├── HomePage.jsx      # 首页 - 上传和记录列表
│   ├── ConfirmPage.jsx   # 确认页 - 编辑和生成
│   ├── StudyPage.jsx     # 学习页 - 卡片网格
│   └── TermPage.jsx      # 学期页
├── components/
│   └── FlipCard.jsx      # 翻转卡片组件
├── context/
│   └── AppContext.jsx    # 全局状态
├── lib/
│   └── supabase.js       # Supabase 客户端
└── services/
    └── imageCache.js     # 图片缓存服务

supabase/functions/       # Edge Functions
├── extract-spelling/     # OCR识别
├── generate-image/       # AI图片生成
└── enrich-word/          # 单词信息丰富

proxy/                    # TTS代理服务器
└── server.js
```

## 🌐 Supabase 部署

### 1. 部署 Edge Functions

```bash
supabase functions deploy extract-spelling
supabase functions deploy generate-image  
supabase functions deploy enrich-word
```

### 2. 设置环境变量

在 Supabase Dashboard → Project Settings → Edge Functions：
- `GOOGLE_API_KEY` - 你的 Gemini API Key

### 3. 初始化数据库

在 Supabase SQL Editor 执行 `supabase/schema.sql`

### 4. 构建并部署前端

```bash
npm run build
supabase hosting publish
```

## 📝 使用说明

1. **首页** - 点击上传听写照片，或查看已有记录
2. **确认页** - 检查AI识别的年级、学期和单词，确认后生成卡片
3. **学习页** - 点击卡片翻转，查看释义、例句和练习
4. **语音** - 点击 Aa 播放单词，点击 🔊 播放句子

## ⚠️ 注意事项

- 首次使用 Edge Functions 可能有冷启动延迟
- TTS 服务需要单独配置代理或使用浏览器语音
- 图片生成依赖 Gemini API，可能偶尔失败

## 📄 许可证

MIT
