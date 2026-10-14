#!/usr/bin/env python3
"""Check that the home page's inline color variables match the design system.

    python3 scripts/check-tokens.py             compare with the pinned copy (offline, used by the hook and CI)
    python3 scripts/check-tokens.py --upstream  compare with the latest tokens.json in sbmadhav/design-system
    python3 scripts/check-tokens.py --refresh   replace the pinned copy with the latest, then compare

index.html keeps its own short variable names in an inline :root block (for a
fast first paint), so nothing forces them to stay in step with the design
system's tokens.json. This script compares every color variable in the three
theme blocks of index.html (Daybreak, Deep Space under prefers-color-scheme,
Deep Space under data-theme="dark") with the matching token, and exits 1 with a
diff when any value disagrees.

The design system lives in its own repo (sbmadhav/design-system). The check
reads a pinned copy, scripts/design-tokens.json, so it needs no network and
always gives the same answer for the same commit. After a color changes in the
design system, run --refresh, fix index.html until the check passes, and commit
both.
"""
import json, pathlib, re, subprocess, sys, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PINNED = ROOT / "scripts" / "design-tokens.json"
UPSTREAM = "https://raw.githubusercontent.com/sbmadhav/design-system/main/tokens.json"

if "--upstream" in sys.argv or "--refresh" in sys.argv:
    try:
        try:
            with urllib.request.urlopen(UPSTREAM, timeout=15) as r:
                raw = r.read().decode()
        except urllib.error.URLError:
            # python.org builds on macOS often lack CA certificates; curl uses the system store
            raw = subprocess.run(["curl", "-fsSL", "--max-time", "15", UPSTREAM],
                                 capture_output=True, text=True, check=True).stdout
        json.loads(raw)
    except Exception as e:
        sys.exit(f"check-tokens: could not fetch {UPSTREAM}: {e}")
    if "--refresh" in sys.argv:
        PINNED.write_text(raw)
        print(f"check-tokens: refreshed {PINNED.relative_to(ROOT)} from {UPSTREAM}")
    SOURCE = UPSTREAM
else:
    raw = PINNED.read_text()
    SOURCE = str(PINNED.relative_to(ROOT))

HTML = (ROOT / "index.html").read_text()
TOKENS = {c["name"]: c["value"] for c in json.loads(raw)["color"]["tokens"]}

# index.html variable name -> tokens.json name, where they differ
RENAMES = {"bg2": "bg-alt", "muted": "ink-muted"}


def norm(v):
    """Lowercase, no spaces, so #FFF8EE == #fff8ee and rgba(1, 2, 3) == rgba(1,2,3)."""
    return re.sub(r"\s+", "", v).lower()


def token(name, theme):
    v = TOKENS[name][theme]
    m = re.fullmatch(r"\{(.+)\}", v)  # alias such as {sky-strong}
    return token(m.group(1), theme) if m else v


def block(pattern, label):
    m = re.search(pattern + r"\s*\{([^{}]*)\}", HTML)
    if not m:
        sys.exit(f"check-tokens: could not find the {label} block in index.html")
    return dict(re.findall(r"--([\w-]+)\s*:\s*([^;]+);", m.group(1)))


BLOCKS = [
    ("Daybreak (:root)", "daybreak", block(r"(?m)^:root", "Daybreak :root")),
    ("Deep Space (prefers-color-scheme: dark)", "deep-space", block(r':root:not\(\[data-theme="light"\]\)', "prefers-color-scheme dark")),
    ('Deep Space (data-theme="dark")', "deep-space", block(r'(?m)^:root\[data-theme="dark"\]', 'data-theme="dark"')),
]

problems, checked = [], 0
for label, theme, vars_ in BLOCKS:
    seen = set()
    for var, value in vars_.items():
        name = RENAMES.get(var, var)
        if name not in TOKENS:
            continue  # not a color token (--display, --shadow, --page, --radius ...)
        seen.add(name)
        checked += 1
        want = token(name, theme)
        if norm(value) != norm(want):
            problems.append(f"  {label}: --{var} is {value.strip()}, tokens.json {name} is {want}")
    missing = sorted(set(TOKENS) - seen)
    if missing:
        problems.append(f"  {label}: no variable for " + ", ".join(missing))

if problems:
    print(f"check-tokens: index.html disagrees with {SOURCE}")
    print("\n".join(problems))
    print("Fix index.html, or change the color in sbmadhav/design-system and run --refresh.")
    sys.exit(1)
print(f"check-tokens: {checked} color values in index.html match {SOURCE}")
