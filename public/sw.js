const CACHE = 'workout-v3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== 'workout-v3').map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  // Never intercept API calls — pass them straight to the network
  if (e.request.url.includes('/api/') || e.request.url.includes('groq') || e.request.url.includes('anthropic') || e.request.url.includes('supabase')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(() => caches.match('/index.html'))));
});
