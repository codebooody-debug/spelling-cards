#!/bin/bash
# 手动设置 token 并部署

echo "请输入 Supabase Access Token (从 https://supabase.com/dashboard/account/tokens 创建):"
read -s TOKEN

export SUPABASE_ACCESS_TOKEN="$TOKEN"

echo ""
echo "✅ Token 已设置"
echo ""
echo "🚀 开始部署..."
echo ""

# 链接项目
echo "🔗 链接到项目 prfdoxcixwpvlbgqydfq..."
supabase link --project-ref prfdoxcixwpvlbgqydfq

# 设置环境变量
echo ""
echo "🔑 设置 GOOGLE_API_KEY..."
supabase secrets set GOOGLE_API_KEY="AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4"

# 部署 Functions
echo ""
echo "📦 部署 Edge Functions..."
supabase functions deploy extract-spelling
echo "✅ extract-spelling"

supabase functions deploy generate-image
echo "✅ generate-image"

supabase functions deploy enrich-word
echo "✅ enrich-word"

echo ""
echo "🎉 部署完成!"
echo "Dashboard: https://supabase.com/dashboard/project/prfdoxcixwpvlbgqydfq"
