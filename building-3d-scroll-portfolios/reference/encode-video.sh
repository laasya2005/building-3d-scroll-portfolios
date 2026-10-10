#!/usr/bin/env bash
# Encode Flow/Veo source clips (raw-video/*.mp4, 1920x1080@24) for the web.
# Each clip is trimmed at the frame where it best returns to the shared start pose
# (measured by pose similarity), cropped around the person, and written at 1280w + 720w.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=raw-video OUT=public/video
mkdir -p "$OUT"

# name:last_frame (inclusive)
CLIPS="wave:112 coffee:155 laugh:144"
CROP="crop=1600:1080:260:0"

# Apple logo on the laptop lid. The camera is locked off in every clip, so the
# lid sits in the same place: centre (767, 701) in the 1280-wide encode.
LOGO_DIR=$(mktemp -d)
node -e "
const sharp = require('sharp');
(async () => {
  for (const [w, size] of [[1280, 150], [720, 84]])
    await sharp('scripts/assets/lid-logo.svg', { density: 300 }).resize(size, size).png().toFile('$LOGO_DIR/logo-' + w + '.png');
})();"
logo_xy() { # width -> overlay x:y
  if [ "$1" = 1280 ]; then echo "692:626"; else echo "389:352"; fi
}

for entry in $CLIPS; do
  name=${entry%%:*}; last=${entry##*:}
  for w in 1280 720; do
    suffix=$([ $w = 720 ] && echo "-sm" || echo "")
    ffmpeg -v error -y -i "$SRC/$name.mp4" -i "$LOGO_DIR/logo-$w.png" -an \
      -filter_complex "[0]trim=end_frame=$((last + 1)),setpts=PTS-STARTPTS,$CROP,scale=$w:-2:flags=lanczos[v];[v][1]overlay=$(logo_xy $w)" \
      -c:v libx264 -preset slow -crf $([ $w = 720 ] && echo 26 || echo 23) -pix_fmt yuv420p \
      -profile:v high -movflags +faststart "$OUT/$name$suffix.mp4"
  done
done

# The resting portrait is one still frame (head upright, eyes to the lens),
# exported with the same crop and lid logo as the clips.
echo "encoded:"; ls -la "$OUT"
