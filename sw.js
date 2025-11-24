// Service Worker per VIT Cyber
// Permette il funzionamento offline completo

const CACHE_NAME = 'vit-cyber-v31';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css?v=31',
  './js/app.js?v=31',
  './js/data-embedded.js?v=31',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  // Forza l'attivazione immediata
  self.skipWaiting();
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendi il controllo immediato di tutti i client
  return self.clients.claim();
});

// Strategia: Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - ritorna la risposta dalla cache
        if (response) {
          return response;
        }

        // Clone della request perché può essere usata una sola volta
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se la risposta è valida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone della risposta perché può essere usata una sola volta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((err) => {
          console.log('[SW] Fetch failed, serving from cache if available:', err);
          // Se il fetch fallisce, prova a servire dalla cache
          return caches.match(event.request);
        });
      })
  );
});

// Gestione dei messaggi dal client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
