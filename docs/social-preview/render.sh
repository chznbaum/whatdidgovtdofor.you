#!/bin/sh
# Renders the repo's GitHub social preview (social-preview.html -> social-preview.png, 1280x640, under 1 MB) with
# headless Chrome, so Young Serif's lining figures apply (satori ignores them). Faces come from public/portraits/ and
# fonts from node_modules, so run `npm ci` first. GitHub only takes the image by hand: Settings -> General -> Social
# preview. Uses macOS's Chrome path; set CHROME to use another.
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=1 --window-size=1280,640 --virtual-time-budget=3000 \
  --screenshot="$PWD/social-preview.raw.png" "file://$PWD/social-preview.html" 2>/dev/null
node -e "
const sharp = require('../../node_modules/sharp');
(async () => {
  await sharp('social-preview.raw.png').extract({ left: 0, top: 0, width: 1280, height: 640 })
    .png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 }).toFile('social-preview.png');
  console.log('social-preview.png', (require('fs').statSync('social-preview.png').size / 1024).toFixed(0) + ' KB');
})();"
rm social-preview.raw.png
