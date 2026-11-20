/* Pure logic for the exploded bike and its stage. Ported from designs/shared/bike.js and
   designs/site/site.js so it can be unit-tested away from the DOM. */

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
/** Cubic ease-in-out. */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const r1 = (v: number) => Math.round(v * 10) / 10;

/** How far a part has moved at a given slider progress, in SVG space (y down). */
export function explodeOffset(part: { v: [number, number]; w: [number, number] }, progress: number) {
  const [w0, w1] = part.w;
  const t = ease(clamp((progress - w0) / (w1 - w0)));
  return { x: r1(part.v[0] * t) + 0, y: r1(-part.v[1] * t) + 0 };
}

export interface Box { x: number; y: number; width: number; height: number }

/** A viewBox that frames the drawing with padding, matched to the stage's aspect ratio. Extra
    height goes above and below the drawing, or all above it when `anchorBottom` is set (so a
    bike on a workbench stays on the bench, not floating mid-stage). */
export function fitViewBox(b: Box, progress: number, aspect: number, anchorBottom = false): [number, number, number, number] | null {
  if (!b.width) return null;
  const pad = 24 + 36 * progress;
  let x = b.x - pad, y = b.y - pad, w = b.width + pad * 2, h = b.height + pad * 2;
  if (w / h < aspect) { const nw = h * aspect; x -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y -= anchorBottom ? nh - h : (nh - h) / 2; h = nh; }
  return [r1(x), r1(y), r1(w), r1(h)];
}

/** Scroll position through the reel mapped to explode progress. The first 10% of travel
    holds the bike together and the last 20% holds it apart. */
export function reelProgress(scrollY: number, reelTop: number, reelHeight: number, viewport: number, current: number) {
  const travel = reelHeight - viewport;
  if (travel <= 0) return current;
  return clamp((clamp((scrollY - reelTop) / travel) - 0.1) / 0.7);
}

/** How far the opening heading has tucked away (0..1) on larger screens, so the bench wall can
    grow into its space. It waits until the reel is 55% through (the bike mostly apart), then eases
    out over the next 30%, scroll-linked so it moves exactly with the page. */
export function tuckProgress(scrollY: number, reelTop: number, reelHeight: number, viewport: number) {
  const travel = reelHeight - viewport;
  if (travel <= 0) return 0;
  const k = clamp((clamp((scrollY - reelTop) / travel) - 0.55) / 0.3);
  return k * k * (3 - 2 * k);
}

/** After the button or slider takes over, scroll takes control back only once it reaches or
    crosses the bike's current state, so the drawing never jumps. */
export const caughtUp = (mapped: number, lastMapped: number, progress: number) =>
  (mapped - progress) * (lastMapped - progress) <= 0;

/** How far the "Select any part" heading has replaced the opening one (0..1). */
export const headBlend = (progress: number, reducedMotion: boolean) =>
  reducedMotion ? 0 : clamp((progress - 0.02) / 0.18);

/** Screen-reader text for the explode slider. */
export function sliderText(progress: number) {
  if (progress < 0.01) return 'Together';
  if (progress > 0.99) return 'Fully apart';
  return Math.round(progress * 100) + '% apart';
}
