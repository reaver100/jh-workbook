/* 우리집 문제집 — 오프라인 캐시 */
const CACHE = 'wb-v15';
const ASSETS = [
  './',
  'index.html',
  'style.css?v=15',
  'app.js?v=15',
  'fig.js?v=15',
  'math.js?v=15',
  'bank-main.js?v=15',
  'bank-extra.js?v=15',
  'bank-g1.js?v=15',
  'bank-g2.js?v=15',
  'bank-g3.js?v=15',
  'bank-g4.js?v=15',
  'bank-g5.js?v=15',
  'bank-g6.js?v=15',
  'bank-x1.js?v=15',
  'bank-x2.js?v=15',
  'bank-x3.js?v=15',
  'bank-x4.js?v=15',
  'bank-x5.js?v=15',
  'bank-x6.js?v=15',
  'bank-social.js?v=15',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 문서는 네트워크 우선(새 버전 반영), 실패하면 캐시
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // 나머지는 캐시 우선
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
