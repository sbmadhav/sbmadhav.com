# Contributing to sbmadhav.com

Thanks for taking the time to help. This is the personal site of Madhav Srinivasan, so a few parts are personal and stay that way, but fixes and improvements are welcome.

## What is welcome

- Bug fixes: broken links, layout problems, errors in the browser console, offline or caching issues.
- Accessibility: contrast, keyboard use, screen reader labels, reduced motion.
- Performance: a lighter first load, smaller images, fewer requests.
- Fixes to the shared files other pages load (`/assets/explore.js`, `/assets/analytics.js`), as long as every page keeps working.

## What is not

- Changes to the copy on the home page (the profile, the work history, the journey). It is personal writing. If something looks wrong, open an issue instead of a pull request.
- New pages, new third-party scripts, trackers or fonts from other hosts, unless discussed in an issue first.
- Changes to the design tokens or components. Those live in [sbmadhav/design-system](https://github.com/sbmadhav/design-system).
- Changes to Vedic Math or the voice agents report. Those live in [sbmadhav/vedic-math](https://github.com/sbmadhav/vedic-math) and [sbmadhav/state-of-voice-agents](https://github.com/sbmadhav/state-of-voice-agents).

Not sure? Open an issue and ask before you start.

## How a change gets merged

1. Fork the repo and create a branch from `master`.
2. Make the change and run the checks below.
3. Open a pull request against `master` and fill in the checklist.

Every pull request needs:

- an approving review from the owner (@sbmadhav, the code owner of every file),
- passing checks (the `check` job in `.github/workflows/site.yml`),
- every review conversation resolved.

Nothing merges without the owner's approval. `master` deploys straight to https://sbmadhav.com, so the branch is protected: no direct pushes from contributors, no force pushes. Workflows from forks wait for the owner's approval before they run.

## Local setup

Static HTML, CSS and JavaScript. No framework and no `npm install`. You need Python 3.

```sh
git clone https://github.com/<you>/sbmadhav.github.io.git
cd sbmadhav.github.io
git config core.hooksPath .githooks   # turn on the pre-commit hook
python3 -m http.server 8000
```

Open http://localhost:8000. Pages use absolute paths such as `/design-system/tokens.css`, so for styles clone [sbmadhav/design-system](https://github.com/sbmadhav/design-system) next to this repo and link it in once: `ln -s ../design-system design-system` (git ignores the link).

## Checks

| Check | Command |
|---|---|
| Generated files are current | `python3 site-build.py && git diff --exit-code` |
| Home page colors match the pinned design tokens | `python3 scripts/check-tokens.py` |

The pre-commit hook runs both. CI runs the same checks on every pull request. If `site-build.py` changes a file, commit that file with your change.

## Style rules

- Follow the design system: https://sbmadhav.com/design-system/. Start new markup from its `template.html`.
- Use tokens, never raw hex: `var(--coral)`, `var(--space-6)`, `var(--radius-lg)`. Text on accent fills uses `var(--on-accent)`.
- Support both color schemes: Daybreak (light) and Deep Space (dark).
- Support kid mode: every piece of copy has a `<span class="pro">` and a `<span class="kid">` version.
- Never use em dashes in copy. Use a period, comma or colon.
- Keep the first load light: images as WebP with `width` and `height`, no new requests before the page loads.
- Never send personal data to analytics.
- Test both schemes, kid mode, a 390px wide phone, keyboard only and reduced motion.

## Repo-only files

GitHub Pages publishes every file it is not told to skip. If you add a file that is not part of the site (docs, scripts, config), add it to both `exclude` in `_config.yml` and the `rsync --exclude` list in `.github/workflows/site.yml`.

## Security problems

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE), the same license as the rest of this repo.
