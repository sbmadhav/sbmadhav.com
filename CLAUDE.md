# sbmadhav.com

Personal site on GitHub Pages (served at https://sbmadhav.com, www redirects to it; `CNAME` holds the domain, branch `master`).

## Building new pages

- Every new page follows the design system in `design-system/`. Read `design-system/README.md` first.
- Every page gets the site-wide Explore menu: a `<button id="exploreBtn" class="xp-btn">` in the header plus `<script src="/assets/explore.js" defer>` (the template already has both). When you add a page, add one entry to `PAGES` at the top of `assets/explore.js`. Pages in other repos served under sbmadhav.com (for example `/state-of-voice-agents/` from the `state-of-voice-agents` repo) load the same `/assets/explore.js`.
- Every page also loads `<script src="/assets/analytics.js" defer>` (GoatCounter: free, cookieless). Record notable actions with `window.siteTrack('area/action', 'Readable title')`; never send personal data.
- Start from `design-system/template.html`; link `/design-system/tokens.css` then `/design-system/components.css`.
- Use tokens (`var(--coral)`, `var(--space-6)`, `var(--radius-lg)`), never raw hex. Text on accent fills uses `var(--on-accent)`, not white.
- Support both color schemes (Daybreak light, Deep Space dark; system default with a saved override) and kid mode (`.pro` / `.kid` spans, `body.kidmode`).
- `/vedic-math/` is its own repo, `sbmadhav/vedic-math` (GitHub project Pages under this domain, like `/state-of-voice-agents/`). Its rules live in that repo's CLAUDE.md. It loads `/design-system/tokens.css`, `/design-system/components.css`, `/assets/explore.js`, `/assets/analytics.js`, `/assets/fonts/` and `/manifest.webmanifest` from this site by absolute URL, so do not rename or remove those. To rebuild that repo from a `vedic-math/` folder (only before the cutover), run `scripts/split-vedic-math.sh`.
- Never use em dashes in copy.
- If a token or the guidelines change, edit `design-system/tokens.json` or `design-system/README.md`, then run `python3 design-system/build.py` to regenerate `tokens.css` and the reference page `design-system/index.html`.

## Home page performance and offline (PWA)

- `index.html` holds the markup and critical CSS; the app logic is in `assets/app.js` (loaded with `defer`). Fonts are self-hosted in `assets/fonts/` (no Google Fonts requests).
- `sw.js` caches the site for offline use and instant repeat visits; `manifest.webmanifest` makes it installable.
- After editing `index.html`, `assets/app.js` or anything `sw.js` precaches, run `python3 site-build.py` so visitors get the new version (it stamps the app.js version and the service worker cache version).
- Keep first load light: no new third-party requests before load (analytics loads after load and idle), images as WebP with width/height, decorative motion starts after the page is ready.

## Checks, hook and deploy

- Pre-commit hook in `.githooks/pre-commit`. Enable it on a fresh clone with `git config core.hooksPath .githooks`. It runs both builds and fails if either changed a file (stage the regenerated files and commit again), then runs the token check.
- `python3 scripts/check-tokens.py` compares the inline color variables in `index.html` (light and both dark blocks) with `design-system/tokens.json`. When a color changes, change both.
- `.github/workflows/site.yml` runs the same checks on pushes and pull requests to `master`. Its `deploy` job publishes `_site/` through GitHub Actions only when the repository variable `PAGES_VIA_ACTIONS` is `true` (and Pages source is set to "GitHub Actions"); otherwise Pages keeps deploying the `master` branch with Jekyll.
- Repo-only files are listed twice: `exclude` in `_config.yml` and the `rsync --exclude` list in the workflow. Keep them in sync when adding one.
