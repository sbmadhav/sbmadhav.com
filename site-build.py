#!/usr/bin/env python3
"""Build the publishable site into an output directory and stamp cache versions there.

    python3 site-build.py               builds into _site/
    python3 site-build.py --out DIR     builds into DIR (emptied first)

The source in git is never stamped: index.html loads plain assets/app.js and sw.js says
VERSION = 'dev'. Stamps exist only in the build output, which CI publishes to GitHub Pages
(.github/workflows/site.yml), so version numbers never show up in diffs or merge conflicts.

What the build does:
- Copies every file git knows about (tracked, or untracked but not ignored) except the
  repo-only files. The exclude list is `exclude:` in _config.yml, the single list for both
  this script and a Jekyll branch deploy. Like Jekyll, it also leaves out any path with a
  part that starts with "." or "_".
- In every copied .html file and in sw.js, adds ?v=<hash of that file> to
  assets/app.js, assets/explore.js and assets/analytics.js.
- Sets sw.js VERSION to a hash of every file the worker caches (pages, scripts, fonts,
  icons), so any change rotates the service worker cache. The /design-system/ files it
  precaches come from the sbmadhav/design-system repo, so they are not hashed; the worker
  refreshes them in the background on every visit (stale-while-revalidate).
- Adds a Content-Security-Policy <meta> (plus an explicit Referrer-Policy) right after
  <meta charset> in every copied .html file. Inline scripts are allowed by their sha256, which
  the build computes, so the hashes are never edited by hand. GitHub Pages cannot send headers,
  so this is the only way to ship a CSP; a <meta> policy cannot carry frame-ancestors,
  report-uri or sandbox. The build fails on inline event handler attributes (onclick="...") and
  javascript: URLs, which the policy would block.
- Checks that assets/count.js (GoatCounter, vendored) still matches the upstream hash it records.
- Writes .nojekyll so Pages serves the output as is.
- Checks the pinned design system (DS_VERSION): every page loads tokens.css, components.css and header.js
  from /design-system/v/<DS_VERSION>/ once each, with integrity (sha384 of the vendored copy in
  scripts/design-system/) and crossorigin="anonymous" (never the unversioned latest files or another
  version; the tags are read with an HTML parser), sw.js precaches that release, and the shared header in each page in HEADER_PAGES matches
  the pinned header.html in scripts/design-system/, composed with that release's compose.py. The header is
  committed composed, so a Jekyll branch deploy shows the same page. `python3 site-build.py --compose`
  re-renders it in the source after moving to a new version or changing a page's slots.

It fails if the source carries stamps (a ?v= on those scripts, a VERSION other than 'dev', or
a Content-Security-Policy <meta>), so they cannot creep back into git.

/vedic-math/ is its own repo (sbmadhav/vedic-math) with its own build.py.
"""
import argparse, base64, fnmatch, hashlib, html.parser, json, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SCRIPTS = ["assets/app.js", "assets/explore.js", "assets/analytics.js"]
# The design-system release the pages pin. scripts/design-system/ holds that release's header.html, music.html,
# compose.py, tokens.css, components.css and header.js (byte-for-byte copies of https://sbmadhav.com/design-system/v/<DS_VERSION>/...), and
# scripts/design-tokens.json its tokens.json. To move to a new version: copy the new files there, change DS_VERSION
# and the /design-system/v/<version>/ links in the pages, run `python3 site-build.py --compose`, review the diff.
DS_VERSION = "2.1.0"
DS_DIR = ROOT / "scripts" / "design-system"
HEADER_PAGES = ["index.html", "404.html"]

h = lambda b: hashlib.sha256(b).hexdigest()[:10]


def fail(msg):
    sys.exit(f"site-build.py: {msg}")


def excludes():
    """The `exclude:` list in _config.yml (plain "- item" lines; no YAML library needed)."""
    out, inside = [], False
    for line in (ROOT / "_config.yml").read_text().splitlines():
        if re.match(r"exclude:\s*$", line):
            inside = True
        elif inside and re.match(r"\s*-\s", line):
            out.append(line.split("-", 1)[1].split(" #")[0].strip().strip("'\""))
        elif inside and line.strip() and not line.lstrip().startswith("#"):
            inside = False
    if not out:
        fail("found no exclude: list in _config.yml")
    return out


def publishable():
    files = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT, capture_output=True, check=True).stdout.decode().split("\0")
    patterns = [p.rstrip("/") for p in excludes()]
    keep = []
    for f in filter(None, files):
        parts = f.split("/")
        if any(p[0] in "._" for p in parts):
            continue
        prefixes = ["/".join(parts[:i]) for i in range(1, len(parts) + 1)]
        if any(fnmatch.fnmatchcase(pre, pat) for pre in prefixes for pat in patterns):
            continue
        if (ROOT / f).is_file():  # skips files deleted but not yet staged
            keep.append(f)
    return sorted(keep)


def stamp(text, versions, where):
    """Add ?v=<hash> to each script URL ("assets/app.js" or "/assets/app.js") inside quotes."""
    for p, v in versions.items():
        pat = r"""(["'])(/?""" + re.escape(p) + r")(\?v=[\w]+)?\1"
        for m in re.finditer(pat, text):
            if m.group(3):
                fail(f"{where} has {m.group(0)}; the source must keep the plain URL (no ?v=)")
        text = re.sub(pat, lambda m: f"{m.group(1)}{m.group(2)}?v={v}{m.group(1)}", text)
    return text


# Every origin a page here loads from. Fonts, images, scripts and styles are self-hosted or come
# from the other repos served under this origin (/design-system/, ...). The only third party is
# GoatCounter's beacon: sendBeacon (connect-src), or an <img> when sendBeacon fails (img-src).
# Styles need 'unsafe-inline': the pages have a critical <style> block, and scripts build markup
# with style="" attributes. 'INLINE_SCRIPTS' is replaced by the hashes of the page's inline scripts.
GOATCOUNTER = "https://sbmadhav.goatcounter.com"
CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' INLINE_SCRIPTS",
    "style-src 'self' 'unsafe-inline'",
    f"img-src 'self' data: {GOATCOUNTER}",
    "font-src 'self'",
    f"connect-src 'self' {GOATCOUNTER}",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
])
CSP_META = re.compile(r"""<meta\s+http-equiv=["']?Content-Security-Policy""", re.I)
# Scripts that run: no type, or a JavaScript type. Data blocks (application/ld+json) never run.
INLINE_SCRIPT = re.compile(r"<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>", re.S | re.I)
RUNS = re.compile(r"""\btype=["']?(text/javascript|module|application/javascript)\b""", re.I)


def add_csp(text, where):
    """Insert the CSP and referrer <meta> tags after <meta charset>, hashing the inline scripts."""
    if CSP_META.search(text):
        fail(f"{where} already has a Content-Security-Policy <meta>; the build adds it, the source must not")
    handler = re.search(r"""<[a-z][^>]*\s(on[a-z]+)\s*=""", text, re.I)
    if handler:
        fail(f"{where} has an inline event handler ({handler.group(1)}=...), which the CSP blocks; use addEventListener")
    if re.search(r"""(href|src|action)\s*=\s*["']?\s*javascript:""", text, re.I):
        fail(f"{where} has a javascript: URL, which the CSP blocks")
    hashes = []
    for m in INLINE_SCRIPT.finditer(text):
        if "type=" in m.group(1).lower() and not RUNS.search(m.group(1)):
            continue
        digest = base64.b64encode(hashlib.sha256(m.group(2).encode()).digest()).decode()
        hashes.append(f"'sha256-{digest}'")
    policy = CSP.replace(" INLINE_SCRIPTS", "".join(" " + x for x in dict.fromkeys(hashes)))
    charset = re.search(r"<meta charset=[\"']?utf-8[\"']?\s*/?>\n?", text, re.I)
    if not charset:
        fail(f"{where} has no <meta charset=\"utf-8\"> to put the CSP after")
    tags = (f'<meta http-equiv="Content-Security-Policy" content="{policy}">\n'
            '<meta name="referrer" content="strict-origin-when-cross-origin">\n')
    return text[:charset.end()] + tags + text[charset.end():]


def check_vendored_count_js():
    """assets/count.js is GoatCounter's count.js below a header comment that records its sha384."""
    f = ROOT / "assets/count.js"
    if not f.exists():
        return
    text = f.read_text()
    want = re.search(r"sha384 of the upstream file: ([A-Za-z0-9+/=]+)", text)
    head_end = text.find("*/\n")
    if not want or head_end < 0:
        fail("assets/count.js has no header recording the upstream sha384")
    body = text[head_end + 3:].encode()
    got = base64.b64encode(hashlib.sha384(body).digest()).decode()
    if got != want.group(1):
        fail(f"assets/count.js differs from the upstream file its header names (sha384 {got}); "
             "update the header when updating the file")


def load_compose():
    import importlib.util
    sys.dont_write_bytecode = True  # no __pycache__ next to the vendored compose.py
    spec = importlib.util.spec_from_file_location("ds_compose", DS_DIR / "compose.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def compose_headers(write):
    """Re-render the shared header of each page in HEADER_PAGES from the pinned header.html.
    write=False: fail if any page differs (the build and CI). write=True: update the pages (--compose)."""
    compose = load_compose()
    partial = (DS_DIR / "header.html").read_text()
    for page in HEADER_PAGES:
        before = (ROOT / page).read_text()
        try:
            after = compose.compose(before, partial)
        except compose.ComposeError as e:
            fail(f"{page}: {e}")
        if after == before:
            continue
        if not write:
            fail(f"the header in {page} differs from scripts/design-system/header.html (design system {DS_VERSION}); "
                 "run python3 site-build.py --compose and commit the result")
        (ROOT / page).write_text(after)
        print(f"site-build.py: composed the header in {page}")


DS_RUNTIME = {"tokens.css": "link", "components.css": "link", "header.js": "script"}


def sri(data):
    return "sha384-" + base64.b64encode(hashlib.sha384(data).digest()).decode()


class Tags(html.parser.HTMLParser):
    """The <link> and <script> start tags of a page, with their attributes (comments and text are not tags)."""
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        if tag in ("link", "script"):
            self.tags.append((tag, dict(attrs), self.getpos()[0]))

    handle_startendtag = handle_starttag


def check_design_system(files):
    """Pages load the pinned release once each, with Subresource Integrity; the pins agree."""
    pinned = json.loads((ROOT / "scripts" / "design-tokens.json").read_text()).get("version")
    if pinned != DS_VERSION:
        fail(f"scripts/design-tokens.json is design system {pinned}, DS_VERSION is {DS_VERSION}")
    base = f"/design-system/v/{DS_VERSION}/"
    for f in [f for f in files if f.endswith(".html")]:
        parser = Tags()
        parser.feed((ROOT / f).read_text())
        seen = {}
        for tag, a, line in parser.tags:
            url = (a.get("href") if tag == "link" else a.get("src")) or ""
            if not url.startswith("/design-system/") or url.startswith("/design-system/icons/"):
                continue
            name = url.rsplit("/", 1)[-1]
            if not url.startswith(base) or name not in DS_RUNTIME:
                fail(f"{f}:{line} loads {url}; pages load only tokens.css, components.css and header.js from {base}")
            if DS_RUNTIME[name] != tag or (tag == "link" and a.get("rel") != "stylesheet") or (tag == "script" and "defer" not in a):
                fail(f"{f}:{line} {name} must be a " + ('<link rel="stylesheet">' if DS_RUNTIME[name] == "link" else "<script defer>"))
            want = sri((DS_DIR / name).read_bytes())
            if a.get("integrity") != want or a.get("crossorigin") != "anonymous":
                fail(f'{f}:{line} {name} needs integrity="{want}" crossorigin="anonymous" (the hash of scripts/design-system/{name})')
            seen[name] = seen.get(name, 0) + 1
        if seen and seen != {n: 1 for n in DS_RUNTIME}:
            fail(f"{f} must load each of {', '.join(DS_RUNTIME)} from {base} exactly once (found {seen})")
    for page in HEADER_PAGES:
        if page not in files:
            fail(f"{page} is missing")
    # The worker precaches the pinned files: the same release as the pages
    sw_pins = set(re.findall(r"""['"]/?design-system/v/([^/'"]+)/""", (ROOT / "sw.js").read_text()))
    if sw_pins != {DS_VERSION}:
        fail(f"sw.js precaches design system {', '.join(sorted(sw_pins)) or 'none'}; this site pins {DS_VERSION}")
    compose_headers(write=False)


def main():
    ap = argparse.ArgumentParser(description="Build the site into an output directory with cache stamps.")
    ap.add_argument("--out", help="output directory, emptied first (default: _site/ in the repo)")
    ap.add_argument("--compose", action="store_true",
                    help="re-render the shared header in the source pages from scripts/design-system/header.html, then stop")
    args = ap.parse_args()
    if args.compose:
        compose_headers(write=True)
        return
    arg = args.out
    out = pathlib.Path(arg).resolve() if arg else ROOT / "_site"
    if out == ROOT or ROOT.is_relative_to(out):
        fail("--out must not be the repo itself")

    if out.exists():
        if any(out.iterdir()) and not (out / ".nojekyll").exists():
            fail(f"{out} is not empty and is not an earlier build (no .nojekyll); refusing to delete it")
        shutil.rmtree(out)
    files = publishable()
    check_design_system(files)
    for required in ["index.html", "sw.js", *SCRIPTS]:
        if required not in files:
            fail(f"{required} is missing from the publishable files")

    for f in files:
        (out / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, out / f)
    (out / ".nojekyll").write_bytes(b"")

    versions = {p: h((ROOT / p).read_bytes()) for p in SCRIPTS}
    check_vendored_count_js()

    # ---------- pages ----------
    for f in files:
        if f.endswith(".html"):
            src = (ROOT / f).read_text()
            new = add_csp(stamp(src, versions, f), f)
            (out / f).write_text(new)
    if "?v=" not in (out / "index.html").read_text():
        fail("index.html loads none of the stamped scripts")

    # ---------- service worker ----------
    sw = (ROOT / "sw.js").read_text()
    m = re.search(r"const VERSION = '([^']*)';", sw)
    if not m:
        fail("sw.js has no `const VERSION = '...';` line")
    if m.group(1) != "dev":
        fail(f"sw.js has VERSION = '{m.group(1)}'; the source must say 'dev'")
    if not re.search(r"^const KILL = (true|false);$", sw, re.M):
        fail("sw.js has no `const KILL = true;` or `const KILL = false;` line (assets/app.js reads it)")
    sw = stamp(sw, versions, "sw.js")
    precache = re.search(r"const PRECACHE = \[(.*?)\];", sw, re.S).group(1)
    cached = set()
    for entry_path in re.findall(r"'([^']+)'", precache):
        p = entry_path.split("?")[0].lstrip("./")
        p = p + "index.html" if p == "" or p.endswith("/") else p
        if p in files:
            cached.add(p)
    cached |= {"index.html", *SCRIPTS}
    cached |= {f for f in files if f.startswith("assets/fonts/")}
    digest = hashlib.sha256()
    for p in sorted(cached):
        digest.update(p.encode() + b"\0" + (ROOT / p).read_bytes() + b"\0")
    version = digest.hexdigest()[:10]
    sw = sw.replace(m.group(0), f"const VERSION = '{version}';")
    (out / "sw.js").write_text(sw)

    rel = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
    print(f"{rel}/: {len(files)} files, "
          + ", ".join(f"{p} v={v}" for p, v in versions.items())
          + f", service worker VERSION={version} ({len(cached)} files)")


if __name__ == "__main__":
    main()
