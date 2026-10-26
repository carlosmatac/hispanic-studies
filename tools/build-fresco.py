"""Build the pillars' fresco: three public-domain paintings melted into one band.

    ~/.venvs/film/bin/python -I tools/build-fresco.py SRC_DIR

SRC_DIR holds the three originals (listed with their sources in assets/art/SOURCES.md):
  morlete-casta-albino.jpg    Mestizaje   (Morlete, casta painting, LACMA)
  cabrera-guadalupe.jpg       Catolicismo (Miguel Cabrera, altarpiece of the Virgin of Guadalupe)
  florentine-codex-80.jpg     Lengua      (Florentine Codex, folio 80, Spanish and Nahuatl)

Each is cropped to a band, the three are laid side by side with wide soft seams,
and graded toward one warm palette, like one fresco on a wall. Writes site/public/art/pillars/fresco.jpg and
one detail per pillar (site/public/art/pillars/<key>-detail.jpg) for the open panel.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site/public/art/pillars"
PAPER = np.array([249, 243, 221], np.float32)
W, H = 3200, 1000

# (file, crop box as fractions, x where it starts on the band, seam widths left/right)
LAYERS = {
    "mestizaje": ("morlete-casta-albino.jpg", (0.0, 0.08, 1.0, 0.66), 0, (0, 380)),
    "lengua": ("florentine-codex-80.jpg", (0.0, 0.50, 1.0, 0.985), 2330, (400, 0)),
    "catolicismo": ("cabrera-guadalupe.jpg", (0.02, 0.035, 0.98, 0.47), 1040, (360, 400)),
}
DETAIL = {  # crops for the open panel (portrait 4:5)
    "mestizaje": (0.0, 0.05, 0.86, 0.80),
    "catolicismo": (0.12, 0.0, 0.88, 0.58),
    "lengua": (0.0, 0.40, 1.0, 1.0),
}


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def grade(a):
    """One palette: lift the blacks to a warm brown, warm the whites toward the paper."""
    a = a / 255.0
    shadow = np.array([0.20, 0.11, 0.09])
    a = shadow + a * (1 - shadow)  # lift
    a = a * (0.86 + 0.14 * PAPER / 255.0)  # warm
    lum = a.mean(axis=2, keepdims=True)
    a = lum + (a - lum) * 0.92
    return np.clip(a * 255, 0, 255)


def main(src):
    src = Path(src)
    band = np.tile(PAPER, (H, W, 1)).astype(np.float32)
    for key in ("mestizaje", "lengua", "catolicismo"):
        f, (l, t, r, b), x0, (sl, sr) = LAYERS[key]
        im = Image.open(src / f).convert("RGB")
        w, h = im.size
        im = im.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
        im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
        a = grade(np.asarray(im, np.float32))
        x1 = min(W, x0 + a.shape[1])
        a = a[:, : x1 - x0]
        xs = np.arange(a.shape[1], dtype=np.float32)
        m = np.ones_like(xs)
        if sl:
            m *= smooth(xs / sl)
        if sr:
            m *= smooth((a.shape[1] - xs) / sr)
        band[:, x0:x1] = band[:, x0:x1] * (1 - m[None, :, None]) + a * m[None, :, None]
        # the detail for the panel
        im2 = Image.open(src / f).convert("RGB")
        w, h = im2.size
        dl, dt, dr, db = DETAIL[key]
        d = im2.crop((int(dl * w), int(dt * h), int(dr * w), int(db * h)))
        d.thumbnail((1400, 1400), Image.LANCZOS)
        Image.fromarray(grade(np.asarray(d, np.float32)).astype(np.uint8)).save(OUT / f"{key}-detail.jpg", quality=80, optimize=True, progressive=True)
    Image.fromarray(np.clip(band, 0, 255).astype(np.uint8)).save(OUT / "fresco.jpg", quality=80, optimize=True, progressive=True)
    print("wrote", OUT / "fresco.jpg")


if __name__ == "__main__":
    main(sys.argv[1])
