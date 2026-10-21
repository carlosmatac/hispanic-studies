# The pillar columns, in Blender

The three columns in the pillars section are our own 3D models of three column
types of the Hispanic world, built by code (bmesh) so they can be rebuilt,
adjusted and re-rendered:

| Pillar | Type | Built after |
| --- | --- | --- |
| Mestizaje | Column of the Andean barroco mestizo: shaft in three ringed bands, flat two-plane carving of interlaced stems, leaves and flowers (`pattern.py`) | The *talla planiforme* of the Andean portals and retablos, 17th–18th c. |
| Catolicismo | Solomonic column, six turns, the eucharistic vine (leaves and grapes) in the groove | The Hispanic *salomónica* of the 17th–18th c. |
| Lengua | Plateresque balaustre: turned vases with gadroons, fluting and acanthus collars | Diego de Sagredo, *Medidas del Romano* (Toledo, 1526) |

All three stand on an Attic base and carry a Corinthian capital after Vignola (two rows of acanthus, caulicoli, corner volutes, helices, concave abacus with fleurons). They are types, not copies of one building, and the page says so.

## Run it

Needs Blender 5.1+ with the Blender Lab **MCP** extension enabled (it listens on `127.0.0.1:9876`); `bl.py` talks to that socket directly.

```bash
# once: the studio HDRI the gold reflects (Poly Haven, CC0, by Sergej Majboroda)
mkdir -p assets/3d/hdri && curl -L -o assets/3d/hdri/studio_small_09_2k.hdr \
  https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr

python3 tools/blender/pattern.py                 # the flat-carving pattern → assets/3d/mestizo-pattern.png
python3 tools/blender/bl.py tools/blender/run_build.py   # build the columns in the open Blender
tools/blender/render_all.sh                      # 3 × 36 frames in Cycles (~30 min on CPU), then pack_frames.py
```

`pack_frames.py` writes `site/public/art/pillars/<key>/`: `g-NN.webp` (gilded render, RGBA), `t-NN.webp` (clay pass the shader engraves from) and `still.webp` (the fallback).

Not committed, all regenerable: `assets/3d/ihs-pillars.blend`, `assets/3d/hdri/`, `assets/3d/frames/`.
