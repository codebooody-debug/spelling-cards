const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 读取 API Key
let MINIMAX_API_KEY = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const match = envContent.match(/MINIMAX_API_KEY=(.+)/);
  if (match) MINIMAX_API_KEY = match[1].trim();
} catch (e) {
  console.log('Warning: Cannot read .env file');
}

const PORT = 3001;

// 静态文件
app.use(express.static(path.join(__dirname, '../dist')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tts_configured: !!MINIMAX_API_KEY });
});

// TTS API
app.post('/api/tts', async (req, res) => {
  if (!MINIMAX_API_KEY) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  const { text, voice_id = 'male-qn-qingse', speed = 0.8 } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const response = await fetch('https://api.minimaxi.chat/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'speech-01-turbo',
        text: text,
        voice_setting: { voice_id, speed, vol: 1.0 },
        audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3' }
      })
    });

    const data = await response.json();
    
    if (data.base_resp?.status_code !== 0) {
      return res.status(400).json({
        success: false,
        error: data.base_resp?.status_msg || 'API Error'
      });
    }
    
    if (data.data?.audio) {
      const buffer = Buffer.from(data.data.audio, 'hex');
      const base64Audio = buffer.toString('base64');
      
      console.log(`🎙️ TTS: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      
      return res.json({
        success: true,
        audio_base64: base64Audio,
        format: 'mp3',
        extra_info: data.extra_info
      });
    }
    
    res.status(400).json({ success: false, error: 'No audio data' });
    
  } catch (error) {
    console.error('TTS Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${MINIMAX_API_KEY ? 'Configured' : 'Not found'}`);
});
