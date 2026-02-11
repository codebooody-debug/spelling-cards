// API 服务封装 - 统一处理 Edge Function 调用

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// 通用 Edge Function 调用
async function callEdgeFunction(functionName, body, options = {}) {
  const { timeout = 30000, retries = 1 } = options;
  
  if (!isSupabaseConfigured()) {
    // 本地开发模式
    const response = await fetch(`http://localhost:3003/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  }
  
  // Supabase Edge Function 调用
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    
    // 重试逻辑
    if (retries > 0) {
      console.log(`重试 ${functionName}...`);
      return callEdgeFunction(functionName, body, { ...options, retries: retries - 1 });
    }
    
    throw error;
  }
}

// OCR 识别 API
export async function extractSpelling(imageData) {
  const result = await callEdgeFunction('extract-spelling', { imageData }, { timeout: 30000 });
  if (!result.success) {
    throw new Error(result.error || '识别失败');
  }
  return result.data;
}

// 单词丰富 API
export async function enrichWord(word, sentence, grade) {
  const result = await callEdgeFunction('enrich-word', { word, sentence, grade }, { timeout: 15000 });
  if (!result.success) {
    throw new Error(result.error || '单词信息获取失败');
  }
  return result.data;
}

// 图片生成 API
export async function generateImage(prompt, width = 1024, height = 1024) {
  const result = await callEdgeFunction('generate-image', { prompt, width, height }, { timeout: 20000 });
  if (!result.success) {
    throw new Error(result.error || '图片生成失败');
  }
  return result;
}

// 批量处理单词（带并发限制）
export async function enrichWordsBatch(words, grade, options = {}) {
  const { concurrency = 3, onProgress } = options;
  const results = [];
  
  // 分批处理
  for (let i = 0; i < words.length; i += concurrency) {
    const batch = words.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (item) => {
      try {
        const data = await enrichWord(item.word, item.sentence, grade);
        if (onProgress) onProgress(item.word, true);
        return { success: true, data, word: item.word };
      } catch (error) {
        console.error(`丰富单词 ${item.word} 失败:`, error);
        if (onProgress) onProgress(item.word, false);
        return { 
          success: false, 
          word: item.word,
          data: {
            meaning: '',
            wordType: 'noun',
            synonyms: [],
            antonyms: [],
            practiceSentences: [],
            memoryTip: ''
          }
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 添加小延迟避免请求过快
    if (i + concurrency < words.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
