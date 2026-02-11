#!/bin/bash
# 检查并自动重启 TTS 服务

echo "🔍 检查 TTS 服务状态..."

# 检查 Google Cloud
if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "🔄 Google Cloud TTS 已停止，正在重启..."
    cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy && nohup node server-google.js > /tmp/google-tts.log 2>&1 &
    sleep 2
    if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
        echo "✅ Google Cloud TTS 重启成功"
    else
        echo "❌ Google Cloud TTS 重启失败"
    fi
else
    echo "✅ Google Cloud TTS 运行正常"
fi

# 检查 MiniMax
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "🔄 MiniMax TTS 已停止，正在重启..."
    cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy && nohup node server-simple.js > /tmp/minimax.log 2>&1 &
    sleep 2
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ MiniMax TTS 重启成功"
    else
        echo "❌ MiniMax TTS 重启失败"
    fi
else
    echo "✅ MiniMax TTS 运行正常"
fi

echo ""
echo "✨ 检查完成！"
