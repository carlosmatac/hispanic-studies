'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { VERT, FRAG } from './engrave.glsl';

/* One pillar plate. Underneath: the finished, gilded plate as a still image,
   so the plate is never empty (no WebGL, reduced motion, slow network).
   On top, once the texture is in: a WebGL2 canvas that cuts the engraving
   as the plate scrolls into view, then gilds it, and lets the gold catch a
   light that follows the pointer. */

const TEX_ASPECT = 512 / 1280;
const LIGHT: [number, number, number] = [-0.55, -0.55, 0.63];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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

export default function EngravedPlate({ tex, still, alt, order }: { tex: string; still: string; alt: string; order: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    const canvas = cv.current;
    if (!el || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) return;

    let prog: WebGLProgram;
    try { prog = compile(gl); } catch (e) { console.warn('[pillars] engraving disabled:', e); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U('uRes'), crop: U('uCrop'), p: U('uP'), eng: U('uEngrave'), gild: U('uGild'), light: U('uLight') };

    const st = { ready: false, engrave: -1, gild: -1, light: [...LIGHT], target: [...LIGHT], raf: 0, dead: false };

    const draw = () => {
      if (!st.ready || st.dead) return;
      gl.uniform1f(u.eng, st.engrave);
      gl.uniform1f(u.gild, st.gild);
      gl.uniform3f(u.light, st.light[0], st.light[1], st.light[2]);
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
      // about 105 lines across the plate, never finer than 2.6 css px
      gl.uniform1f(u.p, Math.max(2.6, w / 105) * dpr);
      const a = w / h;
      if (a > TEX_ASPECT) { const zh = TEX_ASPECT / a; gl.uniform4f(u.crop, 0, (1 - zh) / 2, 1, zh); }
      else { const zw = a / TEX_ASPECT; gl.uniform4f(u.crop, (1 - zw) / 2, 0, zw, 1); }
      draw();
    };

    // progress: 0 as the plate's top enters the viewport, 1 when it has
    // climbed most of the way up; engraving first, then gilding
    const progress = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - r.top) / (vh * 0.95) - order * 0.07;
      const e = clamp01(p / 0.62), g = clamp01((p - 0.6) / 0.4);
      if (e !== st.engrave || g !== st.gild) { st.engrave = e; st.gild = g; draw(); }
    };

    const tick = () => {
      st.raf = 0;
      let moving = false;
      for (let i = 0; i < 3; i++) {
        const d = st.target[i] - st.light[i];
        if (Math.abs(d) > 0.002) { st.light[i] += d * 0.14; moving = true; } else st.light[i] = st.target[i];
      }
      draw();
      if (moving) st.raf = requestAnimationFrame(tick);
    };
    const aim = (t: number[]) => { st.target = t; if (!st.raf) st.raf = requestAnimationFrame(tick); };
    const onMove = (ev: PointerEvent) => {
      if (st.gild < 0.98) return;
      const r = el.getBoundingClientRect();
      aim([((ev.clientX - r.left) / r.width - 0.5) * 2.2, ((ev.clientY - r.top) / r.height - 0.5) * 2.2, 0.75]);
    };
    const onLeave = () => aim([...LIGHT]);

    let scrollRaf = 0;
    const onScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; progress(); }); };

    const start = () => {
      const img = new window.Image();
      img.decoding = 'async';
      img.onload = () => {
        if (st.dead) return;
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        st.ready = true;
        size();
        progress();
        setLive(true);
        window.addEventListener('scroll', onScroll, { passive: true });
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);
      };
      img.src = tex;
    };

    // fetch the texture only when the plate is getting close
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '800px 0px' });
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
    };
  }, [tex, order]);

  return (
    <div ref={wrap} className={`lamina__img${live ? ' is-live' : ''}`}>
      <Image src={still} alt={alt} fill sizes="(max-width: 760px) 90vw, 26vw" />
      <canvas ref={cv} aria-hidden="true" />
    </div>
  );
}
