const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 提供静态文件
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

// TTS 代理接口 - 修正版 (MiniMax API v2)
app.post('/api/tts', async (req, res) => {
  if (!MINIMAX_API_KEY) {
    return res.status(500).json({ 
      error: 'MINIMAX_API_KEY not configured',
      message: '请在 .env 文件中设置 MINIMAX_API_KEY'
    });
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
        voice_setting: {
          voice_id: voice_id,
          speed: speed,
          vol: 1.0
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3'
        }
      })
    });

    const data = await response.json();
    
    // 检查 API 返回状态
    if (data.base_resp?.status_code !== 0) {
      return res.status(400).json({
        success: false,
        error: data.base_resp?.status_msg || 'API Error',
        code: data.base_resp?.status_code
      });
    }
    
    // 处理音频数据
    if (data.data?.audio) {
      // MiniMax 返回的是十六进制字符串，需要转换为 base64
      const hexString = data.data.audio;
      const buffer = Buffer.from(hexString, 'hex');
      const base64Audio = buffer.toString('base64');
      
      // 记录使用量
      const usage = data.extra_info || {};
      console.log(`🎙️ TTS 请求: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      console.log(`   📊 字符数: ${usage.usage_characters || 'N/A'} | 音频时长: ${usage.audio_length}ms | 文件大小: ${usage.audio_size} bytes`);
      
      return res.json({
        success: true,
        audio_base64: base64Audio,
        format: 'mp3',
        extra_info: data.extra_info
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'No audio data received'
    });
    
  } catch (error) {
    console.error('TTS Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    tts_configured: !!MINIMAX_API_KEY,
    ocr_configured: !!process.env.GOOGLE_API_KEY
  });
});

// Gemini OCR 路由
const { extractSpellingFromImage } = require('./gemini-ocr');

app.post('/api/extract-spelling', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ success: false, error: 'imageData is required' });
    }
    
    const result = await extractSpellingFromImage(imageData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gemini 图片生成路由
const { generateImage } = require('./gemini-image');

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    
    console.log('🎨 图片生成请求:', prompt.substring(0, 50));
    const result = await generateImage(prompt, { width, height });
    res.json(result);
  } catch (error) {
    console.error('❌ Image Generation Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gemini 单词信息丰富路由
const { enrichWord } = require('./gemini-enrich');

app.post('/api/enrich-word', async (req, res) => {
  try {
    const { word, sentence, grade = 'P3' } = req.body;
    
    if (!word || !sentence) {
      return res.status(400).json({ 
        success: false, 
        error: 'word and sentence are required' 
      });
    }
    
    console.log('📚 单词信息丰富请求:', word);
    const result = await enrichWord(word, sentence, grade);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Word Enrichment Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    tts_configured: !!MINIMAX_API_KEY,
    ocr_configured: !!process.env.GOOGLE_API_KEY,
    image_generation_configured: !!process.env.GOOGLE_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 代理服务器运行中: http://localhost:${PORT}`);
  console.log(`📋 可用服务:`);
  console.log(`   🎙️ TTS (MiniMax): ${MINIMAX_API_KEY ? '✅' : '❌'}`);
  console.log(`   🔍 OCR (Gemini): ${process.env.GOOGLE_API_KEY ? '✅' : '❌'}`);
  console.log(`   🎨 Image Gen (Gemini 2.5 Flash): ${process.env.GOOGLE_API_KEY ? '✅' : '❌'}`);
  console.log(`🎨 打开 http://localhost:${PORT} 查看应用`);
});
