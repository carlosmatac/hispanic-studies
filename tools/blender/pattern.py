"""Flat (two-plane) carving pattern for the mestizo shaft: an undulating vine
with spiral tendrils, paired leaves and six-petal flowers. White = raised.
Tiles horizontally; one band vertically."""
import math
from PIL import Image, ImageDraw, ImageFilter
W, H = 800, 1300
S = 3  # supersample
img = Image.new('L', (W * S, H * S), 0)
d = ImageDraw.Draw(img)
def P(x, y): return (x * S, y * S)

def stem(points, width, fill=255):
    for a, b in zip(points, points[1:]):
        d.line([P(*a), P(*b)], fill=fill, width=int(width * S))
        d.ellipse([P(a[0] - width / 2, a[1] - width / 2), P(a[0] + width / 2, a[1] + width / 2)], fill=fill)

def leaf(cx, cy, ang, L, Wd):
    pts = []
    for i in range(41):
        t = i / 40
        x = t * L
        y = Wd * math.sin(math.pi * t) ** 0.9 * (1 if i <= 20 else 1)
        pts.append((x, y))
    outline = pts + [(x, -y) for x, y in reversed(pts)]
    ca, sa = math.cos(ang), math.sin(ang)
    poly = [P(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in outline]
    d.polygon(poly, fill=255)
    # incised midrib and side veins
    d.line([P(cx, cy), P(cx + L * 0.9 * ca, cy + L * 0.9 * sa)], fill=0, width=3 * S)

def flower(cx, cy, r, petals=6):
    for k in range(petals):
        a = k / petals * math.tau
        px, py = cx + math.cos(a) * r * 0.55, cy + math.sin(a) * r * 0.55
        d.ellipse([P(px - r * 0.42, py - r * 0.42), P(px + r * 0.42, py + r * 0.42)], fill=255)
    d.ellipse([P(cx - r * 0.3, cy - r * 0.3), P(cx + r * 0.3, cy + r * 0.3)], fill=0)
    d.ellipse([P(cx - r * 0.17, cy - r * 0.17), P(cx + r * 0.17, cy + r * 0.17)], fill=255)
    for k in range(petals):
        a = (k + 0.5) / petals * math.tau
        d.line([P(cx + math.cos(a) * r * 0.32, cy + math.sin(a) * r * 0.32), P(cx + math.cos(a) * r * 0.95, cy + math.sin(a) * r * 0.95)], fill=0, width=2 * S)

def spiral(cx, cy, r0, turns, ang0, sign, width):
    pts = []
    n = 80
    for i in range(n + 1):
        t = i / n
        a = ang0 + sign * t * turns * math.tau
        r = r0 * (1 - 0.85 * t)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    stem(pts, width * (1 - 0.0))
    return pts

# two stems in counter-phase interlace into a chain of tall cells
waves = 2
A = W * 0.30
def sx(y, sgn): return W / 2 + sgn * A * math.sin(y / H * waves * math.tau)
for sgn in (1, -1):
    pts = [(sx(i / 600 * H, sgn), i / 600 * H) for i in range(601)]
    for dx in (-W, 0, W):
        stem([(x + dx, y) for x, y in pts], 24)

cell_h = H / (waves * 2)
for k in range(waves * 2):
    yc = (k + 0.5) * cell_h
    for dx in (-W, 0, W):
        cx = W / 2 + dx
        flower(cx, yc, W * 0.085, 6 if k % 2 else 8)
        # inside the cell: two leaves rising above the flower, two hanging below
        for sy in (-1, 1):
            for sxn in (-1, 1):
                leaf(cx + sxn * W * 0.05, yc + sy * W * 0.06, sy * math.pi / 2 - sy * sxn * 0.85, W * 0.14, W * 0.042)
        # outside the cell, in the gap between this cell and the next tile's: a spiral tendril
        side = 1 if k % 2 == 0 else -1
        ox = cx + side * W * 0.5
        spiral(ox, yc, W * 0.11, 1.15, -math.pi / 2, side, 12)
        d.ellipse([P(ox - W * 0.03, yc - W * 0.03), P(ox + W * 0.03, yc + W * 0.03)], fill=255)
        # small leaves where the stems cross
        by = (k + 1) * cell_h
        leaf(cx, by, 0.0, W * 0.12, W * 0.035)
        leaf(cx, by, math.pi, W * 0.12, W * 0.035)

img = img.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
from pathlib import Path
img.save(Path(__file__).resolve().parents[2] / 'assets/3d/mestizo-pattern.png')
