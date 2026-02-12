// Supabase Storage 服务 - 处理图片和音频的上传下载
// 简化版本 - 专注于核心功能

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_IMAGES = 'word-images';

/**
 * 上传 base64 图片到 Supabase Storage
 */
export async function uploadWordImage(word, base64Image, studyRecordId) {
  console.log(`[upload] 开始: ${word}`);
  
  if (!isSupabaseConfigured()) {
    console.log('[upload] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[upload] 无客户端');
    return null;
  }

  try {
    // 检查用户登录状态
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[upload] 用户未登录');
      return null;
    }

    // 解析 base64
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      console.error('[upload] 无效的 base64 格式');
      return null;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1] || 'png';
    
    // 生成文件路径
    const fileName = `${user.id}/${studyRecordId}/${word.toLowerCase()}.${extension}`;
    console.log(`[upload] 路径: ${fileName}`);
    
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
      console.error('[upload] Storage 错误:', error);
      return null;
    }

    // 获取 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    console.log(`[upload] 成功: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error(`[upload] 异常:`, error);
    return null;
  }
}

/**
 * 获取单词图片 URL
 */
export async function getWordImageUrl(word, studyRecordId) {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('word_media')
      .select('image_url')
      .eq('study_record_id', studyRecordId)
      .eq('word', word.toLowerCase())
      .maybeSingle(); // 使用 maybeSingle 避免报错

    if (error) {
      console.error('[getUrl] 错误:', error);
      return null;
    }

    return data?.image_url || null;
  } catch (error) {
    console.error('[getUrl] 异常:', error);
    return null;
  }
}

/**
 * 保存单词媒体信息
 */
export async function saveWordMedia(mediaData) {
  console.log('[save] 开始');
  
  if (!isSupabaseConfigured()) {
    console.log('[save] 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[save] 无客户端');
    return null;
  }

  try {
    // 检查用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[save] 未登录');
      return null;
    }

    // 保存数据
    const { data, error } = await supabase
      .from('word_media')
      .upsert({
        ...mediaData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,study_record_id,word'
      });

    if (error) {
      console.error('[save] 数据库错误:', error);
      return null;
    }
    
    console.log('[save] 成功');
    return data;
  } catch (error) {
    console.error('[save] 异常:', error);
    return null;
  }
}
