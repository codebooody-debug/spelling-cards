#!/bin/bash
# TTS 服务启动脚本 - 独立运行

echo "🎙️ 启动 TTS 服务（独立进程）"
echo "=============================="

# 启动 Google Cloud TTS
echo ""
echo "1️⃣ 启动 Google Cloud TTS..."
cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy
if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
  nohup node server-google.js > /tmp/google-tts.log 2>&1 &
  echo "   PID: $!"
  sleep 2
  if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "   ✅ Google Cloud TTS 已启动 (端口 3002)"
  else
    echo "   ❌ Google Cloud TTS 启动失败"
  fi
else
  echo "   ✅ Google Cloud TTS 已在运行"
fi

# 启动 MiniMax TTS
echo ""
echo "2️⃣ 启动 MiniMax TTS..."
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
  nohup node server-simple.js > /tmp/minimax.log 2>&1 &
  echo "   PID: $!"
  sleep 2
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ MiniMax TTS 已启动 (端口 3001)"
  else
    echo "   ❌ MiniMax TTS 启动失败"
  fi
else
  echo "   ✅ MiniMax TTS 已在运行"
fi

echo ""
echo "=============================="
echo "服务状态:"
echo "  Google Cloud: http://localhost:3002"
echo "  MiniMax:      http://localhost:3001"
echo ""
echo "🛑 停止所有 TTS: pkill -f 'node server'"
