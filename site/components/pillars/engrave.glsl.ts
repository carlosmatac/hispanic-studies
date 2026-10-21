/* The intaglio shader for the pillar plates.

   Input: one greyscale texture per plate, the photograph's tone already
   normalised (tools: see assets/art/SOURCES.md). Everything else is drawn
   here, per pixel, in device pixels:

   1. Contour: the outlines of the relief, cut first.
   2. Hatching: horizontal lines whose width follows the shadow and which
      bend with the relief (the banknote / engraved-plate technique), cut
      line by line from the top, left to right, like a burin.
   3. Cross-hatching in the deepest shadows, last.
   4. Gilding: a burgundy bole wash, then gold leaf over the raised parts
      (it wears through to the bole in the recesses), lit by a light whose
      direction follows the pointer.

   uEngrave and uGild run 0→1; both at 1 is the finished plate. */

export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;        // canvas size, device px
uniform vec4 uCrop;       // uv = uCrop.xy + q * uCrop.zw (object-fit: cover)
uniform float uP;         // line period, device px
uniform float uEngrave;
uniform float uGild;
uniform vec3 uLight;
out vec4 outColor;

const vec3 PAPER  = vec3(0.976, 0.953, 0.867);
const vec3 INK    = vec3(0.278, 0.043, 0.082);   // --burgundy
const vec3 INK_D  = vec3(0.184, 0.027, 0.051);   // --burgundy-dark
const vec3 GOLD_D = vec3(0.431, 0.282, 0.094);
const vec3 GOLD   = vec3(0.745, 0.557, 0.227);
const vec3 GOLD_L = vec3(0.980, 0.894, 0.627);

// 1 well behind a front moving along x, 0 ahead of it (GLSL smoothstep needs edge0 < edge1)
float behind(float front, float width, float x) { return 1.0 - smoothstep(front - width, front, x); }

float tone(vec2 uv, float lod) { return textureLod(uTex, uv, lod).r; }
float soft(vec2 uv, float lod, vec2 t) {
  return (tone(uv, lod) * 4.0
        + tone(uv + vec2(t.x, 0.0), lod) + tone(uv - vec2(t.x, 0.0), lod)
        + tone(uv + vec2(0.0, t.y), lod) + tone(uv - vec2(0.0, t.y), lod)) / 8.0;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);   // y down
  vec2 q = px / uRes;
  vec2 uv = uCrop.xy + q * uCrop.zw;
  vec2 tx = 1.0 / vec2(textureSize(uTex, 0));

  float Ls = soft(uv, 0.6, tx * 1.2);            // tone the lines follow
  float Lb = soft(uv, 1.4, tx * 2.0);            // smoother, for edges and light
  float gx = soft(uv + vec2(tx.x * 2.0, 0.0), 1.4, tx * 2.0) - soft(uv - vec2(tx.x * 2.0, 0.0), 1.4, tx * 2.0);
  float gy = soft(uv + vec2(0.0, tx.y * 2.0), 1.4, tx * 2.0) - soft(uv - vec2(0.0, tx.y * 2.0), 1.4, tx * 2.0);
  // central difference over 4 texels → per-texel slope, as in the prototype
  gx *= 0.25; gy *= 0.25;
  float D = 1.0 - Ls;

  // --- the burin: where each line is and whether it has been cut yet
  float yy = px.y + (Ls - 0.5) * uP * 1.3;
  float row = floor(yy / uP);
  float rows = uRes.y / uP;
  float rowN = row / rows;
  float xN = q.x;
  float lag = 7.0 / rows;                                   // a line takes 7 line-heights to cut
  float hatchT = clamp((uEngrave - 0.12) / 0.74, 0.0, 1.0) * (1.0 + lag);
  float cutAt = rowN + xN * lag;
  float cut = step(cutAt, hatchT);

  float f = abs(fract(yy / uP) - 0.5) * 2.0;
  float w = clamp(D * 0.95, 0.0, 0.92);
  float aa = max(fwidth(f), 1e-3);
  float ink1 = (1.0 - smoothstep(w - aa, w + aa, f)) * cut;

  // the burin tip: a short bright spark at the cutting front
  float tip = (1.0 - smoothstep(0.0, lag * 0.35, hatchT - cutAt)) * step(cutAt, hatchT)
            * (1.0 - smoothstep(0.0, 0.5, f)) * step(0.001, hatchT) * step(hatchT, 1.0 + lag - 0.001);

  // contours, wiped in from the top ahead of the hatching
  float edge = length(vec2(gx, gy));
  float contourT = clamp(uEngrave / 0.4, 0.0, 1.0) * 1.15;
  float ink3 = smoothstep(0.05, 0.085, edge) * behind(contourT, 0.15, q.y);

  // cross-hatching at 60°, only in deep shadow, last
  float u = dot(px, vec2(0.5, 0.866)) / uP;
  float f2 = abs(fract(u) - 0.5) * 2.0;
  float w2 = clamp((D - 0.68) * 2.4, 0.0, 0.8);
  float aa2 = max(fwidth(f2), 1e-3);
  float crossT = clamp((uEngrave - 0.7) / 0.3, 0.0, 1.0) * 1.2;
  float ink2 = (1.0 - smoothstep(w2 - aa2, w2 + aa2, f2)) * behind(crossT, 0.2, (q.x + q.y) * 0.5);

  float ink = clamp(max(max(ink1, ink2), ink3), 0.0, 1.0);

  // --- gilding: bole first, gold leaf behind it, sweeping corner to corner
  float diag = q.x * 0.35 + q.y * 0.65;
  float front = uGild * 1.4;
  float bole = behind(front, 0.06, diag);
  float leafT = behind(front - 0.2, 0.1, diag);
  float sheen = smoothstep(front - 0.34, front - 0.26, diag) * behind(front - 0.18, 0.08, diag);

  vec3 n = normalize(vec3(-gx * 14.0, -gy * 14.0, 1.0));
  vec3 l = normalize(uLight);
  float diff = clamp(dot(n, l), 0.0, 1.0);
  vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));
  float spec = pow(clamp(dot(n, h), 0.0, 1.0), 24.0);
  float t = clamp(Ls * 0.4 + diff * 0.95 - 0.25, 0.0, 1.0);
  vec3 gold = mix(GOLD_D, GOLD, smoothstep(0.0, 1.0, t));
  gold = mix(gold, GOLD_L, clamp(spec + pow(diff, 5.0) * 0.35, 0.0, 1.0));
  float cover = clamp((Ls - 0.22) / 0.25, 0.0, 1.0);        // worn through to the bole in the recesses

  vec3 ground = mix(PAPER, mix(PAPER, INK, 0.86), bole);
  ground = mix(ground, mix(INK, gold, cover), leafT);
  ground = mix(ground, GOLD_L, sheen * 0.55 * cover);
  vec3 inkCol = mix(INK, INK_D, leafT);
  vec3 col = mix(ground, inkCol, ink);
  col = mix(col, GOLD_L, tip * 0.9);
  outColor = vec4(col, 1.0);
}
`;
