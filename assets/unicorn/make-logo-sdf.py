# Builds ihs-logo-sdf.png: a signed distance field of assets/brand/ihs-logo.svg (0.5 = edge, brighter inside, +-40 px range
# at 1024 px), used by the Unicorn scene F to extrude the eagle in 3D. Needs numpy, scipy, pillow and a PNG render of the SVG:
#   inkscape ../brand/ihs-logo.svg --export-type=png --export-filename=logo2k.png --export-width=1800
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt as edt
im = np.array(Image.open('logo2k.png'))[..., 3] > 127   # 1800x1276 inside mask
# pad onto 2048x1536 canvas (scale 2 => output 1024x768), logo centered
H, W = 1536, 2048
canvas = np.zeros((H, W), bool)
y0, x0 = (H - im.shape[0]) // 2, (W - im.shape[1]) // 2
canvas[y0:y0+im.shape[0], x0:x0+im.shape[1]] = im
d = edt(~canvas) - edt(canvas)          # >0 outside, <0 inside (px at 2048)
d = d / 2.0                              # px at 1024
R = 40.0
v = np.clip(0.5 - d / (2 * R), 0, 1)     # inside -> >0.5 (bright)
img = Image.fromarray((v * 255).round().astype(np.uint8)).resize((1024, 768), Image.LANCZOS)
img.save('ihs-logo-sdf.png')
print('max inside depth px@1024:', (-d).max())
