// Service Worker para PWA Semana Santa Jerez 2026
const CACHE_NAME = 'ssjerez2026-v12';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // Solo manejar peticiones GET
  if (request.method !== 'GET') return;

  // Para navegación (HTML), intentar red primero, luego cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./')))
    );
    return;
  }

  // Para otros recursos, cache primero, luego red
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;
        return fetch(request).then(fetchResponse => {
          // Cachear recursos del mismo origen
          if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
            const clone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Fallback offline
        if (request.destination === 'document') {
          return caches.match('./');
        }
      })
  );
});
