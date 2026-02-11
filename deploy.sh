#!/bin/bash
# 🚀 Supabase 部署脚本
# 运行前请确保：
# 1. 已安装 Supabase CLI: brew install supabase/tap/supabase
# 2. 已登录: supabase login
# 3. 已创建项目并有 Project ID

set -e

echo "🚀 开始部署单词听写助手到 Supabase..."

# 检查 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "请运行: brew install supabase/tap/supabase"
    exit 1
fi

# 检查登录状态
echo "🔍 检查登录状态..."
if ! supabase projects list &> /dev/null; then
    echo "❌ 未登录 Supabase"
    echo "请运行: supabase login"
    exit 1
fi

# 列出项目
echo "📋 你的 Supabase 项目:"
supabase projects list

echo ""
echo "⚠️  请从上面选择你的 Project ID (格式: xxxxxxxxxxxxxxxxxxxx)"
echo "如果没有项目，请先在 https://supabase.com/dashboard 创建"
echo ""
read -p "输入 Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID 不能为空"
    exit 1
fi

# 链接项目
echo "🔗 链接到项目: $PROJECT_ID"
supabase link --project-ref "$PROJECT_ID"

# 设置 Edge Functions 密钥
echo ""
echo "🔑 设置 Edge Functions 环境变量"
echo "需要设置 GOOGLE_API_KEY 用于 Gemini API"
read -p "输入你的 Google AI Studio API Key: " GOOGLE_KEY

if [ -n "$GOOGLE_KEY" ]; then
    supabase secrets set GOOGLE_API_KEY="$GOOGLE_KEY"
    echo "✅ GOOGLE_API_KEY 已设置"
else
    echo "⚠️  未设置 GOOGLE_API_KEY，Edge Functions 将无法工作"
fi

# 部署 Edge Functions
echo ""
echo "📦 部署 Edge Functions..."
supabase functions deploy extract-spelling
echo "✅ extract-spelling 部署完成"

supabase functions deploy generate-image
echo "✅ generate-image 部署完成"

supabase functions deploy enrich-word
echo "✅ enrich-word 部署完成"

# 初始化数据库
echo ""
echo "🗄️  初始化数据库..."
echo "请在 Supabase Dashboard 的 SQL Editor 中执行 supabase/schema.sql 文件"
echo "SQL Editor URL: https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"

# 获取项目 URL
echo ""
echo "📋 项目信息:"
echo "Project ID: $PROJECT_ID"
echo "Project URL: https://$PROJECT_ID.supabase.co"
echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"

# 创建 .env 文件
echo ""
echo "📝 创建前端环境变量文件..."
cat > .env << EOF
VITE_SUPABASE_URL=https://$PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的_anon_key
EOF

echo "✅ .env 文件已创建"
echo "⚠️  请从 Dashboard -> Project Settings -> API 获取 ANON_KEY 并填入 .env 文件"

echo ""
echo "🎉 部署完成！"
echo ""
echo "下一步:"
echo "1. 在 Dashboard 中获取 ANON_KEY 并填入 .env"
echo "2. 执行数据库初始化 SQL"
echo "3. 运行 npm run build 构建前端"
echo "4. 部署前端到 Vercel/Netlify 或 Supabase Hosting"
