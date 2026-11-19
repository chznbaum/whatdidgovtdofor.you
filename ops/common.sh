# Shared by ops/daily.sh and ops/lower-impact.sh; sourced from the repo root.

# One pipeline run at a time: they all edit pipeline/decisions.json and the entries, and all commit and push. The lock
# is a directory, which mkdir creates atomically; it's removed when the run ends, however it ends (short of kill -9).
#   lock         give up at once if another run holds it (runs started by hand)
#   lock 240     wait up to 240 minutes first (the scheduled run, so a long run started by hand doesn't cost a day)
LOCK=pipeline/state/run.lock
lock() {
  mkdir -p pipeline/state
  waited=0
  until mkdir "$LOCK" 2>/dev/null; do
    if [ "$waited" -ge "${1:-0}" ]; then
      echo "Another pipeline run has held $LOCK since $(cat "$LOCK/started" 2>/dev/null || echo '?'); not starting." >&2
      echo "If no run is going (check: ps aux | grep pipeline/run.ts), remove $LOCK and try again." >&2
      exit 1
    fi
    sleep 60
    waited=$((waited + 1))
  done
  date > "$LOCK/started"
  trap 'rm -rf "$LOCK"' EXIT
  trap 'exit 130' INT TERM
}

# Changes reach main only through pull requests, and a run's job ends once its PR is open. People, or workflows started
# by the PR (e.g. once it clears CI), review and merge it, and the merge deploys. Each run works on a
# pipeline/<date>-<time> branch. While a pipeline PR is still open, later runs add their commits to it (with main merged
# in) instead of opening another, so they never redraft what's waiting there. Pushes are always normal ones, never
# forced, and a conflict stops the run for a person.
#   start_run      before the run changes anything: pick the branch and switch to it
#   publish MSG    at the end: commit, push the branch, open the PR if there isn't one, then go back to main
LAST=pipeline/state/last-branch
BRANCH=
START_BRANCH=

start_run() {
  # No remote configured means a local-only run, on whatever is checked out.
  git remote get-url origin >/dev/null 2>&1 || return 0
  START_BRANCH=$(git branch --show-current)
  git fetch -q origin

  # The last run's commits must be on GitHub before a new branch starts from main, or they'd be left behind.
  if [ -f "$LAST" ]; then
    prev=$(cat "$LAST")
    if git rev-parse -q --verify "refs/heads/$prev" >/dev/null &&
      ! git merge-base --is-ancestor "$prev" "refs/remotes/origin/$prev" 2>/dev/null &&
      [ "$(gh pr list --head "$prev" --state all --json number --jq length)" = 0 ]; then
      echo "Branch $prev has commits that never reached GitHub. Push it (git push origin $prev), then run again." >&2
      exit 1
    fi
  fi

  # Our own open pipeline PR, if there is one (never a fork's branch that happens to share the name).
  BRANCH=$(gh pr list --base main --state open --author @me --json headRefName,isCrossRepository \
    --jq '[.[] | select(.isCrossRepository | not) | .headRefName | select(startswith("pipeline/"))][0] // empty')

  if [ -n "$BRANCH" ]; then
    if git rev-parse -q --verify "refs/heads/$BRANCH" >/dev/null; then
      git switch -q "$BRANCH"
      git merge -q --ff-only "origin/$BRANCH"
    else
      git switch -q -c "$BRANCH" "origin/$BRANCH"
    fi
    # Bring in whatever has merged to main since, so the PR stays mergeable.
    if ! git merge -q --no-edit origin/main; then
      git merge --abort
      echo "main doesn't merge cleanly into $BRANCH. Resolve it in that branch or its PR, then run again." >&2
      exit 1
    fi
  else
    BRANCH="pipeline/$(date +%Y-%m-%d-%H%M%S)"
    git switch -q --no-track -c "$BRANCH" origin/main
  fi
  echo "$BRANCH" > "$LAST"
}

publish() {
  git add src/content src/data/roster src/data/lastmod.json pipeline/decisions.json pipeline/retracted.json
  git diff --cached --quiet || git commit -q -m "$1"
  [ -n "$BRANCH" ] || return 0

  # Nothing new since main (no changes and no open PR): no branch to push, no PR to open.
  if [ "$(git rev-list --count origin/main..HEAD)" -gt 0 ]; then
    # If someone pushed to the PR's branch meanwhile, merge their commits in (never rebase what's already pushed).
    # set -e doesn't reach inside an || list, so a failure here stops the run explicitly, before any PR is opened.
    if ! git push -q -u origin "HEAD:refs/heads/$BRANCH"; then
      git pull -q --no-rebase --no-edit origin "$BRANCH" || exit 1
      git push -q -u origin "HEAD:refs/heads/$BRANCH" || exit 1
    fi
    if [ -z "$(gh pr list --head "$BRANCH" --state open --json number --jq '.[].number')" ]; then
      gh pr create --base main --head "$BRANCH" --title "$1" --body "Opened by the pipeline (\`ops/daily.sh\` or \`ops/lower-impact.sh\`). Each commit is one run, and \`pipeline/decisions.json\` records what happened to every candidate. Until this PR is merged, later runs add their commits here instead of opening another PR. Merging it deploys the site."
    fi
  fi

  # Leave the checkout where the run found it (main if it found a pipeline branch), with main caught up to GitHub's.
  case "$START_BRANCH" in "" | pipeline/*) START_BRANCH=main ;; esac
  git switch -q "$START_BRANCH"
  if [ "$START_BRANCH" = main ] && ! git merge -q --ff-only origin/main; then
    echo "Local main has commits GitHub's doesn't, so it wasn't updated. Move them to a branch and open a PR." >&2
  fi
}
