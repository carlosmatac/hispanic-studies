// D · Tenebrismo: Zurbarán's Agnus Dei relit by a candle that follows the cursor (WebGL2, no dependencies).
// Relief comes from the painting's own luminance (blurred mip levels), lit by a warm point light with flicker,
// then vignette and film grain. Without WebGL2 or with reduced motion the CSS still (the painting, dimmed) stays.

const canvas = document.getElementById('candle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform vec2 uLight;
uniform float uTime;
uniform float uFade;
out vec4 outColor;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

vec2 coverUV(vec2 frag) {
  vec2 st = frag / uRes;
  float ca = uRes.x / uRes.y, ia = uImg.x / uImg.y;
  vec2 s = vec2(1.0);
  if (ca > ia) s.y = ia / ca; else s.x = ca / ia;
  return st * s + (1.0 - s) * uFocus;
}
float height(vec2 uv) {
  // big forms from a blurred level, wool and folds from a sharper one
  return luma(textureLod(uTex, uv, 3.0).rgb) * 0.7 + luma(textureLod(uTex, uv, 1.0).rgb) * 0.3;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = coverUV(frag);
  vec3 col = textureLod(uTex, uv, 0.0).rgb;
  col = pow(col, vec3(1.15));

  vec2 px = 2.5 / uImg;
  float hx = height(uv + vec2(px.x, 0.0)) - height(uv - vec2(px.x, 0.0));
  float hy = height(uv + vec2(0.0, px.y)) - height(uv - vec2(0.0, px.y));
  vec3 n = normalize(vec3(-hx * 7.0, -hy * 7.0, 1.0));

  float m = min(uRes.x, uRes.y);
  vec3 toL = vec3(uLight - frag, m * 0.22);
  float d = length(toL.xy) / m;
  vec3 L = normalize(toL);
  float flicker = 0.92 + 0.05 * sin(uTime * 7.3) + 0.03 * sin(uTime * 13.1 + 1.7);
  float att = 1.0 / (1.0 + pow(d / 0.26, 2.0));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0) * 0.18;
  vec3 warm = vec3(1.0, 0.78, 0.5);

  vec3 lit = col * (0.05 + diff * att * flicker * 2.1 * warm) + spec * att * warm * luma(col);
  // a little warm haze around the flame itself
  lit += warm * 0.035 * exp(-d * d / 0.004) * flicker;

  vec2 q = frag / uRes - 0.5;
  lit *= 1.0 - dot(q, q) * 0.9;
  lit += (hash(frag + fract(uTime) * 91.0) - 0.5) * 0.035;
  lit = 1.0 - exp(-lit * 1.25);
  outColor = vec4(mix(vec3(0.0), lit, uFade), 1.0);
}`;

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function start(img) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = (n) => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), img: u('uImg'), focus: u('uFocus'), light: u('uLight'), time: u('uTime'), fade: u('uFade') };
  gl.uniform2f(U.img, img.naturalWidth, img.naturalHeight);

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.round(canvas.clientWidth * dpr);
    H = Math.round(canvas.clientHeight * dpr);
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.res, W, H);
    const narrow = canvas.clientWidth < 700;
    gl.uniform2f(U.focus, narrow ? 0.3 : 0.62, 0.5);
  };
  resize();
  addEventListener('resize', resize);

  // the candle: follows the pointer with a little lag, drifts over the lamb when idle
  const light = { x: 0.62, y: 0.42 };
  const target = { x: 0.62, y: 0.42 };
  let lastMove = -1e9;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
    lastMove = performance.now();
  };
  addEventListener('pointermove', onMove, { passive: true });

  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    if (now - lastMove > 2500) {
      target.x = 0.6 + 0.2 * Math.sin(t * 0.21);
      target.y = 0.45 + 0.12 * Math.sin(t * 0.33 + 1.0);
    }
    light.x += (target.x - light.x) * 0.06;
    light.y += (target.y - light.y) * 0.06;
    gl.uniform2f(U.light, light.x * W, light.y * H);
    gl.uniform1f(U.time, t);
    gl.uniform1f(U.fade, Math.min(1, t / 1.6));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) requestAnimationFrame(frame);
  };
  canvas.classList.add('is-live');
  requestAnimationFrame(frame);
}

if (gl && !reduced) {
  const img = new Image();
  img.onload = () => start(img);
  img.src = '../../assets/art/zurbaran-agnus-dei.jpg';
}
