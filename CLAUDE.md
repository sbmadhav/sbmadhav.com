# sbmadhav.com

Personal site on GitHub Pages (served at https://www.sbmadhav.com; `CNAME` holds the domain, branch `master`).

## Building new pages

- Every new page follows the design system in `design-system/`. Read `design-system/README.md` first.
- Start from `design-system/template.html`; link `/design-system/tokens.css` then `/design-system/components.css`.
- Use tokens (`var(--coral)`, `var(--space-6)`, `var(--radius-lg)`), never raw hex. Text on accent fills uses `var(--on-accent)`, not white.
- Support both color schemes (Daybreak light, Deep Space dark; system default with a saved override) and kid mode (`.pro` / `.kid` spans, `body.kidmode`).
- Never use em dashes in copy.
- If a token changes, edit `design-system/tokens.json` and regenerate `design-system/tokens.css` to match.
