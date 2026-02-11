#!/bin/bash

echo "🎓 Spelling Cards + MiniMax TTS 启动脚本"
echo "=========================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 spelling-cards 目录下运行此脚本"
    exit 1
fi

# 启动代理服务器
echo ""
echo "🔧 启动 MiniMax TTS 代理服务器..."
cd proxy
if [ ! -d "node_modules" ]; then
    echo "📦 安装代理服务器依赖..."
    npm install
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️ 警告: proxy/.env 文件不存在，请创建并配置 MINIMAX_API_KEY"
    exit 1
fi

# 后台启动代理服务器
node server.js &
PROXY_PID=$!
echo "✅ 代理服务器已启动 (PID: $PROXY_PID)"

# 等待代理服务器启动
sleep 2

# 返回上级目录
cd ..

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端开发服务器
echo ""
echo "🚀 启动前端开发服务器..."
echo ""
npm run dev

# 当前端服务器停止时，也停止代理服务器
echo ""
echo "🛑 停止代理服务器..."
kill $PROXY_PID 2>/dev/null

echo "👋 已退出"
