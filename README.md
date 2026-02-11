# 📚 Spelling Cards 使用说明

## 🌐 网站访问
**地址**: http://localhost:8888

网站**已永久运行**，随时可访问。

---

## 🎙️ 语音功能

### 状态指示（卡片右上角）
- 🟢 **绿色** = MiniMax AI 语音（高质量）
- 🟡 **黄色** = 浏览器语音（备用）
- ⚪ **灰色** = 检测中

### 启动 MiniMax TTS（可选）
如果需要 AI 语音，打开**新终端**运行：

```bash
cd /Users/codebody/.openclaw/workspace/spelling-cards
./start-tts.sh
```

保持终端打开，TTS 服务会持续运行。

---

## 🛠️ 管理命令

### 查看状态
```bash
cd /Users/codebody/.openclaw/workspace/spelling-cards
./manage.sh status
```

### 重启网站
```bash
./manage.sh restart
```

### 查看日志
```bash
./manage.sh logs
```

---

## 📁 文件位置

- 网站内容：`/Users/codebody/.openclaw/workspace/spelling-cards/dist/`
- 单词数据：`src/data/spelling-data.json`
- 管理脚本：`manage.sh`

---

**当前状态**: 网站运行中，TTS 按需启动
