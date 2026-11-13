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

# Commit what the run changed and push it, which deploys (GitHub Actions to Bunny). Always a normal push, never forced:
# if the remote has moved, local commits are rebased onto it, and a conflict stops the run for a person to look at.
publish() {
  git add src/content src/data/roster pipeline/decisions.json pipeline/retracted.json
  git diff --cached --quiet || git commit -q -m "$1"
  # No remote configured means a local-only run.
  if git remote get-url origin >/dev/null 2>&1; then
    git push -q origin HEAD:main || { git pull -q --rebase origin main && git push -q origin HEAD:main; }
  fi
}
