#!/usr/bin/env bash
# Fetch, at full quality, only the fragments of Beltrán's videos the reel uses
# (film/MATERIAL.md has the catalogue). They land in film/reel/assets/clips/,
# which is git-ignored: run this once before rendering.
set -euo pipefail
cd "$(dirname "$0")/../reel/assets/clips"
YTDLP="${YTDLP:-$HOME/.venvs/film/bin/yt-dlp}"
NODE="$(command -v node)"
# name  id  start  end
while read -r name id a b; do
  [ -z "${name:-}" ] && continue
  [ -f "$name.mp4" ] && continue
  "$YTDLP" --js-runtimes "node:$NODE" --no-progress -q -S "res:1080,vcodec:h264,acodec:m4a" \
    --download-sections "*$a-$b" --force-keyframes-at-cuts --merge-output-format mp4 \
    -o "$name.raw.%(ext)s" -- "$id"
  # a keyframe every half second: HyperFrames seeks every frame, and a clip
  # cut with one keyframe freezes in the render
  ffmpeg -v error -y -i "$name.raw.mp4" -c:v libx264 -preset medium -crf 16 -r 30 -g 15 -keyint_min 15 \
    -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$name.mp4"
  rm -f "$name.raw.mp4"
  echo "ok $name"
done <<'LIST'
know      3LYcIzK8mxo 859.30 863.30
born      3LYcIzK8mxo 318.50 324.00
mestizo   3LYcIzK8mxo 888.20 893.80
record    3LYcIzK8mxo 53.80 55.68
cowboys   o-dErW9X2P0 47.50 49.70
fashion   NJKfmnwbOXQ 113.20 115.90
chant     urUxytVc2Zc 167.30 170.90
g-bolo    BISc6y6fIuM 82.40 84.50
g-blazer  JNLr7NM_buA 110.00 113.50
g-veranda 5Yug5P6lbCc 154.20 157.60
g-jesuit  xvZouT3m_q4 52.30 55.30
g-roots   in8ZZBfXXlo 58.00 61.10
g-white   2RMoqe-pz8o 58.30 60.40
LIST
