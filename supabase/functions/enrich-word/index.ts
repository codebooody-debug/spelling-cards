// Supabase Edge Function: enrich-word
// 为单词生成释义、同义词、反义词、例句和记忆技巧

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
    const { word, sentence, grade = 'P3' } = await req.json();

    if (!word || !sentence) {
      return new Response(
        JSON.stringify({ success: false, error: 'word and sentence are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📚 丰富单词信息: ${word} (Grade: ${grade})`);

    const gradeLevel = grade.startsWith('P') ? 
      `Primary ${grade.replace('P', '')}` : 
      `Secondary ${grade.replace('S', '')}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an English teacher creating vocabulary cards for Singapore ${gradeLevel} students.

Given the word "${word}" and its context: "${sentence}",
please generate the following information in JSON format:

{
  "meaning": "中文释义（简洁准确）",
  "wordType": "词性（noun/verb/adjective/adverb等）",
  "synonyms": ["同义词1", "同义词2", "同义词3"],
  "antonyms": ["反义词1", "反义词2"],
  "practiceSentences": [
    "使用${word}的完整例句1（不同场景，包含${word}）",
    "使用${word}的完整例句2（不同场景，包含${word}）"
  ],
  "memoryTip": "记忆技巧（有趣、简短，帮助学生记住单词）"
}

Requirements:
1. Synonyms: 2-3 words with increasing difficulty (easy → medium → advanced)
2. Antonyms: 2-3 words if applicable (if no clear antonyms, provide fewer or skip)
3. Practice sentences: Must be complete sentences using "${word}", different contexts from the original
4. Difficulty: Appropriate for ${gradeLevel} students
5. Memory tip: Creative, memorable, can include wordplay or associations

Return ONLY the JSON object, no other text.`
            }]
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
    
    console.log(`✅ 单词信息生成成功: ${word}`);
    
    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 JSON 结果');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    // 格式化结果
    const formattedResult = {
      meaning: result.meaning || '',
      wordType: result.wordType || 'noun',
      synonyms: Array.isArray(result.synonyms) ? result.synonyms.slice(0, 3) : [],
      antonyms: Array.isArray(result.antonyms) ? result.antonyms.slice(0, 3) : [],
      practiceSentences: Array.isArray(result.practiceSentences) ? 
        result.practiceSentences.slice(0, 2).map((s: string) => s.replace(new RegExp(word, 'gi'), '________')) : [],
      memoryTip: result.memoryTip || ''
    };

    return new Response(
      JSON.stringify({ success: true, data: formattedResult }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Word Enrichment Error:', error.message);
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
