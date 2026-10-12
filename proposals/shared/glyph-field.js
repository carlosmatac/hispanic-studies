// glyph-field.js: render an image, a video or a procedural scene as a grid of glyphs (WebGL2, no dependencies).
// Same idea as castle.tech's knights (Unicorn Studio "glyphDither"): each cell samples the source and draws the glyph
// whose ink density matches it. Usage:
//
//   import { GlyphField } from '../shared/glyph-field.js';
//   new GlyphField(canvas, { source: { type: 'image', src: '...' }, charset: ' .:-+*#%@', palette: ['#470B15', '#F9F3DD'] });
//
// Options (all optional except source):
//   source      { type: 'image' | 'video', src, crop: [x0, y0, x1, y1] } or { type: 'procedural', glsl, size: [w, h], image? }
//   mode        'density' (glyph chosen by brightness) | 'text' (glyphs read `text` in order, brightness = opacity)
//   charset     glyphs for density mode, sorted by ink automatically ('0123456789', ' .:-+*#%@', 'IHS'...)
//   text        string for text mode
//   font        CSS font family for the atlas; weight: CSS weight
//   cell        cell size in CSS px
//   background  CSS colour; palette: 1-4 CSS colours mapped from low to high density
//   colorMode   'ramp' (palette by density) | 'source' (source colours)
//   invert      dark glyphs = bright source (use on light backgrounds)
//   fit         'cover' | 'contain'; focus: [x, y] for cover; zoom: number
//   contrast, brightness, gamma, dither, flicker (0..1), shimmer (0..1 radial ripple)
//   ink         [lo, hi] smoothstep on the glyph mask: keeps small glyphs crisp (default [0.06, 0.5])
//   levels      [lo, hi] percentiles for auto-levels of images (default [0.02, 0.98]); local: local-contrast boost
//   drift       { zoom: 0.06, pan: [0.02, 0], period: 24 } slow Ken Burns on still images
//   mouse       { radius: 160, peek: 0..1 (show the real source inside the lens), parallax: 0.02 }
//   reveal      { mode: 'load', duration: 2.4 } | { mode: 'scroll', start: 0.95, end: 0.35 } | null
//   onReady     callback

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const DEFAULT_SRC = `
vec4 SRC(vec2 uv, vec2 st, float t) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(uBg, -1.0);
  vec4 c = img(uv);
  float l = luma(c.rgb);
  float lb = luma(textureLod(uSrc, cropUV(uv), gLod + 2.5).rgb);
  l += uLocal * (l - lb);
  return vec4(c.rgb, lev(l));
}`;

const frag = (src) => `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uCell;
uniform sampler2D uSrc;
uniform vec2 uSrcSize;
uniform vec4 uCrop;
uniform sampler2D uAtlas;
uniform float uGlyphs;
uniform sampler2D uText;
uniform float uTextLen;
uniform int uMode;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLens;
uniform float uPeek;
uniform float uReveal;
uniform float uContrast;
uniform float uBrightness;
uniform float uGamma;
uniform float uDither;
uniform float uFlicker;
uniform float uShimmer;
uniform float uInvert;
uniform int uFit;
uniform vec2 uFocus;
uniform float uZoom;
uniform vec2 uPan;
uniform vec3 uBg;
uniform vec3 uPal[4];
uniform int uPalN;
uniform int uColorMode;
uniform vec2 uLevels;
uniform float uLocal;
uniform float uDebug;
uniform vec2 uInk;
out vec4 outColor;

float gLod = 0.0;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lev(float l) { return clamp((l - uLevels.x) / max(uLevels.y - uLevels.x, 0.001), 0.0, 1.0); }
vec2 cropUV(vec2 uv) { return uCrop.xy + uv * (uCrop.zw - uCrop.xy); }
vec4 img(vec2 uv) { return textureLod(uSrc, cropUV(uv), gLod); }
vec4 imgSharp(vec2 uv) { return textureLod(uSrc, cropUV(uv), 0.0); }
vec2 gCellUV = vec2(0.0);
// darkest of 3x3 taps inside the cell: keeps thin dark lines (engravings) instead of averaging them away
float lumaMin(vec2 uv) {
  float m = 1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++)
    m = min(m, luma(textureLod(uSrc, cropUV(uv + vec2(i, j) * gCellUV * 0.33), max(gLod - 1.5, 0.0)).rgb));
  return m;
}

vec2 fitScale() {
  float ca = uRes.x / uRes.y;
  float ia = uSrcSize.x / uSrcSize.y;
  vec2 s = vec2(1.0);
  if (uFit == 0) { if (ca > ia) s.y = ia / ca; else s.x = ca / ia; }
  else { if (ca > ia) s.x = ca / ia; else s.y = ia / ca; }
  return s / uZoom;
}
vec2 mapUV(vec2 st) {
  vec2 s = fitScale();
  return st * s + (1.0 - s) * uFocus + uPan;
}

${src}

vec3 ramp(float d) {
  if (uPalN <= 1) return uPal[0];
  float x = clamp(d, 0.0, 1.0) * float(uPalN - 1);
  int i = int(min(floor(x), float(uPalN - 2)));
  return mix(uPal[i], uPal[i + 1], x - float(i));
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(frag / uCell);
  vec2 local = fract(frag / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 st = center / uRes;
  float h = hash(cell);

  vec2 s = fitScale();
  float texelsPerPx = (uSrcSize.x * s.x) / uRes.x;
  gLod = log2(max(uCell * texelsPerPx, 1.0));
  gCellUV = uCell / uRes * s;

  vec4 src = SRC(mapUV(st), st, uTime);
  float empty = step(src.a, -0.5);
  float d = max(src.a, 0.0);
  if (uInvert > 0.5) d = 1.0 - d;
  d = (d - 0.5) * uContrast + 0.5 + uBrightness;
  if (uShimmer > 0.0) d += uShimmer * 0.12 * sin(uTime * 1.6 - length(st - 0.5) * 28.0);
  d = pow(clamp(d, 0.0, 1.0), uGamma);
  d = clamp(d + (h - 0.5) * uDither, 0.0, 1.0);

  float r = uReveal * 1.25 - 0.12;
  float shown = step(h, r) * (1.0 - empty);
  float frontier = shown * (1.0 - step(h, r - 0.12));

  float idx;
  float alpha = 1.0;
  if (uMode == 1) {
    float cols = floor(uRes.x / uCell);
    float k = mod(cell.y * cols + cell.x, uTextLen);
    idx = floor(texture(uText, vec2((k + 0.5) / uTextLen, 0.5)).r * 255.0 + 0.5);
    alpha = smoothstep(0.08, 0.85, d);
  } else {
    idx = floor(d * (uGlyphs - 1.0) + 0.5);
  }
  float f = hash(cell + floor(uTime * 6.0 + h * 13.0));
  if (f < uFlicker * 0.12) idx = clamp(idx + (f < uFlicker * 0.06 ? 1.0 : -1.0), 0.0, uGlyphs - 1.0);
  if (frontier > 0.0) { idx = floor(hash(cell + floor(uTime * 14.0)) * uGlyphs); alpha = 1.0; }

  vec2 auv = vec2((idx + local.x) / uGlyphs, local.y);
  float m = textureGrad(uAtlas, auv, vec2(1.0 / (uCell * uGlyphs), 0.0), vec2(0.0, 1.0 / uCell)).r;
  m = smoothstep(uInk.x, uInk.y, m);

  vec3 gc = uColorMode == 1 ? src.rgb : ramp(d);
  if (frontier > 0.0) gc = uPal[uPalN - 1];
  vec3 col = mix(uBg, gc, m * alpha * shown);

  if (uPeek > 0.0 && uLens > 0.0) {
    float lens = 1.0 - smoothstep(uLens * 0.55, uLens, length(frag - uMouse));
    vec2 puv = mapUV(frag / uRes);
    vec4 rs = SRC(puv, frag / uRes, uTime);
    vec3 raw = rs.a < -0.5 ? uBg : rs.rgb;
    col = mix(col, raw, lens * uPeek * shown);
  }
  if (uDebug > 0.5) col = vec3(empty > 0.5 ? 0.0 : d);
  outColor = vec4(col, 1.0);
}`;

function cssColor(c) {
  const el = document.createElement('canvas').getContext('2d');
  el.fillStyle = c;
  const hex = el.fillStyle;
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = hex.match(/[\d.]+/g).map(Number);
  return [m[0] / 255, m[1] / 255, m[2] / 255];
}

function buildAtlas(chars, font, weight, sort) {
  const G = 64;
  const c = document.createElement('canvas');
  c.width = G * chars.length;
  c.height = G;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${weight} ${Math.round(G * 0.86)}px ${font}`;
  chars.forEach((ch, i) => g.fillText(ch, i * G + G / 2, G / 2 + G * 0.04));
  let order = chars.map((_, i) => i);
  if (sort) {
    const data = g.getImageData(0, 0, c.width, G).data;
    const ink = chars.map((_, i) => {
      let sum = 0;
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) sum += data[(y * c.width + i * G + x) * 4];
      return sum;
    });
    order.sort((a, b) => ink[a] - ink[b]);
    const sorted = document.createElement('canvas');
    sorted.width = c.width;
    sorted.height = G;
    const sg = sorted.getContext('2d');
    order.forEach((src, dst) => sg.drawImage(c, src * G, 0, G, G, dst * G, 0, G, G));
    return { canvas: sorted, chars: order.map((i) => chars[i]) };
  }
  return { canvas: c, chars };
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class GlyphField {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.o = {
      mode: 'density', charset: ' .:-+*#%@', text: 'IHS ', font: '"IBM Plex Mono", ui-monospace, monospace', weight: 600,
      cell: 12, background: '#000', palette: ['#fff'], colorMode: 'ramp', invert: false, fit: 'cover', focus: [0.5, 0.5],
      zoom: 1, contrast: 1, brightness: 0, gamma: 1, local: 1.2, levels: [0.02, 0.98], ink: [0.06, 0.5], dither: 0.08, flicker: 0.3, shimmer: 0, drift: null,
      mouse: { radius: 160, peek: 0, parallax: 0.015 }, reveal: { mode: 'load', duration: 2.4 }, ...opts,
    };
    this.o.mouse = { radius: 160, peek: 0, parallax: 0.015, ...(opts.mouse || {}) };
    this.mouse = [-1e5, -1e5];
    this.mouseTarget = [-1e5, -1e5];
    this.par = [0, 0];
    this.visible = true;
    this.t0 = performance.now();
    this.ready = this.init().catch((e) => this.fail(e));
  }

  fail(e) {
    console.warn('[glyph-field]', e);
    const wrap = this.canvas.parentElement;
    if (this.o.source.src) {
      this.canvas.style.background = `center / ${this.o.fit} no-repeat url("${this.o.source.src}")`;
    }
    if (location.protocol === 'file:' && wrap && !wrap.querySelector('.gf-warn')) {
      const n = document.createElement('div');
      n.className = 'gf-warn';
      n.textContent = 'Run `make serve` and open http://localhost:8000: WebGL cannot read images from file://';
      n.style.cssText = 'position:absolute;left:12px;bottom:12px;z-index:5;font:12px monospace;background:#000;color:#fff;padding:6px 8px';
      wrap.appendChild(n);
    }
  }

  async init() {
    const gl = this.canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;
    const o = this.o;

    let chars;
    if (o.mode === 'text') chars = [...new Set([...o.text])];
    else chars = [...o.charset];
    if (document.fonts) await document.fonts.load(`${o.weight} 48px ${o.font}`, chars.join('')).catch(() => {});
    const atlas = buildAtlas(chars, o.font, o.weight, o.mode !== 'text');
    this.glyphCount = atlas.chars.length;

    const src = o.source.type === 'procedural' ? o.source.glsl : DEFAULT_SRC;
    this.prog = this.program(VERT, frag(src));
    gl.useProgram(this.prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = new Proxy({}, { get: (c, k) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(this.prog, k))) });

    this.atlasTex = this.texture(1, atlas.canvas, true);
    const textIdx = o.mode === 'text' ? [...o.text].map((ch) => atlas.chars.indexOf(ch)) : [0];
    gl.activeTexture(gl.TEXTURE2);
    this.textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, textIdx.length, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(textIdx));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    this.textLen = textIdx.length;

    await this.loadSource();
    this.bindEvents();
    this.resize();
    this.loop = this.loop.bind(this);
    if (reduceMotion()) this.render(0);
    else requestAnimationFrame(this.loop);
    o.onReady?.(this);
  }

  async loadSource() {
    const { gl, o } = this;
    const s = o.source;
    this.srcSize = s.size || [1, 1];
    if (s.type === 'video') {
      const v = Object.assign(document.createElement('video'), { src: s.src, muted: true, loop: true, playsInline: true, autoplay: true });
      v.setAttribute('playsinline', '');
      await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; });
      v.play().catch(() => {});
      this.video = v;
      this.srcSize = [v.videoWidth, v.videoHeight];
      this.srcTex = this.texture(0, v, true);
    } else if (s.src || s.image) {
      const im = new Image();
      im.src = s.src || s.image;
      await im.decode();
      if (!s.size) this.srcSize = [im.naturalWidth, im.naturalHeight];
      this.srcTex = this.texture(0, im, true);
      this.levels = this.computeLevels(im, s.crop || [0, 0, 1, 1]);
    } else {
      this.srcTex = this.texture(0, new ImageData(1, 1), false);
    }
    const c = s.crop || [0, 0, 1, 1];
    this.crop = c;
    if (!s.size) this.srcSize = [this.srcSize[0] * (c[2] - c[0]), this.srcSize[1] * (c[3] - c[1])];
  }

  computeLevels(im, crop) {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const g = c.getContext('2d', { willReadFrequently: true });
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    g.drawImage(im, crop[0] * W, crop[1] * H, (crop[2] - crop[0]) * W, (crop[3] - crop[1]) * H, 0, 0, 96, 96);
    const d = g.getImageData(0, 0, 96, 96).data;
    const ls = [];
    for (let i = 0; i < d.length; i += 4) ls.push((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255);
    ls.sort((a, b) => a - b);
    const [lo, hi] = this.o.levels || [0.02, 0.98];
    return [ls[Math.floor(lo * (ls.length - 1))], ls[Math.floor(hi * (ls.length - 1))]];
  }

  texture(unit, source, mips) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, code) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  bindEvents() {
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.io = new IntersectionObserver(([e]) => {
      const was = this.visible;
      this.visible = e.isIntersecting;
      if (this.visible && !was && !reduceMotion()) requestAnimationFrame(this.loop);
    });
    this.io.observe(this.canvas);
    this.onMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const dpr = this.dpr || 1;
      this.mouseTarget = [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
      this.parTarget = [(e.clientX / innerWidth - 0.5), (e.clientY / innerHeight - 0.5)];
    };
    this.onLeave = () => { this.mouseTarget = [-1e5, -1e5]; };
    window.addEventListener('pointermove', this.onMove, { passive: true });
    document.addEventListener('pointerleave', this.onLeave);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (reduceMotion() && this.gl) this.render(0);
  }

  revealProgress(t) {
    const r = this.o.reveal;
    if (!r || reduceMotion() || location.search.includes('noreveal')) return 1;
    if (r.mode === 'scroll') {
      const rect = this.canvas.getBoundingClientRect();
      const vh = innerHeight;
      const start = (r.start ?? 0.95) * vh;
      const end = (r.end ?? 0.35) * vh;
      return Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    }
    const p = Math.min(1, t / (r.duration ?? 2.4));
    return 1 - Math.pow(1 - p, 3);
  }

  loop(now) {
    if (!this.visible || this.destroyed) return;
    this.render((now - this.t0) / 1000);
    requestAnimationFrame(this.loop);
  }

  render(t) {
    const { gl, o, u } = this;
    if (!gl) return;
    const lerp = (a, b, k) => a + (b - a) * k;
    if (this.mouseTarget[0] < -1e4) this.mouse = [...this.mouseTarget];
    else if (this.mouse[0] < -1e4) this.mouse = [...this.mouseTarget];
    else this.mouse = [lerp(this.mouse[0], this.mouseTarget[0], 0.18), lerp(this.mouse[1], this.mouseTarget[1], 0.18)];
    const pt = this.parTarget || [0, 0];
    this.par = [lerp(this.par[0], pt[0], 0.05), lerp(this.par[1], pt[1], 0.05)];

    if (this.video && this.video.readyState >= 2) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    let zoom = o.zoom;
    let pan = [0, 0];
    if (o.drift && !reduceMotion()) {
      const ph = (t / (o.drift.period || 24)) * Math.PI * 2;
      zoom *= 1 + (o.drift.zoom ?? 0.05) * (0.5 - 0.5 * Math.cos(ph));
      const dp = o.drift.pan || [0, 0];
      pan = [dp[0] * Math.sin(ph), dp[1] * Math.sin(ph * 0.7)];
    }
    const px = o.mouse.parallax || 0;
    pan = [pan[0] + this.par[0] * px, pan[1] + this.par[1] * px];

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.textTex);
    gl.uniform1i(u.uSrc, 0);
    gl.uniform1i(u.uAtlas, 1);
    gl.uniform1i(u.uText, 2);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uCell, o.cell * this.dpr);
    gl.uniform2f(u.uSrcSize, this.srcSize[0], this.srcSize[1]);
    gl.uniform4f(u.uCrop, ...this.crop);
    gl.uniform1f(u.uGlyphs, this.glyphCount);
    gl.uniform1f(u.uTextLen, this.textLen);
    gl.uniform1i(u.uMode, o.mode === 'text' ? 1 : 0);
    gl.uniform1f(u.uTime, reduceMotion() ? 0 : t);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform1f(u.uLens, (o.mouse.radius || 0) * this.dpr);
    gl.uniform1f(u.uPeek, o.mouse.peek || 0);
    gl.uniform1f(u.uReveal, this.revealProgress(t));
    gl.uniform1f(u.uContrast, o.contrast);
    gl.uniform1f(u.uBrightness, o.brightness);
    gl.uniform1f(u.uGamma, o.gamma);
    gl.uniform1f(u.uDither, o.dither);
    gl.uniform1f(u.uFlicker, reduceMotion() ? 0 : o.flicker);
    gl.uniform1f(u.uShimmer, o.shimmer);
    gl.uniform1f(u.uInvert, o.invert ? 1 : 0);
    gl.uniform1i(u.uFit, o.fit === 'contain' ? 1 : 0);
    gl.uniform2f(u.uFocus, o.focus[0], o.focus[1]);
    gl.uniform1f(u.uZoom, zoom);
    gl.uniform2f(u.uPan, pan[0], pan[1]);
    gl.uniform3f(u.uBg, ...cssColor(o.background));
    const pal = o.palette.slice(0, 4).map(cssColor);
    while (pal.length < 4) pal.push(pal[pal.length - 1]);
    gl.uniform3fv(u.uPal, pal.flat());
    gl.uniform1i(u.uPalN, Math.min(o.palette.length, 4));
    gl.uniform1i(u.uColorMode, o.colorMode === 'source' ? 1 : 0);
    gl.uniform2f(u.uLevels, ...(this.levels || [0, 1]));
    gl.uniform1f(u.uLocal, o.local);
    gl.uniform1f(u.uDebug, o.debug ? 1 : 0);
    gl.uniform2f(u.uInk, ...o.ink);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.destroyed = true;
    this.ro?.disconnect();
    this.io?.disconnect();
    window.removeEventListener('pointermove', this.onMove);
    document.removeEventListener('pointerleave', this.onLeave);
  }
}

// Procedural scenes. They receive uv (source space, after fit), st (canvas 0..1) and t (seconds) and return
// vec4(rgb colour, density). They can use img(uv), uPal[], uBg, hash(), luma().
GlyphField.procedural = {
  // Cross of Burgundy waving from a pole on the left. Field = uPal[1], saltire = uPal[2]. Use size [1500, 1000].
  burgundyFlag: `
float raguly(vec2 p, vec2 dir, float w) {
  vec2 n = vec2(-dir.y, dir.x);
  float a = dot(p, dir);
  float side = dot(p, n);
  float knot = step(fract(a / 0.11 + (side > 0.0 ? 0.0 : 0.5)), 0.32);
  float wid = w + knot * 0.032;
  return step(abs(side), wid) * step(0.02, a);
}
vec4 SRC(vec2 uv, vec2 st, float t) {
  float x = uv.x;
  float amp = 0.07 * (0.15 + x);
  float ph = x * 6.5 - t * 2.4 + uv.y * 1.2;
  float w = sin(ph) + 0.45 * sin(x * 12.0 - t * 3.3 + uv.y * 2.5);
  vec2 p = vec2(x + 0.012 * sin(uv.y * 5.0 + t * 1.4), uv.y + amp * w * 0.55);
  if (uv.x < -0.03 && uv.x > -0.05 && uv.y > -0.05) return vec4(uPal[3], 0.8);
  if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) return vec4(uBg, -1.0);
  float shade = 0.62 + 0.38 * (0.5 + 0.5 * cos(ph)) * (1.0 - 0.25 * x);
  vec2 q = vec2(p.x * 1.5, p.y);
  float c1 = raguly(q, normalize(vec2(1.5, 1.0)), 0.06);
  float c2 = raguly(vec2(q.x, 1.0 - q.y), normalize(vec2(1.5, 1.0)), 0.06);
  float cross = max(c1, c2);
  vec3 col = mix(uPal[1], uPal[2], cross);
  float d = mix(0.22, 1.0, cross) * shade;
  return vec4(col, d);
}`,

  // Image (an engraving on white) bobbing on a glyph sea. Ship ink = density.
  galleonSea: `
vec4 SRC(vec2 uv, vec2 st, float t) {
  float ang = 0.025 * sin(t * 0.8);
  vec2 c = uv - vec2(0.5, 0.75);
  c = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * c;
  vec2 suv = c + vec2(0.5, 0.75) + vec2(0.0, 0.012 * sin(t * 1.1));
  float ship = 0.0;
  vec3 sc = uPal[2];
  if (suv.x > 0.0 && suv.y > 0.0 && suv.x < 1.0 && suv.y < 1.0) {
    float avg = luma(img(suv).rgb);
    ship = smoothstep(0.22, 0.85, 1.0 - lev(mix(lumaMin(suv), avg, 0.55)));
  }
  float horizon = 0.78;
  float sea = 0.0;
  if (st.y > horizon) {
    float k = (st.y - horizon) / (1.0 - horizon);
    float f = 26.0 + k * 10.0;
    float wv = sin(st.x * f + t * (0.9 + k) + sin(st.x * 7.0 - t * 0.6) * 1.5 + k * 9.0);
    float rows = 0.5 + 0.5 * sin(k * 60.0 - t * 0.8);
    sea = smoothstep(0.35, 1.0, wv) * rows * (0.35 + 0.65 * k);
  }
  float d = max(ship, sea * 0.75);
  vec3 col = ship > sea * 0.75 ? sc : uPal[1];
  return vec4(col, d);
}`,
};
