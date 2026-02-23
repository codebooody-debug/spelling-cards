// Edge Function: text-to-speech
// 使用Google Cloud TTS或MiniMax API生成高质量语音

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { text, voice = 'en-US-Neural2-D', speed = 1.0, engine = 'auto' } = body;

    console.log(`[TTS] 请求: engine=${engine}, text=${text?.substring(0, 20)}...`);

    if (!text) {
      return new Response(
        JSON.stringify({ error: '缺少text参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');
    const MINIMAX_API_KEY = Deno.env.get('MINIMAX_API_KEY');

    let audioContent = null;
    let usedEngine = '';
    let errors = [];

    // ========== Google TTS ==========
    if (engine === 'google' || (engine === 'auto' && GOOGLE_TTS_API_KEY)) {
      if (!GOOGLE_TTS_API_KEY) {
        errors.push('Google: API Key 未设置');
      } else {
        console.log('[TTS] 使用 Google Cloud TTS');
        try {
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
                  ssmlGender: 'MALE'
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
            usedEngine = 'google';
            console.log('[TTS] Google 成功');
          } else {
            const errorText = await response.text();
            errors.push(`Google: ${errorText}`);
            console.error('[TTS] Google 失败:', errorText);
          }
        } catch (e) {
          errors.push(`Google: ${e.message}`);
        }
      }
    }

    // ========== MiniMax TTS ==========
    if (!audioContent && (engine === 'minimax' || (engine === 'auto' && MINIMAX_API_KEY))) {
      if (!MINIMAX_API_KEY) {
        errors.push('MiniMax: API Key 未设置');
      } else {
        console.log('[TTS] 使用 MiniMax TTS');
        const minimaxVoices = ['male-qn-qingse', 'female-shaonv', 'male-yy-jingying', 'female-yy-jiajia'];
        const selectedVoice = minimaxVoices[text.length % minimaxVoices.length];
        
        try {
          const response = await fetch('https://api.minimax.chat/v1/t2a_pro', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MINIMAX_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'speech-01-turbo',
              text: text,
              voice_id: selectedVoice,
              speed: speed,
              vol: 1.0,
              pitch: 0
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.base_resp?.status_code === 0 && data.audio_hex) {
              audioContent = hexToBase64(data.audio_hex);
              usedEngine = 'minimax';
              console.log('[TTS] MiniMax 成功');
            } else {
              errors.push(`MiniMax: ${data.base_resp?.status_msg || 'API错误'}`);
            }
          } else {
            errors.push(`MiniMax HTTP ${response.status}`);
          }
        } catch (e) {
          errors.push(`MiniMax: ${e.message}`);
        }
      }
    }

    if (!audioContent) {
      return new Response(
        JSON.stringify({ error: '语音合成失败', details: errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, audio: audioContent, engine: usedEngine }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function hexToBase64(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return btoa(String.fromCharCode(...bytes));
}
