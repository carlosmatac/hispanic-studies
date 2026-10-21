"""Render one column's turntable: gold frames (RGBA webp) and a clay tone pass (PNG).
Run through bl.py after run_build.py, with KEY, OBJ, FRAMES, SWEEP (degrees),
OUT (folder) and ONLY (list of frame indices, or None for all) defined first.
render_all.sh does the three columns; pack_frames.py then writes the site's files."""
import bpy, math, os, time
sc = bpy.context.scene
cols = [o for o in bpy.data.collections['IHS Pillars'].objects if o.parent is None]
target = bpy.data.objects[OBJ]
saved_x = {o.name: o.location.x for o in cols}
for o in cols:
    hide = o is not target
    o.hide_render = hide
    for c in o.children: c.hide_render = hide
target.location.x = 0
cam = bpy.data.objects['Camera']
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 10.6
el = math.radians(5)
cam.location = (0, -40 * math.cos(el), 4.98 + 40 * math.sin(el))
cam.rotation_euler = (math.radians(90) - el, 0, 0)
sc.render.film_transparent = True
os.makedirs(OUT, exist_ok=True)
env = [n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND' and n.inputs['Color'].is_linked][0]
clay = bpy.data.materials.get('Clay') or bpy.data.materials.new('Clay')
clay.use_nodes = True
cb = clay.node_tree.nodes.get('Principled BSDF')
cb.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1); cb.inputs['Roughness'].default_value = 0.9
t0 = time.time()
frames = ONLY if ONLY is not None else range(FRAMES)
for i in frames:
    target.rotation_euler.z = math.radians(SWEEP * i / max(1, FRAMES - 1) - SWEEP / 2)
    # gold
    sc.view_layers[0].material_override = None
    sc.render.resolution_x, sc.render.resolution_y = 480, 1200
    sc.cycles.samples = 40
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.quality = 80
    sc.render.filepath = os.path.join(OUT, 'g-%02d.webp' % i)
    bpy.ops.render.render(write_still=True)
    # clay tone pass: light and shade only, on white
    sc.view_layers[0].material_override = clay
    env.inputs['Strength'].default_value = 0.12
    sc.render.resolution_x, sc.render.resolution_y = 240, 600
    sc.cycles.samples = 12
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.filepath = os.path.join(OUT, 't-%02d.png' % i)
    bpy.ops.render.render(write_still=True)
    env.inputs['Strength'].default_value = 1.0
sc.view_layers[0].material_override = None
target.rotation_euler.z = 0
for o in cols:
    o.location.x = saved_x[o.name]; o.hide_render = False
    for c in o.children: c.hide_render = False
result = {'key': KEY, 'frames': len(list(frames)), 'secs': round(time.time() - t0, 1)}
