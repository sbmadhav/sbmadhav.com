#!/usr/bin/env python3
"""Stamp cache-busting versions after editing the site.

    python3 site-build.py

- index.html loads assets/app.js, explore.js and analytics.js with ?v=<hash of each file>
- sw.js gets a new VERSION (hash of every file the site serves from the cache: pages,
  scripts, design-system CSS, fonts, icons) so any change rotates the service worker cache.

/vedic-math/ is its own repo (sbmadhav/vedic-math) with its own build.py.

Running it twice changes nothing the second time.
"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).resolve().parent
h = lambda b: hashlib.sha256(b).hexdigest()[:10]
fhash = lambda p: h((root / p).read_bytes())

def write(path, text):
    f = root / path
    if f.read_text() != text:
        f.write_text(text)

# ---------- home page ----------
SCRIPTS = ["assets/app.js", "assets/explore.js", "assets/analytics.js"]
versions = {p: fhash(p) for p in SCRIPTS}

def stamp(text):
    for p, v in versions.items():
        text = re.sub(r"(?<![\w/.-])" + re.escape(p) + r"\?v=[\w_]+", f"{p}?v={v}", text)
    return text

html = stamp((root / "index.html").read_text())
write("index.html", html)

# ---------- service worker ----------
sw = stamp((root / "sw.js").read_text())
precache = re.search(r"const PRECACHE = \[(.*?)\];", sw, re.S).group(1)
cached = set()
for entry_path in re.findall(r"'([^']+)'", precache):
    p = entry_path.split("?")[0].lstrip("./")
    p = p + "index.html" if p == "" or p.endswith("/") else p
    if (root / p).is_file():
        cached.add(p)
cached |= {"index.html", "design-system/tokens.css", "design-system/components.css", *SCRIPTS}
cached |= {p.relative_to(root).as_posix() for p in (root / "assets" / "fonts").glob("*") if p.is_file()}
digest = hashlib.sha256()
for p in sorted(cached):
    digest.update(p.encode() + b"\0" + (root / p).read_bytes() + b"\0")
version = digest.hexdigest()[:10]
sw = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw)
write("sw.js", sw)

print(", ".join(f"{p} v={v}" for p, v in versions.items())
      + f", service worker VERSION={version} ({len(cached)} files)")
