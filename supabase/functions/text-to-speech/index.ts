// Edge Function: text-to-speech
// 使用Google Cloud TTS或MiniMax API生成高质量语音

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice = 'en-US-Neural2-D', speed = 1.0 } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: '缺少text参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取API密钥
    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
    const MINIMAX_API_KEY = Deno.env.get('MINIMAX_API_KEY');

    let audioContent = null;

    // 优先使用Google Cloud TTS
    if (GOOGLE_TTS_API_KEY) {
      console.log('[TTS] 使用Google Cloud TTS');
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: 'en-US',
              name: voice,
              ssmlGender: 'NEUTRAL'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: speed,
              pitch: 0
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        audioContent = data.audioContent;
      } else {
        console.error('[TTS] Google TTS失败:', await response.text());
      }
    }

    // 如果Google失败或没有API key，尝试MiniMax
    if (!audioContent && MINIMAX_API_KEY) {
      console.log('[TTS] 使用MiniMax TTS');
      
      const response = await fetch('https://api.minimax.chat/v1/t2a_pro', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'speech-01-turbo',
          text: text,
          voice_id: 'male-qn-qingse',
          speed: speed,
          vol: 1.0,
          pitch: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.base_resp?.status_code === 0 && data.audio_hex) {
          // MiniMax返回hex格式，需要转换
          audioContent = hexToBase64(data.audio_hex);
        }
      } else {
        console.error('[TTS] MiniMax TTS失败:', await response.text());
      }
    }

    if (!audioContent) {
      return new Response(
        JSON.stringify({ error: '语音合成失败，请检查API配置' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        audio: audioContent,
        engine: GOOGLE_TTS_API_KEY ? 'google' : 'minimax'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TTS] 错误:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 辅助函数：hex转base64
function hexToBase64(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return btoa(String.fromCharCode(...bytes));
}