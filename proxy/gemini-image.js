// Gemini 2.5 Flash Image (Nano Banana) 图片生成服务
const fetch = require('node-fetch');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function generateImage(prompt, options = {}) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const { width = 1024, height = 1024, seed = null } = options;

  console.log('🎨 生成图片:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));

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
    throw new Error(`Gemini Image API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('Gemini 返回空结果');
  }
  
  const parts = data.candidates[0].content?.parts || [];
  
  // 查找图片数据
  const imagePart = parts.find(part => part.inlineData);
  const textPart = parts.find(part => part.text);
  
  if (!imagePart || !imagePart.inlineData) {
    throw new Error('未能生成图片');
  }

  console.log('✅ 图片生成成功');
  
  return {
    success: true,
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    text: textPart?.text || 'Image generated successfully'
  };
}

module.exports = { generateImage };
