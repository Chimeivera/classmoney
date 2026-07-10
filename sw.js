/* 極簡 Service Worker：
   1. 讓 Android Chrome 判定這個網站符合「可安裝」條件（manifest + service worker）
   2. 快取 App 外殼（index.html 本身），離線或訊號不好時至少能打開畫面
   注意：資料本身一律即時連線 Google Apps Script 讀寫，不做資料快取，
   避免看到過期或跟 Google 試算表不同步的補助資料。 */

const CACHE_NAME = "subsidy-app-shell-v1";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // 只快取自己網域的 GET 請求（App 外殼），Apps Script 的資料請求一律直接連線，不經快取
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
