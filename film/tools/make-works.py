"""Write film/reel/compositions/works.html: "what the Institute makes", drop two
of the reel (bars 21-29). Everything on screen comes from the site's own data:

  - Watch: his real thumbnails (film/reel/assets/img/yt-*.jpg)
  - Read: the eight essays in site/lib/content.ts, as cards flying in 3D
  - The canon: the fifty works as the site's cards (site/data/canon-works.json),
    in the same five bindings, on burgundy
  - The Atlas: milestones from site/data/milestones.json pinned on the map
  - De Indiis Editions: the series names (site/lib/i18n.ts)
  - Follow: the channels' own logos (Simple Icons, CC0, as on the site) and one total
    that stays true as they grow: the verified followings add up to more than 50,000

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


# shot boundaries (local seconds): each shot starts on a hit measured in the track
# (film/MUSIC.md). The scene starts on the drop, 41.964 s into the track.
DROP = 41.964
def at(track):
    return round(track - DROP, 3)
W0, R0, C0, A0, K0, F0, END = 0.0, at(45.006), at(50.029), at(55.525), at(61.137), at(64.467), at(69.937)
# the followings land on the hits of the breakdown
NUMS = [at(66.065), at(67.537), at(68.344), at(69.133)]

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

WORKS = json.loads((ROOT / "site/data/canon-works.json").read_text())["works"]
# the channels' glyphs, straight from the site's seal component
icon_src = (ROOT / "site/components/ChannelIcon.tsx").read_text()
GLYPHS = dict(re.findall(r"^  (\w+): '([^']+)',$", icon_src, flags=re.M))
MILES = {m["n"]: m for m in json.loads((ROOT / "site/data/milestones.json").read_text())["milestones"]}

# ---------------------------------------------------------------- the frieze between shots
# The portico of the pillars scene (bar 20) ends with a dive into the "Watch" metope. Every
# later shot leaves the same way: the frieze slides in from the right and the camera dives
# into the next metope. The metopes are in the film's order, so the frieze always runs right.
pillars = (ROOT / "film/reel/compositions/pillars.html").read_text()
GRADE = re.search(r'<img (data-color-grading="[^"]*")[^>]*id="pil-plate"', pillars).group(1)
TINT = "\n".join("            " + re.sub(r' data-hf-id="[^"]*"', "", t).replace('id="pil-sh', 'id="fz-sh')
                 for t in re.findall(r'<path[^>]*id="pil-sh\d"[^>]*/>', pillars))
METOPES = [(258, 218), (582, 227), (915, 227), (1248, 227), (1582, 226), (1916, 218)]
LABELS = ["Watch", "Read", "Canon", "Atlas", "Books", "Community"]
mets = "\n".join(f'          <p id="fz-m{i}" class="fz-met" style="left: {x}px; width: {w}px">{LABELS[i]}</p>'
                 for i, (x, w) in enumerate(METOPES))
fz_x = [round(x + w / 2, 1) for x, w in METOPES]

# ---------------------------------------------------------------- read: 3D cards
ring_r = 760
cards = []
for i, (t, a, d) in enumerate(ESSAYS):
    cards.append(f'''          <div id="rd-a{i}" class="rd-arm"><article id="rd-c{i}" class="rd-card">
            <p class="rd-k">Substack · {esc(d)}</p><h3>{esc(t)}</h3><p class="rd-by">{esc(a)}</p>
          </article></div>''')
grid = [((i % 4) - 1.5) * 470 for i in range(8)], [((i // 4) - 0.5) * 330 for i in range(8)]

# ---------------------------------------------------------------- canon: the fifty works as cards
# the same cards as the site's canon page: ten to a row, in order of year, five bindings
BINDINGS = ["paper", "burgundy", "vellum", "leather", "ink"]
CW, CH, GX, GY = 236, 315, 44, 52
COLS = 10
def split_title(t):
    i = t.find(": ")
    return (t[:i], t[i + 2:]) if i > 0 else (t, "")
card_pos, cards_html = {}, []
for i, w in enumerate(WORKS):
    n = int(w["id"][1:])
    col, row = i % COLS, i // COLS
    x, y = 120 + col * (CW + GX), 140 + row * (CH + GY)
    card_pos[w["id"]] = (x + CW / 2, y + CH / 2)
    tilt = round(((n * 37) % 33 - 16) / 10, 1)
    title, sub = split_title(w["title"])
    long = " is-long" if len(title) > 46 else ""
    counter = " cc--counter" if w["counter"] else ""
    cards_html.append(
        f'          <div class="cc-slot" style="left: {x}px; top: {y}px"><div id="cc-{w["id"]}" class="cc cc--{BINDINGS[(n * 3) % 5]}{counter}" style="rotate: {tilt}deg">'
        f'<p class="cc-top"><b>{w["year"]}</b><span>{esc(w["code"])}</span></p>'
        f'<p class="cc-t{long}">{esc(title)}</p>'
        f'<p class="cc-foot"><i></i><b>{esc(w["author"])}</b><span>{esc(w["life"])}</span></p></div></div>')
CANON_W = 120 * 2 + COLS * CW + (COLS - 1) * GX
CANON_H = 140 * 2 + 5 * CH + 4 * GY
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
logos = "\n".join(f'        <div class="wk-logo"><svg viewBox="0 0 24 24"><path d="{GLYPHS[k]}" /></svg></div>' for k in ["youtube", "instagram", "x", "tiktok", "substack"])
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

    /* the canon: the fifty works as the site's cards, on burgundy */
    #wk-canon {{ background: #470b15; background-image: radial-gradient(70% 80% at 55% 45%, rgba(139, 94, 75, 0.55), transparent 75%); }}
    #cn-world {{ position: absolute; left: 0; top: 0; width: {CANON_W}px; height: {CANON_H}px; transform-origin: 0 0; }}
    .cc-slot {{ position: absolute; width: {CW}px; height: {CH}px; }}
    .cc {{ --bg: #f9f3dd; --fg: #28231e; --ac: #470b15; --ln: rgba(40, 35, 30, 0.3);
      position: absolute; inset: 0; display: flex; flex-direction: column; gap: 10px; padding: 18px 18px 16px; background: var(--bg); color: var(--fg);
      box-shadow: 0 3px 6px rgba(20, 6, 8, 0.25), 0 30px 50px -22px rgba(20, 6, 8, 0.75); }}
    .cc::before {{ content: ""; position: absolute; inset: 8px; border: 1.5px solid var(--ln); }}
    .cc--burgundy {{ --bg: #5a1420; --fg: #f9f3dd; --ac: #dcc8ad; --ln: rgba(249, 243, 221, 0.3); }}
    .cc--leather {{ --bg: #8b5e4b; --fg: #f9f3dd; --ac: #f9f3dd; --ln: rgba(249, 243, 221, 0.36); }}
    .cc--ink {{ --bg: #28231e; --fg: #f9f3dd; --ac: #c9a993; --ln: rgba(249, 243, 221, 0.24); }}
    .cc--vellum {{ --bg: #ede3c8; }}
    .cc--counter::before {{ border-style: dashed; }}
    .cc-top {{ display: flex; justify-content: space-between; font-family: "IBM Plex Mono", monospace; font-size: 15px; color: var(--ac); }}
    .cc-top b {{ font-weight: 500; font-size: 18px; }}
    .cc-t {{ font-style: italic; font-weight: 600; font-size: 29px; line-height: 1.06; }}
    .cc-t.is-long {{ font-size: 23px; line-height: 1.1; }}
    .cc-foot {{ margin-top: auto; display: grid; gap: 4px; font-family: Inter, sans-serif; }}
    .cc-foot i {{ display: block; width: 34px; height: 1.5px; background: var(--ac); margin-bottom: 8px; }}
    .cc-foot b {{ font-weight: 600; font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.25; }}
    .cc-foot span {{ font-family: "IBM Plex Mono", monospace; font-size: 13px; opacity: 0.75; }}
    #wk-canon .wk-slab {{ background: #470b15; }}
    #wk-canon .wk-word {{ color: #f9f3dd; }}
    #wk-canon .wk-fig {{ color: #ede3c8; }}
    #wk-canon .wk-chip {{ background: #f9f3dd; }}

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
    .wk-spine {{ width: 128px; height: 820px; background: #470b15; position: relative; box-shadow: 0 30px 50px -20px rgba(20, 6, 8, 0.7); }}
    .wk-spine:nth-child(3n) {{ background: #28231e; }}
    .wk-spine:nth-child(2) {{ height: 760px; }} .wk-spine:nth-child(4) {{ height: 790px; }} .wk-spine:nth-child(5) {{ height: 740px; }}
    .wk-spine--paper {{ background: #f9f3dd !important; outline: 3px solid #470b15; outline-offset: -3px; }}
    .wk-spine span {{ position: absolute; left: 0; right: 0; bottom: 40px; display: grid; place-items: center; writing-mode: vertical-rl; rotate: 180deg; font-weight: 600; font-size: 40px; white-space: nowrap; color: #f9f3dd; }}
    .wk-spine--paper span {{ color: #470b15; }}
    #wk-books .wk-word {{ font-size: 150px; color: #f9f3dd; }}
    #wk-books {{ background: #8b5e4b; background-image: radial-gradient(80% 90% at 30% 40%, rgba(249, 243, 221, 0.12), transparent 70%); }}
    #wk-books .wk-fig {{ color: #f9f3dd; }}
    #wk-books::before {{ content: ""; position: absolute; inset: 22px; border: 2px solid rgba(249, 243, 221, 0.3); outline: 1.5px solid rgba(249, 243, 221, 0.16); outline-offset: 7px; }}

    /* the frieze: the top of the portico, held by the three pillars */
    #fz {{ position: absolute; inset: 0; z-index: 5; overflow: hidden; }}
    #fz-pane {{ position: absolute; inset: 0; background: #f9f3dd; overflow: hidden; }}
    #fz-world {{ position: absolute; left: 0; top: 0; width: 2400px; height: 1792px; transform-origin: 0 0; }}
    #fz-world > img {{ position: absolute; inset: 0; width: 2400px; height: 1792px; display: block; }}
    #fz-tint {{ position: absolute; inset: 0; width: 2400px; height: 1792px; mix-blend-mode: multiply; }}
    #fz-tint path {{ fill: #470b15; opacity: 0.92; }}
    #fz-arch {{ position: absolute; left: 175px; width: 2050px; top: 322px; height: 52px; display: grid; place-items: center; font-weight: 600; font-size: 34px; letter-spacing: 0.5em; text-indent: 0.5em; text-transform: uppercase; color: #470b15; white-space: nowrap; }}
    .fz-met {{ position: absolute; top: 131px; height: 157px; display: grid; place-items: center; font-weight: 600; font-size: 40px; color: #28231e; }}
    #fz-fill {{ position: absolute; left: 1916px; width: 218px; top: 131px; height: 157px; background: #470b15; opacity: 0; }}

    /* follow: the channels' logos and one total that stays true as they grow */
    #wk-follow {{ background: #2f070d; background-image: radial-gradient(70% 80% at 50% 60%, rgba(71, 11, 21, 0.95), transparent 75%); }}
    #wk-join {{ position: absolute; left: 0; right: 0; top: 110px; text-align: center; font-weight: 500; font-style: italic; font-size: 92px; color: #f9f3dd; }}
    #wk-logos {{ position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; gap: 64px; }}
    .wk-logo {{ width: 128px; height: 128px; display: grid; place-items: center; border-radius: 50%; border: 2px solid rgba(249, 243, 221, 0.55); outline: 1px solid rgba(249, 243, 221, 0.25); outline-offset: 8px; }}
    .wk-logo svg {{ width: 62px; height: 62px; fill: #f9f3dd; }}
    #wk-total {{ position: absolute; left: 0; right: 0; top: 520px; text-align: center; font-weight: 600; font-size: 250px; line-height: 1; letter-spacing: -0.03em; color: #f9f3dd; }}
    #wk-total-sub {{ position: absolute; left: 0; right: 0; top: 790px; text-align: center; font-family: Inter, sans-serif; font-weight: 500; font-size: 40px; color: #ede3c8; }}
    #wk-handle {{ position: absolute; left: 0; right: 0; top: 880px; text-align: center; font-family: "IBM Plex Mono", monospace; font-size: 34px; letter-spacing: 0.06em; color: #c9a993; }}
  </style>

  <div id="root" data-composition-id="works" data-width="1920" data-height="1080">
    <div id="wk-watch" class="wk-shot clip" data-start="{W0}" data-duration="{round(R0 - W0, 4)}">
      <div id="wk-wall">
{thumbs}
      </div>
      <p class="wk-word"><span>Watch</span></p>
      <p class="wk-fig">Videos and Shorts on YouTube</p>
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
{chr(10).join(cards_html)}
      </div>
      <div class="wk-slab" id="cn-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>canon</span></p>
      <p class="wk-fig" style="top: 250px">Fifty classic texts, 1818 to 1999</p>
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
      <div id="wk-logos">
{logos}
      </div>
      <p id="wk-total">50,000+</p>
      <p id="wk-total-sub">followers on five channels</p>
      <p id="wk-handle">@hispano_studies</p>
    </div>

    <div id="fz" class="clip" data-start="0" data-duration="{END}" data-layout-ignore>
      <div id="fz-pane">
        <div id="fz-world">
          <img {GRADE} src="assets/img/portico.jpg" alt="" />
          <svg id="fz-tint" viewBox="0 0 2400 1792">
{TINT}
          </svg>
          <p id="fz-arch">Institute for Hispano Studies</p>
          <i id="fz-fill"></i>
{mets}
        </div>
      </div>
    </div>
  </div>

  <script>
    (() => {{
      const B = 60 / 112;
      const tl = gsap.timeline({{ paused: true }});
      // a title arrives out of the metope the camera dived into: large in the middle, then home
      const arrive = (sel, t, dx, dy) => tl.fromTo(sel, {{ scale: 2.4, x: dx, y: dy }}, {{ scale: 1, x: 0, y: 0, duration: 0.7, ease: "expo.out" }}, t);
      const fig = (id, t) => tl.fromTo(id + " .wk-fig", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, ease: "power2.out" }}, t);
      // a camera over a world: chained moves, each starting from where the last one ends
      const cam = (cx, cy, k) => ({{ x: 960 - cx * k, y: 540 - cy * k, scale: k }});
      const move = (sel, from, to, t, d, ease, first) => tl.fromTo(sel, from, {{ ...to, duration: d, ease, immediateRender: !!first }}, t);

      // WATCH: the word arrives out of the portico's metope, large, and settles; the wall slides in
      tl.fromTo("#wk-watch .wk-word", {{ scale: 2.6, x: 540, y: -200, opacity: 1 }}, {{ scale: 1, x: 0, y: 0, duration: 0.7, ease: "expo.out" }}, {W0});
      tl.fromTo("#wk-wall .wk-thumb", {{ x: 900 }}, {{ x: 0, duration: 0.5, stagger: 0.2, ease: "expo.out" }}, {W0} + 0.1);
      fig("#wk-watch", {W0} + 0.6 * B);

      // READ: eight essays fly in from the depth into a turning ring, then fold into a wall
      arrive("#wk-read .wk-word", {R0}, 660, 383); fig("#wk-read", {R0} + B);
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
      tl.fromTo("#rd-ring", {{ rotationY: -372, rotationX: 10 }}, {{ rotationY: -360, rotationX: 10, duration: {round(C0 - R0 - 3.3, 3)}, ease: "none", immediateRender: false }}, {R0} + 3.3);

      // THE CANON: close on La raza cósmica, along the row to Ariel and Nuestra América, then the
      // camera pulls back to all fifty; the cards drop in from the focus outwards, each on its own tilt
      arrive("#wk-canon .wk-word", {C0}, 510, 383); fig("#wk-canon", {C0} + 0.8 * B);
      const P = {json.dumps({k: [round(v[0]), round(v[1])] for k, v in card_pos.items()})};
      move("#cn-world", cam(P.T030[0], P.T030[1], 2.0), cam(P.T030[0] - 340, P.T030[1] - 40, 2.0), {C0}, 0.9, "power2.inOut", true);
      move("#cn-world", cam(P.T030[0] - 340, P.T030[1] - 40, 2.0), cam(P.T018[0], P.T018[1], 1.7), {C0} + 0.95, 0.9, "power2.inOut");
      move("#cn-world", cam(P.T018[0], P.T018[1], 1.7), cam(P.T013[0], P.T013[1], 1.9), {C0} + 1.9, 0.7, "power2.inOut");
      move("#cn-world", cam(P.T013[0], P.T013[1], 1.9), cam({CANON_W / 2}, {CANON_H / 2}, 0.56), {C0} + 2.6, 1.5, "expo.inOut");
      move("#cn-world", cam({CANON_W / 2}, {CANON_H / 2}, 0.56), cam({CANON_W / 2}, {CANON_H / 2}, 0.53), {C0} + 4.1, {round(A0 - C0 - 4.1, 3)}, "none");
      document.querySelectorAll("#cn-world .cc").forEach((el) => {{
        const [x, y] = P[el.id.slice(3)], d = Math.hypot(x - P.T030[0], y - P.T030[1]);
        tl.fromTo(el, {{ opacity: 0, y: -90, scale: 1.08 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, {C0} + Math.min(1.3, d / 1700 * 1.1));
      }});
      const toChip = (id, slab, chip, t) => {{
        tl.fromTo(id + " .wk-word, " + id + " .wk-fig", {{ opacity: 1, filter: "blur(0px)" }}, {{ opacity: 0, filter: "blur(8px)", duration: 0.18, immediateRender: false }}, t);
        tl.fromTo(slab, {{ opacity: 0.94 }}, {{ opacity: 0, duration: 0.25, immediateRender: false }}, t);
        tl.fromTo(chip, {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "expo.out" }}, t + 0.1);
      }};
      tl.fromTo("#cn-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {C0});
      toChip("#wk-canon", "#cn-slab", "#cn-chip", {C0} + 1.05);

      // THE ATLAS: the camera follows the milestones over the map, a card at each, then pulls back
      arrive("#wk-atlas .wk-word", {A0}, 515, 383); fig("#wk-atlas", {A0} + 0.8 * B);
      const route = {json.dumps([list(p) for _, p, _ in STOPS])};
      const k = 1.25;
      move("#at-world", cam(route[0][0] + 250, route[0][1] + 60, k), cam(route[1][0] + 200, route[1][1], k), {A0}, 0.65, "power2.inOut", true);
      move("#at-world", cam(route[1][0] + 200, route[1][1], k), cam(route[2][0] - 50, route[2][1] + 60, k), {A0} + 0.72, 0.65, "power2.inOut");
      move("#at-world", cam(route[2][0] - 50, route[2][1] + 60, k), cam(route[3][0] - 50, route[3][1] + 40, k), {A0} + 1.44, 0.6, "power2.inOut");
      move("#at-world", cam(route[3][0] - 50, route[3][1] + 40, k), cam(route[4][0] + 200, route[4][1] + 40, k), {A0} + 2.1, 0.6, "power2.inOut");
      move("#at-world", cam(route[4][0] + 200, route[4][1] + 40, k), cam(1792, 760, 0.56), {A0} + 2.76, 1.3, "expo.inOut");
      move("#at-world", cam(1792, 760, 0.56), cam(1792, 760, 0.54), {A0} + 4.1, {round(K0 - A0 - 4.1, 3)}, "none");
      [0, 0.54, 1.26, 1.94, 2.58, 3.3].forEach((t, i) => {{
        tl.fromTo("#at-p" + i, {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2)" }}, {A0} + t);
        tl.fromTo("#at-l" + i, {{ strokeDashoffset: 1, opacity: 1 }}, {{ strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }}, {A0} + t + 0.05);
        tl.fromTo("#at-c" + i, {{ opacity: 0, y: 30, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "expo.out" }}, {A0} + t + 0.12);
      }});
      tl.fromTo("#at-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {A0});
      toChip("#wk-atlas", "#at-slab", "#at-chip", {A0} + 1.05);

      // BOOKS, on the climax: the spines rise onto the shelf, one an eighth apart
      arrive("#wk-books .wk-word", {K0}, 530, 285); fig("#wk-books", {K0} + 0.6 * B);
      tl.fromTo(".wk-spine", {{ yPercent: 105 }}, {{ yPercent: 0, duration: 0.45, stagger: 0.4, ease: "expo.out" }}, {K0});

      // FOLLOW: on the four hits of the breakdown: the logos, the total, what it counts, the handle
      arrive("#wk-join", {F0}, 0, 300);
      const H = {json.dumps(NUMS)};
      tl.fromTo(".wk-logo", {{ opacity: 0, scale: 1.5, filter: "blur(8px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.32, stagger: 0.07, ease: "expo.out" }}, H[0] - 0.05);
      tl.fromTo("#wk-total", {{ opacity: 0, scale: 1.4, filter: "blur(14px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out" }}, H[1] - 0.04);
      tl.fromTo("#wk-total-sub", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "expo.out" }}, H[2]);
      tl.fromTo("#wk-handle", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, H[3]);

      // THE FRIEZE between shots: the shot is pushed out to the left, the top of the portico
      // slides in from the right and glides to the next metope (lit in burgundy), and the camera
      // dives into it, as it dived into "Watch" at the end of the pillars
      const MX = {json.dumps(fz_x)};
      const KF = 1.64, CY = 255;
      const outgoing = ["#wk-watch", "#wk-read", "#wk-canon", "#wk-atlas", "#wk-books"];
      tl.set("#fz-pane", {{ x: 1920 }}, 0);
      [{R0}, {C0}, {A0}, {K0}, {F0}].forEach((t, i) => {{
        const m = MX[i + 1], t0 = t - 0.78;
        tl.set(".fz-met", {{ color: "#28231e" }}, t0);
        tl.set("#fz-m" + (i + 1), {{ color: "#470b15" }}, t0);
        tl.fromTo(outgoing[i], {{ x: 0 }}, {{ x: -1920, duration: 0.4, ease: "power3.inOut", immediateRender: false }}, t0);
        tl.fromTo("#fz-pane", {{ x: 1920 }}, {{ x: 0, duration: 0.4, ease: "power3.inOut", immediateRender: false }}, t0);
        tl.fromTo("#fz-world", cam(m + 260, CY, KF), {{ ...cam(m, CY, KF), duration: 0.42, ease: "power2.out", immediateRender: false }}, t0);
        tl.fromTo("#fz-world", cam(m, CY, KF), {{ ...cam(m, 210, 9), duration: 0.32, ease: "power3.in", immediateRender: false }}, t - 0.32);
        tl.set("#fz-pane", {{ x: 1920 }}, t);
      }});
      // the last metope, Community, fills with burgundy on the way in: the next shot is burgundy
      tl.fromTo("#fz-fill", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.24, ease: "power2.in" }}, {F0} - 0.26);
      tl.fromTo("#fz-m5", {{ color: "#470b15" }}, {{ color: "#f9f3dd", duration: 0.24, ease: "power2.in", immediateRender: false }}, {F0} - 0.26);

      window.__timelines["works"] = tl;
    }})();
  </script>
</template>
'''
OUT.write_text(page)
print("wrote", OUT, "duration", END)
