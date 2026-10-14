# sbmadhav.com

Personal site of Madhav Srinivasan, served by GitHub Pages at [sbmadhav.com](https://sbmadhav.com). Every page works for two audiences: a grown-up mode for recruiters and engineers, and a kid mode that says the same things in plainer words.

## Pages

| Path | What it is | Source |
|---|---|---|
| `/` | Home: work, Brain Lab, Bug Hunt, Design Lab, journey | `index.html`, `assets/app.js` |
| `/vedic-math/` | Vedic Math for Everyone: lessons, Dojo, Arena, games, leaderboards | the `vedic-math` repo, served under this domain |
| `/design-system/` | Tokens, type, components and guidelines behind every page | `design-system/` |
| `/state-of-voice-agents/` | Report on conversational voice AI in healthcare and banking | the `state-of-voice-agents` repo, served under this domain |

`/math/` redirects to `/vedic-math/`. `/numo/` is an older experiment. `404.html` handles every unknown path.

## How it is built

Static HTML, CSS and JavaScript. No framework, no bundler, no `package.json` for the site itself.

- **Design system.** `design-system/tokens.json` is the source of truth for colors (light "Daybreak" and dark "Deep Space"), type, spacing and radii. `python3 design-system/build.py` generates `tokens.css` (including the `@font-face` rules for the self-hosted fonts in `assets/fonts/`) and the reference page `design-system/index.html`. It needs `pip install markdown`.
- **Cache stamping.** `python3 site-build.py` stamps `?v=<hash>` on the home page's scripts and a new cache `VERSION` in `sw.js`.
- **Offline.** `sw.js` precaches the site so repeat visits load instantly and work offline; `manifest.webmanifest` makes it installable.
- **Shared chrome.** Every page loads `assets/explore.js` (the site-wide Explore menu; pages are listed in `PAGES` at its top) and `assets/analytics.js` (GoatCounter, cookieless, loaded after the page is idle).
- **Other repos under this domain.** `/vedic-math/` and `/state-of-voice-agents/` are GitHub project Pages from their own repos. They load the shared files above (and Vedic Math the design-system CSS and fonts) by absolute URL, and the service worker leaves their paths to the network.

Repo-only files (this README, `CLAUDE.md`, build scripts, `scripts/`, `tokens.json`) are kept out of the published site by `exclude` in `_config.yml`.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Pages use absolute paths (`/assets/...`), so serve from the repo root. To try `/vedic-math/` locally, clone `sbmadhav/vedic-math` next to this repo and link it in with `ln -s ../vedic-math vedic-math` (the link is git-ignored).

## Checks

| Check | Command |
|---|---|
| Generated files are current | `python3 site-build.py && python3 design-system/build.py && git diff --exit-code` |
| Home page colors match `tokens.json` | `python3 scripts/check-tokens.py` |

A pre-commit hook in `.githooks/` runs both (well under a second). Enable it once per clone:

```sh
git config core.hooksPath .githooks
```

CI (`.github/workflows/site.yml`) runs the same checks on every push and pull request to `master`. Its `deploy` job publishes to GitHub Pages through Actions, but only once the repository variable `PAGES_VIA_ACTIONS` is `true`; until then Pages deploys from the `master` branch with Jekyll.

## How it is maintained

Most changes are made with AI coding agents working from `CLAUDE.md`, the project rules file, and the design system README. The token check, the hook and CI are there so those rules are enforced by tools rather than by memory.
