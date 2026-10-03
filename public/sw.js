// Note Nest Service Worker
const CACHE_NAME = 'note-nest-shell-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/N%20Emblem.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strictly NEVER intercept or cache:
  // 1. Non-GET requests (mutations, saves, form submissions)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Firebase, Google Auth, Groq, Pinecone or external APIs
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('groq') ||
    url.hostname.includes('pinecone')
  ) {
    return;
  }

  // 3. Application API routes (/api/*)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. Next.js server actions or data requests
  if (url.pathname.startsWith('/_next/data/')) {
    return;
  }

  // Static assets (CSS, JS, fonts, images) -> Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Page navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }
});
