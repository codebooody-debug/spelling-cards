#!/bin/bash
# 🚀 一键部署脚本 - 复制到终端运行

PROJECT_ID="prfdoxcixwpvlbgqydfq"

echo "🚀 单词听写助手 - Supabase 部署"
echo "Project ID: $PROJECT_ID"
echo ""

# 检查登录
echo "1️⃣ 检查 Supabase 登录状态..."
if ! supabase projects list > /dev/null 2>&1; then
    echo "   需要登录，正在打开浏览器..."
    supabase login
    echo "   请完成浏览器登录后，重新运行此脚本"
    exit 1
fi

echo "2️⃣ 链接到项目..."
supabase link --project-ref $PROJECT_ID

echo ""
echo "3️⃣ 设置环境变量..."
# 从 proxy/.env 读取 Google API Key
GOOGLE_KEY=$(grep "GOOGLE_API_KEY" proxy/.env | cut -d'=' -f2)
if [ -n "$GOOGLE_KEY" ]; then
    echo "   设置 GOOGLE_API_KEY..."
    supabase secrets set GOOGLE_API_KEY="$GOOGLE_KEY"
else
    echo "   ⚠️  未找到 GOOGLE_API_KEY，请手动设置:"
    echo "   supabase secrets set GOOGLE_API_KEY=你的密钥"
fi

echo ""
echo "4️⃣ 部署 Edge Functions..."
supabase functions deploy extract-spelling
supabase functions deploy generate-image
supabase functions deploy enrich-word

echo ""
echo "5️⃣ 获取项目信息..."
echo "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "   API URL: https://$PROJECT_ID.supabase.co"

echo ""
echo "6️⃣ 请在 Dashboard 中执行以下操作:"
echo "   a) 打开 SQL Editor: https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo "   b) 执行 supabase/schema.sql 中的 SQL"
echo "   c) 创建 Storage bucket 'spelling-images'"

echo ""
echo "7️⃣ 创建前端环境变量文件..."
cat > .env << EOF
VITE_SUPABASE_URL=https://$PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的_anon_key
EOF

echo ""
echo "✅ Edge Functions 部署完成!"
echo ""
echo "下一步:"
echo "- 从 Dashboard → Project Settings → API 获取 ANON_KEY 填入 .env"
echo "- 执行数据库初始化 SQL"
echo "- 运行 npm run build 构建前端"
