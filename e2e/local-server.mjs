// Serves this checkout for local end-to-end runs. Paths that live in other repos
// (/design-system/, /vedic-math/, /state-of-voice-agents/) come from the live site,
// so the suite runs exactly as on sbmadhav.com but with this branch's files.
//   node local-server.mjs [port]     (default 8123; 8000 is often taken)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || process.env.PORT || 8123);
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
    const pathname = decodeURIComponent(url.pathname);
    if (PROXIED.some(pre => pathname.startsWith(pre) || pathname === pre.slice(0, -1))) return await proxy(req, res);
    if (BLOCKED.test(pathname)) { res.writeHead(404); return res.end(); }
    // GitHub Pages redirects a folder without its slash
    const s = await stat(path.join(root, pathname)).catch(() => null);
    if (s && s.isDirectory() && !pathname.endsWith('/')) { res.writeHead(301, { location: pathname + '/' + url.search }); return res.end(); }
    const f = await file(path.join(root, pathname));
    if (f) { res.writeHead(200, { 'content-type': TYPES[path.extname(f.p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); return res.end(f.body); }
    const nf = await readFile(path.join(root, '404.html'));
    res.writeHead(404, { 'content-type': TYPES['.html'] }); res.end(nf);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, () => console.log(`sbmadhav.com (this checkout) on http://localhost:${port}`));
