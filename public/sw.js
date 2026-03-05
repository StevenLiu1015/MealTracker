const CACHE_NAME = 'meal-tracker-v2'; // ← 每次 deploy 改版號就會強制清舊快取

self.addEventListener('install', (event) => {
  // 安裝後立即接管，不等舊 SW 結束
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/MealTracker/']))
  );
});

self.addEventListener('activate', (event) => {
  // 清掉所有舊版快取
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()) // 立即接管所有分頁
  );
});

self.addEventListener('fetch', (event) => {
  // Network First：優先從網路取最新版，失敗才用快取（離線時）
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 順便更新快取
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
