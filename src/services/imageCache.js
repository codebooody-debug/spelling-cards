// 图片缓存服务 - 使用 IndexedDB 存储 base64 图片
// 替代原有的 localStorage 方案（解决 5MB 限制问题）

import { openDB } from 'idb';

const DB_NAME = 'spelling-cards-cache';
const DB_VERSION = 1;
const STORE_NAME = 'word-images';
const MAX_CACHE_SIZE = 100; // 最多缓存 100 张图片
const CACHE_EXPIRY_DAYS = 30; // 缓存 30 天

// 初始化 IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'word' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }
  });
};

// 获取缓存的图片
export async function getCachedImage(word) {
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, word.toLowerCase());
    
    if (!data) return null;
    
    // 检查是否过期
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (isExpired) {
      await db.delete(STORE_NAME, word.toLowerCase());
      console.log(`🗑️ 缓存已过期，删除: ${word}`);
      return null;
    }
    
    console.log(`📦 从 IndexedDB 加载图片: ${word}`);
    return data.imageUrl;
  } catch (error) {
    console.error('读取 IndexedDB 失败:', error);
    // Fallback 到 localStorage
    return getCachedImageFallback(word);
  }
}

// Fallback: localStorage
function getCachedImageFallback(word) {
  try {
    const key = 'word_image_' + word.toLowerCase();
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000;
      if (!isExpired) return data.imageUrl;
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Fallback 读取失败:', error);
  }
  return null;
}

// 保存图片到缓存
export async function saveImageToCache(word, imageUrl) {
  try {
    const db = await initDB();
    
    // 检查缓存数量，如果超过限制则删除最旧的
    await cleanupOldCache(db);
    
    await db.put(STORE_NAME, {
      word: word.toLowerCase(),
      imageUrl,
      timestamp: Date.now()
    });
    
    console.log(`💾 图片已缓存到 IndexedDB: ${word}`);
  } catch (error) {
    console.error('保存到 IndexedDB 失败:', error);
    // Fallback 到 localStorage
    saveImageToCacheFallback(word, imageUrl);
  }
}

// Fallback: localStorage
function saveImageToCacheFallback(word, imageUrl) {
  try {
    const key = 'word_image_' + word.toLowerCase();
    localStorage.setItem(key, JSON.stringify({
      imageUrl,
      timestamp: Date.now(),
      word: word.toLowerCase()
    }));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage 空间不足');
    }
  }
}

// 清理旧缓存
async function cleanupOldCache(db) {
  try {
    const count = await db.count(STORE_NAME);
    if (count >= MAX_CACHE_SIZE) {
      // 获取最旧的缓存
      const oldItems = await db.getAllFromIndex(STORE_NAME, 'timestamp', undefined, MAX_CACHE_SIZE - 10);
      if (oldItems.length > 0) {
        const deleteCount = oldItems.length - (MAX_CACHE_SIZE - 10);
        for (let i = 0; i < deleteCount; i++) {
          await db.delete(STORE_NAME, oldItems[i].word);
          console.log(`🗑️ 清理旧缓存: ${oldItems[i].word}`);
        }
      }
    }
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
}

// 清除所有图片缓存
export async function clearAllImageCache() {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
    console.log('🧹 已清除所有 IndexedDB 图片缓存');
  } catch (error) {
    console.error('清除 IndexedDB 失败:', error);
  }
  
  // 同时清除 localStorage fallback
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('word_image_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 已清除 ${keysToRemove.length} 个 localStorage 缓存图片`);
  } catch (error) {
    console.error('清除 localStorage 失败:', error);
  }
}

// 获取缓存统计
export async function getCacheStats() {
  try {
    const db = await initDB();
    const count = await db.count(STORE_NAME);
    
    // 获取最旧的缓存日期
    const allItems = await db.getAllFromIndex(STORE_NAME, 'timestamp');
    const oldestItem = allItems[0];
    
    return {
      count,
      maxSize: MAX_CACHE_SIZE,
      oldestDate: oldestItem ? new Date(oldestItem.timestamp).toLocaleDateString() : '-',
      storage: 'IndexedDB'
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return getCacheStatsFallback();
  }
}

// Fallback: localStorage 统计
function getCacheStatsFallback() {
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('word_image_')) count++;
    }
    return {
      count,
      maxSize: 50,
      oldestDate: '-',
      storage: 'localStorage (fallback)'
    };
  } catch {
    return { count: 0, maxSize: MAX_CACHE_SIZE, oldestDate: '-', storage: 'unknown' };
  }
}
