#!/usr/bin/env bash
# Lock down the repos behind sbmadhav.com so only approved contributions merge.
#
# Usage:
#   gh auth login                          # once, as sbmadhav (needs admin on the repos)
#   scripts/secure-repos.sh --dry-run      # show what would change, change nothing
#   scripts/secure-repos.sh                # apply
#   scripts/secure-repos.sh vedic-math     # only some repos
#
# Safe to run again: it reads each setting first and only writes what differs.
# For each repo it:
#   1. Adds or updates a branch ruleset on the default branch: pull request with 1
#      approval and code owner review, stale approvals dismissed, conversations
#      resolved, the repo's CI check required, no force pushes, no deletion.
#      The repository admin role can always bypass it, so the owner (and the owner's
#      Claude sessions) can still push straight to the live site.
#   2. Requires approval before workflows run for every outside contributor (fork PRs).
#   3. Sets the default GITHUB_TOKEN permissions to read, and stops workflows from
#      approving pull requests.
#   4. Turns on secret scanning, push protection, Dependabot alerts and private
#      vulnerability reporting.
#   5. Turns off the wiki and projects when they are empty. Issues stay on.
#   6. Compares the Pages settings before and after, and warns if anything moved.
#
# Needs: gh (authenticated), jq, git.

set -euo pipefail

OWNER=sbmadhav
DEFAULT_REPOS=(sbmadhav.github.io vedic-math design-system state-of-voice-agents)
RULESET_NAME="Protect default branch"
GITHUB_ACTIONS_APP_ID=15368 # the GitHub Actions app, the source of the CI checks
ADMIN_ROLE_ID=5             # built-in repository role ids: maintain 2, write 4, admin 5

# The CI job each repo must pass before a pull request can merge. The names come from
# the jobs in each repo's workflow (Site, CI and Build all name their job "check").
# state-of-voice-agents has no CI yet, so it requires no check.
required_checks() {
  case "$1" in
    sbmadhav.github.io | vedic-math | design-system) echo check ;;
    *) echo "" ;;
  esac
}

DRY_RUN=0
REPOS=()
for arg in "$@"; do
  case "$arg" in
    -n | --dry-run) DRY_RUN=1 ;;
    -h | --help)
      sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
    *) REPOS+=("$arg") ;;
  esac
done
[ ${#REPOS[@]} -gt 0 ] || REPOS=("${DEFAULT_REPOS[@]}")

for tool in gh jq git; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Missing $tool" >&2; exit 1; }
done

AUTHED=1
gh auth status >/dev/null 2>&1 || AUTHED=0
if [ "$AUTHED" = 0 ]; then
  if [ "$DRY_RUN" = 1 ]; then
    echo "gh is not signed in: showing the payloads only, without reading current settings."
  else
    echo "gh is not signed in. Run: gh auth login (then run this again)." >&2
    exit 1
  fi
fi

CHANGES=()
note() { printf '  %-28s %s\n' "$1" "$2"; }
changed() { CHANGES+=("$REPO: $1"); note "$1" "$2"; }

# write METHOD PATH [JSON]: send a change, or print it on a dry run.
write() {
  local method=$1 path=$2 body=${3:-}
  if [ "$DRY_RUN" = 1 ]; then
    printf '    would %s %s\n' "$method" "$path"
    [ -z "$body" ] || printf '%s\n' "$body" | jq . | sed 's/^/      /'
    if [ -n "${SECURE_REPOS_PAYLOAD_DIR:-}" ] && [ -n "$body" ]; then
      local f="$SECURE_REPOS_PAYLOAD_DIR/$(printf '%s_%s' "$method" "$path" | tr '/{}' '___').json"
      printf '%s\n' "$body" >"$f"
    fi
    return 0
  fi
  if [ -n "$body" ]; then
    printf '%s' "$body" | gh api -X "$method" "$path" --input - >/dev/null
  else
    gh api -X "$method" "$path" >/dev/null
  fi
}

# read PATH [JQ]: GET a setting; prints nothing when not signed in.
read_api() {
  [ "$AUTHED" = 1 ] || return 0
  if [ -n "${2:-}" ]; then gh api "$1" --jq "$2"; else gh api "$1"; fi
}

ruleset_json() {
  local checks
  checks=$(required_checks "$1")
  jq -n \
    --arg name "$RULESET_NAME" \
    --argjson admin "$ADMIN_ROLE_ID" \
    --argjson app "$GITHUB_ACTIONS_APP_ID" \
    --arg checks "$checks" '
    {
      name: $name,
      target: "branch",
      enforcement: "active",
      conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
      bypass_actors: [
        { actor_id: $admin, actor_type: "RepositoryRole", bypass_mode: "always" }
      ],
      rules: (
        [
          { type: "deletion" },
          { type: "non_fast_forward" },
          { type: "pull_request",
            parameters: {
              required_approving_review_count: 1,
              require_code_owner_review: true,
              dismiss_stale_reviews_on_push: true,
              require_last_push_approval: false,
              required_review_thread_resolution: true
            } }
        ] +
        (if $checks == "" then [] else
          [ { type: "required_status_checks",
              parameters: {
                strict_required_status_checks_policy: false,
                do_not_enforce_on_create: false,
                required_status_checks:
                  ($checks | split(" ") | map({ context: ., integration_id: $app }))
              } } ]
        end)
      )
    }'
}

pages_snapshot() {
  read_api "repos/$OWNER/$REPO/pages" \
    '{build_type, source, cname, https_enforced, html_url, public}' 2>/dev/null || echo "none"
}

secure_repo() {
  echo
  echo "== $OWNER/$REPO"

  local info='{}' pages_before=""
  if [ "$AUTHED" = 1 ]; then
    if ! info=$(gh api "repos/$OWNER/$REPO" 2>/dev/null); then
      echo "  Not found or no access. Skipped."
      return
    fi
    if [ "$(jq -r '.permissions.admin' <<<"$info")" != true ]; then
      echo "  The signed-in account is not an admin here. Skipped."
      return
    fi
    note "default branch" "$(jq -r '.default_branch' <<<"$info")"
    pages_before=$(pages_snapshot)
  fi

  # 1. Ruleset on the default branch
  local want id have
  want=$(ruleset_json "$REPO")
  id=$(read_api "repos/$OWNER/$REPO/rulesets" ".[] | select(.name == \"$RULESET_NAME\") | .id" | head -n1)
  if [ -z "$id" ]; then
    changed "ruleset" "creating \"$RULESET_NAME\""
    write POST "repos/$OWNER/$REPO/rulesets" "$want"
  else
    have=$(read_api "repos/$OWNER/$REPO/rulesets/$id")
    # Same if every wanted field is present with the same value and the rule types match
    if jq -e --argjson want "$want" '
        (. | contains($want))
        and ((.rules | map(.type) | sort) == ($want.rules | map(.type) | sort))
        and ((.bypass_actors | length) == ($want.bypass_actors | length))' <<<"$have" >/dev/null; then
      note "ruleset" "already set (id $id)"
    else
      changed "ruleset" "updating \"$RULESET_NAME\" (id $id)"
      write PUT "repos/$OWNER/$REPO/rulesets/$id" "$want"
    fi
  fi

  # 2. Fork pull request workflows need approval for every outside contributor
  local policy
  policy=$(read_api "repos/$OWNER/$REPO/actions/permissions/fork-pr-contributor-approval" '.approval_policy')
  if [ "$policy" = all_external_contributors ]; then
    note "fork PR workflow approval" "already all outside contributors"
  else
    changed "fork PR workflow approval" "${policy:-unknown} -> all_external_contributors"
    write PUT "repos/$OWNER/$REPO/actions/permissions/fork-pr-contributor-approval" \
      '{"approval_policy":"all_external_contributors"}'
  fi

  # 3. GITHUB_TOKEN read-only by default; workflows cannot approve pull requests
  local perms
  perms=$(read_api "repos/$OWNER/$REPO/actions/permissions/workflow" \
    '"\(.default_workflow_permissions) \(.can_approve_pull_request_reviews)"')
  if [ "$perms" = "read false" ]; then
    note "GITHUB_TOKEN default" "already read"
  else
    changed "GITHUB_TOKEN default" "${perms:-unknown} -> read false"
    write PUT "repos/$OWNER/$REPO/actions/permissions/workflow" \
      '{"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}'
  fi

  # 4a. Secret scanning, push protection, and turning off an empty wiki and projects
  local patch='{}' scan push wiki projects project_count
  scan=$(jq -r '.security_and_analysis.secret_scanning.status // "unknown"' <<<"$info")
  push=$(jq -r '.security_and_analysis.secret_scanning_push_protection.status // "unknown"' <<<"$info")
  if [ "$scan" = enabled ] && [ "$push" = enabled ]; then
    note "secret scanning" "already on, with push protection"
  else
    changed "secret scanning" "scanning $scan, push protection $push -> both enabled"
    patch=$(jq '.security_and_analysis = {
        secret_scanning: {status: "enabled"},
        secret_scanning_push_protection: {status: "enabled"}}' <<<"$patch")
  fi

  wiki=$(jq -r '.has_wiki | tostring' <<<"$info")
  if [ "$wiki" = false ]; then
    note "wiki" "already off"
  elif GIT_TERMINAL_PROMPT=0 git ls-remote "https://github.com/$OWNER/$REPO.wiki.git" >/dev/null 2>&1; then
    note "wiki" "has pages, left on"
  else
    changed "wiki" "empty, turning off"
    patch=$(jq '.has_wiki = false' <<<"$patch")
  fi

  projects=$(jq -r '.has_projects | tostring' <<<"$info")
  if [ "$AUTHED" = 1 ]; then
    # Needs the read:project token scope (gh auth refresh -s read:project). Without it
    # the count is unknown and projects are left as they are.
    project_count=$(gh api graphql \
      -f query='query($o:String!,$r:String!){repository(owner:$o,name:$r){projectsV2(first:1){totalCount}}}' \
      -f o="$OWNER" -f r="$REPO" --jq '.data.repository.projectsV2.totalCount' 2>/dev/null) || project_count=unknown
  else
    project_count=0
  fi
  if [ "$projects" = false ]; then
    note "projects" "already off"
  elif [ "$project_count" = unknown ]; then
    note "projects" "could not count (token lacks read:project), left on"
  elif [ "$project_count" != 0 ]; then
    note "projects" "$project_count linked, left on"
  else
    changed "projects" "none linked, turning off"
    patch=$(jq '.has_projects = false' <<<"$patch")
  fi

  if [ "$(jq -r '.has_issues | tostring' <<<"$info")" != false ]; then
    note "issues" "on (left on)"
  else
    note "issues" "off: left as is, turn on in Settings if wanted"
  fi

  if [ "$patch" != '{}' ]; then
    write PATCH "repos/$OWNER/$REPO" "$(jq -c . <<<"$patch")"
  fi

  # 4b. Dependabot alerts (GET answers 204 when on, 404 when off)
  if [ "$AUTHED" = 1 ] && gh api "repos/$OWNER/$REPO/vulnerability-alerts" >/dev/null 2>&1; then
    note "Dependabot alerts" "already on"
  else
    changed "Dependabot alerts" "turning on"
    write PUT "repos/$OWNER/$REPO/vulnerability-alerts"
  fi

  # 4c. Private vulnerability reporting (SECURITY.md points here)
  if [ "$(read_api "repos/$OWNER/$REPO/private-vulnerability-reporting" '.enabled')" = true ]; then
    note "private vuln reporting" "already on"
  else
    changed "private vuln reporting" "turning on"
    write PUT "repos/$OWNER/$REPO/private-vulnerability-reporting"
  fi

  # 5. Pages must be exactly as before
  if [ "$AUTHED" = 1 ] && [ "$DRY_RUN" = 0 ]; then
    local pages_after
    pages_after=$(pages_snapshot)
    if [ "$pages_before" = "$pages_after" ]; then
      note "Pages" "unchanged: $(jq -r '"\(.html_url) from \(.source.branch // "Actions")"' <<<"$pages_after" 2>/dev/null || echo "$pages_after")"
    else
      echo "  WARNING: Pages settings changed. Before: $pages_before" >&2
      echo "                                    After:  $pages_after" >&2
    fi
  fi
}

for REPO in "${REPOS[@]}"; do
  secure_repo
done

echo
if [ "$DRY_RUN" = 1 ]; then
  echo "Dry run: nothing was changed. ${#CHANGES[@]} change(s) planned."
elif [ ${#CHANGES[@]} -eq 0 ]; then
  echo "Everything was already in place. Nothing changed."
else
  echo "Changed ${#CHANGES[@]} setting(s):"
  printf '  - %s\n' "${CHANGES[@]}"
fi
