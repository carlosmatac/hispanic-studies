#!/usr/bin/env bash
# Grab one frame per "id seconds" line on stdin and tile them, labelled, into one jpg.
# Usage: printf 'id 12.3\n...' | probe-frames.sh out.jpg [cols]
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"; DIR="$HERE/../media/beltran"
out="$1"; cols="${2:-8}"; tmp="$(mktemp -d)"; n=0
FONT="$(fc-match -f '%{file}' monospace)"
while read -r id t; do
  [ -z "$id" ] && continue
  n=$((n+1))
  ffmpeg -nostdin -v error -y -ss "$t" -i "$DIR/$id.mp4" -frames:v 1 \
    -vf "scale=${W:-200}:300:force_original_aspect_ratio=decrease,pad=${W:-200}:300:(ow-iw)/2:(oh-ih)/2:black,drawtext=fontfile=$FONT:text='$n $id $t':x=2:y=2:fontsize=11:fontcolor=yellow:box=1:boxcolor=black@0.8" \
    "$tmp/$(printf %03d $n).png"
done
rows=$(( (n + cols - 1) / cols ))
ffmpeg -nostdin -v error -y -framerate 1 -i "$tmp/%03d.png" -vf "tile=${cols}x${rows}:padding=2" -frames:v 1 -q:v 5 "$out"
rm -rf "$tmp"
