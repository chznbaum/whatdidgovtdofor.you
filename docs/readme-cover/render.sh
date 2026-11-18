#!/bin/sh
# Renders the README cover (readme-cover.html -> readme-cover-light.png and readme-cover-dark.png, 2024x1282) with
# headless Chrome at 2x. The page picks its theme from the URL hash. Each version has its own opaque background (paper
# for light, ink for dark), so it stays readable when GitHub shows the other theme's image: <picture> follows the
# operating system's light or dark setting, not the GitHub theme. Faces come from public/portraits/ and fonts from
# node_modules, so run `npm ci` first. Uses macOS's Chrome path; set CHROME to use another. The entry excerpt is
# copied from src/content/entries/state/va-2026-hb625-prescription-copay-cap-plans.md; update both if it changes.
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
W=1012
H=641
for T in light dark; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --window-size=$W,$H --default-background-color=00000000 --virtual-time-budget=3000 \
    --screenshot="$PWD/readme-cover-$T.raw.png" "file://$PWD/readme-cover.html#$T" 2>/dev/null
  node -e "
const sharp = require('../../node_modules/sharp');
(async () => {
  await sharp('readme-cover-$T.raw.png').extract({ left: 0, top: 0, width: $W * 2, height: $H * 2 })
    .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile('readme-cover-$T.png');
  console.log('readme-cover-$T.png', (require('fs').statSync('readme-cover-$T.png').size / 1024).toFixed(0) + ' KB');
})();"
  rm "readme-cover-$T.raw.png"
done
