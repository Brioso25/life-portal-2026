const CACHE_VERSION = 3;
const CACHE_NAME = 'ricardo-portal-v' + CACHE_VERSION;
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(URLS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Network-first for API calls and Firebase
  if (url.includes('api.open-meteo.com') ||
      url.includes('api.openai.com') ||
      url.includes('generativelanguage.googleapis.com') ||
      url.includes('firebaseio.com') ||
      url.includes('googleapis.com/identitytoolkit') ||
      url.includes('openlibrary.org') ||
      url.includes('api.themoviedb.org') ||
      url.includes('api.unsplash.com') ||
      url.includes('quotable.io') ||
      url.includes('open.spotify.com')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Stale-while-revalidate for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
