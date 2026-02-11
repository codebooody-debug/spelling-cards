#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
from pathlib import Path

PORT = 3001

# 读取 .env 文件
def load_env():
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key == 'MINIMAX_API_KEY':
                        return value.strip()
    return None

MINIMAX_API_KEY = os.getenv('MINIMAX_API_KEY') or load_env()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # 设置静态文件目录
        super().__init__(*args, directory=str(Path(__file__).parent / '../dist'), **kwargs)
    
    def log_message(self, format, *args):
        # 简化日志输出
        pass
    
    def do_GET(self):
        if self.path == '/api/health':
            self.send_json({'status': 'ok', 'tts_configured': bool(MINIMAX_API_KEY)})
            return
        super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/tts':
            self.handle_tts()
            return
        self.send_error(404)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def handle_tts(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            data = json.loads(body)
            
            text = data.get('text', '')
            voice_id = data.get('voice_id', 'male-qn-qingse')
            speed = data.get('speed', 0.8)
            
            # 调用 MiniMax API
            payload = json.dumps({
                'model': 'speech-01-turbo',
                'text': text,
                'voice_setting': {
                    'voice_id': voice_id,
                    'speed': speed,
                    'vol': 1.0
                },
                'audio_setting': {
                    'sample_rate': 32000,
                    'bitrate': 128000,
                    'format': 'mp3'
                }
            }).encode('utf-8')
            
            req = urllib.request.Request(
                'https://api.minimaxi.chat/v1/t2a_v2',
                data=payload,
                headers={
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': f'Bearer {MINIMAX_API_KEY}'
                }
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                # 读取原始字节并解码
                response_bytes = response.read()
                result = json.loads(response_bytes.decode('utf-8'))
                
                if result.get('base_resp', {}).get('status_code') == 0 and result.get('data', {}).get('audio'):
                    import base64
                    hex_audio = result['data']['audio']
                    audio_bytes = bytes.fromhex(hex_audio)
                    audio_base64 = base64.b64encode(audio_bytes).decode()
                    
                    print(f"🎙️ TTS: {text[:30]}...")
                    
                    self.send_json({
                        'success': True,
                        'audio_base64': audio_base64,
                        'format': 'mp3',
                        'extra_info': result.get('extra_info', {})
                    })
                else:
                    self.send_json({'success': False, 'error': 'API Error'}, 400)
                    
        except Exception as e:
            print(f"Error: {e}")
            self.send_json({'success': False, 'error': str(e)}, 500)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 MiniMax TTS + 静态文件服务器 running on http://localhost:{PORT}")
        print(f"🔑 API Key configured: {'Yes' if MINIMAX_API_KEY else 'No'}")
        httpd.serve_forever()
