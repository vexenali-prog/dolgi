var CACHE_NAME = 'dolgi-shell-v1';
var PRECACHE = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(PRECACHE); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  var isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isHtml) {
    e.respondWith(
      fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) { return cached || caches.match('./index.html'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
        return res;
      });
    })
  );
});
