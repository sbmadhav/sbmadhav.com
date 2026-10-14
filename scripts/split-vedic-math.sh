#!/usr/bin/env bash
# Rebuild the standalone Vedic Math repo from vedic-math/ in this repo, keeping its history.
# Repeatable: every run starts again from the given ref, so run it from the latest master
# right before publishing.
#
# Usage (from anywhere inside this repo):
#   scripts/split-vedic-math.sh [source-ref] [target-dir]
#     source-ref  default: origin/master if it exists, else master
#     target-dir  default: ../vedic-math next to the main checkout of this repo
#
# What it does:
#   1. git subtree split --prefix=vedic-math <source-ref>  (history of that folder, moved to the root)
#   2. In target-dir (created with git init -b main if missing): reset branch main to the split.
#   3. Adds the repo files kept in scripts/split-vedic-math/ (build.py, CLAUDE.md, README.md,
#      _config.yml, .gitignore, .githooks/, .github/workflows/), rewrites "vedic-math/cloud" and
#      "vedic-math/js" doc paths in cloud/ to repo-relative ones, runs build.py and the tests,
#      and commits that as one "Standalone repo" commit on top of the split history.
#
# It rewrites main in target-dir every run. If main was already pushed, it stops unless
# FORCE=1 is set; then publish the result with: git -C <target-dir> push --force-with-lease origin main
# It never pushes and never touches branches in this repo (it only writes refs/split/vedic-math).

set -euo pipefail

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

SRC="$(git rev-parse --show-toplevel)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVERLAY="$HERE/split-vedic-math"
COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
MAIN_CHECKOUT="$(dirname "$COMMON")"

if [ $# -ge 1 ]; then REF="$1"
elif git rev-parse --verify -q origin/master >/dev/null; then REF=origin/master
else REF=master; fi
TARGET="${2:-$(dirname "$MAIN_CHECKOUT")/vedic-math}"

[ -d "$OVERLAY" ] || die "missing $OVERLAY"
git rev-parse --verify -q "$REF^{commit}" >/dev/null || die "unknown ref $REF"
git cat-file -e "$REF:vedic-math/index.html" 2>/dev/null || die "$REF has no vedic-math/ folder"
case "$TARGET" in "$MAIN_CHECKOUT"|"$MAIN_CHECKOUT"/*) die "target $TARGET is inside this repo";; esac

say "Splitting vedic-math/ from $REF ($(git rev-parse --short "$REF"))"
SPLIT="$(git subtree split --prefix=vedic-math "$REF" 2>/dev/null)"
[ -n "$SPLIT" ] || die "git subtree split produced nothing"
git update-ref refs/split/vedic-math "$SPLIT"
echo "    split head $SPLIT ($(git rev-list --count "$SPLIT") commits)"

if [ ! -d "$TARGET/.git" ]; then
  say "Creating $TARGET"
  mkdir -p "$TARGET"
  git init -q -b main "$TARGET"
fi
T() { git -C "$TARGET" "$@"; }

if T rev-parse --verify -q refs/remotes/origin/main >/dev/null && [ "${FORCE:-0}" != 1 ]; then
  die "$TARGET already has origin/main (published). Re-run with FORCE=1 to rebuild main anyway, then push with --force-with-lease."
fi

say "Resetting main in $TARGET to the split"
T fetch -q "$SRC" refs/split/vedic-math
T checkout -q -f -B main FETCH_HEAD
T clean -q -fd

say "Adding repo files"
cp -R "$OVERLAY"/. "$TARGET"/
chmod +x "$TARGET/.githooks/pre-commit" "$TARGET/build.py"
# Doc paths: vedic-math/cloud -> cloud, vedic-math/js -> js (only in cloud/ docs and the setup script)
for f in cloud/README.md cloud/setup.sh cloud/test/package.json; do
  [ -f "$TARGET/$f" ] || continue
  sed -i.bak -e 's#vedic-math/cloud/#cloud/#g' -e 's#vedic-math/cloud\([^-]\)#cloud\1#g' -e 's#`vedic-math/js/#`js/#g' "$TARGET/$f"
  rm -f "$TARGET/$f.bak"
done
# Test comments that name the old run command
for f in "$TARGET"/test/*.mjs "$TARGET"/test/index.js; do
  [ -f "$f" ] || continue
  sed -i.bak -e 's#node --test vedic-math/test/#node --test test/#g' -e "s#node --test 'vedic-math/test/#node --test 'test/#g" "$f"
  rm -f "$f.bak"
done

say "Building and testing"
(cd "$TARGET" && python3 build.py)
(cd "$TARGET" && node --test --test-reporter=dot 'test/**/*.test.{js,mjs}')

say "Committing"
T config core.hooksPath .githooks
T add -A
T commit -q -m "Standalone repo: build, hook, CI and docs

Split from vedic-math/ in sbmadhav/sbmadhav.github.io at $(git rev-parse --short "$REF") with
git subtree split (history kept). Served at https://sbmadhav.com/vedic-math/ by GitHub
project Pages. Shared design system, fonts, Explore menu and analytics stay in the main
site and load by absolute URL.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

say "Done: $TARGET (branch main, $(T rev-list --count main) commits)"
T log --oneline -3
