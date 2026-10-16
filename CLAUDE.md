# sbmadhav.com

Personal site on GitHub Pages (served at https://sbmadhav.com, www redirects to it; `CNAME` holds the domain, branch `master`).

## Building new pages

- Every new page follows the design system. It lives in its own repo, https://github.com/sbmadhav/design-system (a sibling clone at `../design-system`), and GitHub Pages serves it at https://sbmadhav.com/design-system/. Read its `README.md` first.
- Every page gets the site-wide Explore menu: a `<button id="exploreBtn" class="xp-btn">` in the header plus `<script src="/assets/explore.js" defer>` (the template already has both). When you add a page, add one entry to `PAGES` at the top of `assets/explore.js`. Pages in other repos served under sbmadhav.com (for example `/state-of-voice-agents/` from the `state-of-voice-agents` repo) load the same `/assets/explore.js`.
- The Explore menu has the site-wide Pause motion switch (WCAG 2.2.2). It puts `motion-paused` on `<html>` (saved as `motion` in localStorage). Every page treats that class exactly like `prefers-reduced-motion: reduce`: add `html.motion-paused` next to each reduced-motion CSS rule, and make scripts that animate decoration check `window.siteMotion.paused()` (or the class) and listen for the `sitemotion` event on `document`. `/design-system/components.css` already stops CSS animation under the class.
- Pages with repeated navigation start with a "Skip to content" link to `<main id="main" tabindex="-1">`.
- Every page also loads `<script src="/assets/analytics.js" defer>` (GoatCounter: free, cookieless). Record notable actions with `window.siteTrack('area/action', 'Readable title')`; never send personal data. GoatCounter's `count.js` is vendored as `assets/count.js` (no third-party script runs on the site); its header names the upstream commit and sha384, which `site-build.py` checks. Update it by replacing the file body and the header together.
- Start from `template.html` in the design-system repo; link `/design-system/tokens.css` then `/design-system/components.css`.
- Use tokens (`var(--coral)`, `var(--space-6)`, `var(--radius-lg)`), never raw hex. Text on accent fills uses `var(--on-accent)`, not white.
- Support both color schemes (Daybreak light, Deep Space dark; system default with a saved override) and kid mode (`.pro` / `.kid` spans, `body.kidmode`).
- `/vedic-math/` is its own repo, `sbmadhav/vedic-math` (GitHub project Pages under this domain, like `/state-of-voice-agents/`). Its rules live in that repo's CLAUDE.md. It loads `/design-system/tokens.css`, `/design-system/components.css`, `/assets/explore.js`, `/assets/analytics.js`, `/assets/fonts/` and `/manifest.webmanifest` from this site by absolute URL, so do not rename or remove those.
- Never use em dashes in copy.
- Token, component and guideline changes happen in the design-system repo: edit `tokens.json` or `README.md` there, run `python3 build.py` there and push its `main` (its own CLAUDE.md has the details). A push there restyles every page here. To run this site locally with styles, link the clone in: `ln -s ../design-system design-system` (ignored by git).

## Home page performance and offline (PWA)

- `index.html` holds the markup and critical CSS; the app logic is in `assets/app.js` (loaded with `defer`). Fonts are self-hosted in `assets/fonts/` (no Google Fonts requests).
- `sw.js` caches the site for offline use and instant repeat visits; `manifest.webmanifest` makes it installable.
- Never commit cache stamps. In git, `index.html` loads plain `assets/app.js` (no `?v=`) and `sw.js` keeps `const VERSION = 'dev'`. The CI deploy runs `python3 site-build.py --out _site`, which copies the publishable files and stamps the copies (`?v=<hash>` on the scripts, a hash `VERSION` in `sw.js`), so there is nothing to run after editing. The build fails if the source carries stamps.
- The build also writes a Content-Security-Policy `<meta>` (and `<meta name="referrer">`) into every published `.html` file, with the sha256 of each inline script, so never hand-write either tag or hash. The policy (`CSP` in `site-build.py`) allows this origin plus GoatCounter's beacon host; a new origin, worker, frame or inline event handler needs a change there (the build fails on `onclick="..."` attributes and `javascript:` URLs). `e2e/tests/csp.spec.ts` fails on any violation; run it against a build: `python3 site-build.py --out _site && node e2e/local-server.mjs 8123 _site`.
- A `'dev'` service worker caches nothing (network only). Registration is https only, so `python3 -m http.server` never runs the worker; to test it, build `_site` and register `/sw.js` by hand on localhost.
- Keep first load light: no new third-party requests before load (analytics loads after load and idle), images as WebP with width/height, decorative motion starts after the page is ready.

## Checks, hook and deploy

- Pre-commit hook in `.githooks/pre-commit`. Enable it on a fresh clone with `git config core.hooksPath .githooks`. It runs the token check, then builds into a throwaway directory to catch build errors and committed stamps.
- `python3 scripts/check-tokens.py` compares the inline color variables in `index.html` (light and both dark blocks) with a pinned copy of the design tokens, `scripts/design-tokens.json`, so it works offline and in CI without the network. When a color changes in the design-system repo, run `python3 scripts/check-tokens.py --refresh` to update the pin, fix `index.html` until the check passes, and commit both. CI also warns (never fails) when the pin is behind the design-system repo (`--upstream`).
- `.github/workflows/site.yml` runs the token checks and the build on pushes and pull requests to `master`, and checks that `_site/` is stamped and holds no repo-only files. Its `deploy` job publishes that `_site/` through GitHub Actions only when the repository variable `PAGES_VIA_ACTIONS` is `true` (and Pages source is set to "GitHub Actions"); otherwise Pages deploys the `master` branch with Jekyll, which publishes the unstamped source.
- Workflows pin every action to a full commit SHA with the version in a trailing comment (`uses: actions/checkout@<sha> # v6.1.0`), set least-privilege `permissions:` and check out with `persist-credentials: false`. `.github/dependabot.yml` opens weekly update PRs for the actions and `e2e/` npm packages.
- Repo-only files are listed once, in `exclude` in `_config.yml` (one `- item` per line). `site-build.py` and Jekyll both read it. Paths starting with `.` or `_` are always left out.

## End-to-end tests (Playwright)

- `e2e/` holds Playwright tests that run against the LIVE site and its real dependencies (the design-system, vedic-math and state-of-voice-agents repos under the same domain, fonts, the service worker). Specs are in `e2e/tests/`; `fixtures.ts` answers GoatCounter locally so runs never count as visits.
- Every change that affects behavior updates or adds the matching Playwright test in `e2e/` in the same commit. Run `cd e2e && npm ci && npx playwright test` before pushing.
- To test a branch before it is live: `cd e2e && node local-server.mjs 8123` (serves this checkout and proxies the other repos' paths to the live site), then `BASE_URL=http://localhost:8123 npx playwright test`. The service worker checks need https, so they skip locally.
- Known live issues are `test.fixme` with a note (for example `KNOWN` in `e2e/tests/a11y.spec.ts`); remove the entry once fixed.
- `.github/workflows/e2e.yml` runs the suite daily, on demand, and after each push to `master` (it waits until the live files match the commit).
