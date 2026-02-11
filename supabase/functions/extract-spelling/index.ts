// Supabase Edge Function: extract-spelling
// 替换原有的 gemini-ocr.js

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
    const { imageData } = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ success: false, error: 'imageData is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `这是一张英文听写作业的照片。请提取：
1. 年级 (如 P3, P4, P5)
2. 学期 (如 Term 1, Term 2)
3. 听写编号 (如 Spelling 1)
4. 所有单词和对应的句子（用于填空练习）

以 JSON 格式返回：
{
  "grade": "P3",
  "term": "Term 2",
  "spellingNumber": "Spelling 2",
  "title": "Unit 2",
  "words": [
    {"word": "souvenir", "sentence": "My parents bought me..."}
  ]
}`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageData.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('无法解析识别结果');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
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
