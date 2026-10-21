"""Build the three IHS pillar columns in the open Blender scene.

  Mestizaje    column of the Andean barroco mestizo: shaft in three ringed
               tercios covered in flat (two-plane) carving of foliage and flowers
  Catolicismo  Solomonic column: three turns, the eucharistic vine (leaves and
               grapes) running in the groove, Corinthian capital
  Lengua       plateresque balaustre after Sagredo, Medidas del Romano (1526):
               a turned candelabrum shaft with gadroons and an acanthus collar
"""
import math, random
import bmesh, bpy
import numpy as np
from mathutils import Vector, Matrix
import ihs_columns as C

TAU = math.tau
SHAFT = 8.0
HDRI = None  # set by run_build.py: assets/3d/hdri/studio_small_09_2k.hdr


def collection(name):
    col = bpy.data.collections.get(name)
    if col:
        for o in list(col.objects):
            bpy.data.objects.remove(o, do_unlink=True)
    else:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def leaves(bmL, name, col, thick=0.016):
    ob = C.new_object(name, bmL, col)
    m = ob.modifiers.new('Thickness', 'SOLIDIFY')
    m.thickness = thick
    m.offset = 0.0
    return ob


def finish(ob, x, leaf_ob=None):
    ob.location.x = x
    if leaf_ob:
        leaf_ob.parent = ob
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(ob.data); bm.free()
    return ob


# ------------------------------------------------------------- salomónica

def salomonica(col, x=0.0, turns=6.0, amp=0.12):
    bm = bmesh.new()
    bmL = bmesh.new()
    zb = C.attic_base(bm)
    z1 = zb + SHAFT

    def theta(t):
        return TAU * turns * t

    def env(t):  # the twist fades in and out at the ends of the shaft
        return min(1.0, t / 0.04, (1 - t) / 0.04)

    def rad(t):  # slight diminution upward
        return C.R * (1 - 0.1 * t)

    def surf(u, v):
        phi = u * TAU
        r = rad(v) - amp * 0.4 + amp * env(v) * math.cos(phi - theta(v))
        return Vector((r * math.cos(phi), r * math.sin(phi), zb + SHAFT * v))
    C.grid_surface(bm, surf, 96, 480, closed_u=True)

    # the vine in the groove
    rnd = random.Random(7)
    path = []
    N = 900
    for i in range(N + 1):
        t = 0.05 + 0.9 * i / N
        phi = theta(t) + math.pi + 0.18 * math.sin(t * 60)
        r = rad(t) - amp * 0.4 - amp * env(t) + 0.035
        path.append(Vector((r * math.cos(phi), r * math.sin(phi), zb + SHAFT * t)))
    C.tube(bm, path, lambda t: 0.03, 8)

    # leaves and grape clusters along the vine
    for k, i in enumerate(range(16, N - 10, 22)):
        p = path[i]
        out = Vector((p.x, p.y, 0)).normalized()
        side = 1 if k % 2 else -1
        tang = (path[i + 1] - path[i - 1]).normalized()
        sidev = tang.cross(out).normalized() * side
        centre = p + out * 0.05 + sidev * 0.1
        vine_leaf(bmL, centre, out, tang.lerp(sidev, 0.5).normalized(), 0.2 + rnd.random() * 0.04)
        if k % 2 == 0:
            grapes(bm, p + out * 0.06 - sidev * 0.06, out, rnd)
    zc = C.corinthian_capital(bm, z1, R_top=C.R * 0.9, bmL=bmL)
    C.entablature_block(bm, zc)
    return finish(C.new_object('Salomonica', bm, col), x, leaves(bmL, 'Salomonica leaves', col))


def vine_leaf(bm, centre, normal, up, size):
    """A five-lobed vine leaf lying on the shaft, slightly cupped."""
    normal = normal.normalized()
    up = (up - normal * up.dot(normal)).normalized()
    side = up.cross(normal)
    def f(u, v):
        a = u * TAU
        # five pointed lobes (deep sinuses between them), finely toothed edge
        lob = 0.58 + 0.42 * abs(math.cos(2.5 * a)) ** 1.3
        teeth = 1 + 0.06 * abs(math.sin(a * 25))
        notch = 1 - 0.5 * math.exp(-((math.cos(a) + 1) * 8))   # the sinus at the stalk
        r = size * v * lob * notch * teeth
        h = 0.02 * (1 - v * v) - 0.012 * v
        return centre + side * (r * math.sin(a)) + up * (r * math.cos(a) * 1.05) + normal * h
    C.grid_surface(bm, f, 150, 6, closed_u=True)


def grapes(bm, top, normal, rnd):
    """A hanging cluster: a cone of berries."""
    for row in range(5):
        n = 5 - row
        for k in range(n):
            a = k / n * TAU + row
            rr = 0.012 * n
            c = top + Vector((0, 0, -0.045 * row)) + normal * (0.02 + rnd.random() * 0.01)
            c += Vector((math.cos(a) * rr, math.sin(a) * rr, 0))
            m = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.028)
            for v in m['verts']:
                v.co += c


# --------------------------------------------------------------- balaustre

def balaustre(col, x=0.0):
    bm = bmesh.new()
    zb = C.attic_base(bm)
    H = SHAFT
    # (fraction of shaft, radius) — a turned candelabrum, bottom to top
    keys = [
        (0.000, 0.44), (0.012, 0.48), (0.024, 0.48), (0.030, 0.42),                      # foot ring
        (0.050, 0.46), (0.100, 0.60), (0.150, 0.66), (0.200, 0.62), (0.250, 0.48),       # lower vase
        (0.285, 0.36), (0.300, 0.34),
        (0.306, 0.42), (0.318, 0.42), (0.324, 0.37), (0.330, 0.45), (0.344, 0.45), (0.350, 0.37),  # collar
        (0.370, 0.35), (0.420, 0.42), (0.470, 0.52), (0.486, 0.52),                      # inverted fluted bell
        (0.490, 0.46), (0.502, 0.46), (0.506, 0.39),
        (0.530, 0.38), (0.580, 0.50), (0.620, 0.55), (0.660, 0.50), (0.700, 0.38), (0.715, 0.35),  # middle vase
        (0.720, 0.42), (0.732, 0.42), (0.738, 0.37),
        (0.760, 0.36), (0.800, 0.40), (0.840, 0.45), (0.870, 0.40), (0.910, 0.37),       # the pear
        (0.930, 0.38), (0.936, 0.43), (0.952, 0.43), (0.958, 0.40), (1.000, 0.40),       # necking
    ]
    prof = []
    for (t0, r0), (t1, r1) in zip(keys, keys[1:]):
        n = max(2, int((t1 - t0) * 260))
        for i in range(n):
            s = i / n
            s2 = s * s * (3 - 2 * s) if abs(r1 - r0) > 0.05 else s     # ease the big curves
            prof.append((r0 + (r1 - r0) * s2, zb + H * (t0 + (t1 - t0) * s)))
    prof.append((keys[-1][1], zb + H))
    prof = [(0.0, zb)] + prof + [(0.0, zb + H)]

    def gadroon(r, z, phi):
        t = (z - zb) / H
        if 0.035 < t < 0.15:          # gadroons on the lower half of the lower vase
            k = math.sin(math.pi * (t - 0.035) / 0.115)
            return r * (1 + 0.06 * k * max(0.0, math.cos(phi * 20)) ** 0.6)
        if 0.375 < t < 0.48:          # fluting on the inverted bell
            k = math.sin(math.pi * (t - 0.375) / 0.105)
            return r * (1 - 0.035 * k * (0.5 + 0.5 * math.cos(phi * 24)))
        if 0.62 < t < 0.705:          # gadroons on the upper half of the middle vase
            k = math.sin(math.pi * (t - 0.62) / 0.085)
            return r * (1 + 0.05 * k * max(0.0, math.cos(phi * 16 + 0.5)) ** 0.6)
        return r
    C.lathe(bm, prof, 192, radial=gadroon)

    # acanthus collars: on the lower vase's shoulder, under the middle vase, under the pear
    bmL = bmesh.new()
    def ring_r(rr):
        return lambda z: rr
    for k in range(10):
        C.acanthus_leaf(bmL, k * TAU / 10, zb + H * 0.17, H * 0.1, ring_r(0.6), 0.2, lean=-0.05, curl=0.26)
    for k in range(9):
        C.acanthus_leaf(bmL, (k + 0.5) * TAU / 9, zb + H * 0.522, H * 0.06, ring_r(0.42), 0.16, lean=0.15, curl=0.28)
    for k in range(8):
        C.acanthus_leaf(bmL, k * TAU / 8, zb + H * 0.752, H * 0.045, ring_r(0.38), 0.14, lean=0.15, curl=0.28)
    zc = C.corinthian_capital(bm, zb + H, R_top=0.4, bmL=bmL)
    C.entablature_block(bm, zc)
    return finish(C.new_object('Balaustre', bm, col), x, leaves(bmL, 'Balaustre leaves', col))



# ------------------------------------------------- Andean barroco mestizo

def mestizo(col, pattern_path, x=0.0, relief=0.045):
    """Ringed shaft in three tercios, each wrapped in flat two-plane carving.
    `pattern_path` is a greyscale PNG: white = raised motif, black = ground,
    tiling horizontally (once round the shaft) and vertically (one tercio)."""
    img = bpy.data.images.load(pattern_path, check_existing=True)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, img.channels)[:, :, 0]

    def sample(u, v):
        x = (u % 1.0) * (w - 1)
        y = (v % 1.0) * (h - 1)
        x0, y0 = int(x), int(y)
        x1, y1 = (x0 + 1) % w, min(y0 + 1, h - 1)
        fx, fy = x - x0, y - y0
        a = px[y0, x0] * (1 - fx) + px[y0, x1] * fx
        b = px[y1, x0] * (1 - fx) + px[y1, x1] * fx
        return a * (1 - fy) + b * fy

    bm = bmesh.new()
    zb = C.attic_base(bm)
    H = SHAFT
    ring = 0.014     # half-width of each ring moulding, as a fraction of the shaft

    def rad(t):
        return C.R * (1 - 0.08 * t)

    def surf(u, v):
        phi = u * TAU
        r = rad(v)
        d = min(abs(v - 1 / 3), abs(v - 2 / 3))
        if d < ring:                                   # a half-round ring between tercios
            r += 0.075 * math.sqrt(1 - (d / ring) ** 2)
        else:
            band = min(int(v * 3), 2)
            lo = band / 3 + (ring * 1.6 if band > 0 else 0.015)
            hi = (band + 1) / 3 - (ring * 1.6 if band < 2 else 0.015)
            if lo < v < hi:                            # the carved field
                r += relief * sample(u * 2 + band * 0.25, (v - lo) / (hi - lo))
        return Vector((r * math.cos(phi), r * math.sin(phi), zb + H * v))
    C.grid_surface(bm, surf, 360, 1500, closed_u=True)
    bmL = bmesh.new()
    zc = C.corinthian_capital(bm, zb + H, R_top=C.R * 0.92, bmL=bmL)
    C.entablature_block(bm, zc)
    return finish(C.new_object('Mestizo', bm, col), x, leaves(bmL, 'Mestizo leaves', col))


# ------------------------------------------------------------- materials

def material(name, kind):
    """`gold`: gilded wood, the burgundy bole showing in the recesses (AO).
    `stone`: pale stone, for comparison."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    if kind == 'gold':
        ao = nt.nodes.new('ShaderNodeAmbientOcclusion')
        ao.inputs['Distance'].default_value = 0.12
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = 0.35
        ramp.color_ramp.elements[0].color = (0.16, 0.012, 0.022, 1)      # bole: --burgundy, linear
        ramp.color_ramp.elements[1].position = 0.75
        ramp.color_ramp.elements[1].color = (0.92, 0.66, 0.30, 1)       # gold leaf
        nt.links.new(ao.outputs['AO'], ramp.inputs['Fac'])
        nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
        met = nt.nodes.new('ShaderNodeMapRange')
        met.inputs['From Min'].default_value = 0.35
        met.inputs['From Max'].default_value = 0.75
        nt.links.new(ao.outputs['AO'], met.inputs['Value'])
        nt.links.new(met.outputs['Result'], b.inputs['Metallic'])
        b.inputs['Roughness'].default_value = 0.32
    else:
        b.inputs['Base Color'].default_value = (0.78, 0.72, 0.62, 1)
        b.inputs['Roughness'].default_value = 0.85
    return m


def scene_setup():
    sc = bpy.context.scene
    for name in ('Cube',):
        o = bpy.data.objects.get(name)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 48
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
    w = sc.world or bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(HDRI, check_existing=True)
    bg_env = nt.nodes.new('ShaderNodeBackground'); bg_env.inputs['Strength'].default_value = 1.0
    bg_cam = nt.nodes.new('ShaderNodeBackground'); bg_cam.inputs['Color'].default_value = (0.94, 0.90, 0.78, 1)
    lp = nt.nodes.new('ShaderNodeLightPath')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(env.outputs['Color'], bg_env.inputs['Color'])
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
    nt.links.new(bg_env.outputs['Background'], mix.inputs[1])
    nt.links.new(bg_cam.outputs['Background'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    # key light from the upper left, a soft fill, a rim
    for nm, loc, energy, size in (('Key', (-9, -12, 14), 1500, 4), ('Fill', (12, -8, 5), 250, 8), ('Rim', (3, 10, 12), 900, 3)):
        L = bpy.data.objects.get(nm)
        if not L:
            L = bpy.data.objects.new(nm, bpy.data.lights.new(nm, 'AREA'))
            sc.collection.objects.link(L)
        L.data.energy = energy
        L.data.size = size
        L.location = loc
        L.rotation_euler = (Vector((0, 0, 5)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    old = bpy.data.objects.get('Light')
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    cam = bpy.data.objects.get('Camera')
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 13.6
    cam.location = (0, -30, 5.0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    sc.render.resolution_x, sc.render.resolution_y = 1500, 1200
    sc.render.film_transparent = False
