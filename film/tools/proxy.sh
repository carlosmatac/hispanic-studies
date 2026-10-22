#!/usr/bin/env bash
# Shrink a downloaded video in place to a cataloguing proxy: h264 CRF 24, AAC 128k, <= 30 fps.
# Usage: film/tools/proxy.sh <id> <height>    e.g. proxy.sh JNLr7NM_buA 480
# The original is replaced only after the new file probes with the same duration (±1 s).
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"; DIR="$HERE/../media/beltran"
id="$1"; h="$2"; src="$DIR/$id.mp4"; tmp="$DIR/$id.proxy.mp4"
ffmpeg -nostdin -v error -y -i "$src" -vf "scale=-2:$h,fps=30" \
  -c:v libx264 -preset medium -crf 24 -c:a aac -b:a 128k -movflags +faststart "$tmp" 2>/dev/null \
|| ffmpeg -nostdin -v error -y -i "$src" -vf "scale=-2:$h" -r 30 \
  -c:v libx264 -preset medium -crf 24 -c:a aac -b:a 128k -movflags +faststart "$tmp"
d0=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
d1=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp")
python3 -c "import sys; sys.exit(0 if abs($d0-$d1) < 1 else 1)" || { echo "duration mismatch $d0 vs $d1"; rm -f "$tmp"; exit 1; }
mv "$tmp" "$src"; echo "$id -> ${h}p, $(du -h "$src" | cut -f1)"
