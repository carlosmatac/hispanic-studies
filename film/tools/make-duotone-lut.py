"""Write the reel's duotone LUT: every picture printed in the IHS burgundy on
the page's paper. Luma is mapped through a gentle S-curve onto three stops,
so faces keep their modelling and the whites are exactly the site's paper
(#F9F3DD), which is what lets the film melt into the page.

    python3 film/tools/make-duotone-lut.py film/reel/assets/luts/ihs-duotone.cube
"""
import sys

SIZE = 17
STOPS = [(0.0, (0x1E, 0x04, 0x08)), (0.42, (0x47, 0x0B, 0x15)), (1.0, (0xF9, 0xF3, 0xDD))]


def lerp(a, b, t):
    return a + (b - a) * t


def ramp(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            return tuple(lerp(x, y, u) / 255 for x, y in zip(c0, c1))
    return tuple(c / 255 for c in STOPS[-1][1])


def curve(y):
    # lift the paper a touch (bright areas become clean paper), keep the shadows
    y = min(1.0, max(0.0, (y - 0.04) / 0.86))
    return y * y * (3 - 2 * y) * 0.55 + y * 0.45


def main(out):
    lines = ['TITLE "IHS duotone"', f"LUT_3D_SIZE {SIZE}", "DOMAIN_MIN 0 0 0", "DOMAIN_MAX 1 1 1"]
    n = SIZE - 1
    for b in range(SIZE):          # .cube order: red changes fastest
        for g in range(SIZE):
            for r in range(SIZE):
                y = 0.2126 * r / n + 0.7152 * g / n + 0.0722 * b / n
                rr, gg, bb = ramp(curve(y))
                lines.append(f"{rr:.5f} {gg:.5f} {bb:.5f}")
    with open(out, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main(sys.argv[1])
