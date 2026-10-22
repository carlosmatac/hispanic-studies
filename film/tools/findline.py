#!/usr/bin/env python3
"""Find a spoken phrase in <id>.words.tsv and print cut-ready in/out seconds.

Usage: findline.py <media_dir> <id> "<phrase>" [<id> "<phrase>" ...]
Prints: id  in  out  dur  nearest-scene-cut-inside  phrase-as-heard
in = first word start - 0.10 s, out = last word end + 0.15 s (breath room).
"""
import re, sys, os

def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower())

d = sys.argv[1]; args = sys.argv[2:]
for i in range(0, len(args), 2):
    vid, phrase = args[i], args[i + 1]
    rows = [l.rstrip("\n").split("\t") for l in open(os.path.join(d, vid + ".words.tsv"))]
    words = [(float(a), float(b), w) for a, b, w in rows]
    target = [norm(w) for w in phrase.split() if norm(w)]
    ws = [norm(w) for _, _, w in words]
    hit = None
    for k in range(len(ws) - len(target) + 1):
        if ws[k:k + len(target)] == target:
            hit = k; break
    if hit is None:
        print(f"{vid}\tNOT FOUND\t{phrase}"); continue
    a = max(0, words[hit][0] - 0.10); b = words[hit + len(target) - 1][1] + 0.15
    cuts = []
    cf = os.path.join(d, vid + "-cuts.txt")
    if os.path.exists(cf):
        cuts = [float(x) for x in open(cf).read().split() if a < float(x) < b]
    heard = " ".join(w for _, _, w in words[hit:hit + len(target)])
    print(f"{vid}\t{a:.2f}\t{b:.2f}\t{b-a:.2f}\tcuts:{','.join(f'{c:.2f}' for c in cuts) or '-'}\t{heard}")
