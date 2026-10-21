#!/usr/bin/env bash
# For each downloaded video in film/media/beltran/: transcript, contact sheets, scene cuts.
# Usage: film/tools/catalogue.sh [id ...]   (default: every id in ids.txt)
#   <id>.txt            clean transcript ([mm:ss.s] text), from the best English .vtt
#   <id>-sheet-NN.jpg   contact sheets, timestamp burnt on every frame
#                       (16:9: one frame / 4 s, 5x6 per page; vertical: one / 1.5 s, 10x4 per page)
#   <id>-overview-NN.jpg (16:9 only) one frame / 15 s, 6x8 per page
#   <id>-cuts.txt       scene cuts (ffmpeg scene > 0.3), one time in seconds per line
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="$HERE/../media/beltran"
FONT="$(fc-match -f '%{file}' monospace)"
ids=("$@"); [ ${#ids[@]} -eq 0 ] && mapfile -t ids < "$HERE/ids.txt"
for id in "${ids[@]}"; do
  v="$DIR/$id.mp4"; [ -s "$v" ] || { echo "missing $id"; continue; }
  # transcript: manual en > en-orig > en auto
  vtt=""
  for c in "$DIR/$id.en.vtt" "$DIR/$id.en-orig.vtt" $(ls "$DIR/$id".en*.vtt 2>/dev/null); do
    [ -s "$c" ] && { vtt="$c"; break; }
  done
  [ -n "$vtt" ] && python3 -I "$HERE/vtt2txt.py" "$vtt" > "$DIR/$id.txt"
  w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$v")
  h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$v")
  if [ "$h" -gt "$w" ]; then step=1.5; sc="scale=-2:300"; tile=10x4; fs=20
  else step=4; sc="scale=384:-2"; tile=5x6; fs=22; fi
  rm -f "$DIR/$id"-sheet-*.jpg
  ffmpeg -nostdin -v error -y -i "$v" -vf "fps=1/$step,$sc,drawtext=fontfile=$FONT:text='%{pts\:hms}':x=4:y=4:fontsize=$fs:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=$tile:margin=4:padding=4" \
    -q:v 5 "$DIR/$id-sheet-%02d.jpg"
  if [ "$h" -le "$w" ]; then  # long videos: a coarse overview too, one frame / 15 s, 6x8 per page
    rm -f "$DIR/$id"-overview-*.jpg
    ffmpeg -nostdin -v error -y -i "$v" -vf "fps=1/15,scale=320:-2,drawtext=fontfile=$FONT:text='%{pts\:hms}':x=3:y=3:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=6x8:margin=4:padding=4" \
      -q:v 5 "$DIR/$id-overview-%02d.jpg"
  fi
  ffmpeg -nostdin -v info -i "$v" -an -vf "scale=320:-2,select='gt(scene,0.3)',showinfo" -f null - 2>&1 \
    | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 > "$DIR/$id-cuts.txt"
  echo "done $id ($w x $h, $(ls "$DIR/$id"-sheet-*.jpg | wc -l) sheets, $(wc -l < "$DIR/$id-cuts.txt") cuts)"
done
