#!/bin/sh
# One unattended pipeline run: refresh rosters, pull feeds, draft, verify, build, commit, and push.
# The push triggers the GitHub Actions deploy to Bunny (see publish in ops/common.sh).
# Schedule it with ops/com.whatdidgovtdofor.pipeline.plist (see README). Safe to start by hand too: if another run is
# going, it waits for it (up to four hours) instead of running alongside.
set -eu
cd "$(dirname "$0")/.."
. ops/common.sh
lock 240

npm run -s sync:roster
npm run -s pipeline -- feeds --since "$(date -v-14d +%Y-%m-%d)"
npm run -s pipeline -- draft --limit "${DRAFT_LIMIT:-100}" --min-impact "${MIN_IMPACT:-3}" --concurrency "${CONCURRENCY:-3}"
# Verify new drafts, and re-check any entry whose status is more than 60 days old.
npm run -s pipeline -- verify --stale 60 --limit "${VERIFY_LIMIT:-130}" --concurrency "${CONCURRENCY:-3}"
npm run -s validate
npm run -s build

publish "Pipeline run $(date +%Y-%m-%d)"
