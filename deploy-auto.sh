#!/bin/bash
# 🚀 Supabase 完全自动化部署脚本
# Project ID: prfdoxcixwpvlbgqydfq

set -e

PROJECT_ID="prfdoxcixwpvlbgqydfq"
PROJECT_URL="https://$PROJECT_ID.supabase.co"
DASHBOARD_URL="https://supabase.com/dashboard/project/$PROJECT_ID"

echo "=========================================="
echo "🚀 单词听写助手 - Supabase 部署"
echo "Project ID: $PROJECT_ID"
echo "=========================================="
echo ""

# 检查 CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "安装: brew install supabase/tap/supabase"
    exit 1
fi

# 检查登录
echo "🔍 检查登录状态..."
if supabase projects list > /dev/null 2>&1; then
    echo "✅ 已登录"
else
    echo ""
    echo "⚠️  需要登录 Supabase"
    echo ""
    echo "请运行: supabase login"
    echo "或者设置环境变量:"
    echo "  export SUPABASE_ACCESS_TOKEN='你的token'"
    echo ""
    echo "获取 Token:"
    echo "  1. 打开: https://supabase.com/dashboard/account/tokens"
    echo "  2. 点击 'New Token'"
    echo "  3. 复制 Token"
    echo ""
    exit 1
fi

# 链接项目
echo ""
echo "🔗 链接到项目..."
supabase link --project-ref $PROJECT_ID

# 设置环境变量
echo ""
echo "🔑 设置 Edge Functions 密钥..."
GOOGLE_KEY="AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4"
supabase secrets set GOOGLE_API_KEY="$GOOGLE_KEY"
echo "✅ GOOGLE_API_KEY 已设置"

# 部署 Functions
echo ""
echo "📦 部署 Edge Functions..."
echo ""

echo "⏳ 部署 extract-spelling..."
supabase functions deploy extract-spelling
echo "✅ extract-spelling 部署完成"
echo ""

echo "⏳ 部署 generate-image..."
supabase functions deploy generate-image
echo "✅ generate-image 部署完成"
echo ""

echo "⏳ 部署 enrich-word..."
supabase functions deploy enrich-word
echo "✅ enrich-word 部署完成"
echo ""

# 获取项目信息
echo ""
echo "📋 项目信息:"
echo "  Project ID: $PROJECT_ID"
echo "  Dashboard: $DASHBOARD_URL"
echo "  API URL: $PROJECT_URL"
echo ""

# 创建前端环境变量
echo "📝 创建前端环境变量文件..."
cat > .env << EOF
# Supabase 配置
VITE_SUPABASE_URL=$PROJECT_URL
VITE_SUPABASE_ANON_KEY=你的_anon_key

# 获取 ANON_KEY:
# 1. 打开: $DASHBOARD_URL/settings/api
# 2. 复制 Project API keys 下的 anon public
EOF

echo "✅ .env 文件已创建"
echo ""

echo "=========================================="
echo "🎉 Edge Functions 部署完成!"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 获取 ANON_KEY:"
echo "   $DASHBOARD_URL/settings/api"
echo ""
echo "2. 执行数据库初始化 SQL:"
echo "   $DASHBOARD_URL/sql/new"
echo "   (复制 supabase/schema.sql 内容执行)"
echo ""
echo "3. 构建前端:"
echo "   npm run build"
echo ""
echo "4. 部署到 Vercel/Netlify 或 Supabase Hosting"
echo ""
