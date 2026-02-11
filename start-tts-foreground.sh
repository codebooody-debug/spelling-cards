#!/bin/bash
# 前台运行所有 TTS 服务（更稳定）

echo "🎙️ 启动 TTS 服务..."
echo ""

# 启动 Google Cloud TTS (后台)
cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy
node server-google.js &
echo "Google Cloud TTS 启动中..."

# 启动 MiniMax TTS (后台)
node server-simple.js &
echo "MiniMax TTS 启动中..."

echo ""
echo "✅ 所有服务已启动"
echo "按 Ctrl+C 停止所有服务"

# 等待所有后台进程
wait
