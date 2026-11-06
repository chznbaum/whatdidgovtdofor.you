#!/bin/sh
# One unattended pipeline run: refresh rosters, pull feeds, draft, verify, build, and commit locally.
# Never pushes. Schedule it with ops/com.whatdidgovtdofor.pipeline.plist (see README).
set -eu
cd "$(dirname "$0")/.."

npm run -s sync:roster
npm run -s pipeline -- feeds --since "$(date -v-14d +%Y-%m-%d)"
npm run -s pipeline -- draft --limit "${DRAFT_LIMIT:-10}"
# Verify new drafts, and re-check any entry whose status is more than 60 days old.
npm run -s pipeline -- verify --stale 60 --limit "${VERIFY_LIMIT:-30}"
npm run -s validate
npm run -s build

git add src/content src/data/roster pipeline/decisions.json pipeline/retracted.json
git diff --cached --quiet || git commit -q -m "Pipeline run $(date +%Y-%m-%d)"
