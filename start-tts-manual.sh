#!/bin/bash
# 启动 TTS 服务（需要保持此窗口打开）

cd "$(dirname "$0")/proxy"

echo "═══════════════════════════════════════════"
echo "  启动 TTS 服务"
echo "═══════════════════════════════════════════"
echo ""

# 检查并清理旧进程
echo "🧹 检查现有进程..."
pkill -f "server-google.js" 2>/dev/null
pkill -f "server-simple.js" 2>/dev/null
sleep 1

# 启动服务
echo "🚀 启动 Google Cloud TTS (port 3002)..."
node server-google.js &
GOOGLE_PID=$!

sleep 2

echo "🚀 启动 MiniMax TTS (port 3001)..."
node server-simple.js &
MINIMAX_PID=$!

sleep 2

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ 服务已启动"
echo "═══════════════════════════════════════════"
echo ""
echo "  Google Cloud: http://localhost:3002"
echo "  MiniMax:      http://localhost:3001"
echo ""
echo "  进程 PID: $GOOGLE_PID, $MINIMAX_PID"
echo ""
echo "⚠️  重要：不要关闭此窗口！"
echo "   关闭此窗口会导致 TTS 服务停止"
echo ""
echo "按 Enter 键停止服务..."
read

# 停止服务
echo "正在停止服务..."
kill $GOOGLE_PID $MINIMAX_PID 2>/dev/null
pkill -f "server-google.js" 2>/dev/null
pkill -f "server-simple.js" 2>/dev/null
echo "服务已停止"
