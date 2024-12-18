const CACHE_NAME = 'anime-tracker-cache-v1';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/clientscripts/main.js',
    '/images/animeicon.png',
    '/images/animeicon-192.png',
    '/images/animeicon-512.png',
    '/manifest.json'
];

// API endpoints for offline support
const OFFLINE_API_URL = '/api/offline';
const LIST_API_URL = '/api/userlist';

// Install event - Cache static assets and skip waiting
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    
    self.skipWaiting();  // Force the waiting service worker to become active immediately
});

// Activate event - Cleanup old caches and claim clients
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages as soon as the service worker is activated
            return clients.claim();
        })
    );
});

// Fetch event - Serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Handle static asset requests
    if (STATIC_ASSETS.includes(request.url) || request.url.includes('/images/')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    } 
    // Handle API requests (network-first strategy)
    else if (request.url.startsWith(OFFLINE_API_URL) || request.url.startsWith(LIST_API_URL)) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache API responses for offline usage
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Return cached response if offline
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || new Response('Network error', { status: 408 });
                    });
                })
        );
    } else {
        // Default strategy - Cache first, then network
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    }
});
