/* Site analytics: GoatCounter (free, open source, no cookies, no personal data).
   Shared by every page on sbmadhav.com, including pages from other repos.

   - Counts page views (including in-app page changes in single-page apps) and a few named events (games played, music, kid mode, menu use, outbound links).
   - Loads only after the page has finished loading and the browser is idle, so it never slows the first view.
   - Respects Do Not Track and Global Privacy Control, and skips local development.

   Pages call window.siteTrack('event-name', 'Readable title') for custom events; it is always safe to call. */
(() => {
  const CODE = 'sbmadhav';                                   // GoatCounter site code: https://sbmadhav.goatcounter.com
  const ENDPOINT = `https://${CODE}.goatcounter.com/count`;
  const SCRIPT = 'https://gc.zgo.at/count.js';

  const optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local|.*\.test)$/.test(location.hostname);
  const off = optedOut || local;

  const queue = [];
  const ready = () => !!(window.goatcounter && typeof window.goatcounter.count === 'function');
  // Never throws: if count.js is blocked or not there yet, keep the event queued instead
  const send = e => { if (ready()) window.goatcounter.count(e); else queue.push(e); };
  window.siteTrack = (name, title) => {
    if (off || !name) return;
    const e = { path: String(name).slice(0, 120), title: (title || name).toString().slice(0, 120), event: true };
    send(e);
  };
  if (off) return;

  // Outbound links (LinkedIn, GitHub, sources) counted as events
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || a.host === location.host || !/^https?:/.test(a.protocol)) return;
    window.siteTrack('out/' + a.host + a.pathname.replace(/\/$/, ''), 'Outbound: ' + (a.textContent || a.host).trim());
  }, true);

  // Single-page apps (for example the Next.js splash screen app) change pages without a reload: count those too
  let lastPath = location.pathname;
  const onRoute = () => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    const pv = { path: location.pathname, title: document.title };
    setTimeout(() => { pv.title = document.title; send(pv); }, 150);
  };
  ['pushState', 'replaceState'].forEach(m => {
    const orig = history[m];
    history[m] = function () { const r = orig.apply(this, arguments); onRoute(); return r; };
  });
  addEventListener('popstate', onRoute);

  function load() {
    const s = document.createElement('script');
    s.async = true;
    s.src = SCRIPT;
    s.dataset.goatcounter = ENDPOINT;
    s.onload = () => setTimeout(() => queue.splice(0).forEach(send), 300);
    document.head.appendChild(s);
  }
  const idle = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500);
  if (document.readyState === 'complete') idle(load); else addEventListener('load', () => idle(load), { once: true });
})();
