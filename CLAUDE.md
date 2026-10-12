# sbmadhav.com

Personal site on GitHub Pages (served at https://sbmadhav.com, www redirects to it; `CNAME` holds the domain, branch `master`).

## Building new pages

- Every new page follows the design system in `design-system/`. Read `design-system/README.md` first.
- Start from `design-system/template.html`; link `/design-system/tokens.css` then `/design-system/components.css`.
- Use tokens (`var(--coral)`, `var(--space-6)`, `var(--radius-lg)`), never raw hex. Text on accent fills uses `var(--on-accent)`, not white.
- Support both color schemes (Daybreak light, Deep Space dark; system default with a saved override) and kid mode (`.pro` / `.kid` spans, `body.kidmode`).
- Never use em dashes in copy.
- If a token or the guidelines change, edit `design-system/tokens.json` or `design-system/README.md`, then run `python3 design-system/build.py` to regenerate `tokens.css` and the reference page `design-system/index.html`.

## Home page performance and offline (PWA)

- `index.html` holds the markup and critical CSS; the app logic is in `assets/app.js` (loaded with `defer`). Fonts are self-hosted in `assets/fonts/` (no Google Fonts requests).
- `sw.js` caches the site for offline use and instant repeat visits; `manifest.webmanifest` makes it installable.
- After editing `index.html`, `assets/app.js` or anything `sw.js` precaches, run `python3 site-build.py` so visitors get the new version (it stamps the app.js version and the service worker cache version).
- Keep first load light: no new third-party requests, images as WebP with width/height, decorative motion starts after the page is ready.
