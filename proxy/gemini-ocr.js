// Gemini Vision API 封装
const fetch = require('node-fetch');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function extractSpellingFromImage(imageBase64) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('🔍 调用 Gemini OCR...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `这是一张英文听写作业的照片。请仔细识别并提取以下信息：

1. 年级 (Grade): 如 P3, P4, P5 等
2. 学期 (Term): 如 Term 1, Term 2
3. 听写编号: 如 Spelling(2), Spelling 3
4. 标题/单元: 听写的主题名称
5. 单词列表: 每个单词和对应的例句（用于填空练习）

请以 JSON 格式返回：
{
  "grade": "P3",
  "term": "Term 2", 
  "spellingNumber": "Spelling(2)",
  "title": "Unit 2 - The Lion and the Mouse",
  "words": [
    {"word": "souvenir", "sentence": "My parents bought me a kangaroo soft toy as a souvenir during our trip."},
    {"word": "thoroughly", "sentence": "Please check your work thoroughly before submitting."}
  ]
}

注意：
- 如果图片中无法识别某字段，使用合理的默认值
- 确保句子包含目标单词，方便制作填空练习
- 返回纯 JSON，不要有其他文字`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
              }
            }
          ]
        }]
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
  
  const text = data.candidates[0].content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('无法从 Gemini 响应中提取文本');
  }
  
  console.log('✅ Gemini 识别完成');
  
  // 提取 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('无法解析 JSON 结果');
  }
  
  try {
    const result = JSON.parse(jsonMatch[0]);
    console.log(`   识别到 ${result.words?.length || 0} 个单词`);
    return result;
  } catch (e) {
    throw new Error('JSON 解析失败: ' + e.message);
  }
}

module.exports = { extractSpellingFromImage };
