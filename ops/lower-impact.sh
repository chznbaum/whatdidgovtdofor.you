#!/bin/sh
# A run for lower-impact actions, started by hand when there's capacity. The daily run (ops/daily.sh) drafts only
# impact 3 and up, so actions triaged at impact 2 (still worth surfacing) never reach it; this drafts those, then
# verifies, builds, commits and pushes the same way. It skips rosters and feeds, which the daily run keeps fresh, and
# won't start while another run is going.
#   ops/lower-impact.sh                          100 impact-2 drafts, about two hours
#   DRAFT_LIMIT=50 ops/lower-impact.sh           fewer
#   MIN_IMPACT=1 ops/lower-impact.sh             impact 1 too
#   nohup ops/lower-impact.sh > /tmp/whatdidgovtdofor-lower-impact.log 2>&1 &    keeps going after the terminal closes
set -eu
cd "$(dirname "$0")/.."
. ops/common.sh
lock

npm run -s pipeline -- draft --limit "${DRAFT_LIMIT:-100}" --min-impact "${MIN_IMPACT:-2}" --max-impact "${MAX_IMPACT:-2}" --concurrency "${CONCURRENCY:-3}"
npm run -s pipeline -- verify --limit "${VERIFY_LIMIT:-130}" --concurrency "${CONCURRENCY:-3}"
npm run -s validate
npm run -s build

publish "Lower-impact run $(date +%Y-%m-%d)"
