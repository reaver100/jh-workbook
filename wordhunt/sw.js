/* 영어 단어 사냥 - 서비스 워커
   앱 화면은 바로 캐시, AI 모델/라이브러리는 한 번 받은 뒤 캐시에서 씀 */
const SHELL = 'wh-shell-v1';
const BIG = 'wh-model-v1';
const FILES = [
  './', './index.html', './style.css', './app.js', './dict.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== BIG && k.indexOf('wh-') === 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isBig = url =>
  url.includes('cdn.jsdelivr.net') ||
  url.includes('storage.googleapis.com') ||
  url.includes('tfhub.dev') ||
  url.includes('kaggle.com');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  // AI 모델/라이브러리: 캐시 우선 (한 번 받으면 데이터 안 씀)
  if (isBig(url)) {
    e.respondWith(
      caches.open(BIG).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
          return res;
        } catch (err) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // 앱 파일: 네트워크 먼저, 안 되면 캐시
  if (new URL(url).origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) caches.open(SHELL).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  }
});
