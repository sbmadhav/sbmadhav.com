// Serves this checkout for local end-to-end runs. Paths that live in other repos
// (/design-system/, /vedic-math/, /state-of-voice-agents/) come from the live site,
// so the suite runs exactly as on sbmadhav.com but with this branch's files.
//   node local-server.mjs [port] [dir]   (default 8123; 8000 is often taken)
// dir (relative to the checkout) serves a build instead, for example _site from
// `python3 site-build.py --out _site`, which carries the stamps and the Content-Security-Policy.
// Listens on 127.0.0.1 only and never serves a file outside this checkout.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(checkout, process.argv[3] || '.');
if (root !== checkout && !root.startsWith(checkout + path.sep)) throw new Error('dir must be inside the checkout');
const port = +(process.argv[2] || process.env.PORT || 8123);
const host = process.env.HOST || '127.0.0.1';
const LIVE = 'https://sbmadhav.com';
const PROXIED = ['/design-system/', '/vedic-math/', '/state-of-voice-agents/'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const BLOCKED = /^\/(e2e|scripts|\.git|\.github|\.githooks)(\/|$)|^\/(CLAUDE|README)\.md$|^\/site-build\.py$/;

async function proxy(req, res) {
  const r = await fetch(LIVE + req.url, { redirect: 'manual' });
  const headers = {};
  r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k)) headers[k] = v; });
  if (headers.location) headers.location = headers.location.replace(LIVE, '');
  res.writeHead(r.status, headers);
  res.end(Buffer.from(await r.arrayBuffer()));
}

async function file(p) {
  try { const s = await stat(p); if (s.isDirectory()) p = path.join(p, 'index.html'); return { p, body: await readFile(p) }; } catch { return null; }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const decoded = decodeURIComponent(url.pathname);
    // Resolve encoded slashes and dot segments (/..%2f..%2fetc/hosts) before any check
    const full = path.resolve(root, '.' + path.posix.normalize(decoded));
    if (full !== root && !full.startsWith(root + path.sep)) { res.writeHead(404); return res.end(); }
    const pathname = '/' + path.relative(root, full).split(path.sep).join('/') + (decoded.endsWith('/') && full !== root ? '/' : '');
    if (PROXIED.some(pre => pathname.startsWith(pre) || pathname === pre.slice(0, -1))) return await proxy(req, res);
    if (BLOCKED.test(pathname)) { res.writeHead(404); return res.end(); }
    // GitHub Pages redirects a folder without its slash
    const s = await stat(full).catch(() => null);
    if (s && s.isDirectory() && !pathname.endsWith('/')) { res.writeHead(301, { location: pathname + '/' + url.search }); return res.end(); }
    const f = await file(full);
    if (f) { res.writeHead(200, { 'content-type': TYPES[path.extname(f.p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); return res.end(f.body); }
    const nf = await readFile(path.join(root, '404.html'));
    res.writeHead(404, { 'content-type': TYPES['.html'] }); res.end(nf);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, host, () => console.log(`sbmadhav.com (${root === checkout ? 'this checkout' : path.relative(checkout, root)}) on http://localhost:${port}`));
