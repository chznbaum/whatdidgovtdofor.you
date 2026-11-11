#!/bin/bash
# Draws one official in the site's ink style from a real photo, using GPT image generation via Codex.
# Usage: pipeline/portraits/draw.sh <official-id> <photo.jpg> ["extra likeness notes"]
# Writes pipeline/portraits/raw/<id>.png (the drawing on chroma-key green, 900px on the long side).
# Takes a few minutes. Check the result side by side with the photo before going on (see README.md).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
id="$1"; photo="$2"; notes="${3:-}"
[ -f "$photo" ] || { echo "no photo at $photo" >&2; exit 1; }
style="$(cat "$here/style.txt")"
mkdir -p "$here/raw"
work="$(mktemp -d)"
# stdin must be closed or codex waits on it forever.
codex exec -C "$work" --skip-git-repo-check --sandbox workspace-write -m "${CODEX_MODEL:-gpt-5.6-sol}" -i "$photo" -- \
  "Use your image generation tool to restyle the attached photo as: $style. ${notes} Keep the person's likeness faithful: same face, features, skin tone, hair, glasses, and age. Don't add text, logos, or flags. Then copy the generated image to $work/out.png." \
  < /dev/null > "$work/log.txt" 2>&1 || { tail -20 "$work/log.txt" >&2; exit 1; }
[ -f "$work/out.png" ] || { echo "no image produced for $id" >&2; tail -20 "$work/log.txt" >&2; exit 1; }
sips -Z 900 "$work/out.png" --out "$here/raw/$id.png" > /dev/null
rm -rf "$work"
echo "$here/raw/$id.png"
