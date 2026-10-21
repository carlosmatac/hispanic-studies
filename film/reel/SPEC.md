# SPEC: the Institute in one minute

```text
GOAL:    a stranger who lands on the site knows within a minute what IHS is (a Hispanic-world
         institute: Beltrán's channel, essays, a canon, an atlas, books) and wants to scroll on.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps, 60 s. Plays muted in a loop on the page (it must
         read without sound) and from the start with sound when someone presses play.
TIME:    60 s x 30 = 1800 frames. 112 BPM: a beat is 0.5357 s (16.07 f), a bar 2.1429 s.
         Scenes tile the bars: name 1–4, build 5–8, montage 9–16, pillars 17–20,
         works 21–26, lockup 27–28 (film/MUSIC.md).
LOOK:    the medium is the page itself, printed: paper #F9F3DD (exactly the site's ground, so
         the film melts into it), burgundy #470B15 as the one ink, ink #28231E for small type.
         Every picture (paintings, Beltrán's footage) goes through the duotone LUT
         (assets/luts/ihs-duotone.cube, film/tools/make-duotone-lut.py): burgundy shadows,
         paper whites, 12% grain. His own thumbnails stay in colour: they are the product.
         Display: Ibarra Real Nova 600 (the site's face), 150–220 px for hero words, -2.5%
         tracking; italic 500 for the quiet line. Body: Inter 500, 30–38 px.
OBJECTS: the IHS eagle (its stepped wings are the film's signature: they open in 7 steps
         and the scene changes are stepped wipes); the three pillars as columns holding up
         the name; book spines; a year axis with one dot per canon text and Atlas milestone.
MOTION:  arrivals expo.out 0.4–0.5 s; titles blur in per word (8 px → 0, 0.14 s) on the
         beat; wipes power3.in in, power3.out out; stepped reveals use steps(n).
         Hits are tl.set or steps, never eased.
SHOTS:   see the bar map in film/MUSIC.md; one layout change per bar.
BANNED:  dark void; glow, particles, gradients; mono caps labels and pill chips; every
         element fading and sliding up; titles drifting after they land; three cards in a
         row; the logo docked in a corner; any number or quote not from the source
         (site/lib/content.ts, site/data/, Beltrán's own words).
QA:      frame 0 is not empty; every read line holds 0.5 s + 0.3 s a word; text >= 28 px;
         paper in the encoded file within 2 levels of #F9F3DD.
```

## Status

- name, pillars, works, lockup: built.
- build, montage: drafts with his titles and thumbnails until the clips from
  `film/MATERIAL.md` are cut in.
- music: none yet (brief in `film/MUSIC.md`); timings follow the grid and are re-timed
  to the real track once it exists.
