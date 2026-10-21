/* ==========================================================================
   The corridor.

   A CSS 3D hallway with paintings hung on both walls, receding into the dark.
   Scrolling flies you down it, and the chronology is laid out along its
   length: every waypoint is a year you pass.

   The whole scene moves with ONE transform on a single parent. Every plane is
   positioned once at build time and never touched again, so a frame costs one
   style write regardless of how many pictures are hanging. Depth is faked into
   the distance by a fog overlay rather than by per-plane opacity, for the same
   reason.
   ========================================================================== */

const NS_IMG = 'img';

/* Hall geometry, in CSS pixels of 3D space.

   The pictures face the viewer rather than sitting flat against the walls.
   A plane rotated a full 90° is edge-on to anyone looking straight down the
   middle, which renders it as a sliver: physically right, visually useless.
   They are arranged around the mouth of the frustum and turned only slightly
   inward, so you read the painting and still feel the walls. */
const HALF_W = 980;      // how far out to the left and right they hang
const HALF_H = 640;      // and above and below
const GAP = 300;         // spacing from one picture to the next
const TURN = 13;         // degrees each one turns back toward the centre
const START = 700;       // the first ones hang ahead of you, not on you

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * @param {Element} host
 * @param {object} opts
 * @param {string[]} opts.images   picture urls, cycled along the hall
 * @param {number}   opts.planes   how many pictures to hang
 * @param {number}   [opts.seed]   deterministic variation
 */
export function buildCorridor(host, { images, planes = 72, seed = 7 }) {
  /* The ring is sized in 3D pixels but read against the viewport, so on a
     narrow screen the same radius lands inside the text column. Widen it a
     little — the heavy lifting on a phone is done by a longer lens in the
     stylesheet, which moves the camera back rather than stretching the room. */
  const spread = Math.min(1.14, Math.max(1, 1180 / Math.max(360, Math.min(window.innerWidth, 1180))));
  const halfW = HALF_W * spread;
  const halfH = HALF_H * spread;

  host.textContent = '';
  const scene = document.createElement('div');
  scene.className = 'corridor__scene';
  host.appendChild(scene);

  // a small deterministic PRNG: the hall should look hand-hung, but identically
  // so on every load, or the layout would shift under a reload mid-scroll
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const depth = planes * GAP;

  /* Eight slots around a ring, so pictures sweep past evenly on every side
     and the middle of the frame stays clear for the words. */
  const RING = [
    [-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55],
    [-0.46, -1], [0.46, -1], [-0.46, 1], [0.46, 1],
  ];

  for (let i = 0; i < planes; i += 1) {
    const [rx, ry] = RING[i % RING.length];
    const z = -(START + i * GAP);
    const frame = document.createElement('figure');
    frame.className = 'frame';

    // hand-hung variation in size and position, never toward the axis
    const h = 250 + rnd() * 230;
    const w = h * (0.72 + rnd() * 0.4);
    const x = rx * (halfW + rnd() * 240 * spread);
    const y = ry * (halfH + rnd() * 170 * spread);
    const tilt = (rnd() - 0.5) * 3;

    frame.style.width = `${Math.round(w)}px`;
    frame.style.height = `${Math.round(h)}px`;
    frame.style.transform =
      `translate3d(${Math.round(x)}px, ${Math.round(y)}px, ${Math.round(z)}px) `
      + `rotateY(${(-Math.sign(x) * TURN).toFixed(1)}deg) `
      + `rotateX(${(Math.sign(y) * TURN * 0.55).toFixed(1)}deg) `
      + `rotateZ(${tilt.toFixed(2)}deg)`;

    const img = document.createElement(NS_IMG);
    // a stride that is coprime with the ring, so the same picture never ends
    // up hanging opposite itself
    img.src = images[(i * 7) % images.length];
    img.alt = '';
    img.loading = i < 10 ? 'eager' : 'lazy';
    img.decoding = 'async';
    frame.appendChild(img);
    scene.appendChild(frame);
  }

  // a floor line and a ceiling line give the eye the vanishing point
  for (const [cls, y] of [['corridor__floor', halfH + 190], ['corridor__ceil', -(halfH + 190)]]) {
    const el = document.createElement('div');
    el.className = cls;
    el.style.transform = `translate3d(-50%, ${y}px, ${-depth / 2}px) rotateX(90deg)`;
    el.style.width = `${halfW * 2.4}px`;
    el.style.height = `${depth}px`;
    scene.appendChild(el);
  }

  let z = 0;
  return {
    depth,
    /** @param {number} v distance travelled into the hall, in 3D px */
    travel(v) {
      z = v;
      scene.style.transform = `translateZ(${v.toFixed(1)}px)`;
    },
    get z() { return z; },
  };
}

/**
 * Map the page scroll across a tall section to 0..1.
 * Returns a live getter rather than firing callbacks: the caller already has
 * a frame loop, and two sources of truth for "where am I" is one too many.
 */
export function sectionProgress(section) {
  return () => {
    const r = section.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-r.top / total, 0, 1);
  };
}

/**
 * A smoothed value. Scroll arrives in jumps, especially on a trackpad with
 * momentum; easing toward the target is what makes the hall feel like gliding
 * rather than stuttering.
 */
export function smoothed(initial = 0, ease = 0.1) {
  let current = initial;
  let target = initial;
  return {
    set(v) { target = v; },
    jump(v) { current = v; target = v; },
    step() {
      const d = target - current;
      current += Math.abs(d) < 0.0001 ? d : d * ease;
      return current;
    },
    get value() { return current; },
    get target() { return target; },
  };
}
