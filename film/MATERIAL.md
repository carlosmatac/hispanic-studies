# Raw material for the IHS reel: Beltrán's own videos

Catalogue of the 29 videos listed in `site/lib/content.ts` (6 long `VIDEOS`, 23 `SHORTS`), built to make picking fragments fast.
Everything lives in `film/media/beltran/`, which is git-ignored. The scripts are in `film/tools/`.

**Read this before cutting**
- **All times are seconds in the local file.** Proxies keep the source timing, so the same numbers work on a high-quality re-fetch.
- **The local files are proxies.** Long videos are 480p (3LYcIzK8mxo is 720p) and Shorts are 480–1080 px wide. To make the final cut, fetch only the segments you use, at full quality:
  ```bash
  ~/.venvs/film/bin/yt-dlp --js-runtimes node:$(which node) -S "res:1080,vcodec:h264,acodec:m4a" \
    --download-sections "*318.5-324" --force-keyframes-at-cuts \
    -o "film/media/beltran/hq/%(id)s-%(section_start)s.%(ext)s" -- 3LYcIzK8mxo
  ```
- **Transcripts were made locally, not taken from YouTube.** YouTube returned HTTP 429 for every subtitle request (three different clients). The transcripts come from Whisper `small.en` (`film/tools/transcribe.py`), with word-level timings in `<id>.words.tsv`. Every quote below is quoted exactly from those transcripts. Common words are reliable, but **Spanish proper names come out garbled** ("Denóstitlan", "Sheimbaum", "Theota" = Ceuta, "Leias de Indias"). Check a line by ear before setting it as on-screen type.
- In/out points come from the word timings, padded by −0.10 s and +0.15 s (`film/tools/findline.py`). Each one was cross-checked against the scene-cut list and against a still frame.

## Files per video (`film/media/beltran/`)

| file | what |
| --- | --- |
| `<id>.mp4` | proxy video |
| `<id>.txt` / `<id>.words.tsv` | transcript `[mm:ss.s] text` / word timings `start end word` |
| `<id>.head.txt` | long videos only: the first 240 s, transcribed first so the openings were ready quickly |
| `<id>-sheet-NN.jpg` | contact sheets with timecode on each frame: 16:9 at one frame per 4 s, Shorts at one frame per 1.5 s |
| `<id>-overview-NN.jpg` | long videos only: one frame per 15 s |
| `<id>-cuts.txt` | scene cuts in seconds (`scene > 0.3`) |
| `<id>.info.json` | id, title, duration, size, fps, upload date |

**Transcript status.** All 23 Shorts are fully transcribed, and so is 3LYcIzK8mxo. The other 5 long videos have the first 4 minutes (`.head.txt`). Their full transcription was still running in the background when this was written and writes `<id>.txt` when it finishes. To rerun it: `cd film/media/beltran && ~/.venvs/film/bin/python -I ../../tools/transcribe.py <id>.mp4`.

---

## Overview: how Beltrán looks on screen

**He always talks straight to camera, at chest or mid-shot,** holding a small handheld mic or recorder that shows in most frames. He gestures a lot with both hands, which reads well even in 1-second cuts. Lighting is warm and practical-looking, with soft key light and a darker background. There are no studio backdrops and no on-screen logo while he talks.

**Sets** (useful for matching looks across cuts):

| look | where | notes |
| --- | --- | --- |
| **Colourful abstract painting** behind him (red, blue, green), plants, wooden sideboard; blue armchair or orange leather chair | long: BISc6y6fIuM, NJKfmnwbOXQ, Xinb9TN9aOM, JNLr7NM_buA; Shorts: mMXKN9nTeMo, F2ownKA80Ug, o-dErW9X2P0, xvZouT3m_q4, AmmDHiD7MPI | **The most polished look.** Outfits: navy blazer with open white shirt (JNLr, mMXK, F2ow); black shirt with bolo tie (BISc, o-dEr); black tee (NJKf, xvZo, AmmD); Mexico football shirt (Xinb). The colourful background clashes a little with our burgundy/paper palette, so grade it down or duotone it. |
| **Dim study**: orange leather chair, framed colonial painting of three figures (looks like *Los mulatos de Esmeraldas*), plants, bookshelf | 3LYcIzK8mxo | Light-green linen shirt over a white tank. Low-key and moody; the warmest look and the closest to the brand. |
| **Bookshelf + gaming chair**, warm lamp | Shorts: XnwLiEsrPdA, X2pDJsl6Xp0, 35z7XHXk5W8, urUxytVc2Zc, SPIvTx33sOk, w0t-IC2yi20, N9-_qD9BvXY, lwJfzpmMTD8 | Linen or striped shirts and Mexico jerseys. Warm and cosy; home-made feel. |
| **Brick wall**, outdoors or patio | in8ZZBfXXlo (**black "HISPANOAMÉRICA" tee**), TwMFI684Wcc, tBq7cuILmbE, 8v0CMVYXJpE, mszCuwwTb9c | Flat daylight. |
| **Bright white room**, blue and white curtains | 2RMoqe-pz8o, G1s13iY9Rrc, ZJaNB5HJudU, PeOALq5v0zY | High-key daylight, the cleanest skin tones. Navy tee, black tank top, or grey shirt. |
| **Outdoor veranda**, daylight | 5Yug5P6lbCc | Light-blue shirt; airy and green. |

**Recurring visual language**
- **Inserts:** public-domain paintings (Habsburg portraits, conquest scenes, galleons, saints), historical maps, Wikipedia infobox screenshots, book covers and title pages, flags. In the Shorts they sit in the **top third of the vertical frame**, over his head. In the long videos they are small picture-in-picture insets at top-left, or full-frame.
- **Kinetic type:** the long videos open quotes with **collage "ransom-note" typography** made of cut paper letters (BISc 0–15 s, NJKf 52 s and 64 s, Xinb 0–4 s). Torn-paper transitions (BISc ~20 s, 3LYc ~4:30).
- **Channel ident:** a 20–25 s montage (Zapata/Chicano mural, NFWA "Huelga" placards, conquest paintings, a Zapatista on horseback, a bullfighter, skulls, the Virgin of Guadalupe, collage) that ends on a **logo: a sun with two eagle heads over a burgundy band, "INSTITUTE FOR HISPANIC AMERICAN STUDIES"**. That is the *old* name, so **don't use the logo in the reel without asking**. Timings are in the Openings section.
- **Third-party footage is common:** news clips (Sheinbaum speech, C-SPAN Rubio, AOC), fan phone videos, a Sopranos clip, memes. Positions are in the Inserts section; avoid all of it.

**Sources, resolution and aspect ratio**
- On YouTube the long videos are 1920×1080 at 30 fps (BISc6y6fIuM is 60 fps). The local proxies are 854×480 at 30 fps (3LYc is 1280×720).
- The Shorts are 1080×1920 (9:16) at 30 fps (o-dErW9X2P0 is 60 fps; mMXK and AmmD are 29.97). Locally: 8 at 1080×1920, 7 at 720×1280, 8 at 480×854.
- **All Shorts have burnt-in captions** that can't be removed, in one of two styles:
  - **EN white + ES yellow** sentence captions at roughly 55–70 % of frame height (the bookshelf, brick and white-room Shorts).
  - **CapCut-style word-by-word** captions (white with green/yellow keywords) at roughly 60–75 % height (the colourful-painting Shorts).
- **Using Shorts in a 16:9 reel:** they work well as **vertical panels**, either 1–3 side by side or one panel next to kinetic type. His face sits at about 25–50 % of frame height:
  - A tight crop (top ~55 % of the frame, 9:8-ish) loses the captions but often keeps the top-third insert.
  - A crop between y ≈ 20 % and 55 % gives a clean face crop on most Shorts.
  - Full-width 16:9 crops from 1080-wide Shorts end up ~600 px tall, which is soft.
  - Exception: **o-dErW9X2P0 19.5–47 s is a 16:9 wide shot letterboxed into the Short** (blurred pad top and bottom).
- **The only caption-free talking head is in the long videos.** Use those for any full-frame 16:9 face shots.

---

## Talking-head moments (best 28)

Ranked roughly by how well they would land in a fast cut. "Clean" means no insert; Shorts always carry their burnt-in captions.

| # | id | in | out | he says (verbatim) | why |
| --- | --- | --- | --- | --- | --- |
| 1 | 3LYcIzK8mxo | 318.74 | 323.71 | "Mexico was not destroyed in 1521, it was born." | Thesis-level line, clean 16:9, dim study, leaning in with both hands. |
| 2 | 3LYcIzK8mxo | 888.46 | 893.51 | "a mestizo nation built by war, law, love, and faith." | Rhythmic four-beat list, perfect to cut to music. Clean. |
| 3 | 3LYcIzK8mxo | 859.56 | 862.99 | "To know who we are, we must know where we come from." | Mission-statement line, direct look. Clean. |
| 4 | o-dErW9X2P0 | 47.78 | 49.43 | "Cowboys are Hispanic." | Tight close-up, black shirt and bolo, strong look; 1.6 s. CapCut captions. |
| 5 | in8ZZBfXXlo | 58.08 | 61.09 | "You can buy comfort, but you cannot buy roots." | Wears the **HISPANOAMÉRICA** tee; brick wall; hands framing the line. |
| 6 | lwJfzpmMTD8 | 159.54 | 164.61 | "We are not the guilty heirs of an empire. We are the unapologetic product of one." | Composited over a night festival with Cross of Burgundy flags waving behind him: spectacular (but the festival plate is third-party). Splits at 162.05. |
| 7 | 3LYcIzK8mxo | 51.14 | 55.65 | "It is a defense of historical truth. Let's set the record straight." | Out at 55.65, right before the ident cut at 55.70. "Let's set the record straight" alone runs 54.20–55.65. Clean. |
| 8 | xvZouT3m_q4 | 52.42 | 62.03 | "That combination of soaring mysticism and total earthly practicality is profoundly Catholic." | The most cinematic close-up (shallow focus, painting bokeh). Long; "is profoundly Catholic" alone runs 59.14–62.03. |
| 9 | BISc6y6fIuM | 82.48 | 84.45 | "Here's the thing. They're both wrong." | Punchy two-beater, bolo tie. Clean (cut at 82.30, just before the in). |
| 10 | JNLr7NM_buA | 110.14 | 113.47 | "it was the burial of an old bargain." | Blazer look, steepled hands. Clean. |
| 11 | JNLr7NM_buA | 165.36 | 170.01 | "civilizational symbolism that doesn't ask for permission." | Defiant tone, fits the IHS register. Clean. |
| 12 | NJKfmnwbOXQ | 113.44 | 115.69 | "Catholicism is in fashion." | Short, surprising, black tee. Clean (follows the ident ending at 111.0). |
| 13 | 2RMoqe-pz8o | 58.42 | 60.33 | "Spain's violence became metaphysical." | White room, the best daylight face; hands open. Captions. |
| 14 | 2RMoqe-pz8o | 168.66 | 173.41 | "Our ancestors left us a history to understand, not a confession to repeat." | Closing line of the Black Legend Short. A small image sits over his chest around 170–172; trim or crop. |
| 15 | ZJaNB5HJudU | 122.72 | 125.85 | "Spain built the New World by mixing worlds." | Black tank, white room, expressive hands. Conquest painting in the top third. |
| 16 | SPIvTx33sOk | 74.42 | 77.21 | "That's not conquest, that's conversion." | Mexico jersey, bookshelf; crisp antithesis. Small inset at top. |
| 17 | w0t-IC2yi20 | 19.06 | 21.65 | "So either way, Spain wins." | Grin and shrug. Clean apart from captions. |
| 18 | N9-_qD9BvXY | 43.16 | 44.79 | "Yes, you heard that right." | Reaction beat, very usable as a stinger. Clean apart from captions. |
| 19 | mszCuwwTb9c | 129.78 | 132.51 | "The collision was the inheritance." | Brick wall, blue shirt. Clean apart from captions. |
| 20 | o-dErW9X2P0 | 65.74 | 69.23 | "So far west, it became Eastern." | Same close-up as #4; works as a closer. |
| 21 | 3LYcIzK8mxo | 135.92 | 139.75 | "There was no Mexico before 1519." | Provocative fact line. Clean. |
| 22 | in8ZZBfXXlo | 45.64 | 48.95 | "Assimilation gave you access but cost you inheritance." | Same set as #5; hand gesture on "access / inheritance". |
| 23 | AmmDHiD7MPI | 20.40 | 21.15 | "Judas." | 0.75 s, one word, deadpan look to camera; a perfect hit point. |
| 24 | xvZouT3m_q4 | 21.36 | 25.19 | "Hold both the grand and the minute simultaneously." | Same cinematic close-up as #8. |
| 25 | 8v0CMVYXJpE | 65.52 | 69.41 | "we do not need more of Europe. We need more of ourselves." | White shirt, brick wall. Flag and text insets at the top; splits at 67.45. |
| 26 | XnwLiEsrPdA | 142.86 | 146.43 | "you need a world map to tell the story of Hispanic civilization." | **Ties directly to the site's map hero.** Bookshelf set; map insert at the top. |
| 27 | 5Yug5P6lbCc | 154.37 | 157.50 | "All of the Catholic world was trembling." | The daylight veranda look, which adds variety. Clean. |
| 28 | urUxytVc2Zc | 167.52 | 169.57 | "Hispanic, Hispanic, Hispanic, Hispanic," | A rhythmic chant (it runs ~167.5–170.8), made to cut on the beat. **The rest of this Short is abrasive (see the Inserts notes); use only this bit.** |

**Extras if you need more:**
- XnwLiEsrPdA 146.74–150.11: "Follow for the Hispanic history you were never taught in school." (his sign-off; also lwJfzpmMTD8 165.06–168.19)
- NJKfmnwbOXQ 137.42–140.01: "Something is clearly going on."
- BISc6y6fIuM 199.18–201.93: "what Hispanic civilization actually is,"
- JNLr7NM_buA 113.68–117.71: "You can be here, but only if you translate yourself,"
- 3LYcIzK8mxo 615.98–622.79: "Hispanic civilization is not a threat to Mexican identity, it is its source of strength."

---

## Quotable lines (for kinetic type or audio bites)

These are verbatim from the transcripts, with in/out in seconds. ★ marks lines that are 10 words or fewer.

**Hispanic world, synthesis, mestizaje**
- ★ "Mexico was not destroyed in 1521, it was born." 3LYcIzK8mxo 318.74–323.71
- ★ "a mestizo nation built by war, law, love, and faith." 3LYcIzK8mxo 888.46–893.51
- ★ "Spain built the New World by mixing worlds." ZJaNB5HJudU 122.72–125.85
- ★ "What appeared was a synthesis." ZJaNB5HJudU 35.94–37.79
- ★ "Spain gave birth to new peoples," ZJaNB5HJudU 76.60–78.67
- ★ "The collision was the inheritance." mszCuwwTb9c 129.78–132.51
- ★ "the synthesis is the inheritance." lwJfzpmMTD8 152.82–154.75, then "Both halves, together." 155.20–156.63
- ★ "because Hispanidad was never about race." lwJfzpmMTD8 105.06–107.61
- ★ "We are the heirs of a global civilization." X2pDJsl6Xp0 172.56–174.77
- ★ "We are not the guilty heirs of an empire." lwJfzpmMTD8 159.54–162.07 / ★ "We are the unapologetic product of one." 162.02–164.61
- "The civilization that produced you is the synthesis, both halves." SPIvTx33sOk 130.62–134.95
- ★ "To know who we are, we must know where we come from." 3LYcIzK8mxo 859.56–862.99

**300 years cut out of history**
- ★ "to delete 300 years of your heritage." X2pDJsl6Xp0 14.60–17.99
- ★ "They are the foundation of it." X2pDJsl6Xp0 158.78–160.45 (it follows "300 years of universities, hospitals, legal codes, …" at 152.12)
- ★ "Spain preserved indigenous languages for 300 years." N9-_qD9BvXY 0.00–3.11, then ★ "Independent Mexico erased them in a generation." 3.56–6.09
- ★ "There was no Mexico before 1519." 3LYcIzK8mxo 135.92–139.75

**Language**
- ★ "Nahuatl and Quechua had their own grammar before English." N9-_qD9BvXY 45.16–48.71
- ★ "The record is clear." mMXKN9nTeMo 0.00–1.01
- ★ "The United States is already bilingual and bicultural." F2ownKA80Ug 0.00–3.43 (cut at 0.03)
- ★ "You can buy comfort, but you cannot buy roots." in8ZZBfXXlo 58.08–61.09

**Catholicism**
- ★ "That's not conquest, that's conversion." SPIvTx33sOk 74.42–77.21
- ★ "Catholicism is in fashion." NJKfmnwbOXQ 113.44–115.69
- ★ "even in the absence of faith." NJKfmnwbOXQ 182.88–185.69
- "That combination of soaring mysticism and total earthly practicality is profoundly Catholic." xvZouT3m_q4 52.42–62.03

**The Black Legend**
- "Our ancestors left us a history to understand, not a confession to repeat." 2RMoqe-pz8o 168.66–173.41
- ★ "Spain's violence became metaphysical." 2RMoqe-pz8o 58.42–60.33
- ★ "simplicity travels faster than nuance" 2RMoqe-pz8o 101.34–104.09
- ★ "Propaganda doesn't have to invent every crime." 2RMoqe-pz8o 60.78–63.29

**The global empire, the map, the West**
- ★ "This flag gave birth to the modern world," XnwLiEsrPdA 0.00–2.47
- ★ "the first sustained global trading network." XnwLiEsrPdA 98.18–100.55
- ★ "you need a world map to tell the story of Hispanic civilization." XnwLiEsrPdA 142.86–146.43
- ★ "Cowboys are Hispanic." o-dErW9X2P0 47.78–49.43 / ★ "So far west, it became Eastern." 65.74–69.23
- ★ "we do not need more of Europe." 8v0CMVYXJpE 65.52–67.33 / ★ "We need more of ourselves." 67.60–69.41

**Sign-off:** ★ "Follow for the Hispanic history you were never taught in school." XnwLiEsrPdA 146.74–150.11

---

## Openings of the long videos

| id | 0 s → ~15 s | what follows |
| --- | --- | --- |
| **3LYcIzK8mxo** (There Was No Mexico Before Cortes) | Cold open to camera in the dim study: "On the 26th of July 2025, President Claudia Sheinbaum stood before the Mexican nation…" (0.0). Small top-left insets: a Zócalo photo captioned "very small crowd btw" (~4–9 s); the **1524 Cortés map of Tenochtitlan** (~12–15 s). | Hook ends "Let's set the record straight." 54.20–55.65, then the **channel ident** 55.7–77.7 (logo ~74.0–77.7). Sheinbaum speech clips follow from ~85 s (third-party). |
| **NJKfmnwbOXQ** (How to be Catholic If You Don't Believe in God) | Cold open with a joke, told to camera: "There's an old joke from Northern Ireland at the height of the Troubles." (0.2). Black tee, colourful painting; no graphics for the first ~25 s. | Collage text cards at ~52 s and ~64 s ("…how in hell am I supposed to believe…"). **Ident** 88.97–111.0 (logo ~107.3–111.0), then "Catholicism is in fashion." 113.44. |
| **Xinb9TN9aOM** (Why Mexico Keeps FAILING at the World Cup) | "Of all the things that matter least, football matters most." 0.00–5.27 (a Valdano quote, not Beltrán's own line) in **collage typography**; Mexico jersey, orange chair. A photo of Valdano in an Argentina shirt sits in a top-left inset ~4–14 s (third-party). | Fan phone videos as insets ~48–105 s (third-party). Ident probably ~158–187 (a dense run of cuts; not visually checked). |
| **5Yug5P6lbCc** (Spain vs. The False Messiah) | Dateline cold open: "Mantua, Italy, December 13th, 1532" 0–4.5, to camera on a **daylight veranda**, light-blue shirt. Story-hook narration to ~70 s. | Portrait insets (Solomon Molcho ~44 s, Charles V ~52 s, PD paintings). **Ident** ~78.7–102.9 (logo ~99.2–102.9). |
| **JNLr7NM_buA** (Assimilation Is OVER: Bad Bunny…) | Question hook to camera: "So, did the NFL just go woke? Or did it just go where the numbers are?" 0.0–5.9. Navy blazer, white shirt, orange chair. | Insets: Super Bowl LX logo ~16–26 s; Puerto Rico flags at the halftime show ~28–34 s; "ICE OUT" protest photos ~36–50 s (all third-party news/press). No ident in the first 2 min. |
| **BISc6y6fIuM** (The "Wild" West Was a LIE) | **Collage-type quote over him** 0–15: "America reversed the directions … its West is the edge of the East." (Deleuze & Guattari). Book cover inset ~16 s. Torn-paper transition ~20–22. | **C-SPAN clip of Rubio** 22.2–34.2 and **AOC clip** 47.5–~71 (both third-party; avoid). Beltrán back to camera from 82.3: "Here's the thing. They're both wrong." No ident in the first 2 min. |

**Shorts openings** all start cold on a hook line with a title graphic in the top third. The good ones for the reel:
- XnwLiEsrPdA: Cross of Burgundy flag, 0–~4 s
- PeOALq5v0zY: kinetic "SPAIN / IS" type, 0–1.5 s
- 2RMoqe-pz8o: "THE BLACK LEGEND" engraving title, 0–~5.5 s
- xvZouT3m_q4 and AmmDHiD7MPI: white title chip, 0–4 s

Several Shorts open on memes instead; skip those (X2pDJsl6Xp0, urUxytVc2Zc, in8ZZBfXXlo, ZJaNB5HJudU, G1s13iY9Rrc).

---

## Inserts / B-roll

Times for Shorts inserts are read from the 1.5 s contact sheets (±0.75 s), because the cut detector mostly misses changes confined to the top third. Refine them on the timeline.

**Beltrán's own graphics and public-domain art (preferred)**
| id | in–out | what |
| --- | --- | --- |
| XnwLiEsrPdA | ~0.0–4.3 | **Cross of Burgundy flag**, clean flat graphic (top third) |
| XnwLiEsrPdA | ~4.5–10.6 / ~54–61 | Spanish galleons at sea, painting |
| XnwLiEsrPdA | ~12–16 | map of the Burgundian lands with the Burgundy cross |
| XnwLiEsrPdA | ~18–25 | Juana of Castile / Philip the Handsome portraits; Ferdinand and Isabella; Charles V in armour (Wikipedia-card style) |
| XnwLiEsrPdA | ~39–50 | St Andrew icon, then the **Martyrdom of St Andrew** (X-shaped cross) |
| XnwLiEsrPdA | ~61–66 / ~87–99 | Allegory of evangelisation, painting; **"El imperio español en el siglo XVIII" route map** (~87–92); antique world map (~93–99) |
| XnwLiEsrPdA | ~66–76 | Tercios with Burgundy-cross banners, paintings; Lepanto/Tunis Wikipedia cards |
| lwJfzpmMTD8 | ~18–34 | Chuquisaca map + coat of arms; Burgundy-cross flag variants (~22.5–29); **Spanish & Portuguese empires map** (~30–34) |
| lwJfzpmMTD8 | ~34.5–40 | fortress with the Burgundy flag (Spanish fort photo) |
| N9-_qD9BvXY | ~27–43 | **Arte de la lengua mexicana / Quechua grammar title pages** (1547, 1560, 1586): beautiful printed title pages, public domain |
| N9-_qD9BvXY | ~49.5–52 | independence painting (mural-style) |
| PeOALq5v0zY | ~13–30 | maps of Spain + Ceuta/Melilla, Strait of Gibraltar; ~34.5–39 antique sea chart; ~55–58 Reconquista sequence maps |
| G1s13iY9Rrc / ZJaNB5HJudU | various | conquest and colonial paintings, engravings, "Settler vs. Conquistador" title art (G1s13 0–3 s, his own) |
| 3LYcIzK8mxo | ~12–15 | 1524 Cortés map of Tenochtitlan (inset) |
| BISc6y6fIuM | 0–15 | **collage "ransom-note" quote typography over Beltrán**: his own style, a reference for our kinetic type |
| NJKfmnwbOXQ | ~52, ~64 | more collage text cards (his own) |
| 3LYcIzK8mxo / NJKfmnwbOXQ / 5Yug5P6lbCc | 55.7–77.7 / 88.97–111.0 / 78.7–102.9 | **Channel ident montage + old "Institute for Hispanic American Studies" logo.** Mixed sources: Chicano-movement photos, mural, paintings, Zapatista photo. **Ask before use.** |

**Third-party: avoid**
- **3LYcIzK8mxo:** Claudia Sheinbaum speech footage (Mexican government broadcast), ~85–110, ~165–185, ~660–735 and more; a man in a suit, interview clip, ~4:45–5:05.
- **BISc6y6fIuM:** C-SPAN Marco Rubio 22.2–34.2; AOC news clip ("Power Hour") 47.5–~71.
- **35z7XHXk5W8:** *The Sopranos* clip ~8.4–15.2.
- **Xinb9TN9aOM:** fan phone videos ~48–105; football photos.
- **lwJfzpmMTD8:** Pujllay festival (Bolivia) night footage behind him 0–17.5 and ~146–168. Striking, but someone else's footage.
- **JNLr7NM_buA:** Super Bowl / Grammys press photos, ICE protest photos.
- **Memes and meme title cards:** X2pDJsl6Xp0 0–4.5 ("WE WUZ AZTECS"), urUxytVc2Zc 0–9 (incl. "I love big booty latinas"), in8ZZBfXXlo, ZJaNB5HJudU 0–4, SPIvTx33sOk, w0t-IC2yi20.
- **Whole videos to keep out of a brand reel:**
  - tBq7cuILmbE: Che / José Antonio / Franco / George Floyd / Palestine / Iran
  - F2ownKA80Ug: partisan politics ("democrat plantation", Trump)
  - urUxytVc2Zc: slurs ("brain slaves of the gringo plantation"), apart from the "Hispanic, Hispanic…" chant

---

## All 29 videos

Duration is in seconds. "Local" is the downloaded proxy; YouTube sources are 1080p (long videos 1920×1080, Shorts 1080×1920). Subs: **YouTube subtitles were blocked (429) for all 29**, so the column says whether we have a local Whisper transcript (full / head = first 240 s). On-camera % is a rough share of time Beltrán is visible talking; Shorts nearly always show him, often under a top-third insert.

| id | title | dur | local res | fps | transcript | on camera |
| --- | --- | --- | --- | --- | --- | --- |
| BISc6y6fIuM | The "Wild" West Was a LIE | 3377 | 854×480 | 30 (src 60) | head* | ~70 % |
| JNLr7NM_buA | Assimilation Is OVER: Bad Bunny and America's Spanish Future | 2498 | 854×480 | 30 | head* | ~80 % |
| 3LYcIzK8mxo | There Was No Mexico Before Cortes | 913 | 1280×720 | 30 | full | ~75 % |
| 5Yug5P6lbCc | Spain vs. The False Messiah: The Battle for the Holy Land (1532) | 2159 | 854×480 | 30 | head* | ~65 % |
| NJKfmnwbOXQ | How to be Catholic If You Don't Believe in God | 2031 | 854×480 | 30 | head* | ~90 % |
| Xinb9TN9aOM | Why Mexico Keeps FAILING at the World Cup | 2027 | 854×480 | 30 | head* | ~85 % (PiP inserts) |
| XnwLiEsrPdA | Cross of Burgundy: The Flag That Connected the World | 150 | 1080×1920 | 30 | full | ~100 % (inserts ~75 %) |
| mszCuwwTb9c | From Napoleon to Franco: The French Insult That Backfired | 177 | 480×854 | 30 | full | ~95 % |
| lwJfzpmMTD8 | Why are indigenous Bolivians waving a Spanish imperial flag? | 168 | 480×854 | 30 | full | ~95 % |
| w0t-IC2yi20 | Mexican Independence Day: You Can't Erase Spain From the Party | 152 | 480×854 | 30 | full | ~95 % |
| SPIvTx33sOk | Why Does Mexican Pride Put Spain on Trial? | 140 | 480×854 | 30 | full | ~95 % |
| MfZDgdXhLvM | Bad Bunny is doing more than just making hits… | 85 | 480×854 | 29.97 | full | ~80 % |
| 8v0CMVYXJpE | Why Unamuno Told Spain to Become More African | 174 | 480×854 | 30 | full | ~95 % |
| N9-_qD9BvXY | What Happened to Mexico's Indigenous Languages After Independence? | 169 | 480×854 | 30 | full | ~100 % |
| 35z7XHXk5W8 | "Columbus Didn't Discover America" Misses the Point | 164 | 1080×1920 | 30 | full | ~90 % |
| urUxytVc2Zc | LATINO vs. HISPANIC: Know the Difference | 178 | 1080×1920 | 30 | full | ~100 % |
| X2pDJsl6Xp0 | You Were Given a History With 300 Years Cut Out of It | 178 | 1080×1920 | 30 | full | ~95 % |
| G1s13iY9Rrc | Why Anglos Became Pioneers and Spaniards Became Conquistadors | 122 | 1080×1920 | 30 | full | ~100 % |
| 2RMoqe-pz8o | THE LIE THAT OUTLIVED THE EMPIRE \| SPAIN'S BLACK LEGEND | 174 | 1080×1920 | 30 | full | ~100 % |
| in8ZZBfXXlo | Too American for Mexico, Too Mexican for America | 179 | 1080×1920 | 30 | full | ~100 % |
| PeOALq5v0zY | The Bicontinental Spain Nobody Talks About | 179 | 1080×1920 | 30 | full | ~100 % |
| mMXKN9nTeMo | Indigenous languages survived because of Spain — not in spite of it. | 42 | 1080×1920 | 29.97 | full | 100 % (clean) |
| ZJaNB5HJudU | Spain Built the New World. England Rebuilt the Old. | 130 | 720×1280 | 30 | full | ~100 % |
| TwMFI684Wcc | Zapata's Revolution Began With Spanish Land Titles | 175 | 720×1280 | 30 | full | ~100 % |
| xvZouT3m_q4 | The Jesuit Secret for a Productive Day | 77 | 720×1280 | 30 | full | 100 % (clean) |
| tBq7cuILmbE | Why Martyrs Never Have to Govern \| Che Guevara & José Antonio | 176 | 720×1280 | 30 | full | ~100 % |
| F2ownKA80Ug | The New Kingmakers: Hispanics & The 2024 Shift | 61 | 720×1280 | 30 | full | 100 % (clean) |
| o-dErW9X2P0 | The West went so far West… it became the East. | 69 | 720×1280 | 60 | full | 100 % (clean) |
| AmmDHiD7MPI | Why the Church Spends Money on Art | 44 | 720×1280 | 29.97 | full | ~95 % (clean) |

\* full transcript in progress (`<id>.txt` will appear when done).
