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
- Writes .nojekyll so Pages serves the output as is.

It fails if the source carries stamps (a ?v= on those scripts, or a VERSION other than
'dev'), so they cannot creep back into git.

/vedic-math/ is its own repo (sbmadhav/vedic-math) with its own build.py.
"""
import argparse, fnmatch, hashlib, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SCRIPTS = ["assets/app.js", "assets/explore.js", "assets/analytics.js"]

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


def main():
    ap = argparse.ArgumentParser(description="Build the site into an output directory with cache stamps.")
    ap.add_argument("--out", help="output directory, emptied first (default: _site/ in the repo)")
    arg = ap.parse_args().out
    out = pathlib.Path(arg).resolve() if arg else ROOT / "_site"
    if out == ROOT or ROOT.is_relative_to(out):
        fail("--out must not be the repo itself")

    if out.exists():
        if any(out.iterdir()) and not (out / ".nojekyll").exists():
            fail(f"{out} is not empty and is not an earlier build (no .nojekyll); refusing to delete it")
        shutil.rmtree(out)
    files = publishable()
    for required in ["index.html", "sw.js", *SCRIPTS]:
        if required not in files:
            fail(f"{required} is missing from the publishable files")

    for f in files:
        (out / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, out / f)
    (out / ".nojekyll").write_bytes(b"")

    versions = {p: h((ROOT / p).read_bytes()) for p in SCRIPTS}

    # ---------- pages ----------
    for f in files:
        if f.endswith(".html"):
            src = (ROOT / f).read_text()
            new = stamp(src, versions, f)
            if new != src:
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
