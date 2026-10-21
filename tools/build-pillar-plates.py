#!/usr/bin/env python3
"""Build the pillar plates from the straight crops in assets/art/pillars/columns/.

Writes, for each pillar, into site/public/art/pillars/:
  col-<key>.webp         the tone texture the WebGL shader engraves and gilds
  col-<key>-gilded.jpg   the finished plate, shown when WebGL or motion is off

Unlike the other tools this one needs Pillow and NumPy (pip install pillow numpy).
The method mirrors site/components/pillars/engrave.glsl.ts: tone normalised,
horizontal lines whose width follows the shadow and bend with the relief,
cross-hatching in deep shadow, contours, then gold leaf over burgundy bole.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/art/pillars/columns'
OUT = ROOT / 'site/public/art/pillars'
KEYS = ['mestizaje', 'catolicismo', 'lengua']

PAPER = np.array([249, 243, 221]) / 255
INK = np.array([71, 11, 21]) / 255
INK_D = np.array([47, 7, 13]) / 255
GOLD_D = np.array([110, 72, 24]) / 255
GOLD = np.array([190, 142, 58]) / 255
GOLD_L = np.array([250, 228, 160]) / 255


def blur(a, s):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s)), dtype=np.float32) / 255


def tone(key, w, h):
    a = np.asarray(Image.open(SRC / f'{key}.jpg').convert('L').resize((w, h), Image.LANCZOS), dtype=np.float32) / 255
    lo, hi = np.percentile(a, 2), np.percentile(a, 99.5)
    a = np.clip((a - lo) / (hi - lo), 0, 1)
    a = np.clip(a + (a - blur(a, 40)) * 0.8, 0, 1)        # mild local contrast
    a = a ** (np.log(0.6) / np.log(max(float(np.median(a)), 1e-3)))  # median tone to 0.6
    return np.clip(a, 0, 1)


def gilded(key, w=640, h=1600, period=6.0):
    L = tone(key, w, h)
    Ls, D = blur(L, 1.6), 1 - blur(L, 1.6)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    yy = y + (Ls - 0.5) * period * 1.3
    ink = np.abs(((yy / period) % 1) - 0.5) * 2 < np.clip(D * 0.95, 0, 0.92)
    u = (x * 0.5 + y * 0.866) / period
    ink |= np.abs((u % 1) - 0.5) * 2 < np.clip((D - 0.68) * 2.4, 0, 0.8)
    gy, gx = np.gradient(blur(L, 2.2))
    ink |= np.hypot(gx, gy) > 0.06
    n = np.stack([-gx * 14, -gy * 14, np.ones_like(gx)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    ld = np.array([-0.55, -0.55, 0.63]); ld /= np.linalg.norm(ld)
    diff = np.clip((n * ld).sum(-1), 0, 1)
    hv = ld + np.array([0, 0, 1.0]); hv /= np.linalg.norm(hv)
    spec = np.clip((n * hv).sum(-1), 0, 1) ** 24
    t = np.clip(Ls * 0.4 + diff * 0.95 - 0.25, 0, 1)
    t = (t * t * (3 - 2 * t))[..., None]
    gold = GOLD_D * (1 - t) + GOLD * t
    gold += (GOLD_L - gold) * np.clip(spec + diff ** 5 * 0.35, 0, 1)[..., None]
    cover = np.clip((Ls - 0.22) / 0.25, 0, 1)[..., None]
    out = np.where(ink[..., None], INK_D, INK * (1 - cover) + gold * cover)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for k in KEYS:
        tex = Image.fromarray((tone(k, 512, 1280) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
        tex.save(OUT / f'col-{k}.webp', quality=80, method=6)
        gilded(k).save(OUT / f'col-{k}-gilded.jpg', quality=84, optimize=True, progressive=True)
        print('built', k)
