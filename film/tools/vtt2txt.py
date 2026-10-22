#!/usr/bin/env python3
"""Turn a YouTube .vtt (manual or rolling auto-captions) into a clean transcript.

Usage: vtt2txt.py in.vtt > out.txt
Output: one line per caption, "[mm:ss.s] text", rolling duplicates removed.
(Fallback when YouTube subtitles are reachable; otherwise use transcribe.py.)
"""
import html, re, sys

TS = r"(\d+):(\d\d):(\d\d)\.(\d+)"
CUE = re.compile(TS + r"\s+-->\s+" + TS)
TAG = re.compile(r"<[^>]+>")

def secs(h, m, s, f):
    return int(h) * 3600 + int(m) * 60 + int(s) + int(f) / 10 ** len(f)

def fmt(t):
    m, s = divmod(t, 60)
    return f"[{int(m):02d}:{s:04.1f}]"

def main(path):
    lines = open(path, encoding="utf-8").read().splitlines()
    cues, i = [], 0
    while i < len(lines):
        m = CUE.search(lines[i])
        if not m:
            i += 1; continue
        start = secs(*m.groups()[:4]); i += 1
        body = []
        while i < len(lines) and lines[i].strip():
            body.append(lines[i]); i += 1
        cues.append((start, body))
    auto = any("<c>" in l for _, b in cues for l in b)
    out, last = [], ""
    for start, body in cues:
        if auto:
            # rolling captions: only lines with word-timing tags carry new text
            new = [l for l in body if "<c>" in l or re.search(r"<\d", l)]
            if not new:
                continue
            text = html.unescape(TAG.sub("", new[-1])).strip()
        else:
            text = re.sub(r"\s+", " ", html.unescape(TAG.sub("", " ".join(body)))).strip()
        if text and text != last:
            out.append((start, text)); last = text
    for t, text in out:
        print(fmt(t), text)

if __name__ == "__main__":
    main(sys.argv[1])
