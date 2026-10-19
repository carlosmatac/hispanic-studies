/* ==========================================================================
   Motion.

   One rule governs everything here: motion must carry content. A heading that
   wipes in is carrying the fact that you arrived at it; a map that advances as
   you scroll is carrying two thousand years. Decoration that moves for its own
   sake is not in this file.

   Every effect has a designed still state under prefers-reduced-motion — not
   `animation: none`, an actual finished state. See docs/brand/brand-plan.md.
   ========================================================================== */

export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* A single scroll-driven watcher. IntersectionObserver would be the obvious
   tool, but hiding content until an observer fires makes the page depend on
   that observer actually firing — and when it does not (headless capture, an
   older engine, a restored tab) the reader gets a blank section. This runs an
   initial synchronous pass and then rides the scroll, so content can only
   fail safe. */
const watchers = new Set();
let watching = false;
let lastRun = 0;

function runWatchers() {
  lastRun = performance.now();
  const vh = window.innerHeight;
  for (const w of [...watchers]) {
    const r = w.el.getBoundingClientRect();
    // "has this reached the reveal line", not "is it on screen right now".
    // Anything already scrolled past is revealed too, so an anchor jump, a
    // restored scroll position or a fast flick can never strand a section
    // permanently invisible above the viewport.
    const reached = r.top < vh * (1 - w.margin);
    if (reached) {
      watchers.delete(w);
      w.fire();
    }
  }
  if (!watchers.size && watching) {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    watching = false;
  }
}

/* Throttled by elapsed time rather than by requestAnimationFrame. A frame
   callback is the usual choice, but it is not guaranteed to be delivered
   (background tab, headless capture), and a reveal that never runs leaves the
   reader looking at nothing. Reading a dozen rects at 60Hz costs nothing. */
function schedule() {
  if (performance.now() - lastRun < 16) return;
  runWatchers();
}

/** Fire `cb` once, when `el` is `margin` of a viewport height into view. */
function whenInView(el, cb, margin = 0.1) {
  watchers.add({ el, fire: cb, margin });
  if (!watching) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    watching = true;
  }
}

/**
 * Run the pass now, synchronously. Called once after registration so anything
 * already on screen is revealed in the same frame the page paints: no flash of
 * hidden hero, and nothing depends on a later animation frame arriving.
 */
export function flushWatchers() {
  runWatchers();
}

/**
 * Reveal on entry. Adds `is-in` once and never removes it: content that has
 * been read does not un-reveal itself when you scroll back.
 *
 * Opt in with `data-reveal` in the markup. `data-reveal-stagger` on a parent
 * walks its children instead, delaying each one.
 *
 * The hidden state lives behind `.js-motion` on <html>, which this sets. With
 * JavaScript off, or if this never runs, every section is simply visible.
 */
export function observeReveals(root = document) {
  const targets = [...root.querySelectorAll('[data-reveal], [data-reveal-stagger]')];

  const reveal = (el) => {
    if (el.hasAttribute('data-reveal-stagger')) {
      const step = REDUCED ? 0 : Number(el.dataset.revealStagger) || 70;
      [...el.children].forEach((kid, i) => {
        kid.style.setProperty('--d', `${i * step}ms`);
        kid.classList.add('is-in');
      });
    }
    el.classList.add('is-in');
  };

  if (REDUCED) {
    for (const el of targets) reveal(el);
    return;
  }

  document.documentElement.classList.add('js-motion');
  for (const el of targets) whenInView(el, () => reveal(el), 0.12);
  flushWatchers();
}

/**
 * Count a number up when it comes into view. The figures on this page are
 * read off the data, so this animates a real value rather than inventing one.
 */
export function countUp(el, value, ms = 1100) {
  const target = Number(value);
  if (!Number.isFinite(target)) { el.textContent = value; return; }
  if (REDUCED) { el.textContent = target; return; }

  whenInView(el, () => {
    // t0 comes from the first frame callback, never from performance.now():
    // the two clocks are not guaranteed to share an epoch, and subtracting
    // one from the other sent these counters to -12252.
    let t0 = null;
    let done = false;
    const tick = (now) => {
      if (done) return;
      if (t0 === null) t0 = now;
      const t = Math.min(1, Math.max(0, (now - t0) / ms));
      el.textContent = Math.round(target * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(tick);
      else { done = true; el.textContent = target; }
    };
    requestAnimationFrame(tick);
    // and a frame callback that never arrives must not leave a half-counted
    // figure on screen: these are real numbers from the data
    setTimeout(() => { done = true; el.textContent = target; }, ms + 250);
  }, 0.25);
}

/** Fire `cb` once when `el` scrolls into view. Exported for the canon chart. */
export { whenInView };

/**
 * Drive a callback from a run of step elements scrolling past a sticky stage.
 * The step whose midpoint is nearest the middle of the viewport wins, so the
 * active frame is always the one you are actually looking at.
 *
 * Returns a `goTo(index)` that scrolls to a step, so the rail and the scroll
 * cannot disagree about where you are.
 */
export function scrollSteps(steps, onChange) {
  let current = -1;
  let last = 0;

  const pick = () => {
    last = performance.now();
    const mid = window.innerHeight * 0.5;
    let best = 0;
    let bestD = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== current) { current = best; onChange(best); }
  };

  const onScroll = () => {
    if (performance.now() - last < 16) return;
    pick();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  pick();

  return {
    goTo(i) {
      const s = steps[Math.max(0, Math.min(steps.length - 1, i))];
      if (!s) return;
      const r = s.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.5,
        behavior: REDUCED ? 'auto' : 'smooth',
      });
    },
    get index() { return current; },
  };
}

/** A hairline progress bar for the whole document. */
export function scrollProgress(bar) {
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

/**
 * A card that follows the pointer and stays inside the viewport.
 * Used by the canon chart, where the detail panel used to sit so far below the
 * dot you were pointing at that you could not read both at once.
 */
export function makeHoverCard(host) {
  const card = document.createElement('div');
  card.className = 'hovercard';
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  host.appendChild(card);

  let raf = 0;
  let pending = null;

  const place = () => {
    raf = 0;
    if (!pending) return;
    const { x, y } = pending;
    const hostBox = host.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    // prefer above-right of the point, flip when it would leave the plate
    let left = x - hostBox.left + 16;
    let top = y - hostBox.top - h - 14;
    if (left + w > hostBox.width - 6) left = x - hostBox.left - w - 16;
    if (left < 6) left = 6;
    if (top < 6) top = y - hostBox.top + 20;
    card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };

  return {
    show(html, x, y) {
      card.innerHTML = html;
      card.hidden = false;
      pending = { x, y };
      if (!raf) raf = requestAnimationFrame(place);
      card.classList.add('is-in');
    },
    move(x, y) {
      pending = { x, y };
      if (!raf) raf = requestAnimationFrame(place);
    },
    hide() {
      card.classList.remove('is-in');
      card.hidden = true;
    },
  };
}
