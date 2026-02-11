#!/bin/bash

WEB_PORT=8888
TTS_PORT=3001
WEB_LOG="/tmp/web.log"
TTS_LOG="/tmp/tts.log"

check_status() {
    echo "=== 服务状态 ==="
    echo ""
    
    # 检查网站
    if curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
        echo "🌐 网站 (端口 $WEB_PORT): ✅ 运行中"
        echo "   访问: http://localhost:$WEB_PORT"
    else
        echo "🌐 网站 (端口 $WEB_PORT): ❌ 已停止"
    fi
    
    # 检查 TTS
    if curl -s http://localhost:$TTS_PORT/api/health > /dev/null 2>&1; then
        echo "🎙️  TTS (端口 $TTS_PORT): ✅ 运行中"
        echo "   MiniMax AI 语音可用"
    else
        echo "🎙️  TTS (端口 $TTS_PORT): ❌ 已停止"
        echo "   将使用浏览器语音"
    fi
    
    echo ""
}

start_services() {
    echo "🚀 启动服务..."
    
    # 启动网站
    if ! curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
        cd /Users/codebody/.openclaw/workspace/spelling-cards/dist
        nohup python3 -m http.server $WEB_PORT > $WEB_LOG 2>&1 &
        echo "🌐 网站启动 (PID: $!)"
    else
        echo "🌐 网站已在运行"
    fi
    
    # 启动 TTS
    if ! curl -s http://localhost:$TTS_PORT/api/health > /dev/null 2>&1; then
        cd /Users/codebody/.openclaw/workspace/spelling-cards/proxy
        nohup node server-simple.js > $TTS_LOG 2>&1 &
        echo "🎙️  TTS 启动 (PID: $!)"
    else
        echo "🎙️  TTS 已在运行"
    fi
    
    sleep 2
    check_status
    
    # 自动打开浏览器
    open http://localhost:$WEB_PORT
}

stop_services() {
    echo "🛑 停止服务..."
    
    # 查找并停止进程
    lsof -ti:$WEB_PORT 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:$TTS_PORT 2>/dev/null | xargs kill -9 2>/dev/null
    
    echo "✅ 服务已停止"
}

restart_services() {
    echo "🔄 重启服务..."
    stop_services
    sleep 1
    start_services
}

view_logs() {
    echo "=== 最近日志 ==="
    echo ""
    echo "🌐 网站日志:"
    tail -5 $WEB_LOG 2>/dev/null || echo "无日志"
    echo ""
    echo "🎙️  TTS 日志:"
    tail -5 $TTS_LOG 2>/dev/null || echo "无日志"
}

# 主菜单
case "${1:-status}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "命令:"
        echo "  start   - 启动服务"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo "  status  - 查看状态 (默认)"
        echo "  logs    - 查看日志"
        echo ""
        check_status
        ;;
esac
