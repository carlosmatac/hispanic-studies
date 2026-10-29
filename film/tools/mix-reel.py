"""Mix the reel's sound and put it on the rendered picture.

    ~/.venvs/film/bin/python film/tools/mix-reel.py film/reel/renders/v4.mp4 film/reel/renders/v4-mix.mp4

Three layers:
  - the music (film/reel/assets/audio/music.mp3, ElevenLabs Music), trimmed so its first
    note lands on frame 0: video time = track time - OFFSET;
  - Beltrán's voice, which HyperFrames already put in the render (the clips that have
    data-has-audio); the music dips under it (a side-chain from the voice);
  - sound effects from earshot's code-made bank (MIT), each placed on the frame where
    its animation happens (the CUES table below, in video seconds).

The result is normalised to -14 LUFS, peaks under -1.5 dBTP, and muxed with the picture
copied as is. Needs ffmpeg and the earshot venv (~/.venvs/film).
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d, uniform_filter1d

ROOT = Path(__file__).resolve().parents[2]
MUSIC = ROOT / "film/reel/assets/audio/music.mp3"
CACHE = ROOT / "film/reel/renders/sfx"
EARSHOT = Path.home() / ".venvs/film/bin/earshot"
SR = 48000
OFFSET = 3.80          # the track's first note (3.82 s) lands on frame 0
# Beltrán's whole sentence about the pueblos mágicos (issue #67) needs 3.95 s more than the
# track gives: the soft section's Gm-Em-Dm phrase (video 16.86-20.81) plays twice. At LOOP_AT
# the music jumps back LOOP_LEN s (one phrase, 10 eighths, measured on the onsets: 3.948 s),
# just before an onset; everything after it lands LOOP_LEN later than in the track.
LOOP_AT, LOOP_LEN = 20.81, 3.95

# the narrator (film/VOICE.md): optional lines from ElevenLabs, placed when their files exist
NARRATOR = [("vo-claim.mp3", 0.0), ("vo-know.mp3", 7.92), ("vo-name.mp3", 70.15)]
NARRATOR_DB = -1.0

# his clips were recorded at different levels: lift the quiet ones (video s from, to, dB)
VOICE_LIFT = [(12.06, 23.785, 4.5),     # "See, we love our pueblos mágicos, … Spain built them."
              (23.785, 26.193, 3.0)]    # "Not one altarpiece came down."

# ------------------------------------------------------------------ the cues
# (video seconds, sound id, weight 0..1, extra render args). Times follow the scenes in
# film/reel/index.html and the hits measured in the track (film/MUSIC.md), + LOOP_LEN after LOOP_AT.
NAME, BUILD, MONT, PIL, WORKS, LOCK = 0.0, 7.916, 15.435, 32.58, 42.114, 70.087
R0, C0, A0, K0, F0 = (t + LOOP_LEN for t in (41.206, 46.229, 51.725, 57.337, 60.667))   # works shots
TEMPLE, TQ = PIL + 6.81, (9.534 - 6.81) / 4
TILES = [3.604, 4.204, 4.754, 5.254, 5.704, 6.104, 6.454, 6.754]
CUES = []
# the music is dense: whooshes need more level than taps to be heard under it
FAMILY = {"whoosh": 2.0, "swipe": 2.0, "swish": 2.0, "pro_shimmer": 2.5, "fit": 1.6, "tap": 1.6, "pro_pop": 1.4}
def cue(t, sid, w, *args, apex=None):
    """A sound whose loudest moment (apex, for the whooshes) lands on t."""
    fam = sid.split("/")[0]
    w *= next((v for k, v in FAMILY.items() if fam.startswith(k)), 1.0)
    CUES.append((t, sid, w, args, apex))

# the name: the map pulls back, the continents print, the paper steps sweep in
cue(NAME + 4.326 + 0.55, "whoosh_big/swell", 0.30, "--dur", "1.4", "--apex", "0.55", apex=0.55)
for i in range(4):
    cue(NAME + 5.876 + 0.4 * i, "pro_tap/soft", 0.22)
cue(NAME + 7.70, "swipe/paper", 0.40, "--dur", "0.6", "--apex", "0.25", apex=0.25)
# the build: Ortelius' map opens in steps, then the viceregal world whips past, faster and faster
cue(BUILD + 0.02, "pro_zip/down_warm", 0.18)
for i, t in enumerate(TILES):
    q = 1.0 if i == 0 else 0.7            # his voice begins on the second: the whips step back
    cue(BUILD + t, "swish/soft", (0.22 + 0.02 * i) * q, "--dur", "0.45", "--apex", "0.08", apex=0.08)
    cue(BUILD + t + 0.02, "fit/land.light/fingertip_book", 0.22 * q)
# the montage: the cities under his sentence, "Spain built them.", the retablo, four stamps, the stop
for t in (1.6, 3.2, 4.0, 4.8, 5.6):
    cue(MONT + t, "swish/soft", 0.20, "--dur", "0.45", "--apex", "0.08", apex=0.08)
cue(MONT + 6.695, "pro_impact/air", 0.30)
cue(MONT + 8.35, "swish/soft", 0.30, "--dur", "0.6", "--apex", "0.12", apex=0.12)
for i in range(4):
    cue(MONT + 10.808 + 0.4 * i, "pro_pop_in/deep", 0.55 if i == 0 else 0.42)
cue(MONT + 12.40, "swipe/cloth", 0.30, "--apex", "0.18", apex=0.18)
# the pillars: the flight through "Mestizaje", the whip up the Sagrario, the whip onto the Codex
cue(PIL + 0.96, "whoosh_fast/heavy", 0.40, "--dur", "0.75", "--apex", "0.5", apex=0.5)
cue(PIL + 2.27, "swipe/velvet", 0.36, "--dur", "0.6", "--apex", "0.1", apex=0.1)
cue(PIL + 4.54, "swipe/paper", 0.34, "--dur", "0.55", "--apex", "0.1", apex=0.1)
cue(TEMPLE + 0.9, "whoosh_big/swell", 0.34, "--dur", "1.5", "--apex", "0.9", apex=0.9)
for k in range(3):
    cue(TEMPLE + k * TQ, "fit/land.light/fingertip_book", 0.35)
cue(TEMPLE + 3 * TQ - 0.22, "pro_pop_in/deep", 0.35)
cue(WORKS - 0.02, "whoosh_fast/heavy", 0.50, "--dur", "0.75", "--apex", "0.6", apex=0.6)
# works: the thumbnails slide in; then every shot leaves by the frieze: a sweep as it slides
# in, a rush as the camera dives into the metope, a soft low hit as the next shot lands
cue(WORKS + 0.35, "swipe/glide", 0.25, "--apex", "0.2", apex=0.2)
for t in (R0, C0, A0, K0, F0):
    cue(t - 0.78 + 0.22, "swipe/velvet", 0.42, "--dur", "0.8", "--apex", "0.22", apex=0.22)
    cue(t - 0.03, "whoosh_fast/tight", 0.45, "--dur", "0.5", "--apex", "0.3", apex=0.3)
    cue(t, "pro_impact/air", 0.28)
for t in (0, 0.54, 1.26, 1.94, 2.58, 3.3):                       # Atlas pins
    cue(A0 + t, "pro_pop/thup", 0.30)
for i in range(6):                                               # book spines
    cue(K0 + 0.4 * i + 0.06, "tap/knuckle", 0.28)
# the close: the five logos, the total landing, its line, the handle (the breakdown's hits)
for i in range(5):
    cue(WORKS + 24.101 - 0.05 + 0.07 * i, "pro_pop/thup", 0.24)
cue(WORKS + 25.573, "pro_impact/air", 0.34)
cue(WORKS + 26.38, "pro_tap/soft", 0.22)
# the mark: a shimmer in D under the last hit
cue(LOCK, "pro_shimmer/m0", 0.22)


def run(*cmd):
    subprocess.run(cmd, check=True)


def load(path):
    """Any audio file as float32 stereo at SR."""
    tmp = CACHE / (Path(path).stem + "-48k.wav")
    run("ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "2", "-ar", str(SR), "-c:a", "pcm_f32le", str(tmp))
    x, _ = sf.read(tmp, dtype="float32", always_2d=True)
    return x


def sfx(sid, args):
    name = sid.replace("/", "_") + ("_" + "_".join(args) if args else "") + ".wav"
    out = CACHE / name
    if not out.exists():
        run(str(EARSHOT), "sfx", "render", sid, "-o", str(out), "--peak", "-1", *args)
    x, sr = sf.read(out, dtype="float32", always_2d=True)
    assert sr == SR
    return np.repeat(x, 2, axis=1) if x.shape[1] == 1 else x


def place(bus, x, t):
    i = int(round(t * SR))
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), len(bus) - i)
    if n > 0:
        bus[i:i + n] += x[:n]


def lengthen(music):
    """Play [LOOP_AT - LOOP_LEN, LOOP_AT] twice, with a 15 ms equal-power crossfade at the seam."""
    a, k, f = int(round(LOOP_AT * SR)), int(round(LOOP_LEN * SR)), int(0.015 * SR)
    t = np.linspace(0, np.pi / 2, f, dtype=np.float32)[:, None]
    seam = music[a:a + f] * np.cos(t) + music[a - k:a - k + f] * np.sin(t)
    return np.concatenate([music[:a], seam, music[a - k + f:]])


def main(video, out):
    CACHE.mkdir(parents=True, exist_ok=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]))
    n = int(round(dur * SR))

    music = lengthen(load(MUSIC)[int(round(OFFSET * SR)):])
    music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]
    voice = load(video)
    voice = np.pad(voice, ((0, max(0, n - len(voice))), (0, 0)))[:n]
    lift = np.ones(n, np.float32)
    for t0, t1, db in VOICE_LIFT:
        lift[int(t0 * SR):int(t1 * SR)] = 10 ** (db / 20)
    voice *= uniform_filter1d(lift, int(0.02 * SR))[:, None]
    for name, t in NARRATOR:
        f = MUSIC.parent / name
        if f.exists():
            x = load(f)
            x *= 10 ** (NARRATOR_DB / 20) * 0.12 / max(1e-6, float(np.sqrt(np.mean(x ** 2))))   # about his clips' level
            place(voice, x, t)
            print("narrator:", name, "at", t)

    # the dip: follow the voice's level (10 ms hold, 60 ms in, 350 ms out) and take the music
    # down by up to 9 dB while he speaks
    lvl = np.abs(voice).max(axis=1)
    lvl = maximum_filter1d(lvl, int(0.01 * SR))
    env = np.clip((20 * np.log10(lvl + 1e-6) + 42) / 18, 0, 1)    # 0 below -42 dBFS, 1 above -24
    env = uniform_filter1d(maximum_filter1d(env, int(0.35 * SR)), int(0.06 * SR))
    gain = 10 ** (-9 * env / 20)
    music *= gain[:, None]

    bus = np.zeros((n, 2), np.float32)
    for t, sid, w, args, apex in CUES:
        x = sfx(sid, args) * w
        place(bus, x, t - (apex or 0))

    mix = music + 1.15 * voice + bus
    wav = CACHE / "mix.wav"
    sf.write(wav, mix, SR, subtype="FLOAT")
    run("ffmpeg", "-v", "error", "-y", "-i", video, "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "aac", "-b:a", "192k", "-shortest", out)
    print("wrote", out, f"{dur:.2f} s,", len(CUES), "cues")


if __name__ == "__main__":
    if len(sys.argv) != 3 or not shutil.which("ffmpeg"):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
