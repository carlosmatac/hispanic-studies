#!/usr/bin/env python3
"""Pack the rendered turntables for the site (needs Pillow and NumPy).

usage: pack_frames.py [frames-dir] [key ...]
assets/3d/frames/<key>/g-NN.webp, t-NN.png  →  site/public/art/pillars/<key>/
  g-NN.webp   the gilded render, RGBA, as Blender wrote it
  t-NN.webp   the clay pass, greyscale on white (the shader engraves from it)
  still.webp  the resting gilded frame (30): what shows without WebGL or with reduced motion
"""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / 'assets/3d/frames'
KEYS = sys.argv[2:] or ['mestizaje', 'catolicismo', 'lengua']
OUT = REPO / 'site/public/art/pillars'
FRAMES = 36
REST = 30        # where the scroll leaves the column (EngravedPlate.tsx: FRAMES - 1 - NUDGE)
for key in KEYS:
    src, dst = SRC / key, OUT / key
    dst.mkdir(parents=True, exist_ok=True)
    clay = [np.asarray(Image.open(src / f't-{i:02d}.png').convert('RGBA'), dtype=np.float32) / 255 for i in range(FRAMES)]
    # one tone range for the whole turntable, so the light does not flicker between frames
    vals = np.concatenate([c[..., 0][c[..., 3] > 0.5] for c in clay])
    lo, hi = np.percentile(vals, 2), np.percentile(vals, 99)
    for i in range(FRAMES):
        shutil.copyfile(src / f'g-{i:02d}.webp', dst / f'g-{i:02d}.webp')
        c = clay[i]
        tone = np.clip((c[..., 0] - lo) / (hi - lo), 0, 1) * 0.86 + 0.1     # column: 0.1 .. 0.96
        tone = tone * c[..., 3] + (1 - c[..., 3])                            # paper (white) around it
        Image.fromarray((tone * 255).astype(np.uint8)).save(dst / f't-{i:02d}.webp', quality=82, method=6)
    shutil.copyfile(src / f'g-{REST:02d}.webp', dst / 'still.webp')
    print('packed', key, 'tone range', round(float(lo), 3), round(float(hi), 3))
