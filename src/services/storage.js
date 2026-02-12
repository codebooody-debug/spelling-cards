// Supabase Storage 服务 - 处理图片和音频的上传下载

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_IMAGES = 'word-images';
const BUCKET_AUDIOS = 'word-audios';

/**
 * 上传 base64 图片到 Supabase Storage
 * @param {string} word - 单词
 * @param {string} base64Image - base64 格式的图片数据
 * @param {string} studyRecordId - 学习记录ID
 * @returns {Promise<string>} - 返回图片的公开 URL
 */
export async function uploadWordImage(word, base64Image, studyRecordId) {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过图片上传');
    return null;
  }

  try {
    // 从 base64 提取数据和 mime type
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid base64 image format');
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1] || 'png';
    
    // 生成文件名：用户ID/记录ID/单词.扩展名
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    const fileName = `${userId}/${studyRecordId}/${word.toLowerCase()}.${extension}`;
    
    // base64 转 Uint8Array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 上传到 Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(fileName, byteArray, {
        contentType: mimeType,
        upsert: true // 如果存在则覆盖
      });

    if (error) {
      throw error;
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(fileName);

    console.log(`✅ 图片上传成功: ${word} -> ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error(`❌ 图片上传失败 (${word}):`, error);
    return null;
  }
}

/**
 * 上传音频到 Supabase Storage
 * @param {string} word - 单词
 * @param {string} base64Audio - base64 格式的音频数据
 * @param {string} studyRecordId - 学习记录ID
 * @param {string} type - 'word' 或 'sentence'
 * @returns {Promise<string>} - 返回音频的公开 URL
 */
export async function uploadWordAudio(word, base64Audio, studyRecordId, type = 'word') {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过音频上传');
    return null;
  }

  try {
    // base64 数据可能是纯 base64 或带 data URI 前缀
    let base64Data = base64Audio;
    if (base64Audio.includes('base64,')) {
      base64Data = base64Audio.split('base64,')[1];
    }

    const fileName = `${word.toLowerCase()}_${type}.mp3`;
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    const fullPath = `${userId}/${studyRecordId}/${fileName}`;

    // base64 转 Uint8Array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 上传到 Storage
    const { error } = await supabase.storage
      .from(BUCKET_AUDIOS)
      .upload(fullPath, byteArray, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_AUDIOS)
      .getPublicUrl(fullPath);

    console.log(`✅ 音频上传成功: ${word} (${type})`);
    return publicUrl;

  } catch (error) {
    console.error(`❌ 音频上传失败 (${word}):`, error);
    return null;
  }
}

/**
 * 从 Supabase 获取单词图片 URL
 * @param {string} word - 单词
 * @param {string} studyRecordId - 学习记录ID
 * @returns {Promise<string|null>} - 图片 URL 或 null
 */
export async function getWordImageUrl(word, studyRecordId) {
  if (!isSupabaseConfigured()) return null;

  try {
    // 先从 word_media 表查询
    const { data, error } = await supabase
      .from('word_media')
      .select('image_url')
      .eq('study_record_id', studyRecordId)
      .eq('word', word.toLowerCase())
      .single();

    if (error || !data?.image_url) {
      return null;
    }

    return data.image_url;
  } catch (error) {
    console.error(`获取图片 URL 失败 (${word}):`, error);
    return null;
  }
}

/**
 * 保存单词媒体信息到数据库
 * @param {Object} mediaData - 媒体数据
 */
export async function saveWordMedia(mediaData) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('word_media')
      .upsert({
        ...mediaData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,study_record_id,word'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('保存单词媒体失败:', error);
    return null;
  }
}

/**
 * 获取单词的完整媒体信息
 * @param {string} studyRecordId - 学习记录ID
 * @param {string} word - 单词
 */
export async function getWordMedia(studyRecordId, word) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('word_media')
      .select('*')
      .eq('study_record_id', studyRecordId)
      .eq('word', word.toLowerCase())
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error(`获取单词媒体失败 (${word}):`, error);
    return null;
  }
}

/**
 * 批量获取单词媒体信息
 * @param {string} studyRecordId - 学习记录ID
 */
export async function getAllWordMedia(studyRecordId) {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('word_media')
      .select('*')
      .eq('study_record_id', studyRecordId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取单词媒体列表失败:', error);
    return [];
  }
}

/**
 * 检查 Storage Bucket 是否存在，不存在则创建
 */
export async function ensureStorageBuckets() {
  if (!isSupabaseConfigured()) return;

  try {
    // 检查并创建图片 bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketNames = buckets?.map(b => b.name) || [];

    if (!bucketNames.includes(BUCKET_IMAGES)) {
      const { error } = await supabase.storage.createBucket(BUCKET_IMAGES, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      if (error) console.error('创建图片 bucket 失败:', error);
      else console.log('✅ 创建图片 bucket 成功');
    }

    if (!bucketNames.includes(BUCKET_AUDIOS)) {
      const { error } = await supabase.storage.createBucket(BUCKET_AUDIOS, {
        public: true,
        fileSizeLimit: 1048576, // 1MB
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3']
      });
      if (error) console.error('创建音频 bucket 失败:', error);
      else console.log('✅ 创建音频 bucket 成功');
    }
  } catch (error) {
    console.error('检查 Storage Buckets 失败:', error);
  }
}
