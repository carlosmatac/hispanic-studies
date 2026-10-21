#!/usr/bin/env python3
"""Local speech-to-text fallback when YouTube refuses subtitles (HTTP 429).

Usage: ~/.venvs/film/bin/python -I transcribe.py [--model small.en] <file.mp4> ...
Writes next to each video:
  <id>.txt        "[mm:ss.s] text" per segment (same format as vtt2txt.py)
  <id>.words.tsv  start<TAB>end<TAB>word, for frame-accurate in/out points
"""
import argparse, os, subprocess
import numpy as np
from faster_whisper import WhisperModel

def fmt(t):
    m, s = divmod(t, 60)
    return f"[{int(m):02d}:{s:04.1f}]"

ap = argparse.ArgumentParser()
ap.add_argument("--model", default="small.en")
ap.add_argument("--first", type=float, default=0, help="only the first N seconds (writes <id>.head.txt / .head.words.tsv)")
ap.add_argument("files", nargs="+")
a = ap.parse_args()
model = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=os.cpu_count())
for f in a.files:
    base = os.path.splitext(f)[0] + (".head" if a.first else "")
    # decode with ffmpeg ourselves (the bundled PyAV can be incompatible)
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f] + (["-t", str(a.first)] if a.first else []) + ["-ac", "1", "-ar", "16000",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    segs, _ = model.transcribe(audio, language="en", word_timestamps=True, vad_filter=True, beam_size=1)
    with open(base + ".txt", "w") as t, open(base + ".words.tsv", "w") as w:
        for s in segs:
            t.write(f"{fmt(s.start)} {s.text.strip()}\n")
            for wd in s.words or []:
                w.write(f"{wd.start:.2f}\t{wd.end:.2f}\t{wd.word.strip()}\n")
    print("done", os.path.basename(base), flush=True)
