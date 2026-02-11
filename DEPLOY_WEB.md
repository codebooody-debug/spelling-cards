# 🚀 部署指南 - 单词听写助手

## ✅ 当前状态

### 构建完成
```
dist/index.html                   0.47 kB │ gzip:   0.32 kB
dist/assets/index-Cq2-RKRq.css   24.95 kB │ gzip:   5.39 kB
dist/assets/index-ZR7nsHiH.js   444.42 kB │ gzip: 131.05 kB
✓ built in 966ms
```

### 本地预览
🌐 **http://localhost:8889**

---

## 📦 部署选项

### 选项 1: Vercel (推荐)

```bash
# 1. 登录 Vercel
vercel login

# 2. 部署
vercel --prod
```

### 选项 2: Netlify

```bash
# 1. 登录 Netlify
netlify login

# 2. 部署
netlify deploy --prod --dir=dist
```

### 选项 3: GitHub Pages

```bash
# 运行自动部署脚本
./deploy-gh-pages.sh
```

### 选项 4: Surge.sh (无需注册)

```bash
# 1. 安装 Surge
npm install -g surge

# 2. 部署
surge dist spelling-cards.surge.sh
```

---

## 🔧 手动部署

### 上传到任何静态托管服务

`dist/` 文件夹包含所有静态文件：
- `index.html` - 入口文件
- `assets/` - CSS 和 JS 文件

支持的服务：
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting
- 阿里云 OSS
- 腾讯云 COS

---

## ✅ 部署前检查清单

- [x] 构建成功
- [x] Supabase Edge Functions 已部署
- [x] 数据库表已创建
- [x] Storage bucket 已创建
- [x] 环境变量已配置 (.env)

---

## 🌐 Supabase 配置确认

```
Project ID: prfdoxcixwpvlbgqydfq
API URL: https://prfdoxcixwpvlbgqydfq.supabase.co
Dashboard: https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq
```

---

## 🎉 部署后验证

1. 打开部署的网址
2. 上传一张听写图片测试
3. 检查是否能正确识别和生成卡片
4. 测试语音播放功能

---

**本地预览地址: http://localhost:8889**
