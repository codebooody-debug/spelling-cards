const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002; // 使用新端口，避免和 MiniMax 冲突

// Google Cloud API Key
const GOOGLE_API_KEY = 'AIzaSyCc_oN4icJPqQ3c3-Wr8t0y4m8sS_euU6c';
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// 静态文件
app.use(express.static(path.join(__dirname, '../dist')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    provider: 'google-cloud',
    tts_configured: !!GOOGLE_API_KEY 
  });
});

// Google Cloud TTS API
app.post('/api/tts', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Google API Key not configured' });
  }

  const { text, voice_id = 'en-US-Wavenet-D', speed = 0.85 } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: text },
        voice: {
          languageCode: voice_id.substring(0, 5), // en-US
          name: voice_id // en-US-Wavenet-D
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speed,
          pitch: 0,
          volumeGainDb: 0
        }
      })
    });

    const data = await response.json();
    
    if (data.audioContent) {
      console.log(`🎙️ Google TTS: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      
      // 计算大致的音频信息
      const audioSize = Buffer.from(data.audioContent, 'base64').length;
      const estimatedDuration = audioSize / 2000; // 粗略估算
      
      return res.json({
        success: true,
        audio_base64: data.audioContent,
        format: 'mp3',
        extra_info: {
          usage_characters: text.length,
          audio_length: Math.round(estimatedDuration * 1000),
          audio_size: audioSize,
          provider: 'google-cloud',
          voice: voice_id
        }
      });
    }
    
    if (data.error) {
      console.error('Google TTS Error:', data.error);
      return res.status(400).json({ 
        success: false, 
        error: data.error.message || 'Google API Error' 
      });
    }
    
    res.status(400).json({ success: false, error: 'No audio content received' });
    
  } catch (error) {
    console.error('TTS Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 可用声音列表
app.get('/api/voices', (req, res) => {
  res.json({
    voices: [
      { id: 'en-US-Wavenet-D', name: '美国男声 (WaveNet)', gender: 'MALE' },
      { id: 'en-US-Wavenet-C', name: '美国女声 (WaveNet)', gender: 'FEMALE' },
      { id: 'en-GB-Wavenet-B', name: '英国男声 (WaveNet)', gender: 'MALE' },
      { id: 'en-GB-Wavenet-A', name: '英国女声 (WaveNet)', gender: 'FEMALE' },
      { id: 'en-US-Standard-B', name: '美国男声 (标准)', gender: 'MALE' },
      { id: 'en-US-Standard-C', name: '美国女声 (标准)', gender: 'FEMALE' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Google Cloud TTS Server running on http://localhost:${PORT}`);
  console.log(`🔑 Provider: Google Cloud Text-to-Speech`);
  console.log(`🎙️ Voice: WaveNet (高质量)`);
});
