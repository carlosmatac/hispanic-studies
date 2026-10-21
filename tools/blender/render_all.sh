#!/bin/bash
# Render the three turntables (about 30 minutes on a 12-thread CPU), then pack them.
set -e
cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"
for pair in mestizaje:Mestizo catolicismo:Salomonica lengua:Balaustre; do
  k=${pair%%:*}; o=${pair##*:}
  python3 bl.py -c "KEY='$k'; OBJ='$o'; FRAMES=36; SWEEP=120; OUT='$REPO/assets/3d/frames/$k'; ONLY=None
$(cat render_seq.py)"
done
python3 pack_frames.py
