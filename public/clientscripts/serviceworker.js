const CACHE_NAME = 'anime-pwa-cache-v1';
const STATIC_ASSETS = [
    '/',                // Root index
    '/index.html',      // HTML file
    '/style.css',       // Stylesheet
    '/clientscripts/main.js', // Main client-side JS
    '/clientscripts/serviceworker.js', // Service Worker itself
];

// Install Service Worker and cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching Static Assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting(); // Activate immediately after install
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting Old Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Ensure SW controls all clients
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Serve local database or images directly
    if (request.url.endsWith('.db') || request.url.includes('/images/')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then(async (response) => {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, response.clone());
                    return response;
                });
            })
        );
        return;
    }

    // Serve other static assets from the cache
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request);
        })
    );
});
