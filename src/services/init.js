// 初始化 Supabase Storage Buckets
// 仅检查状态，不自动创建（需要管理员在 Dashboard 中手动创建）

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKETS = [
  {
    name: 'spelling-images',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
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
 * 初始化 Storage - 检查 buckets 是否可访问
 * 由于权限限制，不依赖 listBuckets，而是直接尝试访问
 */
export async function initializeStorage() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过 Storage 初始化');
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.log('Supabase 客户端未初始化');
    return;
  }

  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('用户未登录，跳过 Storage 初始化检查');
      return;
    }

    // 由于权限限制，不调用 listBuckets
    // 而是直接尝试访问每个 bucket
    const requiredBuckets = ['spelling-images', 'word-images', 'word-audios'];
    const accessibleBuckets = [];
    const inaccessibleBuckets = [];

    for (const bucketName of requiredBuckets) {
      try {
        // 尝试列出 bucket 内容来验证可访问性
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        if (error) {
          if (error.message.includes('not found') || error.message.includes('does not exist')) {
            inaccessibleBuckets.push(bucketName);
            console.warn(`Bucket '${bucketName}' 不存在`);
          } else {
            // 其他错误（如权限不足），但 bucket 可能存在
            console.log(`Bucket '${bucketName}' 可能已存在（权限限制无法确认）`);
            accessibleBuckets.push(bucketName);
          }
        } else {
          accessibleBuckets.push(bucketName);
          console.log(`✅ Bucket '${bucketName}' 可访问`);
        }
      } catch (err) {
        console.warn(`检查 bucket '${bucketName}' 时出错:`, err.message);
        inaccessibleBuckets.push(bucketName);
      }
    }

    console.log('可访问的 Storage buckets:', accessibleBuckets);

    if (inaccessibleBuckets.length > 0) {
      console.warn('无法访问的 Storage buckets:', inaccessibleBuckets);
      console.warn('请在 Supabase Dashboard 中检查这些 buckets 是否存在并配置正确的访问权限');
    } else {
      console.log('✅ 所有必需的 Storage buckets 可访问');
    }

  } catch (error) {
    console.error('初始化 Storage 失败:', error);
  }
}

/**
 * 设置 bucket 公开访问策略
 * 注意：实际策略需要在 Supabase Dashboard 中配置
 */
async function setupBucketPolicies() {
  console.log('请确保在 Supabase Dashboard 中配置了 Storage 访问策略');
  console.log('详见 docs/CLOUD_SYNC_SETUP.md');
}

/**
 * 检查 Storage 配置状态
 */
export async function checkStorageStatus() {
  if (!isSupabaseConfigured()) {
    return { configured: false, buckets: [] };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { configured: false, error: 'Supabase 客户端未初始化', buckets: [] };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { configured: false, error: '用户未登录', buckets: [] };
    }

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
