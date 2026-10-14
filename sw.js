/* sbmadhav.com service worker: makes the site work offline and load instantly on repeat visits.
   VERSION is stamped by site-build.py; run the script whenever site files change.

   Scope: registered from the home page with scope "/". It leaves /state-of-voice-agents/ and
   /vedic-math/ alone (those paths are served from their own repos, so this file cannot version
   them) and every other origin's requests.
   /design-system/ is also another repo (sbmadhav/design-system) but it is precached like the
   rest, because the offline page needs tokens.css. VERSION cannot hash those files, so a design
   system change reaches visitors through the background refresh below (one visit late).

   KILL SWITCH (retire the worker): set KILL = true below and deploy sw.js. Browsers re-check
   sw.js on the next visit; the new worker then deletes this site's caches (madhav-*), unregisters
   itself and reloads open tabs so they come straight from the network. Keep the kill version
   deployed for a few weeks so returning visitors pick it up, then sw.js can be deleted (and the
   register call in assets/app.js removed). */
const KILL = false;
const VERSION = 'eeee1154d1';
const CACHE = `madhav-${VERSION}`;
const RUNTIME_MAX = 150; // entries kept beyond the precache list; the oldest go first
const NETWORK_ONLY = ['/state-of-voice-agents/', '/vedic-math/'];
const PRECACHE = [
  './',
  'index.html',
  'assets/app.js?v=26402283f3',
  'assets/explore.js?v=140c0b4e82',
  'assets/profile.webp',
  'assets/fonts/fredoka-latin-600-normal.woff2',
  'assets/fonts/fredoka-latin-700-normal.woff2',
  'assets/fonts/nunito-sans-latin-wght-normal.woff2',
  'assets/fonts/space-grotesk-latin-wght-normal.woff2',
  'assets/fonts/jetbrains-mono-latin-500-normal.woff2',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'manifest.webmanifest',
  'design-system/',
  'design-system/tokens.css',
  'design-system/components.css'
];
const PRECACHED = new Set(PRECACHE.map(p => new URL(p, self.registration.scope).href));

if (KILL) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', event => {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('madhav-')).map(k => caches.delete(k)));
      await self.clients.claim();
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: 'window' });
      await Promise.all(tabs.map(t => t.navigate(t.url).catch(() => null)));
    })());
  });
} else {
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
    if (NETWORK_ONLY.some(p => url.pathname.startsWith(p) || url.pathname === p.slice(0, -1))) return;

    // Pages: network first so updates show up; this page's cached copy when offline or slow
    if (req.mode === 'navigate') {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        try {
          const net = await Promise.race([
            fetch(req),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
          ]);
          if (cacheable(net)) put(cache, req, net.clone());
          return net;
        } catch (e) {
          return (await cache.match(req, { ignoreSearch: true })) || offlinePage();
        }
      })());
      return;
    }

    // Unversioned workers: network first, so they never lag behind the scripts that start them
    const unversioned = !url.searchParams.has('v') && req.destination === 'worker';
    if (unversioned) {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        try {
          const net = await fetch(req);
          if (cacheable(net)) put(cache, req, net.clone());
          return net;
        } catch (e) {
          return (await cache.match(req)) || Response.error();
        }
      })());
      return;
    }

    // Everything else from this site: cache first, refresh in the background
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      const refresh = fetch(req).then(res => { if (cacheable(res)) put(cache, req, res.clone()); return res; }).catch(() => null);
      if (hit) { event.waitUntil(refresh); return hit; }
      return (await refresh) || Response.error();
    })());
  });
}

/* Only successful same-origin responses go in the cache (no errors, redirects or opaque responses) */
function cacheable(res) { return !!res && res.ok && res.type === 'basic'; }

/* Store a response, then trim runtime entries (anything not in the precache list) to RUNTIME_MAX, oldest first */
async function put(cache, req, res) {
  try {
    await cache.put(req, res);
    const keys = (await cache.keys()).filter(k => !PRECACHED.has(k.url));
    const extra = keys.length - RUNTIME_MAX;
    for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
  } catch (e) { /* quota or a locked cache: skip caching */ }
}

/* Shown when a page was never visited online. Uses the precached design tokens, so it follows the
   saved scheme or the system one (Daybreak light, Deep Space dark), and falls back to the browser's
   own light or dark colors if the tokens are missing. */
function offlinePage() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Offline · Madhav</title>
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
<link rel="stylesheet" href="/design-system/tokens.css">
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg,Canvas);color:var(--ink,CanvasText);font-family:var(--font-sans,system-ui,sans-serif);padding:var(--space-6,24px);box-sizing:border-box}
main{max-width:30rem;text-align:center}
h1{font-family:var(--display,system-ui,sans-serif);margin:0 0 .5em}
p{color:var(--ink-muted,inherit);line-height:1.5}
a{display:inline-block;margin-top:1em;padding:.7em 1.4em;border-radius:var(--radius-lg,22px);background:var(--coral,LinkText);color:var(--on-accent,Canvas);font-weight:700;text-decoration:none}
</style>
</head>
<body>
<main>
<h1>You are offline</h1>
<p>This page has not been saved on this device yet, so it needs a connection. Pages you have opened before still work offline.</p>
<a href="/">Go to the home page</a>
</main>
</body>
</html>`;
  return new Response(html, { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
