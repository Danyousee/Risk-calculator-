// sw.js - Service Worker for Perpetual Risk Calculator

const CACHE_NAME = 'perpetual-risk-calculator-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-brands-400.woff2'
];

// Install event - cache all assets
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

// Activate event - clean up old caches
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                try {
                                    cache.put(event.request, responseToCache);
                                } catch (e) {
                                    console.log('Service Worker: Cache put error:', e);
                                }
                            });
                        return response;
                    })
                    .catch(() => {
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
                                </style>
                            </head>
                            <body>
                                <div class="offline-container">
                                    <div class="icon">📡</div>
                                    <h1>You're Offline</h1>
                                    <p>Please check your internet connection.</p>
                                    <p style="font-size:14px;margin-top:12px;">Your data is safely stored locally.</p>
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

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
