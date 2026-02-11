#!/bin/bash
# 稳定启动 TTS 服务 - 保持前台运行

cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy

echo "🚀 启动 TTS 服务..."
echo "按 Ctrl+C 停止"
echo ""

# 同时启动两个服务，保持运行
echo "启动 Google Cloud TTS (port 3002)..."
node server-google.js &
GOOGLE_PID=$!

sleep 2

echo "启动 MiniMax TTS (port 3001)..."
node server-simple.js &
MINIMAX_PID=$!

echo ""
echo "✅ 服务已启动:"
echo "  Google Cloud: PID $GOOGLE_PID"
echo "  MiniMax: PID $MINIMAX_PID"
echo ""

# 等待用户输入来保持脚本运行
echo "服务正在运行，不要关闭此窗口！"
echo "按 Enter 停止服务..."
read

# 停止服务
kill $GOOGLE_PID $MINIMAX_PID 2>/dev/null
echo "服务已停止"
