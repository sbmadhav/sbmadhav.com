#!/usr/bin/env python3
"""Check that the pages use the pinned design system instead of copies of it.

    python3 scripts/check-tokens.py             offline check (the pre-commit hook and CI)
    python3 scripts/check-tokens.py --upstream  also compare the pin with the published releases (CI warns on failure)

The pages link the pinned release, /design-system/v/<version>/tokens.css and components.css, and take every
color, type style, spacing step and font from it. Until design system 2.1 the home page kept inline copies of
the colors for first paint, and this script compared them with tokens.json; now any such copy is a drift risk,
so the offline check fails when:
- a page's own CSS (its <style> blocks and style="" attributes) defines a design-system token, such as
  --coral, --ink-muted or --space-4, instead of using the linked one;
- scripts/design-tokens.json (the pinned tokens.json) is not the version that site-build.py pins (DS_VERSION).

--upstream (needs the network) also checks that the vendored files in scripts/design-system/ and
scripts/design-tokens.json are byte-for-byte the published https://sbmadhav.com/design-system/v/<version>/ files,
and reports when a newer release than the pinned one exists (moving to it is a deliberate change: see
site-build.py, DS_VERSION).
"""
import json, pathlib, re, subprocess, sys, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PINNED = ROOT / "scripts" / "design-tokens.json"
VENDORED = {"header.html": ROOT / "scripts/design-system/header.html",
            "music.html": ROOT / "scripts/design-system/music.html",
            "compose.py": ROOT / "scripts/design-system/compose.py",
            "tokens.json": PINNED}
PAGES = ["index.html", "404.html"]
SITE = "https://sbmadhav.com/design-system"


def ds_version():
    m = re.search(r'^DS_VERSION = "([^"]+)"', (ROOT / "site-build.py").read_text(), re.M)
    if not m:
        sys.exit("check-tokens: no DS_VERSION in site-build.py")
    return m.group(1)


def token_names(tokens):
    """Every CSS custom property tokens.css defines for this release (type styles are caught by their text- prefix)."""
    return {t["name"] for group in tokens.values() if isinstance(group, dict)
            for t in group.get("tokens", []) if isinstance(t, dict) and "name" in t}


def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return r.read()
    except urllib.error.URLError:
        # python.org builds on macOS often lack CA certificates; curl uses the system store
        return subprocess.run(["curl", "-fsSL", "--max-time", "15", url], capture_output=True, check=True).stdout


version = ds_version()
tokens = json.loads(PINNED.read_text())
problems = []
if tokens.get("version") != version:
    problems.append(f"  scripts/design-tokens.json is design system {tokens.get('version')}, site-build.py pins {version}")

names = token_names(tokens)
for page in PAGES:
    html = (ROOT / page).read_text()
    own_css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S) + re.findall(r'style="([^"]*)"', html))
    for name in sorted(set(re.findall(r"--([\w-]+)\s*:", own_css))):
        if name in names or name.startswith(("text-", "space-", "radius-", "shadow-", "cat-", "bolt-")):
            problems.append(f"  {page} defines --{name} itself; use the one from /design-system/v/{version}/tokens.css")

if "--upstream" in sys.argv:
    for name, path in VENDORED.items():
        url = f"{SITE}/v/{version}/{name}"
        try:
            live = fetch(url)
        except Exception as e:
            sys.exit(f"check-tokens: could not fetch {url}: {e}")
        if live != path.read_bytes():
            problems.append(f"  {path.relative_to(ROOT)} differs from {url}")
    latest = json.loads(fetch(f"{SITE}/versions.json")).get("latest")
    if latest and latest != version:
        problems.append(f"  design system {latest} is out; this site pins {version} (move on purpose: see DS_VERSION in site-build.py)")

if problems:
    print("check-tokens: the pages are out of step with the pinned design system")
    print("\n".join(problems))
    sys.exit(1)
print(f"check-tokens: the pages use design system {version} and define none of its tokens themselves"
      + (" (vendored files match the published release)" if "--upstream" in sys.argv else ""))
