#!/bin/sh
# One unattended pipeline run: refresh rosters, pull feeds, draft, verify, build, commit, and push.
# The push triggers the GitHub Actions deploy to Bunny. It is always a normal push, never forced: if the remote has
# moved, local commits are rebased onto it, and a conflict stops the run for a person to look at.
# Schedule it with ops/com.whatdidgovtdofor.pipeline.plist (see README).
set -eu
cd "$(dirname "$0")/.."

npm run -s sync:roster
npm run -s pipeline -- feeds --since "$(date -v-14d +%Y-%m-%d)"
npm run -s pipeline -- draft --limit "${DRAFT_LIMIT:-100}" --min-impact "${MIN_IMPACT:-3}" --concurrency "${CONCURRENCY:-3}"
# Verify new drafts, and re-check any entry whose status is more than 60 days old.
npm run -s pipeline -- verify --stale 60 --limit "${VERIFY_LIMIT:-130}" --concurrency "${CONCURRENCY:-3}"
npm run -s validate
npm run -s build

git add src/content src/data/roster pipeline/decisions.json pipeline/retracted.json
git diff --cached --quiet || git commit -q -m "Pipeline run $(date +%Y-%m-%d)"

# Publish. No remote configured means a local-only run.
if git remote get-url origin >/dev/null 2>&1; then
  git push -q origin HEAD:main || { git pull -q --rebase origin main && git push -q origin HEAD:main; }
fi
