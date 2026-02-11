#!/bin/bash
# 🚀 一键部署脚本 - 在终端运行

echo "🚀 单词听写助手 - Supabase 部署脚本"
echo "=================================="
echo ""

# 1. 登录 Supabase
echo "步骤 1: 登录 Supabase"
echo "运行: supabase login"
echo "会打开浏览器，请授权登录"
echo ""

# 2. 列出项目
echo "步骤 2: 列出你的项目"
echo "运行: supabase projects list"
echo ""

# 3. 链接项目
echo "步骤 3: 链接项目"
echo "运行: supabase link --project-ref YOUR_PROJECT_ID"
echo ""

# 4. 设置环境变量
echo "步骤 4: 设置 Google API Key"
echo "运行: supabase secrets set GOOGLE_API_KEY=你的API密钥"
echo ""

# 5. 部署 Functions
echo "步骤 5: 部署 Edge Functions"
echo "运行:"
echo "  supabase functions deploy extract-spelling"
echo "  supabase functions deploy generate-image"
echo "  supabase functions deploy enrich-word"
echo ""

# 6. 数据库初始化
echo "步骤 6: 初始化数据库"
echo "在 Dashboard SQL Editor 执行:"
cat supabase/schema.sql
echo ""

echo "=================================="
echo "快捷命令（复制粘贴）:"
echo ""
echo "cd $(pwd)"
echo "supabase login"
echo "supabase projects list"
