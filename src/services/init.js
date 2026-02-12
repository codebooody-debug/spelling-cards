// 初始化 Supabase Storage Buckets
// 在应用启动时调用

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKETS = [
  {
    name: 'word-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  {
    name: 'word-audios',
    public: true,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['audio/mpeg', 'audio/mp3']
  }
];

/**
 * 初始化所有需要的 Storage Buckets
 */
export async function initializeStorage() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过 Storage 初始化');
    return;
  }

  try {
    // 获取现有 buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('获取 Storage buckets 失败:', listError);
      return;
    }

    const existingNames = existingBuckets?.map(b => b.name) || [];

    // 创建缺失的 buckets
    for (const bucket of BUCKETS) {
      if (!existingNames.includes(bucket.name)) {
        console.log(`创建 Storage bucket: ${bucket.name}`);
        
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (error) {
          console.error(`创建 bucket ${bucket.name} 失败:`, error);
        } else {
          console.log(`✅ Bucket ${bucket.name} 创建成功`);
        }
      } else {
        console.log(`Bucket ${bucket.name} 已存在`);
      }
    }

    // 设置 bucket 公开访问策略（如果不存在）
    await setupBucketPolicies();

  } catch (error) {
    console.error('初始化 Storage 失败:', error);
  }
}

/**
 * 设置 bucket 公开访问策略
 */
async function setupBucketPolicies() {
  try {
    // 通过 SQL 设置策略（需要在 Supabase Dashboard 中执行）
    // 这里只是检查，实际策略需要在 Dashboard 中配置
    console.log('请确保在 Supabase Dashboard 中配置了 Storage 访问策略');
    console.log('详见 docs/CLOUD_SYNC_SETUP.md');
  } catch (error) {
    console.error('设置 bucket 策略失败:', error);
  }
}

/**
 * 检查 Storage 配置状态
 */
export async function checkStorageStatus() {
  if (!isSupabaseConfigured()) {
    return { configured: false, buckets: [] };
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;

    const requiredBuckets = BUCKETS.map(b => b.name);
    const existingBuckets = buckets?.map(b => b.name) || [];
    const missingBuckets = requiredBuckets.filter(name => !existingBuckets.includes(name));

    return {
      configured: true,
      buckets: existingBuckets,
      missingBuckets,
      allReady: missingBuckets.length === 0
    };
  } catch (error) {
    console.error('检查 Storage 状态失败:', error);
    return { configured: false, error: error.message, buckets: [] };
  }
}
