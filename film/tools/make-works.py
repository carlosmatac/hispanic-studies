"""Write film/reel/compositions/works.html: "what the Institute makes", drop two
of the reel (bars 21-29). Everything on screen comes from the site's own data:

  - Watch: his real thumbnails (film/reel/assets/img/yt-*.jpg)
  - Read: the eight essays in site/lib/content.ts, as the home's essay cards (the post's
    cover, its date, author and translator), flying in 3D
  - The archive: covers of real works of the curated 80, coloured by region as on the site
    (film/reel/assets/archive.json, exported from the archive's database by
    film/tools/capture-site.mjs archive), fanned, sorted into the six eras, and one opened
    to its article (the article's own first lines)
  - The Atlas: the globe alone, rendered from our own engine (lib/atlas-globe.ts) by
    film/tools/capture-site.mjs atlas: the camera flies Iberia, the Atlantic, the Americas,
    Manila, the realms fill era by era and the voyages draw themselves; the year, the
    milestone cards and their pins are built here, on the places the render reports
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
ARCHIVE = json.loads((ROOT / "film/reel/assets/archive.json").read_text(encoding="utf-8"))
ATLAS_PINS = json.loads((ROOT / "film/reel/assets/atlas/atlas-pins.json").read_text(encoding="utf-8"))

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

# ---------------------------------------------------------------- the archive: covers, built here
WORKS = {w["id"]: w for w in ARCHIVE["works"]}
ERAS = ARCHIVE["eras"]
ROMAN = ["I", "II", "III", "IV", "V", "VI"]
# three covers an era (Beltrán's order inside it), the first twelve fanned when the shot opens
COLUMNS = [
    ["inter-caetera-1493", "vitoria-de-indis", "las-casas-tratado-comprobatorio"],
    ["sahagun-codice-florentino", "cortes-de-tomar", "garcilaso-comentarios-reales"],
    ["constitucion-cadiz", "T001", "T003"],
    ["T012", "T013", "T030"],
    ["T035", "T038", "T039"],
    ["T046", "cplp-declaracao-constitutiva", "durantez-iberofonia-paniberismo"],
]
FAN = ["inter-caetera-1493", "garcilaso-comentarios-reales", "T001", "cortes-de-tomar", "T013", "T012",
       "T039", "T030", "T035", "sahagun-codice-florentino", "T046", "durantez-iberofonia-paniberismo"]
OPEN = "T030"
ART = next(a for a in ARCHIVE["articles"] if a["id"] == OPEN)
CW2, CH2 = 210, 280
COLX = [260 + i * 280 for i in range(6)]


def first_sentence(t):
    t = " ".join(t.split())
    i = t.find(". ")
    return t[: i + 1] if 0 < i < 260 else t[:200].rsplit(" ", 1)[0] + "…"


def split_title(t):
    for sep in (" — ", ": ", " / "):
        i = t.find(sep)
        if i > 0:
            return t[:i]
    return t


def cover(w, extra="", pre="ac-"):
    t = split_title(w["title"])
    long = " is-long" if len(t) > 34 else ""
    fg = "#f9f3dd" if w["fg"] == "paper" else "#28231e"
    return (f'<div id="{pre}{w["id"]}" class="ac{extra}" style="--bg: {w["bg"]}; --fg: {fg}; --accent: {w["accent"]}; --line: {w["line"]}">'
            f'<p class="ac-top">{esc(w["date"] if len(w["date"]) < 12 else str(w["year"]))}</p>'
            f'<p class="ac-t{long}">{esc(t)}</p>'
            f'<p class="ac-foot"><i></i><b>{esc(w["author"])}</b></p></div>')


ar_cards = []
order = [wid for col in COLUMNS for wid in col]
for wid in order:
    ar_cards.append("        " + cover(WORKS[wid]))
eras_html = "\n".join(
    f'        <p id="ae-{i}" class="ae" style="left: {COLX[i] - 120}px"><b>{ROMAN[i]}</b><span>{e["from"]}–{e["to"]}</span></p>'
    for i, e in enumerate(ERAS))
ow = WORKS[OPEN]
article = f"""        <div id="aa-page">
          <p class="aa-k">{esc(str(ow["year"]))} · {esc(ow["author"])}</p>
          <p class="aa-t">{esc(split_title(ow["title"]))}</p>
          <div class="aa-s"><h4>The author or issuing body</h4><p>{esc(first_sentence(ART["aboutAuthor"]))}</p></div>
          <div class="aa-s"><h4>The work in its time</h4><p>{esc(first_sentence(ART["workInItsTime"]))}</p></div>
          <div class="aa-s"><h4>Why read it today?</h4><p>{esc(first_sentence(ART["whyReadToday"]))}</p></div>
        </div>"""
# where each cover goes: the fan (a hand of twelve around a pivot below the frame), then its era
fan_pos = {}
for i, wid in enumerate(FAN):
    a = (i - (len(FAN) - 1) / 2) * 6.2
    r = 980
    fan_pos[wid] = [round(1230 + r * math.sin(math.radians(a))), round(1580 - r * math.cos(math.radians(a))), round(a, 1)]
col_pos = {}
for c, col in enumerate(COLUMNS):
    for k, wid in enumerate(col):
        col_pos[wid] = [COLX[c], 610 + k * 66, round(((sum(map(ord, wid)) % 9) - 4) * 0.7, 1)]

# ---------------------------------------------------------------- the Atlas: the globe, rendered; the rest built here
FILM0 = 42.114              # where this scene starts in the film (index.html)
AV0 = round(ATLAS_PINS["first"] / 30 - 0.004 - FILM0, 4)
AVD = round(len(ATLAS_PINS["rows"]) / 30, 4)
# the milestone cards: real titles (site/data/milestones.json and the Atlas's stops), each on its place
# [id, pin, kicker, title, from, to (seconds into the shot), card offset from the pin]
AT_CARDS = [
    ["granada", "granada", "1492", "Granada enters the Castilian crown", 0.3, 1.25, [70, -40]],
    ["tordesillas", "tordesillas", "1494", "Treaty of Tordesillas", 1.72, 2.62, [64, -150]],
    ["lima", "lima", "1542", "The New Laws create the Viceroyalty of Peru", 2.52, 3.4, [70, -190]],
    ["manila", "manila", "1565–1571", "The Pacific crossing and Manila", 4.0, 9.0, [60, 40]],
    ["interior", "interior", "1776–1777", "The Bourbon reforms redraw the empire", 4.4, 9.0, [-590, -230]],
]
AT_YEARS = [[0.0, 1492], [1.6, 1494], [2.4, 1542], [3.2, 1565], [4.0, 1777]]
at_cards = []
for cid, pin, k, title, t0, t1, (dx, dy) in AT_CARDS:
    lx, ly = (dx, dy + 40) if dx > 0 else (dx + 520, dy + 40)
    at_cards.append(f"""      <div id="atc-{cid}" class="atc"><div class="atc-in">
        <svg class="atc-lead" viewBox="-800 -800 1600 1600"><path id="atl-{cid}" d="M0 0 L{lx} {ly}" pathLength="1" /></svg>
        <i class="atc-pin"></i>
        <article id="atk-{cid}" class="atc-card" style="left: {dx}px; top: {dy}px"><p class="atc-k">{esc(k)}</p><h3>{esc(title)}</h3></article>
      </div></div>""")
# per frame: the pin's place and how far it faces us [frame, x, y, cos] for each card
AT_TRACKS = {cid: [[r["f"], *r[pin]] for r in ATLAS_PINS["rows"]] for cid, pin, *_ in AT_CARDS}

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

    /* the archive: covers of the curated works, on burgundy, as the old canon cards were */
    #wk-archive {{ background: #470b15; background-image: radial-gradient(70% 80% at 60% 55%, rgba(139, 94, 75, 0.5), transparent 75%); }}
    #wk-archive .wk-slab {{ background: #470b15; }}
    #wk-archive .wk-word {{ color: #f9f3dd; z-index: 2; }}
    #wk-archive .wk-fig {{ color: #ede3c8; z-index: 2; }}
    #wk-archive .wk-slab {{ z-index: 2; }}
    #ar-deck {{ position: absolute; inset: 0; perspective: 1800px; }}
    .ac {{ --paper: #f9f3dd; --leather: #8b5e4b; --burgundy: #470b15; --ink: #28231e; --region-sea: #2a4d51; --region-olive: #4c5327;
      position: absolute; left: {-CW2 // 2}px; top: {-CH2 // 2}px; width: {CW2}px; height: {CH2}px; display: flex; flex-direction: column; gap: 9px; padding: 17px 16px 15px;
      background: var(--bg); color: var(--fg); border-radius: 8px; box-shadow: 0 3px 6px rgba(20, 6, 8, 0.28), 0 30px 50px -22px rgba(20, 6, 8, 0.8); backface-visibility: hidden; }}
    .ac::before {{ content: ""; position: absolute; inset: 7px; border: 1px solid var(--line); border-radius: 3px; }}
    .ac-top {{ font-family: "IBM Plex Mono", Consolas, monospace; font-weight: 500; font-size: 17px; color: var(--accent); }}
    .ac-t {{ font-style: italic; font-weight: 600; font-size: 27px; line-height: 1.07; }}
    .ac-t.is-long {{ font-size: 22px; line-height: 1.1; }}
    .ac-foot {{ margin-top: auto; display: grid; gap: 4px; font-family: Inter, sans-serif; }}
    .ac-foot i {{ display: block; width: 30px; height: 1.5px; background: var(--accent); margin-bottom: 7px; }}
    .ac-foot b {{ font-weight: 600; font-size: 13.5px; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.25; }}
    #ar-head {{ position: absolute; left: 0; right: 0; top: 150px; text-align: center; font-style: italic; font-weight: 600; font-size: 78px; line-height: 1; color: #f9f3dd; white-space: nowrap; }}
    #ar-head span {{ display: inline-block; }}
    .ae {{ position: absolute; top: 300px; width: 240px; text-align: center; color: #f9f3dd; }}
    .ae b {{ display: block; font-weight: 600; font-size: 54px; line-height: 1; }}
    .ae span {{ display: block; margin-top: 8px; font-family: "IBM Plex Mono", Consolas, monospace; font-size: 24px; color: #dcc8ad; }}
    #ar-veil {{ position: absolute; inset: 0; background: rgba(47, 7, 13, 0.82); opacity: 0; }}
    /* the opened work: its cover swings open on the article's first lines */
    #ar-book {{ position: absolute; left: 960px; top: 560px; width: 0; height: 0; perspective: 2200px; }}
    #aa-page {{ position: absolute; left: -380px; top: -330px; width: 760px; height: 660px; padding: 40px 48px; border-radius: 14px; background: #f9f3dd; color: #28231e;
      box-shadow: 0 4px 10px rgba(20, 6, 8, 0.35), 0 50px 90px -30px rgba(20, 6, 8, 0.85); opacity: 0; }}
    .aa-k {{ font-family: "IBM Plex Mono", Consolas, monospace; font-size: 26px; color: #470b15; }}
    .aa-t {{ margin: 8px 0 20px; font-style: italic; font-weight: 600; font-size: 52px; line-height: 1.02; color: #470b15; }}
    .aa-s {{ margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(40, 35, 30, 0.18); }}
    .aa-s h4 {{ font-weight: 600; font-size: 32px; line-height: 1.1; color: #28231e; }}
    .aa-s p {{ margin-top: 6px; font-family: Inter, sans-serif; font-weight: 500; font-size: 22px; line-height: 1.35; color: #5b534b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }}
    #ar-lid {{ position: absolute; left: -380px; top: -330px; width: 760px; height: 660px; transform-origin: 0 50%; transform-style: preserve-3d; }}
    #ar-lid .ac {{ left: 0; top: 0; width: 760px; height: 660px; padding: 40px 42px; gap: 16px; border-radius: 14px; }}
    #ar-lid .ac::before {{ inset: 14px; border-radius: 6px; }}
    #ar-lid .ac-top {{ font-size: 30px; }}
    #ar-lid .ac-t {{ font-size: 76px; }}
    #ar-lid .ac-foot b {{ font-size: 26px; }}
    #ar-lid .ac-foot i {{ width: 60px; height: 2px; }}

    /* the Atlas: the globe, rendered from our engine; the year, the cards and their pins built here */
    #wk-atlas {{ background: transparent; }}
    #at-globe {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: block; background: #17130f; }}
    #at-shade {{ position: absolute; inset: 0; background: linear-gradient(180deg, rgba(23, 19, 15, 0.78) 0%, rgba(23, 19, 15, 0) 38%), linear-gradient(0deg, rgba(23, 19, 15, 0.7) 0%, rgba(23, 19, 15, 0) 30%); }}
    #wk-atlas .wk-word {{ color: #f9f3dd; }}
    #wk-atlas .wk-fig {{ color: #ede3c8; }}
    #at-year {{ position: absolute; left: 120px; bottom: 60px; font-weight: 600; font-size: 230px; line-height: 0.9; letter-spacing: -0.03em; color: #f9f3dd; font-variant-numeric: lining-nums tabular-nums; text-shadow: 0 6px 40px rgba(23, 19, 15, 0.8); }}
    .atc, .atc-in {{ position: absolute; left: 0; top: 0; width: 0; height: 0; }}
    .atc-lead {{ position: absolute; left: -800px; top: -800px; width: 1600px; height: 1600px; overflow: visible; }}
    .atc-lead path {{ fill: none; stroke: #f9f3dd; stroke-width: 3; stroke-dasharray: 0.03 0.02; }}
    .atc-pin {{ position: absolute; left: -15px; top: -15px; width: 30px; height: 30px; border-radius: 50%; background: #470b15; border: 5px solid #f9f3dd; box-shadow: 0 0 0 3px #470b15, 0 4px 14px rgba(0, 0, 0, 0.5); }}
    .atc-card {{ position: absolute; width: 520px; padding: 22px 28px 26px; border-radius: 14px; background: #f9f3dd; border: 3px solid #28231e; outline: 2px solid #b5aa96; outline-offset: 7px; box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7); }}
    .atc-k {{ font-family: "IBM Plex Mono", Consolas, monospace; font-size: 26px; color: #470b15; margin-bottom: 8px; }}
    .atc-card h3 {{ font-weight: 600; font-size: 44px; line-height: 1.04; color: #28231e; }}

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
      <div id="ar-deck">
{chr(10).join(ar_cards)}
      </div>
      <p id="ar-head"><span>From</span> <span>Universal</span> <span>Monarchy</span> <span>to</span> <span>Iberofonía</span></p>
{eras_html}
      <div id="ar-veil"></div>
      <div id="ar-book">
{article}
        <div id="ar-lid">{cover(WORKS[OPEN], " ac--lid", "lid-")}</div>
      </div>
      <div class="wk-slab" id="ar-slab"></div>
      <p class="wk-word" style="font-size: 150px; top: 90px"><span>The</span> <span>archive</span></p>
      <p class="wk-fig" style="top: 250px">The primary sources of Hispanic thought</p>
      <p class="wk-chip" id="ar-chip"><b>The archive</b><span>the primary sources of Hispanic thought</span></p>
    </div>

    <!-- the globe, timed by itself (a timed video must not sit in a timed wrapper): under its shot -->
    <video id="at-globe" class="clip" src="assets/atlas/atlas-shot.mp4" muted playsinline data-start="{AV0}" data-duration="{AVD}"></video>
    <div id="wk-atlas" class="wk-shot clip" data-start="{A0}" data-duration="{round(K0 - A0, 4)}">
      <div id="at-shade"></div>
{chr(10).join(at_cards)}
      <p id="at-year">1492</p>
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

      // THE ARCHIVE: a hand of covers flies in and fans out; on the beat they sort into the six eras
      // under the collection's title; on the next, one comes forward and opens on its article
      arrive("#wk-archive .wk-word", {C0}, 510, 383); fig("#wk-archive", {C0} + 0.8 * B);
      tl.fromTo("#ar-slab", {{ opacity: 0.94 }}, {{ opacity: 0.94, duration: 0.01 }}, {C0});
      const toChip = (id, slab, chip, t) => {{
        tl.fromTo(id + " .wk-word, " + id + " .wk-fig", {{ opacity: 1, filter: "blur(0px)" }}, {{ opacity: 0, filter: "blur(8px)", duration: 0.18, immediateRender: false }}, t);
        if (slab) tl.fromTo(slab, {{ opacity: 0.94 }}, {{ opacity: 0, duration: 0.25, immediateRender: false }}, t);
        tl.fromTo(chip, {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "expo.out" }}, t + 0.1);
      }};
      toChip("#wk-archive", "#ar-slab", "#ar-chip", {C0} + 1.05);
      const FAN = {json.dumps(fan_pos)}, COL = {json.dumps(col_pos)}, ORDER = {json.dumps(order)};
      const SORT = {C0} + 1.6, OPEN = {C0} + 3.2;
      ORDER.forEach((id, i) => {{
        const el = "#ac-" + id, c = COL[id], f = FAN[id];
        if (f) {{
          // from off the frame, below and to the right, tumbling in; then a slow breath of the fan
          tl.fromTo(el, {{ x: 1500 + i * 60, y: 1500, rotation: 50 + i * 4, scale: 1.25, rotationY: -40 }}, {{ x: f[0], y: f[1], rotation: f[2], rotationY: 0, duration: 0.7, ease: "expo.out" }}, {C0} + 0.06 + i * 0.035);
          tl.to(el, {{ x: f[0] - 40, rotation: f[2] * 1.12, duration: SORT - ({C0} + 0.76 + i * 0.035), ease: "none" }}, {C0} + 0.76 + i * 0.035);
          tl.to(el, {{ x: c[0], y: c[1], rotation: c[2], scale: 1, duration: 0.75, ease: "power3.inOut" }}, SORT + i * 0.022);
        }} else {{
          tl.fromTo(el, {{ x: c[0] + 160, y: -320, rotation: -25, scale: 1 }}, {{ x: c[0], y: c[1], rotation: c[2], duration: 0.6, ease: "expo.out" }}, SORT + 0.2 + i * 0.022);
        }}
      }});
      // the collection's title, word by word, and the eras' numerals over their columns
      document.querySelectorAll("#ar-head span").forEach((el, i) => tl.fromTo(el, {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.14 }}, SORT + 0.25 + i * 0.09));
      tl.fromTo(".ae", {{ opacity: 0, y: -24 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "expo.out" }}, SORT + 0.45);
      // one work comes forward (its cover takes the place of the one in its column) and opens
      tl.set("#ar-book", {{ autoAlpha: 0 }}, {C0});
      tl.set("#ar-book", {{ autoAlpha: 1 }}, OPEN);
      tl.set("#ac-{OPEN}", {{ autoAlpha: 0 }}, OPEN);
      tl.fromTo("#ar-veil", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.35, ease: "power2.out" }}, OPEN);
      tl.fromTo("#ar-book", {{ x: COL["{OPEN}"][0] - 960, y: COL["{OPEN}"][1] - 560, scale: {CW2} / 760, rotation: COL["{OPEN}"][2] }}, {{ x: 0, y: 0, scale: 1, rotation: 0, duration: 0.5, ease: "expo.out" }}, OPEN);
      tl.set("#aa-page", {{ opacity: 1 }}, OPEN + 0.3);
      tl.fromTo("#ar-lid", {{ rotationY: 0 }}, {{ rotationY: -150, duration: 0.55, ease: "power2.inOut" }}, OPEN + 0.42);
      tl.fromTo("#aa-page > *", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.3, stagger: 0.09, ease: "expo.out" }}, OPEN + 0.62);
      tl.fromTo("#ar-head, .ae", {{ opacity: 1 }}, {{ opacity: 0.25, duration: 0.3, immediateRender: false }}, OPEN);

      // THE ATLAS: the globe flies (in the video); the year ticks, the cards land on their places
      arrive("#wk-atlas .wk-word", {A0}, 515, 383); fig("#wk-atlas", {A0} + 0.8 * B);
      toChip("#wk-atlas", null, "#at-chip", {A0} + 1.05);
      const YEARS = {json.dumps(AT_YEARS)};
      tl.set("#at-year", {{ textContent: YEARS[0][1] }}, {A0});
      tl.fromTo("#at-year", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }}, {A0} + 0.15);
      YEARS.slice(1).forEach(([t, y], i) => {{
        tl.fromTo("#at-year", {{ textContent: YEARS[i][1] }}, {{ textContent: y, snap: {{ textContent: 1 }}, duration: 0.3, ease: "steps(9)", immediateRender: false }}, {A0} + t - 0.05);
        tl.fromTo("#at-year", {{ scale: 1.08 }}, {{ scale: 1, duration: 0.3, ease: "expo.out", immediateRender: false }}, {A0} + t + 0.25);
      }});
      const CARDS = {json.dumps([[c[0], c[4], c[5]] for c in AT_CARDS])}, TRACK = {json.dumps(AT_TRACKS, separators=(",", ":"))};
      const F0FILM = {FILM0};
      CARDS.forEach(([id, t0, t1]) => {{
        const a = {A0} + t0, b = {A0} + t1;
        // the group rides on its place, frame by frame, and fades as the place turns away
        TRACK[id].forEach(([f, x, y, c]) => {{
          const t = f / 30 - F0FILM;
          if (t < a - 0.05 || t > b + 0.4) return;
          tl.set("#atc-" + id, {{ x, y, opacity: Math.max(0, Math.min(1, (c - 0.05) / 0.15)) }}, t - 0.002);
        }});
        tl.set("#atc-" + id + " .atc-in", {{ autoAlpha: 0 }}, {C0});
        tl.set("#atc-" + id + " .atc-in", {{ autoAlpha: 1 }}, a);
        tl.fromTo("#atc-" + id + " .atc-pin", {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2)" }}, a);
        tl.fromTo("#atl-" + id, {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.25, ease: "power2.out" }}, a + 0.05);
        tl.fromTo("#atk-" + id, {{ opacity: 0, y: 30, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "expo.out" }}, a + 0.12);
        if (t1 < 8) tl.to("#atc-" + id + " .atc-in", {{ autoAlpha: 0, duration: 0.25, ease: "power2.in" }}, b);
      }});

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
      const outgoing = ["#wk-watch", "#wk-read", "#wk-archive", "#wk-atlas, #at-globe", "#wk-books"];
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
