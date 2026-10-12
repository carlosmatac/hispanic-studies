# Builds columnario-height.png: a stylised relief (height) map evoking the 8-reales "columnario" (Pillars of Hercules with
# PLVS VLTRA, crowned hemispheres, waves, VTRAQUE VNUM legend), used by the Unicorn scene E. Not a reproduction of a real coin.
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S = 2048
C = S / 2
R = S / 2 * 0.98            # coin radius in px
FONT = '/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf'
img = Image.new('L', (S, S), 0)
d = ImageDraw.Draw(img)
P = lambda x, y: (C + x * R, C + y * R)          # coin units -> px (y down)
FIELD, RELIEF, HIGH = 70, 170, 220
# disc field and raised rim
d.ellipse([C - R, C - R, C + R, C + R], fill=HIGH)
d.ellipse([C - R * 0.93, C - R * 0.93, C + R * 0.93, C + R * 0.93], fill=FIELD)
# beaded inner border
for i in range(120):
    a = i / 120 * 2 * math.pi
    x, y = P(0.885 * math.cos(a), 0.885 * math.sin(a))
    r = R * 0.016
    d.ellipse([x - r, y - r, x + r, y + r], fill=RELIEF)
# legend around the top, letters rotated along the circle
def arc_text(text, radius, start_deg, end_deg, size, fill):
    font = ImageFont.truetype(FONT, size)
    n = len(text)
    for i, ch in enumerate(text):
        t = (i + 0.5) / n
        ang = math.radians(start_deg + (end_deg - start_deg) * t)
        x, y = P(radius * math.cos(ang), radius * math.sin(ang))
        tile = Image.new('L', (size * 2, size * 2), 0)
        ImageDraw.Draw(tile).text((size, size), ch, font=font, fill=255, anchor='mm')
        rot = -math.degrees(ang) - 90
        tile = tile.rotate(rot, resample=Image.BICUBIC)
        mask = tile
        img.paste(Image.new('L', tile.size, fill), (int(x - size), int(y - size)), mask)
arc_text('VTRAQUE · VNUM · M · 8 · R · M · ', 0.785, 150, 510, int(R * 0.115), RELIEF)
# two hemispheres
for sx in (-1, 1):
    cx, cy, rr = 0.165 * sx, -0.02, 0.16
    x0, y0 = P(cx - rr, cy - rr); x1, y1 = P(cx + rr, cy + rr)
    d.ellipse([x0, y0, x1, y1], fill=RELIEF)
    # meridians / parallels incised
    for k in (-0.55, 0, 0.55):
        w = rr * math.sqrt(1 - k * k)
        a0, b0 = P(cx - w, cy + k * rr - 0.004); a1, b1 = P(cx + w, cy + k * rr + 0.004)
        d.rectangle([a0, b0, a1, b1], fill=FIELD + 40)
    for k in (0.45, 0.9):
        a0, b0 = P(cx - rr * k, cy - rr); a1, b1 = P(cx + rr * k, cy + rr)
        d.ellipse([a0, b0, a1, b1], outline=FIELD + 40, width=int(R * 0.008))
# crown above the globes
def crown(cx, cy, w, h):
    pts = [(-w, h * 0.35), (-w, -h * 0.1), (-w * 0.6, h * 0.12), (-w * 0.3, -h * 0.45), (0, h * 0.05), (w * 0.3, -h * 0.45), (w * 0.6, h * 0.12), (w, -h * 0.1), (w, h * 0.35)]
    d.polygon([P(cx + x, cy + y) for x, y in pts], fill=RELIEF)
    a0, b0 = P(cx - w, cy + h * 0.3); a1, b1 = P(cx + w, cy + h * 0.5)
    d.rectangle([a0, b0, a1, b1], fill=HIGH)
    for x in (-w, -w * 0.3, w * 0.3, w):
        r = h * 0.12
        a, b = P(cx + x, cy - (h * 0.1 if abs(x) == w else h * 0.45))
        d.ellipse([a - r * R, b - r * R, a + r * R, b + r * R], fill=HIGH)
    a, b = P(cx, cy - h * 0.62)  # cross on top
    t = h * 0.06 * R
    d.rectangle([a - t, b - h * 0.18 * R, a + t, b + h * 0.18 * R], fill=HIGH)
    d.rectangle([a - h * 0.12 * R, b - t, a + h * 0.12 * R, b + t], fill=HIGH)
crown(0, -0.27, 0.2, 0.17)
# waves under the globes
for row, yy in enumerate((0.2, 0.27)):
    pts = [P(x, yy + 0.018 * math.sin(x * 40 + row)) for x in np.linspace(-0.4, 0.4, 200)]
    d.line(pts, fill=RELIEF, width=int(R * 0.022))
# the Pillars of Hercules
for sx in (-1, 1):
    cx = 0.46 * sx
    a0, b0 = P(cx - 0.042, -0.34); a1, b1 = P(cx + 0.042, 0.33)
    d.rectangle([a0, b0, a1, b1], fill=RELIEF)
    for yy, ww, hh in ((-0.36, 0.075, 0.035), (0.34, 0.075, 0.035), (-0.4, 0.055, 0.02), (0.38, 0.06, 0.02)):
        a0, b0 = P(cx - ww, yy - hh); a1, b1 = P(cx + ww, yy + hh)
        d.rectangle([a0, b0, a1, b1], fill=HIGH)
    crown(cx, -0.47, 0.065, 0.075)
    # flutes
    for fx in (-0.02, 0, 0.02):
        a0, b0 = P(cx + fx - 0.004, -0.31); a1, b1 = P(cx + fx + 0.004, 0.3)
        d.rectangle([a0, b0, a1, b1], fill=RELIEF - 35)
# ribbons with PLVS / VLTRA wrapped around the pillars
font = ImageFont.truetype(FONT, int(R * 0.075))
for sx, word in ((-1, 'PLVS'), (1, 'VLTRA')):
    cx = 0.46 * sx
    band = Image.new('L', (int(R * 0.42), int(R * 0.11)), 0)
    bd = ImageDraw.Draw(band)
    bd.rectangle([0, 0, band.size[0], band.size[1]], fill=HIGH)
    bd.text((band.size[0] / 2, band.size[1] / 2), word, font=font, fill=FIELD + 20, anchor='mm')
    band = band.rotate(-90 + 14 * sx, expand=True, resample=Image.BICUBIC)
    mask = band.point(lambda v: 255 if v > 0 else 0)
    x, y = P(cx, 0.0)
    img.paste(band, (int(x - band.size[0] / 2), int(y - band.size[1] / 2)), mask)
img = img.filter(ImageFilter.GaussianBlur(3)).resize((1024, 1024), Image.LANCZOS)
img.save('coin-height.png')
