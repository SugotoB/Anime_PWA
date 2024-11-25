const CACHE_NAME = 'anime-pwa-cache-v1';
const API_CACHE_NAME = 'anime-api-cache-v1';
const STATIC_ASSETS = [
    '/',                // Root index
    '/index.html',      // HTML file
    '/style.css',       // Stylesheet
    '/clientscripts/client.js', // Main client-side JS
    '/clientscripts/serviceworker.js',     // Service Worker itself
    '/images/icon.png', // App Icon
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
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Deleting Old Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercept Fetch Requests
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Handle API calls
    if (request.url.includes('/api/')) {
        event.respondWith(networkFirst(request));
    } 
    // Handle Static Assets
    else {
        event.respondWith(cacheFirst(request));
    }
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
}

// Network-first strategy for API calls
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Save a copy in the cache
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());

        return networkResponse;
    } catch (error) {
        console.error('Network Request Failed. Serving from Cache:', error);

        // Serve from cache if available
        const cache = await caches.open(API_CACHE_NAME);
        return await cache.match(request) || new Response('Offline data unavailable.', { status: 503 });
    }
}
