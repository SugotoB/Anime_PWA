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

// IndexedDB Helpers
const openDB = () => {
    const DB_NAME = 'animeTrackerDB';
    const DB_VERSION = 6;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error opening IndexedDB:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains('offlineData')) {
                db.createObjectStore('offlineData', { keyPath: 'mal_id' });
            }
            if (!db.objectStoreNames.contains('userListData')) {
                db.createObjectStore('userListData', { keyPath: 'id' });
            }

            console.log('IndexedDB upgraded to version', DB_VERSION);
        };
    });
};

const clearAndAddToDB = async (storeName, data) => {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Clear existing data (wait for clear to finish)
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = (event) => reject(event.target.error);
        });

        console.log(`Cleared ${storeName} in IndexedDB.`);

        // Add new data
        if (Array.isArray(data)) {
            data.forEach((item) => store.put(item));
        } else {
            store.put(data);
        }

        console.log(`Added new data to ${storeName} in IndexedDB.`);
    } catch (error) {
        console.error(`Failed to update ${storeName}:`, error);
    }
};

const clearAndSyncDB = async (storeName, newData) => {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Step 1: Get existing data from IndexedDB
        let existingData = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });

        if (!Array.isArray(existingData)) {
            console.error(`Existing data in ${storeName} is not an array:`, existingData);
            return;
        }

        if (existingData.length === 0) {
            console.log(`No existing data in ${storeName}, adding new data.`);
            newData.forEach((item) => store.put(item));
            console.log(`Added new data to ${storeName} in IndexedDB.`);
            return;
        }

        const newIds = new Set(newData.map((item) => item.id));

        for (const item of existingData) {
            if (!newIds.has(item.id)) {
                store.delete(item.id);
                console.log(`Deleted ${item.id} from ${storeName}`);
            }
        }

        newData.forEach((item) => store.put(item));

        console.log(`Synced ${storeName} in IndexedDB.`);
    } catch (error) {
        console.error(`Failed to sync ${storeName}:`, error);
    }
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
            console.log('Static assets cached');

            try {
                const offlineResponse = await fetch(OFFLINE_API_URL);
                const offlineData = await offlineResponse.json();
                await clearAndAddToDB('offlineData', offlineData);

                const userListResponse = await fetch(LIST_API_URL);
                const userListData = await userListResponse.json();
                await clearAndAddToDB('userListData', userListData);

                console.log('API data cached in IndexedDB');
            } catch (error) {
                console.warn('Failed to cache API data:', error.message);
            }
        })()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then(async (response) => {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();

                    if (request.url.includes(LIST_API_URL)) {
                        await clearAndSyncDB('userListData', data);
                    } else if (request.url.includes(OFFLINE_API_URL)) {
                        await clearAndAddToDB('offlineData', data);
                    }

                    return response;
                })
                .catch(async () => {
                    console.warn('Network unavailable. Serving API data from IndexedDB.');

                    // Fallback to IndexedDB
                    if (request.url.includes(LIST_API_URL)) {
                        const data = await getAllDataFromDB('userListData');
                        return new Response(JSON.stringify(data), {
                            headers: { 'Content-Type': 'application/json' },
                        });
                    } else if (request.url.includes(OFFLINE_API_URL)) {
                        const data = await getAllDataFromDB('offlineData');
                        return new Response(JSON.stringify(data), {
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }

                    return new Response('Offline content unavailable.', { status: 503 });
                })
        );
    } else {
        event.respondWith(
            caches.match(request).then((cachedResponse) => cachedResponse || fetch(request))
        );
    }
});
