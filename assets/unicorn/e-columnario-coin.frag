#version 300 es
// Custom Unicorn Studio effect (as committed to design "IHS · Retablo"). uCustomTexture1 = columnario-height.png.
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
uniform float uThickness;
uniform float uRelief;
uniform vec3 uAxis;
uniform float uSpinSpeed;
uniform vec3 uMetalColor;
uniform vec3 uLightColor;
uniform vec3 uShadowColor;
uniform float uBrightness;

// #region Unicorn blend helper

  vec3 blend (int blendMode, vec3 src, vec3 dst) {
    /* __UNICORN_HELPER_BLEND_BODY__: shared blend mode branches omitted for brevity. Backend expands this deterministic helper body before validation. */
  }

// #endregion

out vec4 fragColor;

const float TEX_COVER = 0.98;

mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a); float s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

float coinRadius() { return 0.2 + uScale * 0.6; }
float halfThick() { return coinRadius() * (0.02 + uThickness * 0.1); }

// face relief: 0 field, 1 highest
float reliefAt(vec2 q) {
  vec2 uv = q / (coinRadius() / TEX_COVER) * 0.5 + 0.5;
  return textureLod(uCustomTexture1, uv, 0.0).r;
}

// candle-lit treasury: warm key from upper left, burgundy bounce below, soft front fill
vec3 envLight(vec3 r) {
  float sky = smoothstep(-0.6, 0.8, r.y);
  vec3 col = mix(uShadowColor * 0.6, uLightColor * 0.5, sky);
  float soft = pow(max(dot(r, normalize(vec3(-0.3, 0.5, 1.0))), 0.0), 4.0);
  float key = pow(max(dot(r, normalize(vec3(-0.65, 0.65, 0.4))), 0.0), 36.0);
  float rim = pow(max(dot(r, normalize(vec3(0.85, 0.1, 0.3))), 0.0), 10.0);
  col += uLightColor * (soft * 1.8 + key * 4.0) + uLightColor * vec3(1.0, 0.8, 0.6) * rim * 1.2;
  return col;
}

// ray vs capped cylinder along z (object space); returns t and face id (1 front, -1 back, 0 side)
vec2 coinHit(vec3 ro, vec3 rd) {
  float R = coinRadius();
  float h = halfThick();
  float best = 1e4;
  float face = 2.0;
  float a = dot(rd.xy, rd.xy);
  float b = dot(ro.xy, rd.xy);
  float c = dot(ro.xy, ro.xy) - R * R;
  float disc = b * b - a * c;
  if (disc > 0.0 && a > 1e-6) {
    float t = (-b - sqrt(disc)) / a;
    float z = ro.z + rd.z * t;
    if (t > 0.0 && abs(z) <= h) { best = t; face = 0.0; }
  }
  if (abs(rd.z) > 1e-5) {
    float tf = (h - ro.z) / rd.z;
    vec2 pf = ro.xy + rd.xy * tf;
    if (tf > 0.0 && tf < best && dot(pf, pf) <= R * R) { best = tf; face = 1.0; }
    float tb = (-h - ro.z) / rd.z;
    vec2 pb = ro.xy + rd.xy * tb;
    if (tb > 0.0 && tb < best && dot(pb, pb) <= R * R) { best = tb; face = -1.0; }
  }
  return vec2(best, face);
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 bg = texture(uTexture, uv);
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - uPos) * vec2(aspect, 1.0) / min(aspect * 0.9, 1.0);

  float time = uTime * 0.01;
  vec2 m = (uMousePos - 0.5) * uTrackMouse;
  float yaw = uAxis.y * 6.28318530718 + time * uSpinSpeed * 2.0 + m.x * 1.2;
  float pitch = uAxis.x * 6.28318530718 + sin(time * 0.7) * 0.12 - m.y * 0.7;
  float roll = uAxis.z * 6.28318530718;
  mat3 modelRot = rotX(pitch) * rotY(yaw) * rotZ(roll);
  mat3 invModelRot = transpose(modelRot);

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.8));
  vec3 roO = invModelRot * ro;
  vec3 rdO = invModelRot * rd;

  vec2 hit = coinHit(roO, rdO);
  vec3 col = vec3(0.0);
  float cov = 0.0;
  if (hit.y < 1.5) {
    vec3 q = roO + rdO * hit.x;
    float R = coinRadius();
    vec3 nO = vec3(0.0);
    float cavity = 1.0;
    if (hit.y > 0.5 || hit.y < -0.5) {
      // mirror the back face so its legend reads correctly when it turns toward you
      vec2 fq = vec2(q.x * hit.y, q.y);
      float e = R * 0.004;
      float h0 = reliefAt(fq);
      float hx = reliefAt(fq + vec2(e, 0.0)) - reliefAt(fq - vec2(e, 0.0));
      float hy = reliefAt(fq + vec2(0.0, e)) - reliefAt(fq - vec2(0.0, e));
      float k = uRelief * 6.0;
      vec3 nf = normalize(vec3(-hx * k, -hy * k, 1.0));
      nO = vec3(nf.x * hit.y, nf.y, nf.z * hit.y);
      cavity = mix(0.45, 1.0, smoothstep(0.15, 0.75, h0));
    } else {
      float ang = atan(q.y, q.x);
      vec2 radial = normalize(q.xy);
      vec2 tang = vec2(-radial.y, radial.x);
      float reed = sin(ang * 180.0);
      nO = normalize(vec3(radial + tang * reed * 0.25, 0.0));
      cavity = 0.8 + 0.2 * reed;
    }
    vec3 n = modelRot * nO;
    vec3 v = -rd;
    vec3 r = reflect(rd, n);
    float ndv = clamp(dot(n, v), 0.0, 1.0);
    vec3 fres = uMetalColor + (1.0 - uMetalColor) * pow(1.0 - ndv, 5.0);
    col = envLight(r) * fres * cavity * uBrightness * 1.7;
    col = 1.0 - exp(-col * 1.4);
  }
  // supersample only the analytic silhouette test so the coin edge stays smooth
  float px = 1.0 / uResolution.y / min(aspect * 0.9, 1.0);
  float covs = 0.0;
  covs += coinHit(roO, invModelRot * normalize(vec3(p + vec2(0.25, 0.25) * px, -1.8))).y < 1.5 ? 1.0 : 0.0;
  covs += coinHit(roO, invModelRot * normalize(vec3(p + vec2(-0.25, 0.25) * px, -1.8))).y < 1.5 ? 1.0 : 0.0;
  covs += coinHit(roO, invModelRot * normalize(vec3(p + vec2(0.25, -0.25) * px, -1.8))).y < 1.5 ? 1.0 : 0.0;
  covs += coinHit(roO, invModelRot * normalize(vec3(p + vec2(-0.25, -0.25) * px, -1.8))).y < 1.5 ? 1.0 : 0.0;
  cov = covs * 0.25;
  if (hit.y > 1.5) {
    col = uMetalColor * uLightColor * 0.35;
  }

  vec3 blended = col;
  if (uBlendMode > 0) {
    blended = blend(uBlendMode, bg.rgb, col);
  }
  fragColor = vec4(mix(bg.rgb, blended, cov), max(bg.a, cov));
}
