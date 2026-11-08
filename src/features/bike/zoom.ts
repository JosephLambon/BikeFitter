/* Zooming the diagram on its own (pinch, double-tap, ctrl + wheel), never the page.
   A zoom is a scale plus where the zoomed view starts, as fractions of the base view, so it
   follows the drawing as the base view changes while the bike comes apart. The zoomed view
   always stays inside the base view: nothing to scroll, no scrollbars. */
export type ViewBox = [number, number, number, number];
export interface Zoom { s: number; fx: number; fy: number }

export const IDENTITY: Zoom = { s: 1, fx: 0, fy: 0 };
export const MAX_ZOOM = 4;
/** The zoom a double-tap jumps to. */
export const TAP_ZOOM = 2.5;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fit = (z: Zoom): Zoom => {
  const s = clamp(z.s, 1, MAX_ZOOM), room = 1 - 1 / s;
  return { s, fx: clamp(z.fx, 0, room), fy: clamp(z.fy, 0, room) };
};

export function zoomViewBox([x, y, w, h]: ViewBox, z: Zoom): ViewBox {
  const r = (v: number) => Math.round(v * 10) / 10;
  return [r(x + z.fx * w), r(y + z.fy * h), r(w / z.s), r(h / z.s)];
}

/** Zoom to scale `s`, keeping the point at (`px`, `py`) (fractions across the visible view) still. */
export function zoomAt(z: Zoom, s: number, px: number, py: number): Zoom {
  const ns = clamp(s, 1, MAX_ZOOM);
  // The point in base-view fractions stays put: fx + px / s = fx' + px / s'.
  return fit({ s: ns, fx: z.fx + px / z.s - px / ns, fy: z.fy + py / z.s - py / ns });
}

/** Pan by a distance given as fractions of the visible view (a finger drag right is negative). */
export const panBy = (z: Zoom, dx: number, dy: number): Zoom => fit({ s: z.s, fx: z.fx + dx / z.s, fy: z.fy + dy / z.s });

export const isZoomed = (z: Zoom) => z.s > 1.001;

/** How long zooming back out takes: quick, so it still feels like a snap. */
export const ZOOM_OUT_MS = 240;

/** The zoom `k` of the way (0..1) from `a` to `b`. The visible view's width and origin move in a
    straight line, so the drawing glides without swinging sideways. */
export function zoomBetween(a: Zoom, b: Zoom, k: number): Zoom {
  const t = Math.max(0, Math.min(1, k));
  const w = 1 / a.s + (1 / b.s - 1 / a.s) * t;
  return { s: 1 / w, fx: a.fx + (b.fx - a.fx) * t, fy: a.fy + (b.fy - a.fy) * t };
}
