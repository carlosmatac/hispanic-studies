"""Write film/reel/compositions/works.html: "what the Institute makes", drop two
of the reel (bars 21-29). Everything on screen comes from the site's own data:

  - Watch: his real thumbnails (film/reel/assets/img/yt-*.jpg)
  - Read: the eight essays in site/lib/content.ts, as the home's essay cards (the post's
    cover, its date, author and translator), flying in 3D
  - The archive: the archive page itself and a work's page, as the site shows them
    (film/reel/assets/img/site/, captured by film/tools/capture-site.mjs)
  - The Atlas: the Atlas app itself, its globe flying between stops (film/reel/assets/atlas/,
    captured by film/tools/capture-site.mjs from our own engine, lib/atlas-globe.ts)
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
# as on the home (site/lib/content.ts), newest first; dates as the home prints them in English
ESSAYS = [
    ("The Vikings Did Not Discover America", "Iván Vélez", "", "Dec 29, 2025", "the-vikings-did-not-discover-america"),
    ("The Catholic-Hispanic Position on Racism", "Francisco Elías de Tejada", "", "Dec 19, 2025", "the-catholic-hispanic-position-on"),
    ("Oiréis hablar de mí: A Tribute to José Vasconcelos", "Ismael Carvallo Robledo", "Beltrán Arellanes", "Sep 17, 2025", "oireis-hablar-de-mi-a-tribute-to"),
    ("Transitional Political Society, Neither Feudal nor Capitalist: The Spanish Empire", "Santiago Armesilla", "Beltrán Arellanes", "Jun 2, 2025", "transitional-political-society-neither"),
    ("On Bullfighting", "Gustavo Bueno", "Beltrán Arellanes", "May 21, 2025", "on-bullfighting"),
    ("Spain and America", "Gustavo Bueno", "Beltrán Arellanes", "Apr 17, 2025", "spain-and-america"),
    ("The Black Legend: Threat to Hispanic Civilization (Part 1)", "Alicia Melchor Herrera", "", "Apr 12, 2025", "the-black-legend-threat-to-hispanic"),
    ("Aryan Indigenismo and Manifest Destiny", "Beltrán Arellanes", "", "Apr 6, 2025", "aryan-indigenismo-and-manifest-destiny"),
]
SERIES = ["Race, Mixture and Difference", "Indo-Hispanic Thought and Its Critics", "Classics and Critics of Hispanidad",
          "Hispanic Political Theology", "Pan-Iberian and Lusophone Thought", "Literary Continentalism"]
THUMBS = ["BISc6y6fIuM", "JNLr7NM_buA", "3LYcIzK8mxo", "5Yug5P6lbCc", "NJKfmnwbOXQ", "Xinb9TN9aOM"]

# the channels' glyphs, straight from the site's seal component
icon_src = (ROOT / "site/components/ChannelIcon.tsx").read_text(encoding="utf-8")
GLYPHS = dict(re.findall(r"^  (\w+): '([^']+)',$", icon_src, flags=re.M))
# the pictures of the site, as captured (film/tools/capture-site.mjs): the archive page from the
# collection's title down its first era, a work's page, and the Atlas app's frames
SITE = json.loads((ROOT / "film/reel/assets/img/site/site.json").read_text(encoding="utf-8"))

# ---------------------------------------------------------------- the frieze between shots
# The portico of the pillars scene (bar 20) ends with a dive into the "Watch" metope. Every
# later shot leaves the same way: the frieze slides in from the right and the camera dives
# into the next metope. The metopes are in the film's order, so the frieze always runs right.
pillars = (ROOT / "film/reel/compositions/pillars.html").read_text(encoding="utf-8")
GRADE = re.search(r'<img (data-color-grading="[^"]*")[^>]*id="pil-plate"', pillars).group(1)
TINT = "\n".join("            " + re.sub(r' data-hf-id="[^"]*"', "", t).replace('id="pil-sh', 'id="fz-sh')
                 for t in re.findall(r'<path[^>]*id="pil-sh\d"[^>]*/>', pillars))
METOPES = [(258, 218), (582, 227), (915, 227), (1248, 227), (1582, 226), (1916, 218)]
LABELS = ["Watch", "Read", "Archive", "Atlas", "Books", "Community"]
mets = "\n".join(f'          <p id="fz-m{i}" class="fz-met" style="left: {x}px; width: {w}px">{LABELS[i]}</p>'
                 for i, (x, w) in enumerate(METOPES))
fz_x = [round(x + w / 2, 1) for x, w in METOPES]

# ---------------------------------------------------------------- read: 3D cards
ring_r = 760
cards = []
for i, (t, a, tr, d, slug) in enumerate(ESSAYS):
    by = esc(a) + (f" · trans. {esc(tr)}" if tr else "")
    cards.append(f'''          <div id="rd-a{i}" class="rd-arm"><article id="rd-c{i}" class="rd-card">
            <span class="rd-cover"><img src="assets/img/essays/{slug}.jpg" alt="" /></span>
            <span class="rd-text"><p class="rd-k">{esc(d)}</p><h3>{esc(t)}</h3><p class="rd-by">{by}</p></span>
          </article></div>''')
grid = [((i % 4) - 1.5) * 470 for i in range(8)], [((i // 4) - 0.5) * 330 for i in range(8)]

# ---------------------------------------------------------------- the archive and the Atlas, as captured
ARCH = SITE["archive"]      # the archive page: its size in CSS px and where the camera looks
WORK = SITE["work"]         # a work's page
APP = SITE["atlas"]         # the Atlas app: the first film frame it was captured at, and how many
# a video's frame i is the film's frame first + i: start it a hair before that frame's time, so
# both rounding and flooring land on the same frame
FILM0 = 42.114              # where this scene starts in the film (index.html)
AV0 = round(APP["first"] / 30 - 0.004 - FILM0, 4)
AVD = round(APP["frames"] / 30, 4)

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
    .wk-chip {{ position: absolute; left: 60px; top: 46px; padding: 12px 34px 15px; border-radius: 999px; background: rgba(252, 248, 236, 0.84); border: 1px solid rgba(40, 35, 30, 0.13);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 2px 3px rgba(44, 18, 20, 0.14), 0 22px 44px -18px rgba(44, 18, 20, 0.5); -webkit-backdrop-filter: blur(16px) saturate(1.25); backdrop-filter: blur(16px) saturate(1.25); white-space: nowrap; z-index: 3; }}
    .wk-chip b {{ font-weight: 600; font-size: 46px; color: #470b15; }}
    .wk-chip span {{ margin-left: 18px; font-family: Inter, sans-serif; font-weight: 500; font-size: 28px; color: #28231e; }}

    /* watch */
    #wk-watch .wk-word {{ top: 640px; }}
    #wk-watch .wk-fig {{ top: 830px; }}
    #wk-wall {{ position: absolute; left: 690px; top: 110px; display: grid; grid-template-columns: repeat(3, 340px); gap: 20px; }}
    .wk-thumb {{ width: 340px; height: 191px; object-fit: cover; display: block; border-radius: 14px; border: 1px solid rgba(40, 35, 30, 0.14); box-shadow: 0 1px 1px rgba(44, 18, 20, 0.14), 0 10px 22px -8px rgba(44, 18, 20, 0.4); }}

    /* read: eight essays as cards in space */
    #rd-stage {{ position: absolute; inset: 0; perspective: 1700px; perspective-origin: 51% 58%; }}
    #rd-ring {{ position: absolute; left: 980px; top: 660px; width: 0; height: 0; transform-style: preserve-3d; }}
    .rd-arm {{ position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; }}
    /* the home's essay card (globals.css .essay): rounded, the post's cover, its date, title and byline */
    .rd-card {{ position: absolute; left: -220px; top: -150px; width: 440px; height: 300px; padding: 18px; border-radius: 22px; background: #fbf7e9; border: 1px solid rgba(40, 35, 30, 0.13);
      box-shadow: 0 2px 3px rgba(44, 18, 20, 0.14), 0 22px 44px -18px rgba(44, 18, 20, 0.48); backface-visibility: hidden; display: grid; grid-template-columns: 122px minmax(0, 1fr); gap: 0 20px; align-items: start; }}
    .rd-cover {{ display: block; width: 122px; height: 152px; overflow: hidden; border-radius: 8px; border: 1px solid rgba(40, 35, 30, 0.16); box-shadow: 0 1px 1px rgba(44, 18, 20, 0.14), 0 6px 14px -6px rgba(44, 18, 20, 0.3); }}
    .rd-cover img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
    .rd-text {{ display: grid; gap: 8px; align-content: start; }}
    .rd-k {{ font-family: "IBM Plex Mono", monospace; font-size: 20px; color: #6a625a; }}
    /* the clamp clips at the box: a little padding keeps the last line's descenders, not the next line */
    .rd-card h3 {{ font-weight: 600; font-size: 30px; line-height: 1.08; color: #28231e; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; padding-bottom: 0.06em; }}
    .rd-by {{ font-family: Inter, sans-serif; font-weight: 500; font-size: 19px; line-height: 1.3; color: #6a625a; }}
    #wk-read .wk-word, #wk-read .wk-fig {{ z-index: 2; }}

    /* the archive: its own page, the camera over it; then a work's page, whipped in */
    #ar-world {{ position: absolute; left: 0; top: 0; width: {ARCH["w"]}px; height: {ARCH["h"]}px; transform-origin: 0 0; }}
    #ar-world > img, #ar-work > img {{ position: absolute; inset: 0; width: 100%; height: 100%; display: block; }}
    #ar-work {{ position: absolute; left: 0; top: 0; width: {WORK["w"]}px; height: {WORK["h"]}px; transform-origin: 0 0; z-index: 1; }}
    #wk-archive .wk-word, #wk-archive .wk-fig, #wk-archive .wk-slab {{ z-index: 2; }}

    /* the Atlas: the app itself, as it runs (a video of our own engine, the page's glass around it) */
    #wk-atlas {{ background: transparent; }}
    /* its chip sits at the top, over the dark above the planet: the year card keeps its corner */
    #at-chip {{ left: 50%; top: 104px; translate: -50% 0; }}
    #at-app {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: block; object-fit: cover; transform-origin: 50% 46%; background: #17130f; }}

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

    <div id="wk-archive" class="wk-shot clip" data-start="{C0}" data-duration="{round(A0 - C0, 4)}">
      <div id="ar-world"><img src="assets/img/site/{ARCH["file"]}" alt="" /></div>
      <div id="ar-work"><img src="assets/img/site/{WORK["file"]}" alt="" /></div>
      <div class="wk-slab" id="ar-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>archive</span></p>
      <p class="wk-fig" style="top: 250px">The primary sources of Hispanic thought</p>
      <p class="wk-chip" id="ar-chip"><b>The archive</b><span>the primary sources of Hispanic thought</span></p>
    </div>

    <!-- the app, timed by itself (a timed video must not sit in a timed wrapper): under its shot -->
    <video id="at-app" class="clip" src="assets/atlas/{APP["file"]}" muted playsinline data-start="{AV0}" data-duration="{AVD}"></video>
    <div id="wk-atlas" class="wk-shot clip" data-start="{A0}" data-duration="{round(K0 - A0, 4)}">
      <div class="wk-slab" id="at-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>Atlas</span></p>
      <p class="wk-fig" style="top: 250px">An interactive globe, 218 BCE to today</p>
      <p class="wk-chip" id="at-chip"><b>The Atlas</b><span>218 BCE to today</span></p>
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

      // THE ARCHIVE: close on the collection's title, down into its first era, its cards one under
      // another; on the beat a work's page whips in (its article), and the camera reads down it
      arrive("#wk-archive .wk-word", {C0}, 510, 383); fig("#wk-archive", {C0} + 0.8 * B);
      const AR = {json.dumps(ARCH["cam"])}, WK = {json.dumps(WORK["cam"])};
      move("#ar-world", cam(...AR[0]), cam(...AR[1]), {C0}, 1.0, "power1.inOut", true);
      move("#ar-world", cam(...AR[1]), cam(...AR[2]), {C0} + 1.0, 1.3, "power2.inOut");
      move("#ar-world", cam(...AR[2]), cam(...AR[3]), {C0} + 2.3, {round(WORK["at"] - 2.3, 3)}, "none");
      const wt = {C0} + {WORK["at"]};
      tl.set("#ar-work", {{ autoAlpha: 0 }}, {C0});
      tl.set("#ar-work", {{ autoAlpha: 1 }}, wt);
      tl.fromTo("#ar-work img", {{ x: 300, filter: "blur(18px)" }}, {{ x: 0, filter: "blur(0px)", duration: 0.16, ease: "power3.out" }}, wt);
      move("#ar-work", cam(...WK[0]), cam(...WK[1]), wt, {round(A0 - C0 - WORK["at"], 3)}, "power1.out", true);
      tl.fromTo("#ar-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {C0});
      const toChip = (id, slab, chip, t) => {{
        tl.fromTo(id + " .wk-word, " + id + " .wk-fig", {{ opacity: 1, filter: "blur(0px)" }}, {{ opacity: 0, filter: "blur(8px)", duration: 0.18, immediateRender: false }}, t);
        tl.fromTo(slab, {{ opacity: 0.94 }}, {{ opacity: 0, duration: 0.25, immediateRender: false }}, t);
        tl.fromTo(chip, {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "expo.out" }}, t + 0.1);
      }};
      toChip("#wk-archive", "#ar-slab", "#ar-chip", {C0} + 1.05);

      // THE ATLAS: the app as it runs, the story flying from stop to stop; the camera eases back
      arrive("#wk-atlas .wk-word", {A0}, 515, 383); fig("#wk-atlas", {A0} + 0.8 * B);
      tl.fromTo("#at-app", {{ scale: 1.14 }}, {{ scale: 1.0, duration: {round(K0 - A0, 3)}, ease: "power2.out" }}, {A0});
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
      const outgoing = ["#wk-watch", "#wk-read", "#wk-archive", "#wk-atlas, #at-app", "#wk-books"];
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
OUT.write_text(page, encoding="utf-8")
print("wrote", OUT, "duration", END)
