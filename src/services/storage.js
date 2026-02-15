// Storage 服务 - 处理图片上传到 Supabase Storage 和数据库保存

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_IMAGES = 'word-images';

/**
 * 将 base64 图片转换为 Blob
 */
function base64ToBlob(base64Data, mimeType = 'image/png') {
  try {
    // 移除 data URL 前缀
    const base64 = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error('[base64ToBlob] 转换失败:', error);
    return null;
  }
}

/**
 * 上传图片到 Supabase Storage
 */
export async function uploadWordImage(word, base64Image, studyRecordId) {
  console.log(`[uploadWordImage] 开始: word=${word}, studyRecordId=${studyRecordId}`);
  
  if (!isSupabaseConfigured()) {
    console.error('[uploadWordImage] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[uploadWordImage] 无客户端');
    return null;
  }

  try {
    // 检查用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[uploadWordImage] 未登录:', userError?.message);
      return null;
    }

    // 解析 base64
    let mimeType = 'image/png';
    let base64Data = base64Image;
    
    if (base64Image.includes(',')) {
      const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    
    const extension = mimeType.split('/')[1] || 'png';
    
    // 文件路径: user-id/study-record-id/word.png
    const fileName = `${user.id}/${studyRecordId}/${word.toLowerCase()}.${extension}`;
    console.log(`[uploadWordImage] 文件路径: ${fileName}`);
    
    // 转换为 Blob
    const imageBlob = base64ToBlob(base64Data, mimeType);
    if (!imageBlob) {
      console.error('[uploadWordImage] base64 转换失败');
      return null;
    }
    
    console.log(`[uploadWordImage] 图片大小: ${imageBlob.size} bytes`);

    // 上传到 Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(fileName, imageBlob, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('[uploadWordImage] Storage 上传失败:', uploadError.message);
      return null;
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    console.log(`[uploadWordImage] 成功: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error(`[uploadWordImage] 异常:`, error.message);
    return null;
  }
}

/**
 * 获取图片 URL
 * 先查 Storage，没有再返回 null
 */
export async function getWordImageUrl(word, studyRecordId) {
  console.log(`[getWordImageUrl] 查询: word=${word}, studyRecordId=${studyRecordId}`);
  
  if (!isSupabaseConfigured()) {
    console.log('[getWordImageUrl] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.log('[getWordImageUrl] 无客户端');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[getWordImageUrl] 未登录');
      return null;
    }

    const folderPath = `${user.id}/${studyRecordId}`;
    
    // 列出文件夹中的文件
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_IMAGES)
      .list(folderPath);
    
    if (listError) {
      console.error('[getWordImageUrl] 列出文件失败:', listError.message);
      return null;
    }
    
    if (!files || files.length === 0) {
      console.log(`[getWordImageUrl] 文件夹为空: ${folderPath}`);
      return null;
    }
    
    // 查找匹配的文件
    const targetFileName = `${word.toLowerCase()}.png`;
    const file = files.find(f => f.name.toLowerCase() === targetFileName);
    
    if (!file) {
      console.log(`[getWordImageUrl] 文件不存在: ${targetFileName}`);
      return null;
    }

    // 获取 URL
    const fileName = `${folderPath}/${file.name}`;
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    console.log(`[getWordImageUrl] 找到图片: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('[getWordImageUrl] 异常:', error.message);
    return null;
  }
}

/**
 * 保存单词媒体信息到数据库
 */
export async function saveWordMedia(mediaData) {
  console.log('[saveWordMedia] 开始:', mediaData.word);
  
  if (!isSupabaseConfigured()) {
    console.error('[saveWordMedia] Supabase 未配置');
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('[saveWordMedia] 无客户端');
    return null;
  }

  try {
    // 检查用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[saveWordMedia] 未登录:', userError?.message);
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

    console.log('[saveWordMedia] 准备插入:', record);

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
      console.error('[saveWordMedia] 数据库失败:', error.message);
      console.error('[saveWordMedia] 错误详情:', error);
      return null;
    }

    console.log('[saveWordMedia] 成功:', data.id);
    return data;

  } catch (error) {
    console.error('[saveWordMedia] 异常:', error.message);
    return null;
  }
}