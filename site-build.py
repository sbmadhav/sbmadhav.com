#!/usr/bin/env python3
"""Stamp cache-busting versions after editing the site.

    python3 site-build.py

- index.html loads assets/app.js?v=<hash of app.js>
- sw.js gets a new VERSION (hash of index.html + app.js) so returning visitors pick up changes
"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).parent
app = (root / "assets/app.js").read_bytes()
appv = hashlib.sha256(app).hexdigest()[:10]

index = root / "index.html"
html = re.sub(r"assets/app\.js\?v=[\w_]+", f"assets/app.js?v={appv}", index.read_text())
index.write_text(html)

sw_src = root / "sw.js"
sw = sw_src.read_text()
version = hashlib.sha256(html.encode() + app).hexdigest()[:10]
sw = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw)
sw = re.sub(r"assets/app\.js\?v=[\w_]+", f"assets/app.js?v={appv}", sw)
sw_src.write_text(sw)
print(f"app.js v={appv}, service worker VERSION={version}")
