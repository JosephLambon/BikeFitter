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

export interface Rect { left: number; top: number; right: number; bottom: number }

const area = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/** Where the floating info card goes. The rule (AGENTS.md §5.1): it avoids the selected
    part, and it covers as few other parts as it can. Among equally good places it stays where
    it was (no jitter), then sits as close to the part as it can. Rects are in client pixels;
    the result is relative to the host. */
export function placeCard(
  part: Rect | readonly Rect[],
  others: readonly Rect[],
  host: { left: number; top: number; width: number },
  stageBottom: number,
  card: { width: number; height: number },
  prev?: { left: number; top: number } | null,
  gap = 8,
) {
  const cw = card.width, ch = card.height;
  const minX = 8, maxX = Math.max(8, host.width - cw - 8), minY = 8, maxY = Math.max(8, stageBottom - host.top - ch - 8);
  const mine = (Array.isArray(part) ? part : [part]) as readonly Rect[];
  const ps = mine.map((r) => ({ left: r.left - host.left, top: r.top - host.top, right: r.right - host.left, bottom: r.bottom - host.top }));
  const guards = ps.map((r) => ({ left: r.left - gap, top: r.top - gap, right: r.right + gap, bottom: r.bottom + gap }));
  // The nearest of the part's pieces anchors the side candidates and the distance.
  const p = ps[0];
  const os = others.map((o) => ({ left: o.left - host.left, top: o.top - host.top, right: o.right - host.left, bottom: o.bottom - host.top }));
  const pcx = (p.left + p.right) / 2, pcy = (p.top + p.bottom) / 2;

  const score = (x: number, y: number) => {
    const r: Rect = { left: x, top: y, right: x + cw, bottom: y + ch };
    let n = 0, a = 0;
    for (const o of os) { const k = area(r, o); if (k > 0) { n++; a += k; } }
    const d = Math.hypot(x + cw / 2 - pcx, y + ch / 2 - pcy);
    let g = 0;
    for (const q of guards) g += area(r, q);
    return [g, n, Math.round(a / 400), d] as const;
  };
  const better = (s: readonly number[], t: readonly number[]) => {
    for (let i = 0; i < s.length; i++) if (s[i] !== t[i]) return s[i] < t[i];
    return false;
  };

  // Candidates: hugging each side of the part, and a grid over the whole stage.
  const cands: [number, number][] = [
    [p.right + gap, pcy - ch / 2], [p.left - gap - cw, pcy - ch / 2], [pcx - cw / 2, p.bottom + gap], [pcx - cw / 2, p.top - gap - ch],
  ];
  const step = 16;
  for (let y = minY; y <= maxY; y += step) for (let x = minX; x <= maxX; x += step) cands.push([x, y]);
  cands.push([maxX, maxY], [minX, maxY], [maxX, minY]);

  let best: [number, number] | null = null, bestS: readonly number[] = [];
  for (const [cx, cy] of cands) {
    const x = clamp(cx, minX, maxX), y = clamp(cy, minY, maxY), s = score(x, y);
    if (!best || better(s, bestS)) { best = [x, y]; bestS = s; }
  }
  if (prev) {
    const x = clamp(prev.left, minX, maxX), y = clamp(prev.top, minY, maxY), s = score(x, y);
    // Same coverage as the best (ignoring distance): stay put.
    if (s[0] <= bestS[0] && s[1] <= bestS[1] && s[2] <= bestS[2]) { best = [x, y]; bestS = s; }
  }
  const final = score(best![0], best![1]);
  /* `clear`: the card misses the selected part entirely. */
  return { left: Math.round(best![0]), top: Math.round(best![1]), clear: final[0] === 0, covers: final[1] };
}

/** Scroll position through the reel mapped to explode progress. The first 10% of travel
    holds the bike together and the last 20% holds it apart. */
export function reelProgress(scrollY: number, reelTop: number, reelHeight: number, viewport: number, current: number) {
  const travel = reelHeight - viewport;
  if (travel <= 0) return current;
  return clamp((clamp((scrollY - reelTop) / travel) - 0.1) / 0.7);
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
