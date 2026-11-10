var CACHE = "walkie-v10";
var FILES = [
  "./", "./index.html", "./peerjs.min.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return (k===CACHE || k.indexOf("walkie-")!==0) ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 네트워크 우선 — 새 버전을 올리면 바로 반영되고, 오프라인이면 캐시로 떨어진다
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match("./index.html"); });
    })
  );
});

/* ---------- 푸시 호출: 전화벨처럼 여러 번 울린다 ---------- */
self.addEventListener("push", function(e){
  var d = { title: "무전기", body: "호출이 왔습니다" };
  try { if (e.data) d = e.data.json(); } catch (err) {}

  e.waitUntil((async function(){
    // 앱이 열려 있으면 화면 쪽에서 벨소리를 내게 한다
    try {
      var cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      cs.forEach(function(c){ c.postMessage({ t: "ring", from: d.from || "" }); });
    } catch (err) {}

    var opts = {
      body: d.body || "호출이 왔습니다",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: "walkie-call",
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 90, 200, 90, 380],
      actions: [{ action: "stop", title: "끄기" }, { action: "open", title: "열기" }],
      data: { url: "./index.html?join=1" }
    };

    // 같은 알림을 10번 다시 울린다 (띵 … 띵 … 띵) — '끄기'를 누르면 도중에 멈춘다
    self.__ringStop = false;
    for (var i = 0; i < 10; i++) {
      if (self.__ringStop) break;
      try { await self.registration.showNotification(d.title || "무전기", opts); } catch (err) {}
      if (i < 9) await new Promise(function(r){ setTimeout(r, 900); });
    }
  })());
});

self.addEventListener("message", function(e){
  if (e.data && e.data.t === "stopring") self.__ringStop = true;
});

self.addEventListener("notificationclick", function(e){
  e.notification.close();
  /* '끄기'를 누르면 더 울리지 않고 앱도 열지 않는다 */
  if (e.action === "stop") {
    self.__ringStop = true;
    e.waitUntil((async function(){
      var ns = await self.registration.getNotifications({ tag: "walkie-call" });
      ns.forEach(function(n){ try { n.close(); } catch (err) {} });
      var cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      cs.forEach(function(c){ c.postMessage({ t: "stopring" }); });
    })());
    return;
  }
  self.__ringStop = true;
  e.waitUntil((async function(){
    var all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (var i = 0; i < all.length; i++) {
      if (all[i].url.indexOf(self.registration.scope) === 0) {
        await all[i].focus();
        all[i].postMessage({ t: "autojoin" });
        return;
      }
    }
    await self.clients.openWindow("./index.html?join=1");
  })());
});
