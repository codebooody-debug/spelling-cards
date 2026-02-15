// 简化版 Storage 服务 - 只上传图片到 Storage，不保存到数据库

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_IMAGES = 'word-images';

/**
 * 上传图片到 Supabase Storage
 */
export async function uploadWordImage(word, base64Image, studyRecordId) {
  console.log(`[上传] 开始: ${word}`);
  
  if (!isSupabaseConfigured()) {
    console.log('[上传] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[上传] 无客户端');
    return null;
  }

  try {
    // 检查用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[上传] 未登录');
      return null;
    }

    // 解析 base64
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      console.error('[上传] 格式错误:', base64Image.substring(0, 50));
      return null;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1] || 'png';
    
    // 文件路径
    const fileName = `${user.id}/${studyRecordId}/${word.toLowerCase()}.${extension}`;
    console.log(`[上传] 文件名: ${fileName}`);
    
    // base64 转 Uint8Array - 使用更安全的方法
    let byteArray;
    try {
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      byteArray = bytes;
      console.log(`[上传] 转换成功: ${byteArray.length} bytes`);
    } catch (e) {
      console.error('[上传] base64转换失败:', e.message);
      return null;
    }

    // 上传
    const { error } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(fileName, byteArray, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('[上传] Storage 失败:', error.message);
      return null;
    }

    // 获取 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    console.log(`[上传] 成功: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error(`[上传] 异常:`, error.message);
    return null;
  }
}

/**
 * 获取图片 URL
 * 先查 Storage，没有再查本地
 */
export async function getWordImageUrl(word, studyRecordId) {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileName = `${user.id}/${studyRecordId}/${word.toLowerCase()}.png`;
    
    // 检查文件是否存在
    const { data: exists } = await supabase.storage
      .from(BUCKET_IMAGES)
      .list(`${user.id}/${studyRecordId}`);
    
    const file = exists?.find(f => f.name === `${word.toLowerCase()}.png`);
    if (!file) return null;

    // 获取 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    return null;
  }
}

/**
 * 保存单词媒体信息到数据库
 * @param {Object} mediaData - 媒体数据
 * @param {string} mediaData.word - 单词
 * @param {string} mediaData.studyRecordId - 学习记录ID
 * @param {string} mediaData.imageUrl - 图片URL
 * @param {string} mediaData.meaning - 中文释义
 * @param {string} mediaData.wordType - 词性
 * @param {string} mediaData.phonetic - 音标
 * @param {Array} mediaData.synonyms - 同义词数组
 * @param {Array} mediaData.antonyms - 反义词数组
 * @param {Array} mediaData.practiceSentences - 练习例句
 * @param {string} mediaData.memoryTip - 记忆技巧
 * @param {string} mediaData.sentence - 原句子
 */
export async function saveWordMedia(mediaData) {
  console.log('[保存数据库] 开始:', mediaData.word);
  
  if (!isSupabaseConfigured()) {
    console.log('[保存数据库] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[保存数据库] 无客户端');
    return null;
  }

  try {
    // 检查用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[保存数据库] 未登录');
      return null;
    }

    // 准备数据
    const record = {
      user_id: user.id,
      word: mediaData.word.toLowerCase(),
      study_record_id: mediaData.studyRecordId,
      image_url: mediaData.imageUrl,
      image_generated_at: new Date().toISOString(),
      meaning: mediaData.meaning || '',
      word_type: mediaData.wordType || 'noun',
      phonetic: mediaData.phonetic || '/fəˈnetɪk/',
      synonyms: mediaData.synonyms || [],
      antonyms: mediaData.antonyms || [],
      practice_sentences: mediaData.practiceSentences || [],
      memory_tip: mediaData.memoryTip || '',
      sentence: mediaData.sentence || ''
    };

    console.log('[保存数据库] 记录:', record);

    // 插入或更新数据库
    const { data, error } = await supabase
      .from('word_media')
      .upsert(record, {
        onConflict: 'user_id,study_record_id,word',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[保存数据库] 失败:', error.message);
      return null;
    }

    console.log('[保存数据库] 成功:', data.id);
    return data;

  } catch (error) {
    console.error('[保存数据库] 异常:', error.message);
    return null;
  }
}
