/* The pillar plates' shader.

   Input, per frame of a column's turntable (rendered in Blender,
   tools/blender/): a clay pass (light and shade only, on white) and the
   gilded render (RGBA). Two neighbouring frames are blended so the turn is
   smooth between frames.

   1. Engraving, from the clay pass: the contour first, then horizontal lines
      whose width follows the shadow and which bend with the relief, cut line
      by line from the top like a burin, then cross-hatching in deep shadow.
   2. Gilding: a burgundy bole wash crosses the column, the gilded render
      follows it, a sheen rides the front.

   uEngrave and uGild run 0→1; both at 1 is the gilded column, as rendered. */

export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTone0;
uniform sampler2D uTone1;
uniform sampler2D uGold0;
uniform sampler2D uGold1;
uniform float uMix;       // blend between frame i and i+1
uniform vec2 uRes;        // canvas size, device px
uniform vec4 uCrop;       // uv = uCrop.xy + q * uCrop.zw (object-fit: cover)
uniform float uP;         // line period, device px
uniform float uEngrave;
uniform float uGild;
out vec4 outColor;

const vec3 PAPER  = vec3(0.976, 0.953, 0.867);
const vec3 INK    = vec3(0.278, 0.043, 0.082);   // --burgundy
const vec3 GOLD_L = vec3(0.980, 0.894, 0.627);

// 1 well behind a front moving along x, 0 ahead of it (smoothstep needs edge0 < edge1)
float behind(float front, float width, float x) { return 1.0 - smoothstep(front - width, front, x); }

float tone(vec2 uv, float lod) { return mix(textureLod(uTone0, uv, lod).r, textureLod(uTone1, uv, lod).r, uMix); }
float soft(vec2 uv, float lod, vec2 t) {
  return (tone(uv, lod) * 4.0
        + tone(uv + vec2(t.x, 0.0), lod) + tone(uv - vec2(t.x, 0.0), lod)
        + tone(uv + vec2(0.0, t.y), lod) + tone(uv - vec2(0.0, t.y), lod)) / 8.0;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);   // y down
  vec2 q = px / uRes;
  vec2 uv = uCrop.xy + q * uCrop.zw;
  vec2 tx = 1.0 / vec2(textureSize(uTone0, 0));

  // --- engraving, from the clay pass
  float Ls = soft(uv, 0.0, tx * 0.8);
  float gx = (soft(uv + vec2(tx.x, 0.0), 0.5, tx) - soft(uv - vec2(tx.x, 0.0), 0.5, tx)) * 0.5;
  float gy = (soft(uv + vec2(0.0, tx.y), 0.5, tx) - soft(uv - vec2(0.0, tx.y), 0.5, tx)) * 0.5;
  float D = clamp((1.0 - Ls) * 1.15, 0.0, 1.0);

  float yy = px.y + (Ls - 0.5) * uP * 1.3;
  float row = floor(yy / uP);
  float rows = uRes.y / uP;
  float rowN = row / rows;
  float lag = 7.0 / rows;                                   // a line takes 7 line-heights to cut
  float hatchT = clamp((uEngrave - 0.12) / 0.74, 0.0, 1.0) * (1.0 + lag);
  float cutAt = rowN + q.x * lag;
  float cut = step(cutAt, hatchT);
  float f = abs(fract(yy / uP) - 0.5) * 2.0;
  float w = clamp(D * 0.95, 0.0, 0.9);
  float aa = max(fwidth(f), 1e-3);
  float ink1 = (1.0 - smoothstep(w - aa, w + aa, f)) * cut * smoothstep(0.03, 0.08, D);
  float tip = (1.0 - smoothstep(0.0, lag * 0.35, hatchT - cutAt)) * step(cutAt, hatchT)
            * (1.0 - smoothstep(0.0, 0.5, f)) * step(0.04, D) * step(hatchT, 1.0 + lag - 0.001);

  float edge = length(vec2(gx, gy));
  float contourT = clamp(uEngrave / 0.4, 0.0, 1.0) * 1.15;
  float ink3 = smoothstep(0.06, 0.12, edge) * behind(contourT, 0.15, q.y);

  float u = dot(px, vec2(0.5, 0.866)) / uP;
  float f2 = abs(fract(u) - 0.5) * 2.0;
  float w2 = clamp((D - 0.62) * 2.2, 0.0, 0.8);
  float aa2 = max(fwidth(f2), 1e-3);
  float crossT = clamp((uEngrave - 0.7) / 0.3, 0.0, 1.0) * 1.2;
  // scaled by its own width: at zero width the anti-aliasing band would still draw a hairline
  float ink2 = (1.0 - smoothstep(w2 - aa2, w2 + aa2, f2)) * smoothstep(0.0, 0.06, w2) * behind(crossT, 0.2, (q.x + q.y) * 0.5);

  float ink = clamp(max(max(ink1, ink2), ink3), 0.0, 1.0);
  vec3 col = mix(PAPER, INK, ink);
  col = mix(col, GOLD_L, tip * 0.9);

  // --- gilding: the bole wash crosses the column, the gilded render follows
  vec4 g = mix(texture(uGold0, uv), texture(uGold1, uv), uMix);
  float diag = q.x * 0.35 + q.y * 0.65;
  float front = uGild * 1.4;
  float bole = behind(front, 0.06, diag) * g.a;
  float leaf = behind(front - 0.2, 0.1, diag);
  float sheen = smoothstep(front - 0.34, front - 0.26, diag) * behind(front - 0.18, 0.08, diag) * g.a;

  col = mix(col, mix(INK, PAPER, 0.12), bole);
  col = mix(col, mix(PAPER, g.rgb, g.a), leaf);
  col = mix(col, GOLD_L, sheen * 0.45);
  outColor = vec4(col, 1.0);
}
`;
