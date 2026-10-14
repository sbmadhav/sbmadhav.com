#!/usr/bin/env python3
"""Check that the home page's inline color variables match the design system.

    python3 scripts/check-tokens.py

index.html keeps its own short variable names in an inline :root block (for a
fast first paint), so nothing forces them to stay in step with
design-system/tokens.json. This script compares every color variable in the
three theme blocks of index.html (Daybreak, Deep Space under
prefers-color-scheme, Deep Space under data-theme="dark") with the matching
token, and exits 1 with a diff when any value disagrees.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / "index.html").read_text()
TOKENS = {c["name"]: c["value"] for c in json.loads((ROOT / "design-system/tokens.json").read_text())["color"]["tokens"]}

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
    print("check-tokens: index.html disagrees with design-system/tokens.json")
    print("\n".join(problems))
    print("Fix index.html (or tokens.json, then run python3 design-system/build.py).")
    sys.exit(1)
print(f"check-tokens: {checked} color values in index.html match tokens.json")
