// 语音合成服务 - 支持多种TTS引擎

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

// TTS引擎类型
const TTS_ENGINES = {
  BROWSER: 'browser',  // 浏览器原生
  ELEVENLABS: 'elevenlabs',  // ElevenLabs API
  MINIMAX: 'minimax',  // MiniMax API
};

// 当前使用的引擎
let currentEngine = TTS_ENGINES.BROWSER;

// 音频缓存
const audioCache = new Map();

/**
 * 设置TTS引擎
 */
export function setTTSEngine(engine) {
  if (Object.values(TTS_ENGINES).includes(engine)) {
    currentEngine = engine;
    console.log(`[TTS] 切换到引擎: ${engine}`);
  }
}

/**
 * 获取当前TTS引擎
 */
export function getTTSEngine() {
  return currentEngine;
}

/**
 * 浏览器原生TTS
 */
export function playBrowserTTS(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // 选择更好的语音
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') ||
        v.name.includes('Microsoft David') ||
        (v.lang === 'en-US' && v.name.includes('Natural'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`[TTS] 使用语音: ${preferredVoice.name}`);
      }

      utterance.onstart = () => {
        console.log(`[TTS] 开始播放: ${text.substring(0, 30)}...`);
      };
      
      utterance.onend = () => {
        console.log('[TTS] 播放完成');
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error('[TTS] 播放错误:', e);
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 通过Edge Function调用AI TTS
 */
export async function playAITTS(text, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase未配置');
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase客户端未初始化');
  }

  // 检查缓存
  const cacheKey = `${text}_${options.voice || 'default'}`;
  if (audioCache.has(cacheKey)) {
    console.log('[TTS] 使用缓存音频');
    return playAudioBlob(audioCache.get(cacheKey));
  }

  try {
    console.log(`[TTS] 调用AI语音合成: ${text.substring(0, 30)}...`);
    
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text,
        voice: options.voice || 'en-US-Neural2-D',
        speed: options.speed || 1.0
      }
    });

    if (error) throw error;
    if (!data?.audio) throw new Error('未返回音频数据');

    // 解码base64音频
    const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
    
    // 缓存音频
    audioCache.set(cacheKey, audioBlob);
    
    // 播放音频
    return playAudioBlob(audioBlob);
    
  } catch (error) {
    console.error('[TTS] AI合成失败:', error);
    // 降级到浏览器TTS
    console.log('[TTS] 降级到浏览器原生TTS');
    return playBrowserTTS(text, options);
  }
}

/**
 * 播放音频Blob
 */
function playAudioBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    
    audio.play().catch(reject);
  });
}

/**
 * base64转Blob
 */
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 主播放函数
 */
export async function playTTS(text, options = {}) {
  // 根据当前引擎选择播放方式
  switch (currentEngine) {
    case TTS_ENGINES.ELEVENLABS:
    case TTS_ENGINES.MINIMAX:
      try {
        return await playAITTS(text, options);
      } catch (error) {
        console.warn('[TTS] AI引擎失败，降级到浏览器TTS:', error.message);
        return playBrowserTTS(text, options);
      }
    
    case TTS_ENGINES.BROWSER:
    default:
      return playBrowserTTS(text, options);
  }
}

/**
 * 预加载语音（提前合成常用单词）
 */
export async function preloadTTS(words) {
  console.log(`[TTS] 预加载 ${words.length} 个单词`);
  
  for (const word of words) {
    try {
      if (!audioCache.has(word)) {
        // 静默预加载，不播放
        await playAITTS(word, { preload: true });
      }
    } catch (error) {
      console.warn(`[TTS] 预加载失败: ${word}`, error.message);
    }
  }
}

/**
 * 清除音频缓存
 */
export function clearTTSCache() {
  audioCache.clear();
  console.log('[TTS] 音频缓存已清除');
}

/**
 * 获取缓存统计
 */
export function getTTSStats() {
  return {
    cacheSize: audioCache.size,
    engine: currentEngine
  };
}