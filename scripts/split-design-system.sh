#!/bin/sh
# Split design-system/ (with its history) out of this repo into its own repo.
#
#   scripts/split-design-system.sh [DEST]
#
# DEST defaults to ../design-system next to this repo (the sbmadhav/design-system clone).
# Repeatable: it splits the latest origin/master every time. git subtree split is
# deterministic, so the same history always gives the same commits.
#
# - DEST missing: creates it with branch main at the split commit.
# - DEST exists:  fetches the split into DEST's branch "split" and leaves merging to you
#                 (git -C DEST merge split), so commits made in DEST are never overwritten.
#
# Once design-system/ is removed from master, origin/master has nothing left to split.
# Pass a commit that still has the folder instead: SPLIT_FROM=34ccf0b scripts/split-design-system.sh
set -eu

SITE=$(git rev-parse --show-toplevel)
# The main checkout (not a worktree under .claude/worktrees), so DEST lands next to it
MAIN=$(cd "$(git rev-parse --git-common-dir)/.." && pwd)
DEST=${1:-$(dirname "$MAIN")/design-system}
FROM=${SPLIT_FROM:-origin/master}

if [ "$FROM" = origin/master ]; then
  git -C "$SITE" fetch --quiet origin master
fi
git -C "$SITE" cat-file -e "$FROM:design-system" 2>/dev/null || {
  echo "split-design-system: $FROM has no design-system/ folder; set SPLIT_FROM to an older commit" >&2
  exit 1
}

# git subtree split wants the folder in the working tree, which a checkout without
# design-system/ lacks, so split inside a temporary detached worktree at FROM.
# The temporary ref lets DEST fetch the commit. Both are removed on exit.
TMP=$(mktemp -d)
REF=refs/split/design-system
trap 'git -C "$SITE" worktree remove --force "$TMP" 2>/dev/null; rm -rf "$TMP"; git -C "$SITE" update-ref -d "$REF" 2>/dev/null' EXIT
git -C "$SITE" worktree add --quiet --detach "$TMP" "$FROM"

echo "Splitting design-system/ from $FROM ..."
SHA=$(git -C "$TMP" subtree split -q --prefix=design-system HEAD)
echo "Split commit: $SHA"
git -C "$SITE" update-ref "$REF" "$SHA"

if [ ! -d "$DEST/.git" ]; then
  mkdir -p "$DEST"
  git -C "$DEST" init --quiet -b main
  git -C "$DEST" fetch --quiet "$SITE" "$REF"
  git -C "$DEST" reset --quiet --hard "$SHA"
  echo "Created $DEST on main at $SHA"
else
  git -C "$DEST" fetch --quiet "$SITE" "$REF"
  git -C "$DEST" branch -f split "$SHA"
  echo "Updated branch split in $DEST to $SHA. Merge it with: git -C $DEST merge split"
fi
