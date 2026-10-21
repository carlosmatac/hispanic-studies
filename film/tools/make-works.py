"""Write film/reel/compositions/works.html: "what the Institute makes", drop two
of the reel (bars 21-29). Everything on screen comes from the site's own data:

  - Watch: his real thumbnails (film/reel/assets/img/yt-*.jpg)
  - Read: the eight essays in site/lib/content.ts, as cards flying in 3D
  - The canon: the real graph (93 cards, 47 edges) as laid out on the site,
    captured by film/tools/capture-canon-geom.mjs into film/reel/data/
  - The Atlas: milestones from site/data/milestones.json pinned on the map
  - De Indiis Editions: the series names (site/lib/i18n.ts)
  - Follow: the followings we have verified (site/lib/content.ts)

    python3 film/tools/make-works.py
"""
import html
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "film/reel/compositions/works.html"
B = 60 / 112


def bar(n):
    return round(n * 4 * B, 4)


# shot boundaries (local seconds), one bar = 2.1429 s
W0, R0, C0, A0, K0, F0, END = bar(0), bar(1), bar(3), bar(5), bar(7), bar(8), bar(9)

esc = html.escape

# ---------------------------------------------------------------- data
ESSAYS = [
    ("The Catholic-Hispanic Position on Racism", "Francisco Elías de Tejada", "19 Dec 2025"),
    ("The Vikings Did Not Discover America", "Iván Vélez", "29 Dec 2025"),
    ("Oiréis hablar de mí: A Tribute to José Vasconcelos", "Ismael Carvallo Robledo", "17 Sep 2025"),
    ("Transitional Political Society, Neither Feudal nor Capitalist: The Spanish Empire", "Santiago Armesilla", "2 Jun 2025"),
    ("Spain and America", "Gustavo Bueno", "17 Apr 2025"),
    ("On Bullfighting", "Gustavo Bueno", "21 May 2025"),
    ("Aryan Indigenismo and Manifest Destiny", "Beltrán Arellanes", "6 Apr 2025"),
    ("The Black Legend: Threat to Hispanic Civilization (Part 1)", "Alicia Melchor Herrera", "12 Apr 2025"),
]
SERIES = ["Race, Mixture and Difference", "Indo-Hispanic Thought and Its Critics", "Classics and Critics of Hispanidad",
          "Hispanic Political Theology", "Pan-Iberian and Lusophone Thought", "Literary Continentalism"]
THUMBS = ["BISc6y6fIuM", "JNLr7NM_buA", "3LYcIzK8mxo", "5Yug5P6lbCc", "NJKfmnwbOXQ", "Xinb9TN9aOM"]

geom = json.loads((ROOT / "film/reel/data/canon-geom.json").read_text())
graph = json.loads((ROOT / "site/data/canon-graph.json").read_text())
EDGE_KIND = {e["id"]: e["kind"] for e in graph["edges"]}
MILES = {m["n"]: m for m in json.loads((ROOT / "site/data/milestones.json").read_text())["milestones"]}

# ---------------------------------------------------------------- read: 3D cards
ring_r = 760
cards = []
for i, (t, a, d) in enumerate(ESSAYS):
    cards.append(f'''          <div id="rd-a{i}" class="rd-arm"><article id="rd-c{i}" class="rd-card">
            <p class="rd-k">Substack · {esc(d)}</p><h3>{esc(t)}</h3><p class="rd-by">{esc(a)}</p>
          </article></div>''')
grid = [((i % 4) - 1.5) * 470 for i in range(8)], [((i // 4) - 0.5) * 330 for i in range(8)]

# ---------------------------------------------------------------- canon: the real graph
FOCUS = (1800, 1250)                    # the middle of the 1900–1930 cluster the camera tours
def strip(h):
    return re.sub(r'<div[^>]*react-flow__handle[^>]*></div>', '', h)

nodes_html, node_delay = [], []
for n in geom["nodes"]:
    cx, cy = n["x"] + n["w"] / 2, n["y"] + n["h"] / 2
    dist = math.hypot(cx - FOCUS[0], cy - FOCUS[1])
    node_delay.append(round(min(1.5, dist / 1500 * 1.5), 3))
    nodes_html.append(f'          <div class="cn-n" style="left: {n["x"]}px; top: {n["y"]}px; width: {n["w"]}px; height: {n["h"]}px">'
                      f'<div class="{esc(n["cls"])}">{strip(n["html"])}</div></div>')
edges_html, sparks_html, edge_delay = [], [], []
for e in geom["edges"]:
    kind = EDGE_KIND.get(e["id"], "documented")
    nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", e["d"])]
    mx, my = sum(nums[0::2]) / (len(nums) / 2), sum(nums[1::2]) / (len(nums) / 2)
    edge_delay.append(round(min(2.2, math.hypot(mx - FOCUS[0], my - FOCUS[1]) / 1500 * 2.0) + 0.1, 3))
    edges_html.append(f'            <path class="cn-e cn-e--{kind}" d="{e["d"]}" pathLength="1" />')
    if kind != "wrote":
        sparks_html.append(f'            <path class="cn-s" d="{e["d"]}" pathLength="1" />')

# ---------------------------------------------------------------- atlas: milestones on the map
# pins in the map image's own pixels (3584 x 1746), card offsets beside them
STOPS = [
    (60, (1994, 358), (70, -250)),
    (9, (1288, 571), (60, -60)),
    (14, (1053, 600), (-610, 40)),
    (16, (1348, 959), (-640, 30)),
    (22, (1707, 1042), (70, 20)),
    (18, (3266, 672), (-640, -260)),
]
pins, mcards = [], []
for i, (n, (px, py), (dx, dy)) in enumerate(STOPS):
    m = MILES[n]
    pins.append(f'          <i id="at-p{i}" class="at-pin" style="left: {px}px; top: {py}px"></i>')
    lx, ly = px + dx + (0 if dx > 0 else 560), py + dy + 70
    pins.append(f'          <svg class="at-lead" viewBox="0 0 3584 1746"><path id="at-l{i}" d="M{px} {py} L{lx} {ly}" pathLength="1" /></svg>')
    mcards.append(f'''          <article id="at-c{i}" class="at-card" style="left: {px + dx}px; top: {py + dy}px">
            <p class="at-k">{esc(m["date"]["en"])} · Milestone {n} of 60</p><h3>{esc(m["title"]["en"])}</h3>
          </article>''')

# ---------------------------------------------------------------- page
thumbs = "\n".join(f'        <img class="wk-thumb" src="assets/img/yt-{t}.jpg" alt="" />' for t in THUMBS)
spines = "\n".join(f'        <div class="wk-spine{" wk-spine--paper" if i % 2 else ""}"><span>{esc(s)}</span></div>' for i, s in enumerate(SERIES))

page = f'''<template>
  <style>
    @font-face {{ font-family: "Ibarra Real Nova"; src: url("assets/fonts/ibarra-real-nova.ttf"); font-weight: 400 700; }}
    @font-face {{ font-family: "Ibarra Real Nova"; src: url("assets/fonts/ibarra-real-nova-italic.ttf"); font-weight: 400 700; font-style: italic; }}
    #root {{ position: absolute; inset: 0; background: #f9f3dd; overflow: hidden; font-family: "Ibarra Real Nova", serif; color: #28231e; }}
    .wk-shot {{ position: absolute; inset: 0; background: #f9f3dd; overflow: hidden; }}
    .wk-word {{ position: absolute; left: 150px; top: 120px; font-weight: 600; font-size: 190px; line-height: 0.9; letter-spacing: -0.025em; color: #470b15; white-space: nowrap; }}
    .wk-word span {{ display: inline-block; }}
    .wk-fig {{ position: absolute; left: 156px; top: 310px; font-family: Inter, sans-serif; font-weight: 500; font-size: 38px; color: #28231e; white-space: nowrap; }}
    /* a paper slab that keeps the title readable over a moving world */
    .wk-slab {{ position: absolute; left: 0; top: 0; width: 1020px; height: 380px; background: #f9f3dd; }}

    /* after its entrance a title becomes a small chip, so the world can be seen */
    .wk-chip {{ position: absolute; left: 60px; top: 46px; padding: 12px 26px 14px; background: #f9f3dd; border: 3px solid #470b15; white-space: nowrap; z-index: 3; }}
    .wk-chip b {{ font-weight: 600; font-size: 46px; color: #470b15; }}
    .wk-chip span {{ margin-left: 18px; font-family: Inter, sans-serif; font-weight: 500; font-size: 28px; color: #28231e; }}

    /* watch */
    #wk-watch .wk-word {{ top: 640px; }}
    #wk-watch .wk-fig {{ top: 830px; }}
    #wk-wall {{ position: absolute; left: 690px; top: 110px; display: grid; grid-template-columns: repeat(3, 340px); gap: 20px; }}
    .wk-thumb {{ width: 340px; height: 191px; object-fit: cover; display: block; }}

    /* read: eight essays as cards in space */
    #rd-stage {{ position: absolute; inset: 0; perspective: 1700px; perspective-origin: 51% 58%; }}
    #rd-ring {{ position: absolute; left: 980px; top: 660px; width: 0; height: 0; transform-style: preserve-3d; }}
    .rd-arm {{ position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; }}
    .rd-card {{ position: absolute; left: -220px; top: -150px; width: 440px; height: 300px; padding: 26px 30px; background: #f9f3dd; border: 3px solid #470b15; outline: 1px solid #470b15; outline-offset: 6px; backface-visibility: hidden; display: flex; flex-direction: column; }}
    .rd-k {{ font-family: Inter, sans-serif; font-weight: 500; font-size: 22px; color: #470b15; margin-bottom: 14px; }}
    .rd-card h3 {{ font-weight: 600; font-size: 40px; line-height: 1.05; color: #28231e; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }}
    .rd-by {{ margin-top: auto; font-family: Inter, sans-serif; font-weight: 500; font-size: 24px; color: #6a625a; }}
    #wk-read .wk-word, #wk-read .wk-fig {{ z-index: 2; }}

    /* the canon: the real graph, as on the site */
    #cn-world {{ position: absolute; left: 0; top: 0; width: 3300px; height: 3200px; transform-origin: 0 0; }}
    #cn-edges {{ position: absolute; left: 0; top: 0; width: 3300px; height: 3200px; overflow: visible; }}
    .cn-e {{ fill: none; stroke: #470b15; stroke-width: 2.4; stroke-dasharray: 1 1; }}
    .cn-e--probable {{ stroke-width: 2; }}
    .cn-e--opposition {{ stroke: #28231e; stroke-width: 2.2; }}
    .cn-e--wrote {{ stroke: #b5aa96; stroke-width: 1.6; }}
    .cn-s {{ fill: none; stroke: #470b15; stroke-width: 7; stroke-linecap: round; stroke-dasharray: 0.001 0.045; }}
    .cn-n {{ position: absolute; }}
    .cg-node {{ position: relative; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; width: 100%; height: 100%; overflow: hidden; padding: 7px 10px 7px 11px; font-family: Inter, sans-serif; font-size: 11.5px; line-height: 1.2; color: #28231e; background: #f9f3dd; }}
    .cg-node__yr {{ flex: none; font-family: "IBM Plex Mono", monospace; font-size: 10px; color: #470b15; letter-spacing: 0.02em; }}
    .cg-node__t {{ flex: none; font-family: "Ibarra Real Nova", serif; font-weight: 600; font-size: 13px; line-height: 1.12; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }}
    .cg-node__a {{ flex: none; font-size: 10.5px; color: #6a625a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
    .cg-node--text {{ border: 1px solid #28231e; }}
    .cg-node--text .cg-node__t {{ font-style: italic; }}
    .cg-node--author {{ justify-content: center; padding: 8px 15px; border-radius: 999px; background: #470b15; color: #f9f3dd; border: 1px solid #470b15; }}
    .cg-node--author .cg-node__a {{ color: #d9cdb6; }}
    .cg-node--author.is-counter {{ background: #f9f3dd; color: #28231e; border: 1.5px dashed #470b15; }}
    .cg-node--author.is-counter .cg-node__a {{ color: #6a625a; }}
    .cg-node--corpus {{ justify-content: center; border: 1px dotted #28231e; border-radius: 8px; background: #ede3c8; }}
    .cg-node--corpus .cg-node__t {{ font-weight: 400; font-style: italic; }}
    .cg-node--periodical {{ border: 1px solid #28231e; transform: skewX(-10deg); justify-content: center; }}
    .cg-node--periodical .cg-node__in {{ transform: skewX(10deg); display: flex; flex-direction: column; gap: 2px; min-width: 0; }}
    .cg-node--institution {{ justify-content: center; padding-inline: 20px; background: #28231e; clip-path: polygon(11px 0, calc(100% - 11px) 0, 100% 50%, calc(100% - 11px) 100%, 11px 100%, 0 50%); }}
    .cg-node--institution::before {{ content: ""; position: absolute; inset: 1px; z-index: 0; background: #f9f3dd; clip-path: polygon(10.5px 0, calc(100% - 10.5px) 0, 100% 50%, calc(100% - 10.5px) 100%, 10.5px 100%, 0 50%); }}
    .cg-node--institution .cg-node__in {{ position: relative; z-index: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }}

    /* the Atlas: milestones pinned on the Iberophone map */
    #at-world {{ position: absolute; left: 0; top: 0; width: 3584px; height: 1746px; transform-origin: 0 0; }}
    #at-world > img {{ position: absolute; inset: 0; width: 3584px; height: 1746px; display: block; }}
    .at-lead {{ position: absolute; inset: 0; width: 3584px; height: 1746px; overflow: visible; }}
    .at-lead path {{ fill: none; stroke: #470b15; stroke-width: 4; stroke-dasharray: 0.02 0.02; }}
    .at-pin {{ position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; background: #470b15; border: 6px solid #f9f3dd; box-shadow: 0 0 0 3px #470b15; }}
    .at-card {{ position: absolute; width: 560px; padding: 24px 30px 28px; background: #f9f3dd; border: 3px solid #28231e; outline: 2px solid #b5aa96; outline-offset: 7px; }}
    .at-k {{ font-family: "IBM Plex Mono", monospace; font-size: 24px; color: #470b15; margin-bottom: 10px; }}
    .at-card h3 {{ font-weight: 600; font-size: 46px; line-height: 1.05; color: #28231e; }}

    /* books */
    #wk-shelf {{ position: absolute; right: 150px; bottom: 0; height: 860px; display: flex; gap: 18px; align-items: flex-end; }}
    .wk-spine {{ width: 128px; height: 820px; background: #470b15; position: relative; }}
    .wk-spine:nth-child(2) {{ height: 760px; }} .wk-spine:nth-child(4) {{ height: 790px; }} .wk-spine:nth-child(5) {{ height: 740px; }}
    .wk-spine--paper {{ background: #ede3c8; outline: 3px solid #470b15; outline-offset: -3px; }}
    .wk-spine span {{ position: absolute; left: 0; right: 0; bottom: 40px; display: grid; place-items: center; writing-mode: vertical-rl; rotate: 180deg; font-weight: 600; font-size: 40px; white-space: nowrap; color: #f9f3dd; }}
    .wk-spine--paper span {{ color: #470b15; }}
    #wk-books .wk-word {{ font-size: 150px; }}

    /* follow */
    #wk-follow {{ background: #470b15; }}
    #wk-nums {{ position: absolute; left: 150px; width: 1620px; top: 360px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px; }}
    .wk-num {{ color: #f9f3dd; }}
    .wk-num b {{ display: block; font-weight: 600; font-size: 150px; line-height: 1; letter-spacing: -0.03em; }}
    .wk-num span {{ display: block; margin-top: 18px; font-family: Inter, sans-serif; font-weight: 500; font-size: 38px; }}
    #wk-join {{ position: absolute; left: 150px; top: 120px; font-weight: 500; font-style: italic; font-size: 92px; color: #f9f3dd; }}
  </style>

  <div id="root" data-composition-id="works" data-width="1920" data-height="1080">
    <div id="wk-watch" class="wk-shot clip" data-start="{W0}" data-duration="{round(R0 - W0, 4)}">
      <div id="wk-wall">
{thumbs}
      </div>
      <p class="wk-word"><span>Watch</span></p>
      <p class="wk-fig">13.5K subscribers on YouTube</p>
    </div>

    <div id="wk-read" class="wk-shot clip" data-start="{R0}" data-duration="{round(C0 - R0, 4)}">
      <div id="rd-stage">
        <div id="rd-ring">
{chr(10).join(cards)}
        </div>
      </div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>Read</span></p>
      <p class="wk-fig" style="top: 250px">Essays and translations on Substack</p>
    </div>

    <div id="wk-canon" class="wk-shot clip" data-start="{C0}" data-duration="{round(A0 - C0, 4)}">
      <div id="cn-world">
        <svg id="cn-edges" viewBox="0 0 3300 3200">
{chr(10).join(edges_html)}
{chr(10).join(sparks_html)}
        </svg>
{chr(10).join(nodes_html)}
      </div>
      <div class="wk-slab" id="cn-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>canon</span></p>
      <p class="wk-fig" style="top: 250px">Fifty texts, 1818 to 1999, and who read whom</p>
      <p class="wk-chip" id="cn-chip"><b>The canon</b><span>fifty texts, 1818 to 1999</span></p>
    </div>

    <div id="wk-atlas" class="wk-shot clip" data-start="{A0}" data-duration="{round(K0 - A0, 4)}">
      <div id="at-world">
        <img src="assets/img/iberophone-map.jpg" alt="" />
{chr(10).join(pins)}
{chr(10).join(mcards)}
      </div>
      <div class="wk-slab" id="at-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>Atlas</span></p>
      <p class="wk-fig" style="top: 250px">Sixty milestones, c. 722 to 2026</p>
      <p class="wk-chip" id="at-chip"><b>The Atlas</b><span>sixty milestones, c. 722 to 2026</span></p>
    </div>

    <div id="wk-books" class="wk-shot clip" data-start="{K0}" data-duration="{round(F0 - K0, 4)}">
      <p class="wk-word"><span>De</span> <span>Indiis</span><br /><span>Editions</span></p>
      <p class="wk-fig" style="top: 470px">Six series of books, in translation</p>
      <div id="wk-shelf">
{spines}
      </div>
    </div>

    <div id="wk-follow" class="wk-shot clip" data-start="{F0}" data-duration="{round(END - F0, 4)}">
      <p id="wk-join">Join the argument.</p>
      <div id="wk-nums">
        <p class="wk-num"><b>13.5K</b><span>YouTube</span></p>
        <p class="wk-num"><b>19K</b><span>Instagram</span></p>
        <p class="wk-num"><b>22K</b><span>X</span></p>
        <p class="wk-num"><b>587</b><span>Substack</span></p>
      </div>
    </div>
  </div>

  <script>
    (() => {{
      const B = 60 / 112;
      const tl = gsap.timeline({{ paused: true }});
      const word = (id, t) => tl.fromTo(id + " .wk-word span", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.16, stagger: 0.08, ease: "power2.out" }}, t);
      const fig = (id, t) => tl.fromTo(id + " .wk-fig", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, ease: "power2.out" }}, t);
      // a camera over a world: chained moves, each starting from where the last one ends
      const cam = (cx, cy, k) => ({{ x: 960 - cx * k, y: 540 - cy * k, scale: k }});
      const move = (sel, from, to, t, d, ease, first) => tl.fromTo(sel, from, {{ ...to, duration: d, ease, immediateRender: !!first }}, t);

      // WATCH: the word arrives out of the portico's metope, large, and settles; the wall slides in
      tl.fromTo("#wk-watch .wk-word", {{ scale: 2.6, x: 540, y: -200, opacity: 1 }}, {{ scale: 1, x: 0, y: 0, duration: 0.7, ease: "expo.out" }}, {W0});
      tl.fromTo("#wk-wall .wk-thumb", {{ x: 900 }}, {{ x: 0, duration: 0.5, stagger: B / 2, ease: "expo.out" }}, {W0} + 0.1);
      fig("#wk-watch", {W0} + B);

      // READ: eight essays fly in from the depth into a turning ring, then fold into a wall
      word("#wk-read", {R0} + 0.1); fig("#wk-read", {R0} + B);
      const grid = {json.dumps([[round(x), round(y)] for x, y in zip(*grid)])};
      for (let i = 0; i < 8; i++) {{
        tl.fromTo("#rd-a" + i, {{ rotationY: i * 45 }}, {{ rotationY: i * 45, duration: 0.01 }}, {R0});
        tl.fromTo("#rd-c" + i, {{ z: -2600, opacity: 0, y: (i % 2 ? 70 : -70) }}, {{ z: {ring_r}, opacity: 1, y: (i % 2 ? 70 : -70), duration: 0.8, ease: "expo.out" }}, {R0} + i * 0.06);
        // the fold: arms straighten, cards come forward into a tilted wall of two rows
        tl.fromTo("#rd-a" + i, {{ rotationY: i * 45 }}, {{ rotationY: 0, duration: 0.85, ease: "power3.inOut", immediateRender: false }}, {R0} + 2.35 + i * 0.03);
        tl.fromTo("#rd-c" + i, {{ z: {ring_r}, x: 0, y: (i % 2 ? 70 : -70) }}, {{ z: 0, x: grid[i][0], y: grid[i][1], duration: 0.85, ease: "power3.inOut", immediateRender: false }}, {R0} + 2.35 + i * 0.03);
      }}
      tl.fromTo("#rd-ring", {{ rotationY: 30, rotationX: 8 }}, {{ rotationY: -110, rotationX: 8, duration: 2.35, ease: "power1.inOut" }}, {R0});
      tl.fromTo("#rd-ring", {{ rotationY: -110, rotationX: 8 }}, {{ rotationY: -372, rotationX: 10, duration: 0.95, ease: "power3.inOut", immediateRender: false }}, {R0} + 2.35);
      tl.fromTo("#rd-ring", {{ rotationY: -372, rotationX: 10 }}, {{ rotationY: -366, rotationX: 10, duration: 0.6, ease: "none", immediateRender: false }}, {R0} + 3.3);

      // THE CANON: the camera starts close on La raza cósmica and pulls out to the whole field,
      // the cards appearing and the edges drawing outwards from it, dots running along them
      word("#wk-canon", {C0} + 0.1); fig("#wk-canon", {C0} + B);
      // the camera follows a real chain of readers: Ariel → Rodó → Vasconcelos → La raza cósmica → Haya
      move("#cn-world", cam(1625, 1046, 2.3), cam(1646, 790, 2.3), {C0}, 0.7, "power2.inOut", true);
      move("#cn-world", cam(1646, 790, 2.3), cam(2014, 1380, 2.0), {C0} + 0.75, 0.8, "power2.inOut");
      move("#cn-world", cam(2014, 1380, 2.0), cam(2030, 1520, 2.3), {C0} + 1.6, 0.55, "power2.inOut");
      move("#cn-world", cam(2030, 1520, 2.3), cam(1830, 1300, 0.85), {C0} + 2.2, 1.3, "expo.inOut");
      move("#cn-world", cam(1830, 1300, 0.85), cam(1830, 1300, 0.8), {C0} + 3.5, {round(A0 - C0 - 3.5, 3)}, "none");
      const nd = {json.dumps(node_delay)};
      document.querySelectorAll("#cn-world .cn-n").forEach((el, i) => tl.fromTo(el, {{ opacity: 0, scale: 0.85 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }}, {C0} + nd[i]));
      const ed = {json.dumps(edge_delay)};
      document.querySelectorAll("#cn-edges .cn-e").forEach((el, i) => tl.fromTo(el, {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }}, {C0} + ed[i]));
      tl.fromTo("#cn-edges .cn-s", {{ strokeDashoffset: 0, opacity: 0 }}, {{ strokeDashoffset: -0.6, opacity: 1, duration: {round(A0 - C0 - 0.3, 3)}, ease: "none" }}, {C0} + 0.3);
      const toChip = (id, slab, chip, t) => {{
        tl.fromTo(id + " .wk-word, " + id + " .wk-fig", {{ opacity: 1, filter: "blur(0px)" }}, {{ opacity: 0, filter: "blur(8px)", duration: 0.18, immediateRender: false }}, t);
        tl.fromTo(slab, {{ opacity: 0.94 }}, {{ opacity: 0, duration: 0.25, immediateRender: false }}, t);
        tl.fromTo(chip, {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "expo.out" }}, t + 0.1);
      }};
      tl.fromTo("#cn-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {C0});
      toChip("#wk-canon", "#cn-slab", "#cn-chip", {C0} + 1.05);

      // THE ATLAS: the camera follows the milestones over the map, a card at each, then pulls back
      word("#wk-atlas", {A0} + 0.1); fig("#wk-atlas", {A0} + B);
      const route = {json.dumps([list(p) for _, p, _ in STOPS])};
      const k = 1.25;
      move("#at-world", cam(route[0][0] + 250, route[0][1] + 60, k), cam(route[1][0] + 200, route[1][1], k), {A0}, 0.55, "power2.inOut", true);
      move("#at-world", cam(route[1][0] + 200, route[1][1], k), cam(route[2][0] - 50, route[2][1] + 60, k), {A0} + 0.6, 0.55, "power2.inOut");
      move("#at-world", cam(route[2][0] - 50, route[2][1] + 60, k), cam(route[3][0] - 50, route[3][1] + 40, k), {A0} + 1.2, 0.5, "power2.inOut");
      move("#at-world", cam(route[3][0] - 50, route[3][1] + 40, k), cam(route[4][0] + 200, route[4][1] + 40, k), {A0} + 1.75, 0.5, "power2.inOut");
      move("#at-world", cam(route[4][0] + 200, route[4][1] + 40, k), cam(1792, 760, 0.56), {A0} + 2.3, 1.1, "expo.inOut");
      move("#at-world", cam(1792, 760, 0.56), cam(1792, 760, 0.545), {A0} + 3.4, {round(K0 - A0 - 3.4, 3)}, "none");
      [0, 0.45, 1.05, 1.62, 2.15, 2.75].forEach((t, i) => {{
        tl.fromTo("#at-p" + i, {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2)" }}, {A0} + t);
        tl.fromTo("#at-l" + i, {{ strokeDashoffset: 1, opacity: 1 }}, {{ strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }}, {A0} + t + 0.05);
        tl.fromTo("#at-c" + i, {{ opacity: 0, y: 30, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "expo.out" }}, {A0} + t + 0.12);
      }});
      tl.fromTo("#at-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {A0});
      toChip("#wk-atlas", "#at-slab", "#at-chip", {A0} + 1.05);

      // BOOKS: the spines rise onto the shelf, one an eighth note apart
      word("#wk-books", {K0}); fig("#wk-books", {K0} + B);
      tl.fromTo(".wk-spine", {{ yPercent: 105 }}, {{ yPercent: 0, duration: 0.45, stagger: B / 2, ease: "expo.out" }}, {K0});

      // FOLLOW: a figure on each beat
      tl.fromTo("#wk-join", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18 }}, {F0});
      tl.fromTo(".wk-num", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: B * 0.75, ease: "expo.out" }}, {F0} + 0.15);

      window.__timelines["works"] = tl;
    }})();
  </script>
</template>
'''
OUT.write_text(page)
print("wrote", OUT, "duration", END)
