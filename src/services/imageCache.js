// 图片缓存服务 - 使用 localStorage 存储 base64 图片
const CACHE_KEY_PREFIX = 'word_image_';
const MAX_CACHE_SIZE = 50; // 最多缓存50张图片

// 获取缓存的图片
export function getCachedImage(word) {
  try {
    const key = CACHE_KEY_PREFIX + word.toLowerCase();
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      // 检查是否过期（30天）
      const isExpired = Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000;
      if (!isExpired) {
        console.log(`📦 从缓存加载图片: ${word}`);
        return data.imageUrl;
      }
      // 过期则删除
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('读取缓存失败:', error);
  }
  return null;
}

// 保存图片到缓存
export function saveImageToCache(word, imageUrl) {
  try {
    const key = CACHE_KEY_PREFIX + word.toLowerCase();
    const data = {
      imageUrl,
      timestamp: Date.now(),
      word: word.toLowerCase()
    };
    
    // 检查缓存数量，如果超过限制则删除最旧的
    cleanupOldCache();
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 图片已缓存: ${word}`);
  } catch (error) {
    // 可能是存储空间不足
    if (error.name === 'QuotaExceededError') {
      console.warn('缓存空间不足，清理旧缓存...');
      cleanupOldCache(true); // 强制清理一半缓存
      try {
        const key = CACHE_KEY_PREFIX + word.toLowerCase();
        localStorage.setItem(key, JSON.stringify({
          imageUrl,
          timestamp: Date.now(),
          word: word.toLowerCase()
        }));
      } catch (e) {
        console.error('缓存失败:', e);
      }
    } else {
      console.error('保存缓存失败:', error);
    }
  }
}

// 清理旧缓存
function cleanupOldCache(aggressive = false) {
  try {
    const images = [];
    
    // 收集所有缓存的图片
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key));
        images.push({ key, ...data });
      }
    }
    
    // 按时间排序
    images.sort((a, b) => a.timestamp - b.timestamp);
    
    // 删除最旧的
    const deleteCount = aggressive ? Math.floor(images.length / 2) : Math.max(0, images.length - MAX_CACHE_SIZE);
    
    for (let i = 0; i < deleteCount; i++) {
      localStorage.removeItem(images[i].key);
      console.log(`🗑️ 清理旧缓存: ${images[i].word}`);
    }
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
}

// 清除所有图片缓存
export function clearAllImageCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 已清除 ${keysToRemove.length} 个缓存图片`);
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

// 获取缓存统计
export function getCacheStats() {
  try {
    let count = 0;
    let oldestTimestamp = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        count++;
        const data = JSON.parse(localStorage.getItem(key));
        if (data.timestamp < oldestTimestamp) {
          oldestTimestamp = data.timestamp;
        }
      }
    }
    
    return {
      count,
      maxSize: MAX_CACHE_SIZE,
      oldestDate: count > 0 ? new Date(oldestTimestamp).toLocaleDateString() : '-'
    };
  } catch {
    return { count: 0, maxSize: MAX_CACHE_SIZE, oldestDate: '-' };
  }
}
