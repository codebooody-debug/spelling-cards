# MiniMax TTS 代理服务器

## 配置文件

创建 `.env` 文件：

```
MINIMAX_API_KEY=你的_API_Key
MINIMAX_GROUP_ID=你的_Group_ID（如果有）
PORT=3001
```

## 启动代理

```bash
npm install
node server.js
```

代理地址：`http://localhost:3001/api/tts`