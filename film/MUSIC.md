# The reel's music

The music comes first; the film is cut to it (the method in
gulipad.com/writings/mila-launch-video).

## The track we use

`film/reel/assets/audio/music.mp3`: ElevenLabs Music, 2026-10-22, made from the brief below.
It is 78 s long with 3.8 s of silence before the first note and 2.8 s after the last, and it
did not keep the grid we asked for, so the film was re-cut to the track as it is (measured with
librosa: onsets, low-band hits, harmonic/percussive energy, chords).

- Pulse about 75 BPM (a quarter is ~0.80 s, the eighths at ~0.40 s carry the rhythm); the
  guitar intro is played freely.
- **Video time = track time − 3.80 s.** The film is 71.4 s, the length of the music.

| video s | track s | the music | the picture |
| --- | --- | --- | --- |
| 0.02 | 3.82 | the guitar begins | "One civilization," letter by letter |
| 4.33 | 8.13 | second guitar phrase | the map pulls back to four continents |
| 7.92 | 11.72 | third phrase | Beltrán: "To know who we are…" |
| 11.52 | 15.32 | fourth phrase | the mosaic of him, faster and faster |
| 15.44 | 19.24 | a low hit; the bass leaves, soft section | montage: "Mexico was not destroyed in 1521…", "Cowboys are Hispanic." |
| 22.24 | 26.04 | a hit, then the music almost stops | "Hispanic," stamped; then "War, law, love, and faith" in the near-silence |
| 28.63 | 32.43 | the beat comes back, a long rise on A | the three pillars, one painting each |
| 35.44 | 39.24 | the rise peaks | the portico; the camera dives into "Watch" |
| 38.16 | 41.96 | **the drop** (D) | Watch |
| 41.21 / 43.59 | 45.01 / 47.39 | hits (43.59 is the biggest) | Read; its ring of essays folds on 43.59 |
| 46.23 | 50.03 | hit | the canon |
| 51.73 | 55.53 | hit | the Atlas |
| 57.34 | 61.14 | **the climax** (back on D) | De Indiis Editions |
| 60.67 | 64.47 | hit | "Join the argument." |
| 62.27 · 63.74 · 64.54 · 65.33 | 66.07 · 67.54 · 68.34 · 69.13 | the breakdown's hits | 13.5K · 19K · 22K · 587 |
| 66.14 | 69.94 | **the last hit**, two more and the final chord (71.56) | the eagle, the name, hispanostudies.com |
| 71.40 | 75.20 | silence | end (the page loops it) |

Every shot change in the works is preceded by the frieze sweep (0.78 s before the hit).

## The mix

`film/tools/mix-reel.py <render> <out>` lays the music under the render: Beltrán's voice
comes from the render itself (his clips), the music dips up to 9 dB under it, and the sound
effects (earshot's bank, MIT) sit on their frames, listed in the script's `CUES` table. The
mix is normalised to −14 LUFS, peaks under −1.5 dBTP. Change a scene's timing, change its cues.

## The brief it was made from

### The idea: La Folía, rebuilt

**La Folía** is the Iberian ground: a chord sequence born in Portugal and Spain in the late
1400s that Corelli, Vivaldi, Handel and Rachmaninoff all took up. It is the most
recognisably Hispanic piece of music that is not a cliché (no flamenco "¡olé!", no mariachi),
it belongs to the same centuries IHS writes about, and it is in the public domain.

The track keeps the Folía's harmony and character (stately, minor, a little defiant) and
dresses it in the language of motion-design reels: a tight modern beat, deep sub hits on the
cuts, clean stops before the drops, short and punchy. Old bones, new muscle: which is what
the Institute is.

Harmony (one chord per bar, D minor):

    | Dm | A  | Dm | C  | F  | C  | Dm | A  |    first half ends open (on A)
    | Dm | A  | Dm | C  | F  | C  | Dm A | Dm |  second half closes (on Dm)

### Spec

- **Length**: 66.4 s, 31 bars (it has to land on the logo, then ring out).
- **Tempo**: 112 BPM, 4/4. A bar is 2.143 s; the Folía is 8 bars (17.1 s).
- **Key**: D minor.
- **No vocals, no choir syllables.** Beltrán's own voice goes on top in two places.
- **Instruments**: Spanish baroque guitar (rasgueado strums and single plucked lines),
  plucked harpsichord or a dry plucked synth, low strings (cellos, basses) playing short
  stabs; tight modern drums (punchy kick, snap clap, palmas, cajón, closed hats); a clean
  sub bass that hits on the downbeats; one big low impact on each drop.
- **Mix**: dry and close, not a cathedral. Loud but not squashed (−14 LUFS integrated for the
  web; peaks below −1 dBTP).
- **Avoid**: EDM supersaws, trap hi-hat rolls, "epic trailer" choirs and braams, flamenco
  vocals and "olé", mariachi trumpets, castanets as a gag, lo-fi vinyl crackle.

### The beat grid we asked for (the track did not keep it)

| bars | time | section | music | picture |
| --- | --- | --- | --- | --- |
| 1–4 | 0.00–8.57 | **Intro** | solo baroque guitar: the Folía's first half, played freely; a soft sub swell under bar 4 | the name, built letter by letter; the eagle's stepped wings |
| 5–8 | 8.57–17.14 | **Build** | palmas and a muted kick join; strings stab on every downbeat; a riser through bar 8; **full stop on the last beat** (silence 0.5 s) | first glimpses of Beltrán, faster and faster |
| 9–16 | 17.14–34.29 | **Drop 1** | the whole kit and the sub; guitar rasgueado on the offbeats; cellos play the Folía bass line | the montage: Beltrán to camera, his openings, the maps and paintings, one cut per beat at its peak |
| 17–20 | 34.29–42.86 | **Break** | half time: only strings holding the chords, a soft pulse, space | the three pillars, one bar each: MESTIZAJE · CATOLICISMO · LENGUA, and one line of Beltrán's own voice |
| 21–29 | 42.86–62.14 | **Drop 2** | everything back, a touch bigger (a second guitar, higher strings); the last bar builds | what IHS makes: the channel (1 bar), the essays (2), the canon (2), the Atlas (2), the books (1), the followings (1); between each, the portico's frieze sweeps in (0.8 s before the change) and the camera dives into the next metope on the downbeat |
| 30–31 | 62.14–66.43 | **Lockup** | one clean hit on the downbeat of bar 30 (low impact + a final Dm chord), then it rings out | the IHS logo and the name; silence by 66.4 s |

The key sync points: **8.57** (build starts), **17.14** (drop 1), **34.29** (break),
**42.86** (drop 2), **62.14** (logo hit).

Inside drop 2 the picture changes on the downbeats of bars 22, 24, 26, 28 and 29 (**45.00,
49.29, 53.57, 57.86, 60.00**), each preceded by a frieze sweep that starts 0.78 s earlier. These
get a whoosh into a soft low thump from earshot; the music only needs to keep its downbeats
clear there (no fills that smear across them).

### Making it

Generate 3–4 takes, put them in `~/Descargas`, and say their names. Each one is measured
(tempo, where the drops and the final hit land, loudness) and the best fit is chosen; the
edit is then re-timed to it.

#### ElevenLabs Music (composition plan, preferred)

ElevenLabs lets each section have its own length and styles, which is what the grid needs.
Global styles: `instrumental, 112 bpm, D minor, La Folia chord progression, Spanish baroque
guitar, modern cinematic percussion, punchy kick, palmas, cajon, deep sub bass, short low
string stabs, dry close mix, motion design showreel`. Negative global styles: `vocals,
choir, EDM supersaw, trap hi-hats, trailer braams, flamenco singing, mariachi, lo-fi`.

| section | length | styles | negative |
| --- | --- | --- | --- |
| Intro | 8.6 s | solo Spanish baroque guitar playing La Folia, free, intimate, soft sub swell at the end | drums |
| Build | 8.6 s | palmas, muted kick on every beat, low string stabs on downbeats, rising tension, riser, hard stop with half a second of silence at the end | |
| Drop 1 | 17.1 s | full modern beat, punchy kick and sub on downbeats, guitar rasgueado on offbeats, cellos playing the La Folia bass line, driving, confident | |
| Break | 8.6 s | half time, sustained strings only, soft pulse, spacious, room for a spoken voice | drums, kick |
| Drop 2 | 19.3 s | full beat returns bigger, two guitars, higher strings, builds in the last bar | |
| Lockup | 4.3 s | one big low impact and a final D minor chord, then ring out to silence | drums after the hit |

The same as one prompt, for the plain text box:

> Instrumental motion-design showreel track, exactly 66 seconds, 112 BPM, D minor, built on
> the La Folía chord progression (Dm A Dm C F C Dm A). 0–8 s: solo Spanish baroque guitar
> plays the Folía, intimate. 8–17 s: palmas and a muted kick join, low string stabs on the
> downbeats, a riser, then a hard stop. 17 s: the drop: punchy modern beat, deep sub bass on
> the downbeats, cajón, guitar rasgueado on the offbeats, cellos on the Folía bass line.
> 34–43 s: half-time break, strings only, spacious. 43–62 s: the beat returns bigger. 62 s: one
> big low hit and a final D minor chord ringing out to silence at 66 s. Dry, close, confident.
> No vocals, no choir, no EDM supersaws, no trailer braams, no flamenco singing.

#### Suno (if ElevenLabs does not land the structure)

Style: `instrumental, La Folia, Spanish baroque guitar, modern cinematic beat, palmas, cajon,
sub bass, string stabs, 112 bpm, D minor, motion design`. Exclude: `vocals, choir, edm,
trap`. Lyrics field (structure tags only, no words): `[Intro: solo guitar] [Build] [Stop]
[Drop] [Break: strings only] [Drop] [Final hit] [End]`.

## Rights

The Folía as a composition is public domain. The recording is whatever the generator makes:
use a plan that grants commercial use (ElevenLabs paid plans; Suno Pro or Premier), and log
the final track in `assets/art/SOURCES.md` with the tool, the plan, the date and the prompt.
Sound effects come from earshot's code-made bank (MIT, github.com/Leonxlnx/earshot).
