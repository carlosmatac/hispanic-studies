"""Build the three columns in the open Blender (run through bl.py)."""
import sys, importlib, time
D = REPO + '/tools/blender'
if D not in sys.path:
    sys.path.insert(0, D)
import ihs_columns, ihs_build
importlib.reload(ihs_columns); importlib.reload(ihs_build)
B = ihs_build
B.HDRI = REPO + '/assets/3d/hdri/studio_small_09_2k.hdr'
t = time.time()
B.scene_setup()
col = B.collection('IHS Pillars')
obs = [B.mestizo(col, REPO + '/assets/3d/mestizo-pattern.png', x=-4.2), B.salomonica(col, x=0.0), B.balaustre(col, x=4.2)]
gold = B.material('Gold leaf', 'gold')
for o in obs + [c for o in obs for c in o.children]:
    o.data.materials.clear(); o.data.materials.append(gold)
result = {'built': [(o.name, len(o.data.vertices)) for o in obs], 'secs': round(time.time() - t, 1)}
