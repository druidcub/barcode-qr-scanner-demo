const CACHE_NAME = 'barcode-scanner-demo-v1';
const APP_SHELL = [
  './barcode_qrcode_scanner_single_page.html',
  './barcode-scanner-manifest.webmanifest',
  './barcode-scanner-icon-192.png',
  './barcode-scanner-icon-512.png',
  './html5-qrcode.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isHttpRequest = requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:';
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isHttpRequest || !isSameOrigin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put('./barcode_qrcode_scanner_single_page.html', responseClone))
            .catch(() => {});
          return response;
        })
        .catch(() => caches.match('./barcode_qrcode_scanner_single_page.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone))
          .catch(() => {});
        return response;
      });
    })
  );
});
