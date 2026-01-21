// sw.js
const CACHE_NAME = 'kiki-os-cache-v1';

// 安装事件
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 强制立即激活
  console.log('Service Worker 已安装');
});

// 激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // 立即接管页面
  console.log('Service Worker 已激活');
});

// 拦截网络请求 (这是一个最简单的策略：网络优先，失败则忽略)
// 这满足了 PWA "拥有 Service Worker" 的要求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // 如果断网了，这里可以返回一个离线页面，或者不做处理
      return new Response("Offline");
    })
  );
});