/* 우리집 문제집 — 오프라인 캐시 */
const CACHE = 'wb-v18';
const ASSETS = [
  './',
  'index.html',
  'style.css?v=18',
  'app.js?v=18',
  'fig.js?v=18',
  'math.js?v=18',
  'bank-main.js?v=18',
  'bank-extra.js?v=18',
  'bank-g1.js?v=18',
  'bank-g2.js?v=18',
  'bank-g3.js?v=18',
  'bank-g4.js?v=18',
  'bank-g5.js?v=18',
  'bank-g6.js?v=18',
  'bank-x1.js?v=18',
  'bank-x2.js?v=18',
  'bank-x3.js?v=18',
  'bank-x4.js?v=18',
  'bank-x5.js?v=18',
  'bank-x6.js?v=18',
  'bank-social.js?v=18',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.indexOf('wb-') === 0).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/walkie/') >= 0 || url.pathname.indexOf('/wordhunt/') >= 0) return;  // 다른 앱은 그 앱 서비스워커가 담당

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
