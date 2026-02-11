#!/bin/bash
# 🚀 部署到 GitHub Pages

set -e

echo "🚀 部署单词听写助手到 GitHub Pages"
echo "=================================="
echo ""

# 检查是否在 git 仓库
cd /Users/codebody/.openclaw/workspace/spelling-cards

# 创建 gh-pages 分支（如果不存在）
if ! git branch | grep -q "gh-pages"; then
    echo "📦 创建 gh-pages 分支..."
    git checkout --orphan gh-pages
else
    echo "📦 切换到 gh-pages 分支..."
    git checkout gh-pages
fi

# 复制 dist 内容到根目录
echo "📁 复制构建文件..."
cp -r dist/* .

# 添加 .nojekyll 文件（防止 GitHub Pages 使用 Jekyll）
touch .nojekyll

# 提交
echo "💾 提交更改..."
git add -A
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"

# 推送
echo "☁️ 推送到 GitHub..."
git push origin gh-pages --force

echo ""
echo "=================================="
echo "🎉 部署完成！"
echo "=================================="
echo ""
echo "访问地址:"
echo "  https://codebody.github.io/spelling-cards"
echo ""
echo "注意: 首次部署可能需要几分钟生效"
