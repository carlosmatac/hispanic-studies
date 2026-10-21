'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { VERT, FRAG } from './engrave.glsl';

/* One pillar plate: a column modelled in Blender (tools/blender/), rendered
   as a turntable of FRAMES frames, each with a gilded render (g-NN.webp) and a
   clay pass (t-NN.webp). As the plate scrolls through the viewport the column
   turns, is engraved from the clay pass, then gilded; the pointer can turn it
   a little further. Underneath, the resting gilded frame as a still image: all
   that shows with reduced motion, without WebGL2, or before the frames load. */

export const FRAMES = 36;
const ASPECT = 480 / 1200;
const NUDGE = 5;                       // frames the pointer can add either way
const REST = FRAMES - 1 - NUDGE;        // where the scroll leaves the column (and still.webp)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const pad = (i: number) => String(i).padStart(2, '0');

function compile(gl: WebGL2RenderingContext) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}

export default function EngravedPlate({ dir, alt, order }: { dir: string; alt: string; order: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // a fresh canvas per mount: a context lost on unmount can never be handed back
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) return;
    el.appendChild(canvas);

    let prog: WebGLProgram;
    try { prog = compile(gl); } catch (e) { console.warn('[pillars] plate disabled:', e); canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U('uRes'), crop: U('uCrop'), p: U('uP'), eng: U('uEngrave'), gild: U('uGild'), mix: U('uMix') };

    // four texture units: tone i, tone i+1, gold i, gold i+1
    const tex = [0, 1, 2, 3].map((unit) => {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, unit < 2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      return t;
    });
    ['uTone0', 'uTone1', 'uGold0', 'uGold1'].forEach((n, i) => gl.uniform1i(U(n), i));
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const tones: (HTMLImageElement | null)[] = Array(FRAMES).fill(null);
    const golds: (HTMLImageElement | null)[] = Array(FRAMES).fill(null);
    const bound = [-1, -1, -1, -1];
    const st = { ready: false, dead: false, p: -1, nudge: 0, nudgeTo: 0, raf: 0 };

    // nearest loaded frame to i, so a frame still in flight never blanks the plate
    const nearest = (arr: (HTMLImageElement | null)[], i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        if (arr[i - d]) return i - d;
        if (arr[i + d]) return i + d;
      }
      return -1;
    };
    const bind = (unit: number, arr: (HTMLImageElement | null)[], i: number, tone: boolean) => {
      const k = nearest(arr, i);
      if (k < 0 || bound[unit] === k) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
      if (tone) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, arr[k]!);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, arr[k]!);
      }
      bound[unit] = k;
    };

    const draw = () => {
      if (!st.ready || st.dead) return;
      const p = st.p;
      const e = clamp01(p / 0.55), g = clamp01((p - 0.5) / 0.45);
      // the column turns through the whole passage, plus the pointer's nudge
      const fpos = Math.min(FRAMES - 1, Math.max(0, clamp01(p) * REST + st.nudge));
      const i = Math.floor(fpos), j = Math.min(FRAMES - 1, i + 1);
      bind(0, tones, i, true); bind(1, tones, j, true);
      bind(2, golds, i, false); bind(3, golds, j, false);
      gl.uniform1f(u.mix, fpos - i);
      gl.uniform1f(u.eng, e);
      gl.uniform1f(u.gild, g);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.p, Math.max(2.6, w / 105) * dpr);
      const a = w / h;
      if (a > ASPECT) { const zh = ASPECT / a; gl.uniform4f(u.crop, 0, (1 - zh) / 2, 1, zh); }
      else { const zw = a / ASPECT; gl.uniform4f(u.crop, (1 - zw) / 2, 0, zw, 1); }
      draw();
    };

    // 0 as the plate's top enters the viewport, 1 when it has climbed most of the way up
    const progress = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh - r.top) / (vh * 0.95) - order * 0.07);
      if (p !== st.p) { st.p = p; draw(); }
    };

    const tick = () => {
      st.raf = 0;
      const d = st.nudgeTo - st.nudge;
      st.nudge = Math.abs(d) < 0.01 ? st.nudgeTo : st.nudge + d * 0.12;
      draw();
      if (st.nudge !== st.nudgeTo) st.raf = requestAnimationFrame(tick);
    };
    const aim = (n: number) => { st.nudgeTo = n; if (!st.raf) st.raf = requestAnimationFrame(tick); };
    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      aim(((ev.clientX - r.left) / r.width - 0.5) * 2 * NUDGE);
    };
    const onLeave = () => aim(0);
    let scrollRaf = 0;
    const onScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; progress(); }); };

    const load = (src: string, arr: (HTMLImageElement | null)[], i: number) => new Promise<void>((res) => {
      const img = new window.Image();
      img.decoding = 'async';
      img.onload = () => { if (!st.dead) { arr[i] = img; if (st.ready) draw(); } res(); };
      img.onerror = () => res();
      img.src = src;
    });

    const start = async () => {
      // the frame the plate will open on first, then the rest, near ones first
      progress();
      const first = Math.round(clamp01(st.p) * REST);
      await Promise.all([load(`${dir}/t-${pad(first)}.webp`, tones, first), load(`${dir}/g-${pad(first)}.webp`, golds, first)]);
      if (st.dead || !tones[first] || !golds[first]) return;
      st.ready = true;
      size();
      setLive(true);
      window.addEventListener('scroll', onScroll, { passive: true });
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      const rest = Array.from({ length: FRAMES }, (_, i) => i).filter((i) => i !== first).sort((a, b) => Math.abs(a - first) - Math.abs(b - first));
      for (let k = 0; k < rest.length; k += 6) {
        if (st.dead) return;
        await Promise.all(rest.slice(k, k + 6).flatMap((i) => [load(`${dir}/t-${pad(i)}.webp`, tones, i), load(`${dir}/g-${pad(i)}.webp`, golds, i)]));
      }
    };

    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    const ro = new ResizeObserver(() => { if (st.ready) { size(); progress(); } });
    ro.observe(el);

    return () => {
      st.dead = true;
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(st.raf);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [dir, order]);

  return (
    <div ref={wrap} className={`lamina__img${live ? ' is-live' : ''}`}>
      <Image src={`${dir}/still.webp`} alt={alt} fill sizes="(max-width: 760px) 90vw, 26vw" />
    </div>
  );
}
