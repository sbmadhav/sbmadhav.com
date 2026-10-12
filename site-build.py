#!/usr/bin/env python3
"""Stamp cache-busting versions after editing the site.

    python3 site-build.py

- index.html loads assets/app.js and assets/explore.js with ?v=<hash of each file>
- sw.js gets a new VERSION (hash of index.html + app.js) so returning visitors pick up changes
"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).parent
SCRIPTS = ["assets/app.js", "assets/explore.js"]
versions = {p: hashlib.sha256((root / p).read_bytes()).hexdigest()[:10] for p in SCRIPTS}
app = b"".join((root / p).read_bytes() for p in SCRIPTS)
appv = versions["assets/app.js"]

def stamp(text):
    for p, v in versions.items():
        text = re.sub(re.escape(p) + r"\?v=[\w_]+", f"{p}?v={v}", text)
    return text

index = root / "index.html"
html = stamp(index.read_text())
index.write_text(html)

sw_src = root / "sw.js"
sw = sw_src.read_text()
version = hashlib.sha256(html.encode() + app).hexdigest()[:10]
sw = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw)
sw = stamp(sw)
sw_src.write_text(sw)
print(", ".join(f"{p} v={v}" for p, v in versions.items()) + f", service worker VERSION={version}")
