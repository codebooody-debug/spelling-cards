# 🚀 Supabase 部署 - 最终解决方案

## 当前状态

✅ **已完成：**
- GitHub 仓库已更新 (commit: 900f6f3)
- 3 个 Edge Functions 代码已准备
- Project ID: `prfdoxcixwpvlbgqydfq`

❌ **需要完成：**
- Supabase CLI 登录认证
- Edge Functions 部署到云端
- 数据库初始化

---

## 🎯 方案一：手动获取 Token（推荐，2分钟）

### 步骤 1：创建 Access Token
1. 打开：https://supabase.com/dashboard/account/tokens
2. 点击 **"New Token"**
3. 命名：`cli-deploy`
4. 点击 **"Generate Token"**
5. 复制 Token（格式如：`sbp_xxxxxxxx...`）

### 步骤 2：运行自动部署脚本
```bash
cd /Users/codebody/.openclaw/workspace/spelling-cards
./deploy-auto.sh
# 按提示粘贴 Token
```

---

## 🎯 方案二：手动通过 Dashboard 部署

### 步骤 1：部署 Edge Functions
1. 打开：https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/functions
2. 点击 **"Deploy a new function"**
3. 依次部署以下函数：

**Function 1: extract-spelling**
- 名称：`extract-spelling`
- 复制 `supabase/functions/extract-spelling/index.ts` 内容

**Function 2: generate-image**
- 名称：`generate-image`
- 复制 `supabase/functions/generate-image/index.ts` 内容

**Function 3: enrich-word**
- 名称：`enrich-word`
- 复制 `supabase/functions/enrich-word/index.ts` 内容

### 步骤 2：设置环境变量
1. 打开：https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/settings/functions
2. 添加环境变量：
   - 名称：`GOOGLE_API_KEY`
   - 值：`AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4`

### 步骤 3：初始化数据库
1. 打开：https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/sql/new
2. 复制 `supabase/schema.sql` 全部内容
3. 粘贴并点击 **"Run"**

### 步骤 4：创建 Storage Bucket
1. 打开：https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/storage/buckets
2. 点击 **"New Bucket"**
3. 名称：`spelling-images`
4. 勾选 **"Public bucket"**
5. 点击 **"Save"**

---

## 🎯 方案三：使用 GitHub Actions 自动部署

已创建 `.github/workflows/deploy.yml`，推送代码后自动部署。

需要设置 GitHub Secrets：
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`: `prfdoxcixwpvlbgqydfq`

---

## 📝 部署后配置

### 获取前端环境变量
1. 打开：https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/settings/api
2. 复制 **Project URL** 和 **anon public** key
3. 填入 `.env` 文件：

```env
VITE_SUPABASE_URL=https://prfdoxcixwpvlbgqydfq.supabase.co
VITE_SUPABASE_ANON_KEY=你的_anon_key
```

### 构建前端
```bash
cd /Users/codebody/.openclaw/workspace/spelling-cards
npm run build
```

### 部署前端
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- Supabase Hosting: `supabase hosting publish`

---

## ✅ 验证部署

部署完成后，访问以下链接验证：

- Dashboard: https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq
- Edge Functions: https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq/functions
- API 文档: https://prfdoxcixwpvlbgqydfq.supabase.co/functions/v1/extract-spelling

---

## 🆘 遇到问题？

### Edge Functions 部署失败
检查 GOOGLE_API_KEY 是否已正确设置

### 数据库连接失败
确保 SQL 已正确执行，且 RLS 策略已启用

### 前端无法连接
检查 `.env` 文件中的 URL 和 KEY 是否正确

---

**推荐：使用方案一，最快最方便！**
