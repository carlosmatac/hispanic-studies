"""Print the period images (film/reel/assets/img/period/) in the film's duotone.

    ~/.venvs/film/bin/python -I film/tools/grade-period.py

The originals (film/reel/assets/img/period/) are not committed: each is listed with its
source URL in assets/art/SOURCES.md. Only the prints the film uses are.

Each picture is levelled (0.5 % auto-contrast), dark paintings get their midtones
lifted so the burgundy does not swallow them, then the duotone LUT
(film/reel/assets/luts/ihs-duotone.cube) prints it in burgundy on the site's paper.
Writes film/reel/assets/img/graded/<same name>.jpg, at most 2600 px on the long side.
Graded files can be used anywhere in CSS (backgrounds, text masks) without a
data-color-grading attribute.
"""
import glob
import os
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parents[2] / "film/reel/assets"
SRC, OUT, LUT = ROOT / "img/period", ROOT / "img/graded", ROOT / "luts/ihs-duotone.cube"


def main():
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        # the period set, and the three paintings the pillars already used (named pillar-*)
        files = [(f, os.path.basename(f)) for f in sorted(glob.glob(str(SRC / "*.jpg")))]
        files += [(str(ROOT / f"img/{k}.jpg"), f"pillar-{k}.jpg") for k in ("mestizaje", "catolicismo", "lengua")]
        for f, name in files:
            if name.startswith("_"):
                continue
            im = Image.open(f).convert("RGB")
            im.thumbnail((2600, 2600), Image.LANCZOS)
            im = ImageOps.autocontrast(im, cutoff=0.5)
            mean = ImageStat.Stat(im.convert("L")).mean[0]
            gamma = min(1.9, (110 / max(mean, 30)) ** 0.8) if mean < 110 else 1.0
            if gamma > 1.01:
                im = im.point([round(255 * (i / 255) ** (1 / gamma)) for i in range(256)] * 3)
            pre = os.path.join(tmp, name)
            im.save(pre, quality=95)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-vf", f"lut3d={LUT}", "-q:v", "4", str(OUT / name)], check=True)
            print(f"{name:52s} mean {mean:5.1f}  lift {gamma:.2f}")


if __name__ == "__main__":
    main()
