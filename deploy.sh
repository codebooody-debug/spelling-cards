#!/bin/bash
# GitHub 部署辅助脚本

echo "🚀 开始部署到 GitHub..."

# 1. 初始化 Git（如果还没做）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit: Spelling Cards with Supabase"

# 4. 创建 GitHub 仓库（你需要先手动在 github.com 创建空仓库）
echo ""
echo "⚠️  请先在 https://github.com/new 创建仓库"
echo "   仓库名：spelling-cards"
echo "   选择 Public"
echo "   不要勾选 README"
echo ""
read -p "创建好后，输入你的 GitHub 用户名: " username

# 5. 关联远程仓库
git remote add origin https://github.com/$username/spelling-cards.git

# 6. 推送代码
git branch -M main
git push -u origin main

echo ""
echo "✅ 代码已推送到 GitHub！"
echo "   地址: https://github.com/$username/spelling-cards"
