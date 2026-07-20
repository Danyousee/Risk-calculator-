// SW.js - Improved Service Worker

const CACHE_NAME = 'perpetual-risk-calculator-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker: All assets cached!');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated and ready!');
            return self.clients.claim();
        })
    );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            try {
                                cache.put(event.request, responseClone);
                            } catch (e) {
                                console.log('Cache put error:', e);
                            }
                        });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Offline fallback
                        return new Response(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Offline</title>
                                <style>
                                    body { font-family: Inter, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f8ff; color: #1d3557; text-align: center; padding: 20px; }
                                    .offline-container { max-width: 400px; }
                                    h1 { font-size: 28px; margin-bottom: 12px; }
                                    p { color: #6b7b93; line-height: 1.6; }
                                    .icon { font-size: 64px; margin-bottom: 20px; }
                                    .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #1565ff; color: white; border: none; border-radius: 12px; text-decoration: none; font-weight: 600; }
                                </style>
                            </head>
                            <body>
                                <div class="offline-container">
                                    <div class="icon">📡</div>
                                    <h1>You're Offline</h1>
                                    <p>Please check your internet connection.</p>
                                    <p style="font-size:14px;margin-top:12px;">Your data is safely stored locally.</p>
                                    <button class="btn" onclick="location.reload()">Retry</button>
                                </div>
                            </body>
                            </html>
                        `, {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
    );
});

// Handle messages
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
