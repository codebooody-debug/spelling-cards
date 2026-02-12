// Supabase Edge Function: generate-image
// 为单词生成AI插图 - 使用 Gemini 2.5 Flash Image

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { prompt, width = 1024, height = 1024 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 生成图片:', prompt.substring(0, 50));

    // 使用 Gemini 2.5 Flash Image (Nano Banana)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}. Please generate an image with high quality, suitable for educational materials.`
            }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('Gemini 返回空结果');
    }
    
    const parts = data.candidates[0].content?.parts || [];
    
    // 查找图片数据
    const imagePart = parts.find((part: any) => part.inlineData);
    const textPart = parts.find((part: any) => part.text);
    
    if (!imagePart || !imagePart.inlineData) {
      throw new Error('未能生成图片');
    }

    console.log('✅ 图片生成成功');
    
    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
        text: textPart?.text || 'Image generated successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Image Generation Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
