const CACHE_NAME = 'anime-tracker-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/clientscripts/main.js',
    '/images/animeicon.png',
    '/manifest.json'
];

const OFFLINE_API_URL = '/api/offline';
const LIST_API_URL = '/api/userlist';

// Open IndexedDB and return the instance
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('animeTrackerDB', 2);  // Increment the version to ensure onupgradeneeded is triggered
        request.onerror = (event) => {
            console.error("IndexedDB open error", event.target.error);
            reject(event.target.error);
        };
        request.onsuccess = (event) => {
            console.log("IndexedDB opened successfully");
            resolve(event.target.result);
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create object stores if they do not exist
            if (!db.objectStoreNames.contains('offlineData')) {
                db.createObjectStore('offlineData', { keyPath: 'mal_id' });
                console.log("Created object store 'offlineData'");
            }
            if (!db.objectStoreNames.contains('userListData')) {
                db.createObjectStore('userListData', { keyPath: 'id' });
                console.log("Created object store 'userListData'");
            }
        };
    });
};

// Save data to IndexedDB
const saveToIndexedDB = async (data, storeName) => {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Save each item from data into the IndexedDB store
        data.forEach(item => {
            console.log(`Saving item to IndexedDB: ${JSON.stringify(item)}`);
            store.put(item);  // Save the item
        });
        
        // Wait for the transaction to complete
        await transaction.complete;
        console.log('Data saved to IndexedDB');
    } catch (err) {
        console.error('Error saving data to IndexedDB:', err);
    }
};

// Fetch and cache offline data, and store it in IndexedDB
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log('Caching static assets');
            await cache.addAll(STATIC_ASSETS);

            try {
                // Fetch offline data from the API
                const response = await fetch(OFFLINE_API_URL);
                const data = await response.json();
                const offlineResponse = new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' }
                });
                await cache.put(OFFLINE_API_URL, offlineResponse);
                console.log('Cached offline table data');

                // Save offline data to IndexedDB in 'offlineData' store
                await saveToIndexedDB(data, 'offlineData');

                // Fetch and cache user list data
                const response2 = await fetch(LIST_API_URL);
                const data2 = await response2.json();
                const userlistResponse = new Response(JSON.stringify(data2), {
                    headers: { 'Content-Type': 'application/json' }
                });
                await cache.put(LIST_API_URL, userlistResponse);
                console.log('Cached userlist table data');

                // Save user list data to IndexedDB in 'userListData' store
                await saveToIndexedDB(data2, 'userListData');
            } catch (err) {
                console.warn('Failed to fetch offline table data during installation:', err);
            }
        })()
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
});

// Fetch handler with cache and IndexedDB fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.url.includes('/api/offline')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (!response || response.status !== 200) {
                        throw new Error('Network response was not OK');
                    }
                    return response;
                })
                .catch(async () => {
                    console.warn('Offline: Serving cached or IndexedDB offline data');

                    // First try cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(OFFLINE_API_URL);
                    if (cachedResponse) return cachedResponse;

                    // Then try IndexedDB
                    const db = await openDB();
                    const transaction = db.transaction('offlineData', 'readonly');
                    const store = transaction.objectStore('offlineData');
                    const data = await store.getAll();
                    console.log('Serving data from IndexedDB:', data);
                    return new Response(JSON.stringify(data), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    } else if (request.url.includes('/api/userlist')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (!response || response.status !== 200) {
                        throw new Error('Network response was not OK');
                    }
                    return response;
                })
                .catch(async () => {
                    console.warn('Offline: Serving cached or IndexedDB user list data');

                    // First try cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(LIST_API_URL);
                    if (cachedResponse) return cachedResponse;

                    // Then try IndexedDB
                    const db = await openDB();
                    const transaction = db.transaction('userListData', 'readonly');
                    const store = transaction.objectStore('userListData');
                    const data = await store.getAll();
                    console.log('Serving data from IndexedDB:', data);
                    return new Response(JSON.stringify(data), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    } else {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    }
});
