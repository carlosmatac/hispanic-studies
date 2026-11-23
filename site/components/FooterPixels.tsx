'use client';

import { useEffect, useRef } from 'react';
import { DEFAULT_VARIANT, FOOTER_FILM, FOOTER_VARIANTS, rampRgb, type FooterVariant } from '@/lib/footer-pixels';

/* The footer's ground (issue #106): our film (public/video/footer-loop.mp4, a
   slow drift over four period plans and paintings) redrawn as discrete pixels
   in the brand's dark colours, at low contrast. The knobs and the three
   variants are in lib/footer-pixels.ts.

   How: each frame, the film is drawn into a canvas with one pixel per cell
   (the browser averages the frame down), each cell's luminance picks a step of
   the ramp through a 4×4 ordered dither, and the result is put on a second
   canvas of the same few pixels that CSS scales up with `image-rendering:
   pixelated`. So the work is a few thousand cells a frame whatever the
   screen's DPR, on the CPU, without WebGL.

   - It loads nothing until the footer is near (preload none), plays only while
     the footer is on screen and the tab is visible, and redraws at most `fps`
     times a second, only when the film has a new frame.
   - Reduced motion, Save-Data, or a film that cannot play: the still
     (footer-loop.jpg) is pixelated the same way, once; nothing moves.
   - It is decoration (aria-hidden), absolutely placed under the footer's
     content: it never changes the footer's size, and fades in over the ground,
     whose colour is the ramp's own middle. Without a canvas or a script, the
     ground stays. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
const MAX_CELLS = 40_000; // a cap on the cells per frame: past it the cells grow

function pickVariant(): FooterVariant {
  if (process.env.NODE_ENV !== 'production') {
    const n = Number(new URLSearchParams(window.location.search).get('footerVariant'));
    if (n === 1 || n === 2 || n === 3) return FOOTER_VARIANTS[n];
  }
  return FOOTER_VARIANTS[DEFAULT_VARIANT];
}

export default function FooterPixels() {
  const box = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLCanvasElement>(null);
  const film = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = box.current;
    const canvas = screen.current;
    const video = film.current;
    if (!el || !canvas || !video) return;
    video.muted = true;
    const v = pickVariant();
    // the knobs the CSS reads (the veil under the text, the mosaic's hairlines, the cell) live on the footer
    const host = el.parentElement ?? el;
    el.dataset.variant = v.name;
    host.style.setProperty('--px-grid', String(v.grid));
    host.style.setProperty('--px-veil', String(v.veil));

    const ctx = canvas.getContext('2d');
    const sample = document.createElement('canvas');
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    if (!ctx || !sctx) return;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';

    const ramp = rampRgb(v);
    const steps = ramp.length - 1;
    let [lo, hi] = v.levels;
    let leveled = false; // the auto window has been set once (the first frame takes it whole, later ones ease toward theirs)
    const hist = new Uint32Array(64);
    const lut = new Float32Array(256);
    let lum = new Uint8Array(0);
    const bayer = Float32Array.from(BAYER, (t) => t * v.dither);
    // the ramp as 32-bit pixels (RGBA in memory: little-endian ABGR words)
    const packed = Uint32Array.from(ramp, ([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let still = reduce.matches || saveData || !video.canPlayType('video/mp4');

    let cols = 0;
    let rows = 0;
    let out: ImageData | null = null;
    let shown = false;
    const fit = () => {
      const r = el.getBoundingClientRect();
      let cell = v.cell;
      while (Math.ceil(r.width / cell) * Math.ceil(r.height / cell) > MAX_CELLS) cell += 1;
      const c = Math.max(1, Math.ceil(r.width / cell));
      const w = Math.max(1, Math.ceil(r.height / cell));
      host.style.setProperty('--px-cell', `${cell}px`);
      if (c === cols && w === rows) return false;
      cols = c; rows = w;
      canvas.width = sample.width = cols;
      canvas.height = sample.height = rows;
      canvas.style.width = `${cols * cell}px`;
      canvas.style.height = `${rows * cell}px`;
      out = ctx.createImageData(cols, rows);
      return true;
    };

    // one frame: the source, cropped to the box (cover), down to one pixel a cell, then quantised
    const draw = (src: CanvasImageSource, sw: number, sh: number) => {
      if (!out || !sw || !sh) return;
      const ar = cols / rows;
      let cw = sw;
      let ch = sh;
      if (sw / sh > ar) cw = sh * ar; else ch = sw / ar;
      sctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, cols, rows);
      const d = sctx.getImageData(0, 0, cols, rows).data;
      const total = cols * rows;
      if (lum.length !== total) lum = new Uint8Array(total);
      for (let k = 0, i = 0; k < total; k++, i += 4) lum[k] = (54 * d[i] + 183 * d[i + 1] + 19 * d[i + 2]) >> 8; // Rec. 709 luma, 0..255
      if (v.auto) {
        hist.fill(0);
        for (let k = 0; k < total; k++) hist[lum[k] >> 2]++;
        let acc = 0;
        let a = -1;
        let b = 63;
        for (let k = 0; k < 64; k++) {
          acc += hist[k];
          if (a < 0 && acc >= total * 0.03) a = k;
          if (acc >= total * 0.97) { b = k; break; }
        }
        const [na, nb] = [a / 64, Math.max(a + 2, b + 1) / 64];
        const ease = leveled ? 0.08 : 1;
        lo += (na - lo) * ease;
        hi += (nb - hi) * ease;
        leveled = true;
      }
      // a step (as a fraction) for each of the 256 lumas, this frame
      for (let l = 0; l < 256; l++) lut[l] = Math.min(1, Math.max(0, (l / 255 - lo) / (hi - lo))) * steps + 0.5;
      const o = new Uint32Array(out.data.buffer);
      for (let y = 0, k = 0; y < rows; y++) {
        const by = (y & 3) * 4;
        for (let x = 0; x < cols; x++, k++) {
          const s = Math.floor(lut[lum[k]] + bayer[by + (x & 3)]);
          o[k] = packed[s < 0 ? 0 : s > steps ? steps : s];
        }
      }
      ctx.putImageData(out, 0, 0);
      if (!shown) { shown = true; el.classList.add('is-on'); }
    };

    // the still: drawn when nothing moves, and first while the film loads
    const img = new Image();
    img.decoding = 'async';
    let imgReady = false;
    const drawStill = () => { if (imgReady) draw(img, img.naturalWidth, img.naturalHeight); };
    img.onload = () => { imgReady = true; if (still || video.readyState < 2) drawStill(); };

    let near = false;
    let onScreen = false;
    let started = false;
    let last = 0;
    let frame = 0;
    let vfc = 0;
    const gap = 1000 / v.fps;
    const hasVfc = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    const tick = (now: number) => {
      frame = 0; vfc = 0;
      if (!running()) return;
      if (now - last >= gap - 2 && video.readyState >= 2) { last = now; draw(video, video.videoWidth, video.videoHeight); }
      schedule();
    };
    const schedule = () => {
      if (frame || vfc) return;
      if (hasVfc) vfc = video.requestVideoFrameCallback((now) => tick(now));
      else frame = requestAnimationFrame(tick);
    };
    const running = () => !still && onScreen && document.visibilityState === 'visible';
    const update = () => {
      if (near && !started) {
        started = true;
        img.src = FOOTER_FILM.still;
        if (!still) {
          video.src = FOOTER_FILM.src;
          video.playbackRate = v.speed;
          video.defaultPlaybackRate = v.speed;
        }
      }
      if (running()) {
        video.play().then(() => { video.playbackRate = v.speed; schedule(); }).catch(() => { still = true; drawStill(); });
      } else {
        if (!video.paused) video.pause();
        if (frame) cancelAnimationFrame(frame);
        if (vfc) video.cancelVideoFrameCallback(vfc);
        frame = 0; vfc = 0;
      }
    };

    fit();
    const ro = new ResizeObserver(() => {
      if (!fit()) return;
      if (still || video.readyState < 2) drawStill(); else draw(video, video.videoWidth, video.videoHeight);
    });
    ro.observe(el);
    const nearIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near = true; update(); } }, { rootMargin: '400px 0px' });
    const seenIo = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update(); }, { threshold: 0 });
    nearIo.observe(el);
    seenIo.observe(el);
    const onError = () => { still = true; update(); drawStill(); };
    const onMotion = () => { still = reduce.matches || saveData; update(); if (still) drawStill(); };
    video.addEventListener('error', onError);
    reduce.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', update);
    return () => {
      ro.disconnect(); nearIo.disconnect(); seenIo.disconnect();
      video.removeEventListener('error', onError);
      reduce.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', update);
      if (frame) cancelAnimationFrame(frame);
      if (vfc) video.cancelVideoFrameCallback(vfc);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  return (
    <div className="foot__pixels" ref={box} aria-hidden="true">
      <canvas ref={screen} />
      <video ref={film} className="foot__film" muted loop playsInline disablePictureInPicture preload="none" tabIndex={-1} />
    </div>
  );
}
