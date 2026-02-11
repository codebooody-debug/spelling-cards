#!/bin/bash
# 🚀 推送代码到 GitHub

echo "🚀 准备推送代码到 GitHub"
echo "========================"
echo ""
echo "仓库地址: https://github.com/codebooody-debug/spelling-cards"
echo ""

# 确认 remote URL
cd /Users/codebody/.openclaw/workspace/spelling-cards
git remote -v

echo ""
echo "推送命令:"
echo "  git push -u origin main"
echo ""
echo "如果提示输入用户名密码:"
echo "  用户名: codebooody-debug"
echo "  密码: 使用 GitHub Personal Access Token"
echo ""
echo "或者使用 GitHub CLI 登录:"
echo "  gh auth login"
echo ""
