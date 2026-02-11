#!/bin/bash
# Spelling Cards 启动脚本 - 稳定版

set -e  # 遇到错误停止

echo "🎓 Spelling Cards 启动脚本"
echo "=========================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

WEB_PORT=8888
TTS_PORT=3001
WEB_LOG="/tmp/web.log"
TTS_LOG="/tmp/tts.log"

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在清理..."
    lsof -ti:$WEB_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:$TTS_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
}

# 捕获中断信号
trap cleanup EXIT INT TERM

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 被占用，正在清理...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 等待服务就绪
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "⏳ 等待 $name 启动"
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        echo -n "."
        sleep 0.5
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}❌ 超时${NC}"
    return 1
}

# 启动网站服务
start_web() {
    echo "🌐 启动网站服务..."
    check_port $WEB_PORT
    
    cd /Users/codebody/.openclaw/workspace/spelling-cards/dist
    nohup python3 -m http.server $WEB_PORT > $WEB_LOG 2>&1 &
    WEB_PID=$!
    echo "   PID: $WEB_PID"
    
    if wait_for_service $WEB_PORT "网站"; then
        echo -e "   ${GREEN}✅ 网站已就绪${NC}"
        echo "   访问: http://localhost:$WEB_PORT"
        return 0
    else
        echo -e "   ${RED}❌ 网站启动失败${NC}"
        return 1
    fi
}

# 启动 TTS 服务
start_tts() {
    echo ""
    echo "🎙️  启动 MiniMax TTS 服务..."
    check_port $TTS_PORT
    
    cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy
    nohup node server-simple.js > $TTS_LOG 2>&1 &
    TTS_PID=$!
    echo "   PID: $TTS_PID"
    
    if wait_for_service $TTS_PORT "TTS"; then
        # 测试 TTS API
        if curl -s -X POST http://localhost:$TTS_PORT/api/tts \
            -H "Content-Type: application/json" \
            -d '{"text":"test","voice_id":"male-qn-qingse","speed":0.8}' \
            -o /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ MiniMax AI 语音已就绪${NC}"
            return 0
        fi
    fi
    
    echo -e "   ${YELLOW}⚠️  TTS 启动失败，将使用浏览器语音${NC}"
    return 1
}

# 显示最终状态
show_status() {
    echo ""
    echo "=========================="
    echo "📊 服务状态"
    echo "=========================="
    echo ""
    
    # 网站状态
    if curl -s http://localhost:$WEB_PORT >/dev/null 2>&1; then
        echo -e "🌐 网站: ${GREEN}运行中${NC} (http://localhost:$WEB_PORT)"
    else
        echo -e "🌐 网站: ${RED}已停止${NC}"
    fi
    
    # TTS 状态
    if curl -s http://localhost:$TTS_PORT/api/health >/dev/null 2>&1; then
        echo -e "🎙️  TTS: ${GREEN}运行中${NC} (MiniMax AI 语音)"
    else
        echo -e "🎙️  TTS: ${YELLOW}已停止${NC} (将使用浏览器语音)"
    fi
    
    echo ""
    echo "📖 使用说明:"
    echo "   • 绿色点 = MiniMax AI 语音 (高质量)"
    echo "   • 黄色点 = 浏览器语音 (备用)"
    echo ""
    echo "🛑 停止服务: lsof -ti:$WEB_PORT,$TTS_PORT | xargs kill -9"
    echo ""
}

# 主程序
main() {
    # 启动网站 (必须)
    if ! start_web; then
        echo -e "${RED}❌ 网站启动失败，退出${NC}"
        exit 1
    fi
    
    # 启动 TTS (可选)
    start_tts || true  # TTS 失败不退出
    
    # 显示状态
    show_status
    
    # 打开浏览器
    echo "🚀 正在打开浏览器..."
    open http://localhost:$WEB_PORT
    
    echo ""
    echo -e "${GREEN}✅ 启动完成！${NC}"
    echo ""
}

# 运行主程序
main
