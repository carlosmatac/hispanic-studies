"""Procedural Hispanic column types for the IHS pillars, built with bmesh.

Units: the shaft's lower diameter D = 1 (radius R = 0.5). Every column stands
on z = 0 and is centred on x = y = 0 before being moved into place.
"""
import math
import bmesh
import bpy
from mathutils import Vector, Matrix

TAU = math.tau
R = 0.5


# ---------------------------------------------------------------- utilities

def new_object(name, bm, collection, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    return ob


def grid_surface(bm, f, nu, nv, closed_u=False, cap=False):
    """Add a parametric surface f(u, v) -> Vector, u,v in [0,1]."""
    cols = nu if closed_u else nu + 1
    verts = [[bm.verts.new(f(i / nu, j / nv)) for i in range(cols)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu if closed_u else nu):
            a = verts[j][i]
            b = verts[j][(i + 1) % cols] if closed_u else verts[j][i + 1]
            c = verts[j + 1][(i + 1) % cols] if closed_u else verts[j + 1][i + 1]
            d = verts[j + 1][i]
            bm.faces.new((a, b, c, d))
    return verts


def lathe(bm, profile, segments=96, z0=0.0, radial=None):
    """Revolve a profile [(r, z), ...] (bottom to top). `radial(r, z, phi)` may
    modulate the radius (gadroons, flutes)."""
    def f(u, v):
        k = min(int(round(v * (len(profile) - 1))), len(profile) - 1)
        r, z = profile[k]
        phi = u * TAU
        if radial:
            r = radial(r, z, phi)
        return Vector((r * math.cos(phi), r * math.sin(phi), z + z0))
    verts = grid_surface(bm, f, segments, len(profile) - 1, closed_u=True)
    # close the ends
    bot = verts[0]
    top = verts[-1]
    if profile[0][0] > 1e-4:
        bm.faces.new(list(reversed(bot)))
    if profile[-1][0] > 1e-4:
        bm.faces.new(top)
    return verts


def arc(r0, z0, r1, z1, bulge, n=10):
    """A profile arc from (r0,z0) to (r1,z1) bowing outward by `bulge` (torus /
    scotia when negative). Returns points without the first one."""
    pts = []
    for i in range(1, n + 1):
        t = i / n
        r = r0 + (r1 - r0) * t + bulge * math.sin(math.pi * t)
        z = z0 + (z1 - z0) * t
        pts.append((r, z))
    return pts


def step(pts, r, dz):
    """Fillet: vertical step of height dz at radius r."""
    z = pts[-1][1]
    pts.append((r, z))
    pts.append((r, z + dz))


def box(bm, cx, cy, z0, w, d, h):
    m = bmesh.ops.create_cube(bm, size=1.0)
    for v in m['verts']:
        v.co = Vector((cx + v.co.x * w, cy + v.co.y * d, z0 + h / 2 + v.co.z * h))


# ------------------------------------------------------------- attic base

def attic_base_profile(R=R):
    """Plinth is a separate box; this is torus - fillet - scotia - fillet - torus."""
    P = [(0.0, 0.0), (0.72, 0.0)]
    P += arc(0.72, 0.0, 0.70, 0.14, 0.07, 10)          # lower torus
    step(P, 0.64, 0.015)
    P += arc(0.64, 0.155, 0.62, 0.26, -0.045, 10)      # scotia
    step(P, 0.63, 0.012)
    P += arc(0.63, 0.272, R * 1.06, 0.36, 0.05, 8)     # upper torus
    P.append((R * 1.02, 0.37))
    P.append((R, 0.39))                                # apophyge into the shaft
    return P


def attic_base(bm, z0=0.0, plinth=0.16):
    box(bm, 0, 0, z0, 1.5, 1.5, plinth)
    lathe(bm, [(r, z + z0 + plinth) for r, z in attic_base_profile()], 96)
    return z0 + plinth + 0.39


# ------------------------------------------------------- acanthus & capital

def acanthus_leaf(bm, ang, z0, height, r_of_z, width, lean=0.35, lobes=5, curl=0.3, nu=16, nv=30):
    """One acanthus leaf standing on the bell at azimuth `ang`.

    The leaf rises against the bell (r_of_z), leaning out a little; its upper
    part (`curl` of its length) turns outward and down into a hook, the way
    the leaves of a Corinthian capital do. The outline is broad with a rounded
    tip, the edge cut into lobes, the midrib sunk."""
    v0 = 1 - curl
    cr = height * curl * 0.62          # radius of the hook

    def spine(v):
        """(outward offset, z) of the midrib at v."""
        if v <= v0:
            return lean * height * (v / v0) ** 2 * v0, z0 + height * v
        out0, zt = lean * height * v0, z0 + height * v0
        a = (v - v0) / curl * math.pi * 0.95
        return out0 + cr - cr * math.cos(a), zt + cr * math.sin(a)

    def f(u, v):
        s = u * 2 - 1
        w = width * (0.42 + 0.58 * math.sin(math.pi * min(1.0, v * 1.15)))
        w *= 0.72 + 0.28 * abs(math.sin(v * lobes * math.pi)) ** 0.5     # lobed edge
        if v < 0.06:
            w *= 0.55 + 0.45 * v / 0.06                                   # narrow foot
        x = s * w
        out, zz = spine(v)
        # cupping: edges forward, midrib sunk; the lobes' tips turn outward
        cup = width * (0.10 * s * s - 0.05 * (1 - abs(s)) ** 3) * (0.4 + 0.6 * v)
        base_r = r_of_z(min(zz, z0 + height)) if v <= v0 else r_of_z(z0 + height * v0)
        rad = base_r + out + cup + 0.012
        dirv = Vector((math.cos(ang), math.sin(ang), 0))
        tang = Vector((-math.sin(ang), math.cos(ang), 0))
        return dirv * rad + tang * x + Vector((0, 0, zz))
    grid_surface(bm, f, nu, nv)


def volute(bm, ang, z_top, r_out, size, turns=1.6, thick=0.035, n=60):
    """A spiral tube (corner volute / helix) springing up and out at azimuth ang."""
    dirv = Vector((math.cos(ang), math.sin(ang), 0))
    pts = []
    for i in range(n + 1):
        t = i / n
        a = t * turns * TAU
        rr = size * (1 - 0.82 * t)
        # spiral in the vertical plane through dirv, centre near the abacus corner
        c = dirv * (r_out) + Vector((0, 0, z_top - size))
        p = c + dirv * (rr * math.sin(a)) + Vector((0, 0, rr * math.cos(a)))
        pts.append(p)
    tube(bm, pts, lambda t: thick * (1 - 0.45 * t), 8)


def tube(bm, pts, radius_fn, sides=8):
    rings = []
    for i, p in enumerate(pts):
        t = i / (len(pts) - 1)
        a = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        a.normalize()
        ref = Vector((0, 0, 1)) if abs(a.z) < 0.9 else Vector((1, 0, 0))
        n1 = a.cross(ref).normalized()
        n2 = a.cross(n1).normalized()
        r = radius_fn(t)
        rings.append([bm.verts.new(p + (n1 * math.cos(k / sides * TAU) + n2 * math.sin(k / sides * TAU)) * r) for k in range(sides)])
    for i in range(len(rings) - 1):
        for k in range(sides):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])


def rosette(bm, centre, normal, r, petals=6, depth=0.03):
    """A small carved flower (fleuron) facing `normal`."""
    normal = normal.normalized()
    ref = Vector((0, 0, 1)) if abs(normal.z) < 0.9 else Vector((1, 0, 0))
    a = normal.cross(ref).normalized()
    b = normal.cross(a).normalized()
    def f(u, v):
        phi = u * TAU
        rr = r * v * (0.7 + 0.3 * abs(math.cos(phi * petals / 2)))
        h = depth * (1 - v ** 2) + depth * 0.4 * math.cos(phi * petals) * v * (1 - v)
        return centre + a * (rr * math.cos(phi)) + b * (rr * math.sin(phi)) + normal * h
    grid_surface(bm, f, petals * 8, 6, closed_u=True)


def face_spiral(bm, ang, pts2d, depth_fn, radius_fn, sides=8):
    """A tube following a curve drawn on one face of the capital.
    pts2d: [(s, z)], s across the face (0 = face centre); depth_fn(s, z) is the
    distance from the axis along the face normal."""
    n = Vector((math.cos(ang), math.sin(ang), 0))
    t = Vector((-math.sin(ang), math.cos(ang), 0))
    pts = [n * depth_fn(s_, z) + t * s_ + Vector((0, 0, z)) for s_, z in pts2d]
    tube(bm, pts, radius_fn, sides)


def volute_curve(s0, z0, s1, z1, r0, turns, sgn, n_stalk=24, n_sp=70):
    """Stalk from (s0,z0) rising to (s1,z1), then a spiral of start radius r0
    curling `turns` times, outward first (sgn = +1 toward +s)."""
    pts = []
    for i in range(n_stalk):
        t = i / n_stalk
        e = t * t * (3 - 2 * t)
        # bow the stalk outward a little
        pts.append((s0 + (s1 - s0) * e + 0.04 * sgn * math.sin(math.pi * t), z0 + (z1 - z0) * (1 - (1 - t) ** 1.6)))
    # spiral centre below and outward of the stalk's end
    cx, cz = s1 + sgn * r0 * 0.15, z1 - r0
    a0 = math.pi / 2
    for i in range(n_sp + 1):
        t = i / n_sp
        a = a0 - sgn * t * turns * TAU
        r = r0 * (1 - 0.8 * t)
        pts.append((cx + math.cos(a) * r * sgn * -1 * -1, cz + math.sin(a) * r))
    return pts


def corinthian_capital(bm, z0, R_top=R * 0.86, H=1.17, bmL=None):
    """Corinthian capital after Vignola: height 7/6 D; two rows of eight
    acanthus leaves reaching 1/3 and 2/3 of the height; from caulicoli between
    the upper leaves spring the corner volutes and the inner helices; a thin
    abacus with concave sides and a fleuron on each face."""
    bmL = bmL or bm
    a_h = H * 0.13
    bell_h = H - a_h
    half = R * 1.45                       # half the abacus side

    def bell_r(z):
        t = max(0.0, min(1.0, (z - z0) / bell_h))
        return R_top + (R_top * 1.22 - R_top) * (t ** 1.8)

    # astragal and bell
    lathe(bm, [(0, z0 - 0.06), (R_top + 0.01, z0 - 0.06)] + arc(R_top + 0.01, z0 - 0.06, R_top + 0.01, z0, 0.035, 8) + [(0, z0)], 96)
    lathe(bm, [(0.0, z0)] + [(bell_r(z0 + bell_h * k / 24), z0 + bell_h * k / 24) for k in range(25)] + [(0.0, z0 + bell_h)], 96)

    # leaves: upper row behind (taller), lower row in front
    for k in range(8):
        acanthus_leaf(bmL, (k + 0.5) * TAU / 8, z0, H * 0.62, bell_r, 0.2, lean=0.1, curl=0.24)
    for k in range(8):
        acanthus_leaf(bmL, k * TAU / 8, z0, H * 0.36, lambda z: bell_r(z) + 0.035, 0.21, lean=0.12, curl=0.3)

    # volutes and helices, drawn on each of the four faces
    def depth(s_, z):
        # on the bell near the centre, out to the abacus corner at the edge
        base = bell_r(z) + 0.03
        k = min(1.0, abs(s_) / (half * 0.95))
        return base + (half * 0.98 - base) * k ** 2
    for f in range(4):
        ang = f * TAU / 4
        for sgn in (-1, 1):
            vc = volute_curve(sgn * 0.13, z0 + H * 0.5, sgn * half * 0.78, z0 + H * 0.86, 0.12, 1.6, sgn)
            face_spiral(bm, ang, vc, depth, lambda t: 0.038 * (1 - 0.5 * t))
            hc = volute_curve(sgn * 0.07, z0 + H * 0.52, sgn * 0.05, z0 + H * 0.84, 0.06, 1.4, -sgn)
            face_spiral(bm, ang, hc, depth, lambda t: 0.024 * (1 - 0.5 * t))
            # caulicolus: a short fluted stalk with a collar, where they spring
            cs = [(sgn * 0.13, z0 + H * 0.36 + H * 0.16 * t / 10) for t in range(11)]
            face_spiral(bm, ang, cs, depth, lambda t: 0.045, 10)

    # abacus: concave sides, the corners cut
    za = z0 + bell_h
    N = 160
    def abacus_pt(t, grow):
        side = int(t * 4) % 4
        s_ = (t * 4) % 1
        x = (-half + 2 * half * s_) * grow
        y = (-half + 0.24 * math.sin(math.pi * s_)) * grow
        x = max(-half * 0.93, min(half * 0.93, x)) if abs(y) > half * 0.92 * grow else x
        return Matrix.Rotation(side * TAU / 4, 2) @ Vector((x, y))
    rings = []
    for z, g in ((za, 1.0), (za + a_h * 0.45, 1.0), (za + a_h * 0.5, 1.035), (za + a_h, 1.035)):
        rings.append([bm.verts.new((p.x, p.y, z)) for p in (abacus_pt(i / N, g) for i in range(N))])
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(N):
            bm.faces.new((r0[i], r0[(i + 1) % N], r1[(i + 1) % N], r1[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    for k in range(4):
        ang = k * TAU / 4
        n = Vector((math.cos(ang), math.sin(ang), 0))
        rosette(bmL, n * (half - 0.24 + 0.02) + Vector((0, 0, za + a_h * 0.5)), n, 0.09, 6, 0.05)
    return z0 + H


def entablature_block(bm, z0, h=0.09):
    """A thin impost block so every column ends on the same level."""
    box(bm, 0, 0, z0, 1.5, 1.5, h)
    return z0 + h
