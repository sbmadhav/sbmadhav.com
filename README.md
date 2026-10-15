# sbmadhav.com

Personal site of Madhav Srinivasan, served by GitHub Pages at [sbmadhav.com](https://sbmadhav.com). Every page works for two audiences: a grown-up mode for recruiters and engineers, and a kid mode that says the same things in plainer words.

## Pages

| Path | What it is | Source |
|---|---|---|
| `/` | Home: work, Brain Lab, Bug Hunt, Design Lab, journey | `index.html`, `assets/app.js` |
| `/vedic-math/` | Vedic Math for Everyone: lessons, Dojo, Arena, games, leaderboards | the [`vedic-math`](https://github.com/sbmadhav/vedic-math) repo, served under this domain |
| `/design-system/` | Tokens, type, components and guidelines behind every page | the [`design-system`](https://github.com/sbmadhav/design-system) repo, served under this domain |
| `/state-of-voice-agents/` | Report on conversational voice AI in healthcare and banking | the `state-of-voice-agents` repo, served under this domain |

`/math/` redirects to `/vedic-math/`. `404.html` handles every unknown path.

## How it is built

Static HTML, CSS and JavaScript. No framework, no bundler, no `package.json` for the site itself.

- **Design system.** Lives in its own repo, [sbmadhav/design-system](https://github.com/sbmadhav/design-system), published at `/design-system/`. Its `tokens.json` is the source of truth for colors (light "Daybreak" and dark "Deep Space"), type, spacing and radii; its `build.py` generates `tokens.css` (including the `@font-face` rules for the self-hosted fonts in this repo's `assets/fonts/`) and the reference page. This repo keeps a pinned copy of `tokens.json` in `scripts/design-tokens.json` for the home page color check.
- **Build and cache stamping.** Git holds unstamped source. `python3 site-build.py --out _site` copies the publishable files into `_site/` and stamps the copies: `?v=<hash>` on the shared scripts in every page, and a cache `VERSION` in `sw.js`. CI runs it and publishes `_site/`, so version numbers never appear in diffs.
- **Offline.** `sw.js` precaches the site so repeat visits load instantly and work offline; `manifest.webmanifest` makes it installable.
- **Shared chrome.** Every page loads `assets/explore.js` (the site-wide Explore menu; pages are listed in `PAGES` at its top) and `assets/analytics.js` (GoatCounter, cookieless, loaded after the page is idle).
- **Other repos under this domain.** `/vedic-math/` and `/state-of-voice-agents/` are GitHub project Pages from their own repos. They load the shared files above (and Vedic Math the design-system CSS and fonts) by absolute URL, and the service worker leaves their paths to the network.

Repo-only files (this README, `CLAUDE.md`, build scripts, `scripts/`) are kept out of the published site by `exclude` in `_config.yml`, the one list both `site-build.py` and Jekyll read. Paths starting with `.` or `_` are always left out.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. The source is unstamped and the service worker only registers over https, so a plain local server always shows your latest edits. To see what visitors get, run `python3 site-build.py` and serve `_site/` instead. Pages use absolute paths (`/assets/...`, `/design-system/...`), so serve from the repo root. For styles, clone the design-system repo next to this one and link it in once: `ln -s ../design-system design-system`. To try `/vedic-math/` locally, do the same with `sbmadhav/vedic-math`: `ln -s ../vedic-math vedic-math`. Git ignores both links.

## Checks

| Check | Command |
|---|---|
| The site builds, and the source has no cache stamps | `python3 site-build.py --out _site` |
| Home page colors match the pinned `tokens.json` | `python3 scripts/check-tokens.py` (`--refresh` updates the pin from the design-system repo) |

A pre-commit hook in `.githooks/` runs both (well under a second). Enable it once per clone:

```sh
git config core.hooksPath .githooks
```

CI (`.github/workflows/site.yml`) runs the same checks on every push and pull request to `master`, plus a check that `_site/` is stamped and holds no repo-only files.

## Deploy

On a push to `master`, CI builds `_site/` and its `deploy` job publishes it to GitHub Pages. That needs two settings: **Settings > Pages > Source** set to "GitHub Actions", and the repository variable `PAGES_VIA_ACTIONS` set to `true` (Settings > Secrets and variables > Actions > Variables). Without them Pages deploys the `master` branch with Jekyll, which publishes the unstamped source: the site still works, but browsers are not told when scripts change and the service worker runs in its no-cache `'dev'` mode.

## How it is maintained

Most changes are made with AI coding agents working from `CLAUDE.md`, the project rules file, and the design system README. The token check, the hook and CI are there so those rules are enforced by tools rather than by memory.
