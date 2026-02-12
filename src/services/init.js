// 初始化 Supabase Storage Buckets
// 仅检查状态，不自动创建（需要管理员在 Dashboard 中手动创建）

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

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
 * 初始化 Storage - 仅检查状态，不自动创建 buckets
 * Buckets 应该由管理员在 Supabase Dashboard 中手动创建
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

    // 获取现有 buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('获取 Storage buckets 失败:', listError);
      console.log('请确保在 Supabase Dashboard 中已创建以下 buckets:', BUCKETS.map(b => b.name).join(', '));
      return;
    }

    const existingNames = existingBuckets?.map(b => b.name) || [];
    console.log('已存在的 Storage buckets:', existingNames);

    // 检查必需的 buckets 是否存在
    const missingBuckets = BUCKETS.filter(bucket => !existingNames.includes(bucket.name));
    
    if (missingBuckets.length > 0) {
      console.warn('缺少必需的 Storage buckets:', missingBuckets.map(b => b.name));
      console.warn('请在 Supabase Dashboard 中手动创建这些 buckets');
      console.warn('详见 docs/CLOUD_SYNC_SETUP.md');
    } else {
      console.log('✅ 所有必需的 Storage buckets 已存在');
    }

  } catch (error) {
    console.error('初始化 Storage 失败:', error);
    console.log('提示: 请确保在 Supabase Dashboard 中已创建 buckets 并配置了访问策略');
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
