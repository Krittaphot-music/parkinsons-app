/* Parkinson's Helper — Service Worker
   Cache-first strategy for offline support
*/

const CACHE_NAME = 'pd-helper-v1';

// ไฟล์ที่จะ cache ไว้ใช้ offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// Install — cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // ถ้า cache บาง asset ไม่ได้ ก็ข้ามไปก่อน (dev mode ชื่อไฟล์ต่างกัน)
      });
    })
  );
  self.skipWaiting();
});

// Activate — ลบ cache เก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // ข้าม non-GET requests และ requests จาก extension
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response ใหม่
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback — ดึงจาก cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // ถ้าไม่มีใน cache เลย ส่ง index.html แทน (SPA fallback)
          return caches.match('/index.html');
        });
      })
  );
});
