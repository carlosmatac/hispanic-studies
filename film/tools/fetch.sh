#!/usr/bin/env bash
# Download Beltrán's videos (ids.txt) and their English subtitles into film/media/beltran/.
# Usage: film/tools/fetch.sh [video|subs]   (default: both). Needs ~/.venvs/film (yt-dlp).
# Videos come at <= 720p (h264/m4a); anything over 150 MB is shrunk to a 480p proxy
# (exact segments can be re-fetched at full quality later with --download-sections).
# Metadata is a small <id>.info.json (id, title, duration, size, fps, date, description).
# Stops downloading video when free disk space drops under MIN_FREE_GB (default 3).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../media/beltran"; mkdir -p "$OUT"
YT=~/.venvs/film/bin/yt-dlp
COMMON=(--js-runtimes "node:$(command -v node)" --no-progress -o "$OUT/%(id)s.%(ext)s")
MIN_FREE_GB="${MIN_FREE_GB:-3}"
mode="${1:-both}"
free_gb() { df -BG --output=avail / | tail -1 | tr -dc 0-9; }
while read -r id; do
  [ -z "$id" ] && continue
  if [ "$mode" != subs ] && [ ! -s "$OUT/$id.mp4" ]; then
    if [ "$(free_gb)" -lt "$MIN_FREE_GB" ]; then
      echo "LOW DISK ($(free_gb) GB free): skipping video $id"
    else
      $YT "${COMMON[@]}" -S "res:720,vcodec:h264,acodec:m4a" --merge-output-format mp4 --no-write-subs \
        --print-to-file '{"id": %(id)j, "title": %(title)j, "duration": %(duration)j, "width": %(width)j, "height": %(height)j, "fps": %(fps)j, "upload_date": %(upload_date)j, "description": %(description)j}' \
        "$OUT/%(id)s.info.json" "https://www.youtube.com/watch?v=$id" </dev/null || echo "FAILED video $id"
      rm -f "$OUT/$id".*.part "$OUT/$id".f[0-9]* "$OUT/$id".temp.* 2>/dev/null
      if [ -s "$OUT/$id.mp4" ] && [ "$(du -m "$OUT/$id.mp4" | cut -f1)" -gt 150 ]; then
        "$HERE/proxy.sh" "$id" 480 </dev/null || echo "FAILED proxy $id"
      fi
    fi
  fi
  if [ "$mode" != video ] && ! ls "$OUT/$id".en*.vtt >/dev/null 2>&1; then
    $YT "${COMMON[@]}" --skip-download --write-subs --write-auto-subs \
      --sub-langs "${SUB_LANGS:-en,en-orig}" --sub-format vtt --sleep-subtitles 4 \
      "https://www.youtube.com/watch?v=$id" </dev/null || echo "FAILED subs $id"
    sleep 6
  fi
done < "$HERE/ids.txt"
