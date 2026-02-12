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
      console.error('[上传] 格式错误');
      return null;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1] || 'png';
    
    // 文件路径
    const fileName = `${user.id}/${studyRecordId}/${word.toLowerCase()}.${extension}`;
    
    // base64 转 Uint8Array
    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
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

// 保留空函数兼容旧代码
export async function saveWordMedia(mediaData) {
  console.log('[保存数据库] 已禁用，仅使用 Storage');
  return null;
}
