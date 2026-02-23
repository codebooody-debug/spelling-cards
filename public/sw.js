/**
 * Service Worker for 单词听写助手 PWA
 * 提供离线缓存、资源预缓存和网络策略
 */

const CACHE_NAME = 'spelling-cards-v1';
const STATIC_CACHE_NAME = 'spelling-cards-static-v1';
const IMAGE_CACHE_NAME = 'spelling-cards-images-v1';

// 需要预缓存的核心静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

/**
 * 安装事件 - 预缓存核心资源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] 预缓存完成');
        // 立即激活新的 Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 预缓存失败:', error);
      })
  );
});

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 删除不在当前白名单中的旧缓存
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker 已激活');
        // 立即接管所有客户端
        return self.clients.claim();
      })
  );
});

/**
 * 判断是否为图片请求
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'image' || 
         url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

/**
 * 判断是否为 API 请求
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase') ||
         url.hostname.includes('openai') ||
         url.hostname.includes('minimax');
}

/**
 * 判断是否为静态资源请求
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return request.destination === 'script' || 
         request.destination === 'style' ||
         request.destination === 'document' ||
         url.pathname.match(/\.(js|css|html|json)$/i);
}

/**
 * 获取请求 - 使用不同的缓存策略
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API 请求 - 网络优先，失败时使用缓存
  if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 图片请求 - 缓存优先，但定期更新
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE_NAME));
    return;
  }
  
  // 静态资源 - 缓存优先
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
    return;
  }
  
  // 其他请求 - 网络优先
  event.respondWith(networkFirstStrategy(request));
});

/**
 * 缓存优先策略
 * 先尝试从缓存获取，失败时再从网络获取并更新缓存
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 在后台更新缓存
      fetchAndCache(request, cacheName).catch(() => {});
      return cachedResponse;
    }
    
    // 缓存未命中，从网络获取
    return await fetchAndCache(request, cacheName);
  } catch (error) {
    console.error('[SW] 缓存优先策略失败:', error);
    // 返回离线页面或错误响应
    return new Response('网络错误，请检查连接', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    });
  }
}

/**
 * 网络优先策略
 * 先尝试从网络获取，失败时再从缓存获取
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 成功获取，更新缓存
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] 网络请求失败，尝试从缓存获取:', request.url);
    
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 缓存也未命中
    throw error;
  }
}

/**
 * 缓存优先并刷新策略（用于图片）
 * 先返回缓存，同时在后台更新
 */
async function cacheFirstWithRefresh(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // 无论缓存是否命中，都在后台更新
  const fetchPromise = fetchAndCache(request, cacheName)
    .then(response => {
      // 通知客户端图片已更新（如果支持）
      if (cachedResponse && response) {
        notifyClientsOfUpdate(request.url);
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  // 如果有缓存，立即返回
  if (cachedResponse) {
    // 对于图片，我们可以立即返回缓存，不需要等待网络
    return cachedResponse;
  }
  
  // 没有缓存，等待网络请求
  return fetchPromise;
}

/**
 * 获取资源并缓存
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] 获取并缓存失败:', error);
    throw error;
  }
}

/**
 * 通知客户端资源已更新
 */
async function notifyClientsOfUpdate(url) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({
      type: 'CACHE_UPDATED',
      url: url,
      timestamp: Date.now()
    });
  });
}

/**
 * 处理消息推送（用于后台同步等）
 */
self.addEventListener('message', (event) => {
  console.log('[SW] 收到消息:', event.data);
  
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * 后台同步 - 用于离线操作同步
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-study-records') {
    console.log('[SW] 执行后台同步: sync-study-records');
    event.waitUntil(syncStudyRecords());
  }
});

/**
 * 同步学习记录（示例函数）
 */
async function syncStudyRecords() {
  // 这里可以实现离线数据同步逻辑
  console.log('[SW] 同步学习记录...');
}

console.log('[SW] Service Worker 脚本已加载');
