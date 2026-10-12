/* sbmadhav.com service worker: makes the site work offline and load instantly on repeat visits.
   VERSION is stamped by site-build.py; bump it (run the script) whenever site files change. */
const VERSION = '90631a0b53';
const CACHE = `madhav-${VERSION}`;
const PRECACHE = [
  './',
  'index.html',
  'assets/app.js?v=2e146bd9f1',
  'assets/profile.webp',
  'assets/fonts/fredoka-latin-600-normal.woff2',
  'assets/fonts/fredoka-latin-700-normal.woff2',
  'assets/fonts/nunito-sans-latin-wght-normal.woff2',
  'assets/fonts/space-grotesk-latin-wght-normal.woff2',
  'assets/fonts/jetbrains-mono-latin-500-normal.woff2',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('madhav-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Pages: network first so updates show up, cached copy when offline or slow
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await Promise.race([
          fetch(req),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (e) {
        return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./')) || (await cache.match('index.html'));
      }
    })());
    return;
  }

  // Everything else from this site: cache first, refresh in the background
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const refresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await refresh) || Response.error();
  })());
});
