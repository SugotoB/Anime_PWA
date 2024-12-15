// Open or create IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('animeTrackerDB', 3);

        request.onerror = (event) => reject(event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Object store for API GET data (offline support)
            if (!db.objectStoreNames.contains('offlineData')) {
                db.createObjectStore('offlineData', { keyPath: 'mal_id' });
            }

            // Object store for user's list data
            if (!db.objectStoreNames.contains('userListData')) {
                db.createObjectStore('userListData', { keyPath: 'id' });
            }

            // Object store to queue requests for offline sync
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { autoIncrement: true });
            }

            console.log('IndexedDB stores created or upgraded');
        };
    });
};

// Add data to a specified store
const addData = async (storeName, data) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data);
    return transaction.complete;
};

// Get all data from a specified store
const getAllData = async (storeName) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return store.getAll();
};

// Delete data by key from a specified store
const deleteData = async (storeName, key) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(key);
    return transaction.complete;
};

// Add API request to sync queue
const addToSyncQueue = async (request) => {
    const db = await openDB();
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    store.add(request);
    console.log('Request added to sync queue:', request);
    return transaction.complete;
};

// Process all requests in the sync queue
const processSyncQueue = async () => {
    const db = await openDB();
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const requests = await store.getAll();

    for (const req of requests) {
        try {
            const response = await fetch(req.url, {
                method: req.method,
                headers: req.headers,
                body: req.body ? JSON.stringify(req.body) : null,
            });
            console.log(`Synced ${req.method} request: ${req.url}`);
            store.delete(req.id); // Remove successfully synced requests
        } catch (err) {
            console.warn(`Failed to sync request: ${req.url}`, err);
        }
    }
};



const CACHE_NAME = 'anime-tracker-cache-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/clientscripts/main.js',
    '/images/animeicon.png',
    '/manifest.json',
];

// API endpoints for offline support
const OFFLINE_API_URL = '/api/offline';
const LIST_API_URL = '/api/userlist';


// Install: Cache static assets and API data
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
            console.log('Static assets cached');

            // Fetch and store initial API data in IndexedDB
            const db = await openDB();

            // Fetch user list data
            const userListResponse = await fetch(LIST_API_URL).catch(() => null);
            if (userListResponse) {
                const userListData = await userListResponse.json();
                const userListTransaction = db.transaction('userListData', 'readwrite');
                const userListStore = userListTransaction.objectStore('userListData');
                userListData.forEach((item) => userListStore.put(item));
                console.log('User list data cached in IndexedDB');
            }

            // Fetch offline data
            const offlineResponse = await fetch(OFFLINE_API_URL).catch(() => null);
            if (offlineResponse) {
                const offlineData = await offlineResponse.json();
                const offlineTransaction = db.transaction('offlineData', 'readwrite');
                const offlineStore = offlineTransaction.objectStore('offlineData');
                offlineData.forEach((item) => offlineStore.put(item));
                console.log('Offline API data cached in IndexedDB');
            }
        })()
    );
});

// Activate: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => key !== CACHE_NAME && caches.delete(key))
            );
        })
    );
});

// Fetch handler: Cache-first for static, IndexedDB for APIs
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Handle API requests
    if (request.url.includes('/api/')) {
        if (request.method === 'POST' || request.method === 'DELETE' || request.method === 'PUT') {
            // Offline support for POST/PUT/DELETE
            event.respondWith(
                fetch(request.clone())
                    .catch(async () => {
                        console.warn('Network unavailable. Saving request to sync queue.');

                        const body = await request.clone().json();
                        await addToSyncQueue({
                            url: request.url,
                            method: request.method,
                            headers: Object.fromEntries(request.headers),
                            body: body,
                        });

                        return new Response(
                            JSON.stringify({ success: true, message: 'Request saved for offline sync.' }),
                            { headers: { 'Content-Type': 'application/json' } }
                        );
                    })
            );
        } else if (request.method === 'GET') {
            // GET: Try network, fallback to IndexedDB
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        return response;
                    })
                    .catch(async () => {
                        console.warn('Serving GET request from IndexedDB.');

                        const db = await openDB();
                        if (request.url.includes(LIST_API_URL)) {
                            const transaction = db.transaction('userListData', 'readonly');
                            const store = transaction.objectStore('userListData');
                            const data = await store.getAll();
                            return new Response(JSON.stringify(data), {
                                headers: { 'Content-Type': 'application/json' },
                            });
                        } else if (request.url.includes(OFFLINE_API_URL)) {
                            const transaction = db.transaction('offlineData', 'readonly');
                            const store = transaction.objectStore('offlineData');
                            const data = await store.getAll();
                            return new Response(JSON.stringify(data), {
                                headers: { 'Content-Type': 'application/json' },
                            });
                        }
                        return new Response('Offline content unavailable.', { status: 503 });
                    })
            );
        }
    } else {
        // Static files: Cache-first strategy
        event.respondWith(
            caches.match(request).then((cachedResponse) => cachedResponse || fetch(request))
        );
    }
});

// Listen for online event and process sync queue
self.addEventListener('online', () => {
    console.log('Online! Processing sync queue...');
    processSyncQueue();
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-queue') {
        event.waitUntil(processSyncQueue());
    }
});
