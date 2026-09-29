#!/usr/bin/env bash
# implement-sub-issues — run one headless pi session per GitHub sub-issue of a
# parent issue, committing every ticket onto a single branch.
#
# Usage: scripts/implement-sub-issues.sh <parent-issue> [--repo OWNER/NAME]
#          [--base BRANCH] [--branch NAME] [--from N] [--only N]
#          [--push] [--pr] [--dry-run]
#
# The parent issue body is the PRD; its sub-issues are the tickets, run in the
# parent's sub-issue order. All tickets land on one branch (default: the
# current branch; --branch NAME checks it out, creating it from HEAD if needed).
# The branch must not be the base (default: the repo's default branch).
#
# A ticket is done when its issue is closed or a commit in <base>..HEAD has a
# "Refs #N" trailer, so re-running resumes. The loop stops at the first
# failure and leaves the tree as-is for inspection.
#
# After each ticket the runner prettier-formats only the files the ticket
# changed (amending them into the ticket's last commit), then gates on
# `pnpm lint && pnpm tsc`. Nothing is pushed unless --push or --pr is given;
# --pr also opens (or updates) one draft PR that closes every completed ticket.
#
# Compatible with macOS bash 3.2.

set -uo pipefail

REMOTE="origin"

usage() {
  sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

die() { printf 'implement-sub-issues: %s\n' "$*" >&2; exit 1; }
info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }

# ---------- args ----------
PARENT=""
REPO=""
BASE=""
BRANCH=""
FROM=""
ONLY=""
PUSH=0
OPEN_PR=0
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --repo|-R) [ $# -ge 2 ] || die "$1 needs OWNER/NAME"; REPO="$2"; shift 2 ;;
    --base) [ $# -ge 2 ] || die "--base needs a branch"; BASE="$2"; shift 2 ;;
    --branch) [ $# -ge 2 ] || die "--branch needs a name"; BRANCH="$2"; shift 2 ;;
    --from) [ $# -ge 2 ] || die "--from needs an issue number"; FROM="${2#\#}"; shift 2 ;;
    --only) [ $# -ge 2 ] || die "--only needs an issue number"; ONLY="${2#\#}"; shift 2 ;;
    --push) PUSH=1; shift ;;
    --pr) PUSH=1; OPEN_PR=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -*) die "unknown flag: $1" ;;
    *) [ -z "$PARENT" ] || die "only one parent issue allowed"; PARENT="${1#\#}"; shift ;;
  esac
done

[ -n "$PARENT" ] || usage 1
case "$PARENT" in *[!0-9]*) die "parent issue must be a number: $PARENT" ;; esac

# ---------- preflight ----------
for cmd in git gh pi jq pnpm; do
  command -v "$cmd" >/dev/null 2>&1 || die "missing required command: $cmd"
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repository"
cd "$REPO_ROOT" || die "cannot cd to $REPO_ROOT"

gh auth status >/dev/null 2>&1 || die "gh is not authenticated (run: gh auth login)"
[ -n "$REPO" ] || REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)" \
  || die "cannot detect GitHub repo; pass --repo OWNER/NAME"
[ -n "$BASE" ] || BASE="$(gh repo view "$REPO" --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null)" \
  || die "cannot detect default branch; pass --base BRANCH"

tree_clean() { [ -z "$(git status --porcelain)" ]; }
tree_clean || die "working tree is not clean"

CURRENT="$(git symbolic-ref --quiet --short HEAD)" || die "detached HEAD; check out a branch first"
[ -n "$BRANCH" ] || BRANCH="$CURRENT"
[ "$BRANCH" != "$BASE" ] || die "refusing to commit tickets onto base branch $BASE; pass --branch NAME"

git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null \
  || git rev-parse --verify --quiet "$REMOTE/$BASE^{commit}" >/dev/null \
  || die "base branch $BASE not found locally or on $REMOTE"
git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || BASE_REF="$REMOTE/$BASE"
BASE_REF="${BASE_REF:-$BASE}"

# ---------- github ----------
PARENT_JSON="$(gh issue view "$PARENT" -R "$REPO" --json number,title,body,url)" \
  || die "cannot read issue #$PARENT in $REPO"
PARENT_TITLE="$(jq -r .title <<<"$PARENT_JSON")"

# number<TAB>state<TAB>title, in the parent's sub-issue order.
SUBS="$(gh api "repos/$REPO/issues/$PARENT/sub_issues" --paginate \
  --jq '.[] | "\(.number)\t\(.state)\t\(.title)"')" \
  || die "cannot list sub-issues of #$PARENT"
[ -n "$SUBS" ] || die "issue #$PARENT has no sub-issues"

TICKETS=()
while IFS= read -r line; do TICKETS+=("$line"); done <<<"$SUBS"

field() { printf '%s' "$1" | cut -f "$2"; }

issue_closed() { # <n>
  [ "$(gh issue view "$1" -R "$REPO" --json state -q .state 2>/dev/null)" = CLOSED ]
}

# A ticket is committed when a commit on the branch carries "Refs #N".
committed_on_branch() { # <n>
  git log --format=%B "$BASE_REF..$BRANCH" 2>/dev/null | grep -Eq "^Refs #$1\$"
}

ticket_done() { committed_on_branch "$1" || issue_closed "$1"; }

# Issue numbers from the ticket's "Depends on:" line.
ticket_deps() { # <body>
  printf '%s\n' "$1" | grep -i '^depends on:' | grep -oE '#[0-9]+' | tr -d '#' || true
}

# ---------- logs ----------
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/implement-sub-issues/$(basename "$REPO_ROOT")/$PARENT"
RUN_LOG="$LOG_DIR/run.log"
PRD_FILE="$LOG_DIR/prd-$PARENT.md"

write_prd() {
  mkdir -p "$LOG_DIR"
  jq -r '"# PRD #\(.number): \(.title)\n\n\(.url)\n\n\(.body)"' <<<"$PARENT_JSON" >"$PRD_FILE"
}

write_ticket() { # <n> <file>
  gh issue view "$1" -R "$REPO" --json number,title,body,url \
    -q '"# #\(.number): \(.title)\n\n\(.url)\n\n\(.body)"' >"$2"
}

build_prompt() { # <n> <title> <ticket-file>
  local n="$1" title="$2" ticket_file="$3"
  cat <<EOF
You are implementing GitHub issue #$n ("$title"), attached above as $(basename "$ticket_file"). It is one sub-issue of the PRD in #$PARENT, also attached as $(basename "$PRD_FILE"). Work fully autonomously; nobody will answer questions.

Every sub-issue of #$PARENT is implemented as a commit on the same branch, \`$BRANCH\`, which is checked out. Earlier tickets are already committed; run \`git log --oneline $BASE_REF..HEAD\` to see them. Build on what they did.

Do these steps in order:

1. Read AGENTS.md and CONTEXT.md, then the code the ticket touches.
2. Implement everything in the ticket's scope and acceptance criteria. Stay inside this ticket; don't start other sub-issues.
3. Run the ticket's Validation commands and fix failures. Run vitest non-interactively (\`pnpm test -- --run\`). Always finish with \`pnpm lint && pnpm tsc\` passing. If something can only be checked manually (e.g. on a device), list it in the commit body under "Manual checks".
4. Formatting: only format files you changed, with \`pnpm exec prettier --write --ignore-unknown <files>\`. Never run prettier on \`.\` or on whole directories; the codebase is not prettier-clean and that rewrites unrelated files.
5. Commit on \`$BRANCH\` with a conventional-commit message (e.g. \`feat(meal-planner): ...\`). The last line of the message must be exactly this trailer:
   Refs #$n
   One commit is preferred. Leave the working tree clean, and don't commit anything unrelated.
6. Don't switch branches, rebase, amend or rewrite earlier commits, push, open PRs, or comment on or close issues.
7. The last line of your final response must be exactly one of:
   SUB_ISSUE_RESULT: DONE
   SUB_ISSUE_RESULT: FAILED <one-line reason>
EOF
}

# Prettier-format files changed since <start>; amend fixes into HEAD.
format_changed() { # <start>
  local files
  files="$(git diff --name-only --diff-filter=ACMR "$1..HEAD")"
  [ -n "$files" ] || return 0
  printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 pnpm exec prettier --write --ignore-unknown >/dev/null \
    || return 1
  if ! tree_clean; then
    info "amending prettier fixes into $(git rev-parse --short HEAD)"
    git add -u && git commit --quiet --amend --no-edit || return 1
  fi
}

quality_gate() { pnpm lint && pnpm tsc; }

# ---------- plan ----------
info "repo:   $REPO ($REPO_ROOT)"
info "parent: #$PARENT $PARENT_TITLE (${#TICKETS[@]} sub-issues)"
info "branch: $BRANCH (base $BASE_REF)"

if [ "$DRY_RUN" = 0 ]; then
  if [ "$CURRENT" != "$BRANCH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git checkout --quiet "$BRANCH" || die "cannot check out $BRANCH"
    else
      info "creating $BRANCH from $CURRENT"
      git checkout --quiet -b "$BRANCH" || die "cannot create $BRANCH"
    fi
  fi
  write_prd
  info "logs:   $LOG_DIR"
  info "baseline: pnpm lint && pnpm tsc"
  quality_gate >"$LOG_DIR/baseline.log" 2>&1 \
    || die "baseline checks fail before any ticket runs; see $LOG_DIR/baseline.log"
fi

trap 'echo; warn "interrupted"; exit 130' INT TERM

ran_any=0
started_from=0
PLANNED=" " # dry-run only: tickets that would have run earlier
for t in "${TICKETS[@]}"; do
  n="$(field "$t" 1)"
  title="$(field "$t" 3)"

  if [ -n "$ONLY" ] && [ "$n" != "$ONLY" ]; then continue; fi
  if [ -n "$FROM" ] && [ "$started_from" = 0 ]; then
    [ "$n" = "$FROM" ] || continue
    started_from=1
  fi

  if committed_on_branch "$n"; then
    info "[#$n] done (committed): $title"; continue
  fi
  if [ "$(field "$t" 2)" = closed ]; then
    info "[#$n] done (closed): $title"; continue
  fi

  body="$(gh issue view "$n" -R "$REPO" --json body -q .body)" || die "[#$n] cannot read issue"
  for dep in $(ticket_deps "$body"); do
    case "$PLANNED" in *" $dep "*) continue ;; esac
    ticket_done "$dep" || die "[#$n] depends on #$dep, which is neither closed nor committed on $BRANCH"
  done

  if [ "$DRY_RUN" = 1 ]; then
    printf '\n\033[1m[#%s] %s\033[0m\n' "$n" "$title"
    if [ "$ran_any" = 0 ]; then
      printf '  prompt:\n'
      build_prompt "$n" "$title" "$LOG_DIR/issue-$n.md" | sed 's/^/    | /'
    fi
    PLANNED="$PLANNED$n "
    ran_any=1
    continue
  fi

  # --- run ---
  ticket_file="$LOG_DIR/issue-$n.md"
  log="$LOG_DIR/issue-$n.log"
  write_ticket "$n" "$ticket_file" || die "[#$n] cannot read issue"
  start="$(git rev-parse HEAD)"
  started="$(date '+%Y-%m-%dT%H:%M:%S')"

  info "[#$n] $title"
  info "[#$n] log: $log"

  pi -p --name "$BRANCH #$n" "@$PRD_FILE" "@$ticket_file" \
    "$(build_prompt "$n" "$title" "$ticket_file")" 2>&1 | tee "$log"
  pi_status="${PIPESTATUS[0]}"
  ran_any=1

  # --- verify ---
  fail=""
  if [ "$pi_status" -ne 0 ]; then
    fail="pi exited with status $pi_status"
  elif grep -q '^SUB_ISSUE_RESULT: FAILED' "$log"; then
    fail="agent reported: $(grep '^SUB_ISSUE_RESULT: FAILED' "$log" | tail -n 1 | sed 's/^SUB_ISSUE_RESULT: FAILED *//')"
  elif [ "$(git symbolic-ref --quiet --short HEAD)" != "$BRANCH" ]; then
    fail="agent left $BRANCH checked out as something else"
  elif ! git merge-base --is-ancestor "$start" HEAD; then
    fail="agent rewrote commits that existed before the ticket"
  elif [ "$(git rev-list --count "$start..HEAD")" -eq 0 ]; then
    fail="no new commits"
  elif ! committed_on_branch "$n"; then
    fail="no commit with a 'Refs #$n' trailer"
  elif ! tree_clean; then
    fail="working tree is not clean"
  elif ! format_changed "$start"; then
    fail="prettier failed on changed files"
  elif ! quality_gate >>"$log" 2>&1; then
    fail="pnpm lint && pnpm tsc failed (see log)"
  elif ! tree_clean; then
    fail="working tree is not clean after checks"
  fi

  if [ -n "$fail" ]; then
    printf '%s\t#%s\tFAILED: %s\n' "$started" "$n" "$fail" >>"$RUN_LOG"
    warn "[#$n] FAILED: $fail"
    warn "log: $log"
    exit 1
  fi

  printf '%s\t#%s\tDONE %s\n' "$started" "$n" "$(git rev-parse --short HEAD)" >>"$RUN_LOG"
  info "[#$n] done: $(git log -1 --format='%h %s')"
done

if [ -n "$FROM" ] && [ "$started_from" = 0 ]; then
  die "#$FROM is not a sub-issue of #$PARENT"
fi

if [ "$DRY_RUN" = 1 ]; then
  [ "$ran_any" = 1 ] && echo || info "nothing to do: all selected sub-issues are done"
  exit 0
fi

[ "$ran_any" = 1 ] && info "all selected sub-issues complete" \
  || info "nothing to do: all selected sub-issues are done"

# ---------- push / PR ----------
[ "$PUSH" = 1 ] || exit 0
info "pushing $BRANCH to $REMOTE"
git push --quiet -u "$REMOTE" "$BRANCH" || die "failed to push $BRANCH"

[ "$OPEN_PR" = 1 ] || exit 0
closes=""
for t in "${TICKETS[@]}"; do
  n="$(field "$t" 1)"
  committed_on_branch "$n" && closes="$closes- Closes #$n $(field "$t" 3)"$'\n'
done
pr_body="Implements the sub-issues of #$PARENT.

$closes"
pr_url="$(gh pr list -R "$REPO" --head "$BRANCH" --state open --json url -q '.[0].url // empty')"
if [ -n "$pr_url" ]; then
  gh pr edit "$pr_url" -R "$REPO" --body "$pr_body" >/dev/null || die "failed to update $pr_url"
  info "updated PR: $pr_url"
else
  pr_url="$(gh pr create -R "$REPO" --draft --base "$BASE" --head "$BRANCH" \
    --title "${PARENT_TITLE#PRD: }" --body "$pr_body")" || die "failed to open PR"
  info "opened draft PR: $pr_url"
fi
