#version 300 es
// Custom Unicorn Studio effect (as committed to design "IHS · Retablo"). uCustomTexture1 = ihs-logo-sdf.png.
precision highp float;
precision highp int;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uCustomTexture1;
uniform vec2 uResolution;
uniform vec2 uMousePos;
uniform float uTrackMouse;
uniform float uTime;
uniform int uBlendMode;
uniform vec2 uPos;
uniform float uScale;
uniform float uDepth;
uniform float uBevel;
uniform vec3 uAxis;
uniform float uSwayAmount;
uniform vec3 uGoldColor;
uniform vec3 uShadowColor;
uniform float uBrightness;

// #region Unicorn blend helper

  vec3 blend (int blendMode, vec3 src, vec3 dst) {
    /* __UNICORN_HELPER_BLEND_BODY__: shared blend mode branches omitted for brevity. Backend expands this deterministic helper body before validation. */
  }

// #endregion

out vec4 fragColor;

const float TEX_ASPECT = 0.75;
const float SDF_RANGE_PX = 80.0;
const float MAX_DIST = 6.0;

float ign(vec2 st) { return fract(52.9829189 * fract(dot(st, vec2(0.06711056, 0.00583715)))); }

mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a); float s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

float texWidth() { return 0.6 + uScale * 2.0; }

// 2D signed distance of the emblem in object units, from the precomputed field (0.5 = edge, brighter inside)
float logo2D(vec2 q) {
  float tw = texWidth();
  vec2 half_ = vec2(tw, tw * TEX_ASPECT) * 0.5;
  vec2 uv = q / (half_ * 2.0) + 0.5;
  vec2 cuv = clamp(uv, vec2(0.002), vec2(0.998));
  float s = textureLod(uCustomTexture1, cuv, 0.0).r;
  float d = (0.5 - s) * SDF_RANGE_PX * tw / 1024.0;
  vec2 o = (uv - cuv) * half_ * 2.0;
  return d + length(o);
}

float bevelR() { return uBevel * 0.04 * texWidth() / 2.6; }
float halfDepth() { return 0.01 + uDepth * 0.16; }

float sceneField(vec3 p) {
  float r = bevelR();
  float d2 = logo2D(p.xy) + r;
  vec2 w = vec2(d2, abs(p.z) - halfDepth() + r);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - r;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0035, -0.0035);
  return normalize(e.xyy * sceneField(p + e.xyy) + e.yyx * sceneField(p + e.yyx) + e.yxy * sceneField(p + e.yxy) + e.xxx * sceneField(p + e.xxx));
}

vec2 boxHit(vec3 ro, vec3 rd, vec3 b) {
  vec3 m = 1.0 / rd;
  vec3 n = m * ro;
  vec3 k = abs(m) * b;
  vec3 t1 = -n - k;
  vec3 t2 = -n + k;
  float tN = max(max(t1.x, t1.y), t1.z);
  float tF = min(min(t2.x, t2.y), t2.z);
  return vec2(tN, tF);
}

// warm chapel environment: candle-gold key from above left, burgundy bounce from below
vec3 envLight(vec3 r) {
  float sky = smoothstep(-0.6, 0.8, r.y);
  vec3 col = mix(uShadowColor * 0.5, vec3(1.0, 0.85, 0.6) * 0.3, sky);
  float soft = pow(max(dot(r, normalize(vec3(-0.35, 0.45, 1.0))), 0.0), 5.0);
  float key = pow(max(dot(r, normalize(vec3(-0.6, 0.7, 0.45))), 0.0), 40.0);
  float rim = pow(max(dot(r, normalize(vec3(0.85, 0.15, 0.35))), 0.0), 12.0);
  float band = (1.0 - smoothstep(0.0, 0.07, abs(r.y - 0.42))) * 0.5;
  col += vec3(1.0, 0.9, 0.72) * (soft * 1.5 + key * 4.0 + band) + vec3(1.0, 0.72, 0.5) * rim * 1.1;
  return col;
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 bg = texture(uTexture, uv);
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - uPos) * vec2(aspect, 1.0) / min(aspect * 0.9, 1.0);

  float time = uTime * 0.012;
  vec2 m = (uMousePos - 0.5) * uTrackMouse;
  float yaw = uAxis.y * 6.28318530718 + sin(time) * uSwayAmount * 0.6 + m.x * 0.9;
  float pitch = uAxis.x * 6.28318530718 + sin(time * 0.73 + 1.3) * uSwayAmount * 0.18 - m.y * 0.6;
  float roll = uAxis.z * 6.28318530718;
  mat3 modelRot = rotX(pitch) * rotY(yaw) * rotZ(roll);
  mat3 invModelRot = transpose(modelRot);

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.8));
  vec3 roO = invModelRot * ro;
  vec3 rdO = invModelRot * rd;

  float tw = texWidth();
  vec3 bounds = vec3(tw * 0.5, tw * TEX_ASPECT * 0.5, halfDepth() + 0.01);
  vec2 tb = boxHit(roO, rdO, bounds);

  vec3 col = vec3(0.0);
  float cov = 0.0;
  if (tb.x < tb.y && tb.y > 0.0) {
    float t = max(tb.x, 0.0) + 0.004 * ign(gl_FragCoord.xy);
    float minD = 1.0;
    float minT = t;
    float hit = 0.0;
    for (int i = 0; i < 80; i++) {
      vec3 q = roO + rdO * t;
      float d = sceneField(q);
      if (d < minD) { minD = d; minT = t; }
      if (d < 0.0015) { hit = 1.0; break; }
      t += max(d * 0.85, 0.0015);
      if (t > tb.y) { break; }
    }
    float pix = 2.0 / uResolution.y * 3.0 / 1.8;
    if (hit < 0.5 && minD < pix) { hit = 1.0 - smoothstep(pix * 0.25, pix, minD); t = minT; }
    if (hit > 0.0) {
      vec3 q = roO + rdO * t;
      vec3 nO = calcNormal(q);
      vec3 n = modelRot * nO;
      vec3 v = -rd;
      vec3 r = reflect(rd, n);
      float ndv = clamp(dot(n, v), 0.0, 1.0);
      vec3 f0 = uGoldColor;
      vec3 fres = f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0);
      vec3 spec = envLight(r) * fres;
      float diff = clamp(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0, 1.0);
      col = spec * uBrightness * 1.6 + uGoldColor * diff * 0.12;
      // gentle tone curve so highlights roll off like gold leaf instead of clipping
      col = 1.0 - exp(-col * 1.4);
      cov = hit;
    }
  }

  vec3 blended = col;
  if (uBlendMode > 0) {
    blended = blend(uBlendMode, bg.rgb, col);
  }
  fragColor = vec4(mix(bg.rgb, blended, cov), max(bg.a, cov));
}
