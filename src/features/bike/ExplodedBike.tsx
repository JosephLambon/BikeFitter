/* The exploded road bike: original artwork (see drawing.ts). Hover, tap or keyboard selects a
   part; the selected part goes Bike amber and the rest ghost; an info card explains it.
   Ported from designs/shared/bike.js.
   With a `build`, only that build's parts are drawn, and changing it plays a swap: leaving parts
   fly, roll or retract away, arriving ones follow, and deeper rims grow while the wheels spin. */
import { createPortal } from 'react-dom';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { SOURCES } from '../../content/sources';
import type { Build } from './build';
import { clamp, ease, explodeOffset, fitViewBox, placeCard, type Box as VBox, type Rect } from './explode';
import { separate, type Piece } from './layout';
import { IDENTITY, TAP_ZOOM, isZoomed, panBy, zoomAt, zoomViewBox, type ViewBox, type Zoom } from './zoom';
import { B, BENCH_BOTTOM, FA, RA, REST_BOTTOM, ST, add, benchMarkup, groundMarkup, pt, type Pt } from './drawing';
import { FRAGMENTS, PARTS, drawnFragments, inBuild, partInfo, partsFor, unitOf, type Fragment, type PartDef, type Swap } from './parts';
import { motion } from '../../theme/tokens';
import './bike.css';

const fragKey = (f: Fragment) => f.fragId + '@' + f.layer;
/* The fragment that takes keyboard focus for each part: the first one drawn of the fragment
   that carries the part's copy (so the front wheel's, not the rear's). */
const FOCUS_FRAG = new Map<string, string>();
for (const f of FRAGMENTS) if (f.part.what && !FOCUS_FRAG.has(f.key)) FOCUS_FRAG.set(f.key, fragKey(f));
const PART_OF = new Map(PARTS.map((p) => [p.id, p]));

/* Swap timing. Leaving parts go first and fast; arriving ones follow and settle. */
const OUT_MS = 480, IN_MS = 720, IN_AFTER_OUT = 240, RIM_MS = 950;
const EASE_OUT = 'cubic-bezier(.55, 0, .8, .2)';

/** Where a part sits when it is off the bike, as WAAPI keyframe fields. */
function offStage(s: Swap = {}) {
  const t = `translate(${s.x ?? 0}px, ${-(s.y ?? 0)}px) rotate(${s.rotate ?? 0}deg) scale(${s.scale ?? 1})`;
  return { transform: t, opacity: 0 };
}
/** Point a swap's rotation and scale at the right place: the axle it names, or the part's centre. */
function aim(el: SVGGElement, s: Swap = {}) {
  el.style.transformBox = s.about ? 'view-box' : 'fill-box';
  el.style.transformOrigin = s.about ? `${s.about.x}px ${-s.about.y}px` : 'center';
}
const swapEls = (host: HTMLElement, fragId: string) =>
  [...host.querySelectorAll<SVGGElement>(`.bx-part[data-frag="${fragId}"] > .bx-swap`)];

/** Play one part's arrival or departure. Resolves when it has finished (or was cancelled). */
function playSwap(host: HTMLElement, part: PartDef, dir: 'in' | 'out', delay: number): Promise<unknown> {
  const s = part.swap ?? {}, runs: Promise<unknown>[] = [];
  for (const el of swapEls(host, part.id)) {
    el.getAnimations().forEach((a) => a.cancel());
    aim(el, s);
    const off = offStage(s), on = { transform: 'none', opacity: 1 };
    const opts: KeyframeAnimationOptions = dir === 'in'
      ? { duration: IN_MS, delay: delay + (s.delay ?? 0), easing: motion.rise, fill: 'backwards' }
      : { duration: OUT_MS, delay: s.delay ? s.delay / 2 : 0, easing: EASE_OUT, fill: 'forwards' };
    if (s.draw) {
      // Cables draw themselves along their length, from the lever end.
      for (const path of el.querySelectorAll('path')) {
        const k = [{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }];
        runs.push(path.animate(dir === 'in' ? k : [...k].reverse(), { ...opts, duration: dir === 'in' ? IN_MS + 300 : OUT_MS }).finished);
      }
      const fade = [{ opacity: 0 }, { opacity: 1 }];
      runs.push(el.animate(dir === 'in' ? fade : [...fade].reverse(), { ...opts, duration: 160, delay: dir === 'in' ? opts.delay : OUT_MS - 160 }).finished);
    } else {
      runs.push(el.animate(dir === 'in' ? [off, on] : [on, off], opts).finished);
    }
  }
  return Promise.all(runs).catch(() => undefined);
}

/** Spin the wheels once about their axles while the rims change depth. */
function spinWheels(host: HTMLElement) {
  for (const [suffix, axle] of [['-f', FA], ['-r', RA]] as const) {
    for (const id of ['rim', 'spokes', 'valve', 'hub', 'tyre']) {
      for (const el of swapEls(host, id + suffix)) {
        aim(el, { about: axle });
        el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: RIM_MS, easing: 'cubic-bezier(.45, 0, .2, 1)' });
      }
    }
  }
}

/** An electronic shift: the rear mech steps across and back, twice. */
function shiftMech(host: HTMLElement, delay: number) {
  for (const id of ['rearmech', 'battery-r']) {
    for (const el of swapEls(host, id)) {
      el.animate(
        [{ transform: 'none' }, { transform: 'translate(-9px, 0)', offset: 0.2 }, { transform: 'none', offset: 0.45 }, { transform: 'translate(-6px, 0)', offset: 0.65 }, { transform: 'none' }],
        { duration: 700, delay, easing: 'ease-in-out', composite: 'add' },
      );
    }
  }
}

/** Card widths to try, narrowest first: wider cards are shorter, so they fit above or below a big part. */
const CARD_WIDTHS = [300, 400, 520, 640, 760];
interface CardPos { left: number; top: number; width: number; clear: boolean; covers: number }

/** Clear space between parts when the bike is fully apart, in mm. */
const LAYOUT_GAP = 28;
/** How far each part's strokes reach beyond its geometry (getBBox leaves strokes out). */
const STROKE_REACH = new Map<string, number>();
for (const f of FRAGMENTS) {
  const widths = [...f.markup.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => +m[1] / 2 + 1);
  STROKE_REACH.set(f.part.id, Math.max(STROKE_REACH.get(f.part.id) ?? 2, ...widths));
}
const unionBox = (a: VBox | null, b: VBox): VBox => {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
};
const unionRect = (a: Rect | null, b: Rect): Rect =>
  a ? { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) }
    : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };

/** Rects of the drawn parts in client pixels, one per part definition (its fragments together). */
function partRects(host: HTMLElement, skipKey?: string | null) {
  const by = new Map<string, Rect>();
  host.querySelectorAll<SVGGElement>('.bx-part:not(.is-leaving)').forEach((g) => {
    if (g.dataset.part === skipKey) return;
    const r = g.getBoundingClientRect();
    if (r.width || r.height) by.set(g.dataset.frag!, unionRect(by.get(g.dataset.frag!) ?? null, r));
  });
  return [...by.values()];
}

const canAnimate = () => typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';

/** Where the signal pulses ring out for an electronic shift: the lever, then each mech. */
function pulseSpots(build: Build, progress: number, vec: (p: PartDef) => [number, number]): { at: Pt; delay: number }[] {
  const at = (id: string, p: Pt) => { const d = PART_OF.get(id)!, o = explodeOffset({ v: vec(d), w: d.w }, progress); return add(p, pt(o.x, -o.y)); };
  const spots = [{ at: at('levers', B(80, 24)), delay: 0 }, { at: at('rearmech', add(RA, pt(-30, -60))), delay: 260 }];
  if (build.chainrings === 'double') spots.push({ at: at('frontmech', ST(172)), delay: 380 });
  return spots;
}

export interface ExplodedBikeProps {
  /** 0 assembled, 1 fully apart. */
  progress: number;
  /** Hover, tap and keyboard selection with an info card. Default true. */
  interactive?: boolean;
  /** Where "Related lesson" links point, once lessons exist. */
  lessonHref?: string;
  onSelect?: (key: string | null) => void;
  /** The build to draw (see build.ts). Without one, the original drawing. */
  build?: Build;
  /** Stand the bike on a workbench that runs to the host's edges (clip it there). Default false. */
  bench?: boolean;
  /** Pinch, double-tap and ctrl + wheel zoom the drawing on its own (never the page). Default false. */
  zoomable?: boolean;
  /** Dock the info card here (portalled) instead of floating it over the drawing. Pass null
      while the host is mounting: the card waits for it rather than floating. */
  cardHost?: HTMLElement | null;
  className?: string;
}

interface FragProps {
  frag: Fragment;
  /** Accessible name: part name and system. */
  label: string;
  active: boolean;
  /** On its way off the bike: drawn, but not selectable. */
  leaving?: boolean;
  transform?: string;
  focusIndex?: number;
  tabStop: boolean;
  setRef?: (i: number, el: SVGGElement | null) => void;
  onFocusPart?: (key: string) => void;
  onKeyPart?: (e: KeyboardEvent<SVGGElement>, i: number) => void;
}

const Frag = memo(function Frag({ frag, label, active, leaving, transform, focusIndex, tabStop, setRef, onFocusPart, onKeyPart }: FragProps) {
  const focusable = focusIndex !== undefined;
  return (
    <g
      className={'bx-part' + (active ? ' is-active' : '') + (leaving ? ' is-leaving' : '')}
      data-part={frag.key}
      data-frag={frag.fragId}
      data-unit={unitOf(frag.part)}
      style={transform ? { transform } : undefined}
      {...(focusable && {
        ref: (el: SVGGElement | null) => setRef?.(focusIndex, el),
        role: 'button',
        tabIndex: tabStop ? 0 : -1,
        'aria-label': label,
        'aria-pressed': active,
        onFocus: () => onFocusPart?.(frag.key),
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => onKeyPart?.(e, focusIndex),
      })}
    >
      <g className="bx-swap"><g className="bx-lift" dangerouslySetInnerHTML={{ __html: frag.markup }} /></g>
    </g>
  );
});

function InfoCard({ partKey, lessonHref, build }: { partKey: string; lessonHref?: string; build?: Build }) {
  const p = partInfo(partKey, build);
  return (
    <>
      <Box component="p" sx={{ display: 'inline-block', m: '0 0 8px', px: 1, py: '2px', borderRadius: '6px', background: 'var(--bike-tint)', color: 'var(--bike)', fontSize: 12, fontWeight: 600 }}>
        {p.sys}
      </Box>
      <Box component="h3" sx={{ fontSize: 20, fontWeight: 650, letterSpacing: '-0.02em', m: '0 0 6px', lineHeight: 1.25 }}>{p.name}</Box>
      <Box component="p" sx={{ fontWeight: 600, m: '0 0 8px' }}>{p.what}</Box>
      <Box component="p" sx={{ color: 'var(--ink-2)', m: '0 0 8px' }}>{p.how}</Box>
      {p.fit && (
        <Box sx={{ color: 'var(--ink-2)', m: '0 0 10px', p: '10px 12px', borderRadius: '10px', background: 'var(--surface)' }}>
          <Box component="p" sx={{ m: 0 }}><Box component="strong" sx={{ color: 'var(--ink)' }}>Why it matters for fit.</Box> {p.fit}</Box>
          {p.sources?.length ? (
            <Box component="p" sx={{ m: '6px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
              Source:{' '}
              {p.sources.map((id, i) => {
                const s = SOURCES[id];
                return (
                  <span key={id}>
                    {i > 0 && '; '}
                    <a href={s.url} target="_blank" rel="noreferrer">{s.author}, {s.org}<span aria-hidden="true"> →</span></a>
                  </span>
                );
              })}
            </Box>
          ) : null}
        </Box>
      )}
      {p.lesson && lessonHref && <a className="bx-card-link" href={lessonHref}>Related lesson<span aria-hidden="true"> →</span></a>}
    </>
  );
}

export function ExplodedBike({ progress, interactive = true, lessonHref, onSelect, bench = false, zoomable = false, cardHost, build, className }: ExplodedBikeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<SVGGElement>(null);
  const benchRef = useRef<SVGGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const partRefs = useRef<(SVGGElement | null)[]>([]);
  const pointerDown = useRef(false);
  const downPart = useRef<string | null>(null);

  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [tabStop, setTabStop] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cardPos, setCardPos] = useState<CardPos | null>(null);
  const lastCard = useRef<{ key: string; pos: CardPos } | null>(null);

  /* Zoom: the base view (fitted to the drawing) and the zoom on top of it (zoom.ts). */
  const baseVb = useRef<ViewBox | null>(null);
  const zoom = useRef<Zoom>(IDENTITY);
  const [zoomed, setZoomed] = useState(false);
  const [zoomTick, setZoomTick] = useState(0);
  const applyView = useCallback(() => {
    if (baseVb.current) svgRef.current?.setAttribute('viewBox', zoomViewBox(baseVb.current, zoom.current).join(' '));
  }, []);
  const commitZoom = useCallback((z: Zoom) => {
    zoom.current = isZoomed(z) ? z : IDENTITY;
    applyView();
    setZoomed(isZoomed(zoom.current));
    setZoomTick((n) => n + 1);
  }, [applyView]);

  /* The build: which parts are on the bike, which are leaving, and how deep the rims are. */
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const motionOk = !reduce && canAnimate();
  const targetDepth = build?.rims === 'deep' ? 1 : 0;
  const [depth, setDepth] = useState(targetDepth);
  const [seen, setSeen] = useState(build);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [swap, setSwap] = useState<{ seq: number; enter: string[]; leave: string[]; from?: Build }>({ seq: 0, enter: [], leave: [] });
  const [pulse, setPulse] = useState(0);
  if (build !== seen) {
    // Adjust state while rendering (React's pattern for reacting to a prop change), so leaving
    // parts are still drawn in the same commit that removes them from the build.
    const enter = PARTS.filter((p) => inBuild(p, build) && !inBuild(p, seen)).map((p) => p.id);
    const leave = PARTS.filter((p) => !inBuild(p, build) && inBuild(p, seen)).map((p) => p.id);
    setSeen(build);
    if (motionOk) {
      setLeaving(new Set([...leaving, ...leave].filter((id) => !inBuild(PART_OF.get(id)!, build))));
      setSwap({ seq: swap.seq + 1, enter, leave, from: seen });
    } else {
      setLeaving(new Set());
      setDepth(targetDepth);
    }
  }
  const all = useMemo(() => drawnFragments(depth), [depth]);
  const shown = useMemo(() => all.filter((f) => inBuild(f.part, build) || leaving.has(f.fragId)), [all, build, leaving]);
  const parts = useMemo(() => partsFor(build), [build]);
  const focusIndex = useMemo(() => new Map(parts.map((p, i) => [FOCUS_FRAG.get(p.key)!, i])), [parts]);

  /* The exploded layout: every removable part clear of every other (layout.ts). Measured in the
     browser from the drawing itself; where nothing can be measured (tests) the parts' own
     vectors are used. */
  const layoutKey = useMemo(() => PARTS.filter((p) => inBuild(p, build)).map((p) => p.id).join(' '), [build]);
  const [vectors, setVectors] = useState<Record<string, [number, number]> | null>(null);
  const [relayout, setRelayout] = useState(false);
  const laidOut = useRef(false);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Parts in one unit move as one piece (unitOf in parts.ts): the frame's tubes stay joined,
    // and each wheel's tyre, rim, spokes, hub and valve stay nested in each other.
    const units = new Map<string, { box: VBox; part: PartDef; ids: string[] }>();
    for (const id of layoutKey.split(' ')) {
      let box: VBox | null = null;
      for (const el of host.querySelectorAll<SVGGElement>(`.bx-part[data-frag="${id}"] .bx-lift`)) {
        if (typeof el.getBBox !== 'function') return;
        const b = el.getBBox();
        box = unionBox(box, { x: b.x, y: b.y, width: b.width, height: b.height });
      }
      if (!box || !box.width) continue;
      const k = STROKE_REACH.get(id) ?? 2;
      box = { x: box.x - k, y: box.y - k, width: box.width + 2 * k, height: box.height + 2 * k };
      const part = PART_OF.get(id)!, u = unitOf(part), had = units.get(u);
      if (had) { had.box = unionBox(had.box, box); had.ids.push(id); } else units.set(u, { box, part, ids: [id] });
    }
    const pieces: Piece[] = [...units].map(([u, { box, part }]) => (
      part.sys === 'Frame' ? { id: u, box, offset: { x: 0, y: 0 }, fixed: true } : { id: u, box, offset: { x: part.v[0], y: -part.v[1] } }
    ));
    const out = separate(pieces, LAYOUT_GAP);
    const next: Record<string, [number, number]> = {};
    for (const [u, { ids }] of units) for (const id of ids) next[id] = [out[u].x, -out[u].y];
    setVectors(next);
    // A build change while apart glides parts to their new places instead of jumping.
    if (laidOut.current && motionOk) {
      setRelayout(true);
      const t = setTimeout(() => setRelayout(false), 700);
      return () => clearTimeout(t);
    }
    laidOut.current = true;
  }, [layoutKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const vec = useCallback((p: PartDef): [number, number] => vectors?.[p.id] ?? p.v, [vectors]);

  const state = useRef({ active, pinned });
  state.current = { active, pinned };
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const select = useCallback((key: string | null, pin: boolean) => {
    const prev = state.current.active;
    if (key === prev && pin === state.current.pinned) return;
    state.current = { active: key, pinned: !!key && pin };
    setActive(key);
    setPinned(!!key && pin);
    if (key !== prev) onSelectRef.current?.(key);
  }, []);

  /* Track the host's size: it drives the viewBox, card placement and docking. */
  useLayoutEffect(() => {
    const el = hostRef.current!;
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Frame the drawing: padded, and matched to the stage's aspect ratio. */
  useLayoutEffect(() => {
    const svg = svgRef.current!, root = rootRef.current!;
    if (typeof root.getBBox !== 'function') return;
    const aspect = svg.clientWidth && svg.clientHeight ? svg.clientWidth / svg.clientHeight : 1.6;
    // Measure each part where it rests at this progress, leaving out swap animations (a spinning
    // wheel's rotated box, a part flying off): the view only follows the explode, so it never
    // breathes while the build changes. getBBox ignores the element's own ancestors' transforms.
    let m: VBox | null = null;
    const ground = root.querySelector<SVGGElement>('.bx-ground');
    if (ground) { const b = ground.getBBox(); m = unionBox(m, { x: b.x, y: b.y, width: b.width, height: b.height }); }
    root.querySelectorAll<SVGGElement>('.bx-part:not(.is-leaving)').forEach((g) => {
      const lift = g.querySelector<SVGGElement>('.bx-lift'), part = PART_OF.get(g.dataset.frag!);
      if (!lift || !part) return;
      const b = lift.getBBox();
      if (!b.width && !b.height) return;
      const o = explodeOffset({ v: vec(part), w: part.w }, progress);
      m = unionBox(m, { x: b.x + o.x, y: b.y + o.y, width: b.width, height: b.height });
    });
    if (!m) return;
    const { x, y, width, height } = m as VBox;
    let box = { x, y, width, height };
    if (bench) {
      // Parts that fall as the bike comes apart land on the worktop, never inside the bench:
      // the bench drops to stay under the lowest part. Always show a strip of the bench front.
      const drop = Math.max(0, y + height - REST_BOTTOM);
      benchRef.current?.setAttribute('transform', drop ? `translate(0 ${Math.round(drop)})` : '');
      box = { x, y, width, height: Math.max(height, BENCH_BOTTOM + drop - y) };
    }
    const vb = fitViewBox(box, progress, aspect, bench);
    if (vb) { baseVb.current = vb; applyView(); }
  }, [progress, size, bench, shown, leaving, vec, applyView]);

  /* Zoom gestures: pinch and drag on touch screens, double-tap to zoom in or back out, ctrl +
     wheel (trackpad pinch) on desktop. They act on the drawing only: the page never zooms or
     scrolls, and the zoomed view never leaves the drawing, so there is nothing to scroll. */
  const suppressClick = useRef(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!zoomable || !svg) return;
    const frac = (x: number, y: number) => { const r = svg.getBoundingClientRect(); return { fx: (x - r.left) / r.width, fy: (y - r.top) / r.height, w: r.width, h: r.height }; };
    const mid = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    let pinch: { d: number; m: { x: number; y: number }; z: Zoom } | null = null;
    let pan: { x: number; y: number; z: Zoom; moved: boolean } | null = null;
    let lastTap: { t: number; x: number; y: number } | null = null;
    let multi = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        multi = true; pan = null;
        pinch = { d: dist(e.touches) || 1, m: mid(e.touches), z: zoom.current };
      } else if (e.touches.length === 1) {
        multi = false;
        pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, z: zoom.current, moved: false };
      }
    };
    const onMove = (e: TouchEvent) => {
      if (pinch && e.touches.length >= 2) {
        e.preventDefault();
        const m = mid(e.touches), f = frac(pinch.m.x, pinch.m.y);
        const z = zoomAt(pinch.z, pinch.z.s * (dist(e.touches) / pinch.d), f.fx, f.fy);
        zoom.current = panBy(z, -(m.x - pinch.m.x) / f.w, -(m.y - pinch.m.y) / f.h);
        applyView();
      } else if (pan && e.touches.length === 1) {
        const dx = e.touches[0].clientX - pan.x, dy = e.touches[0].clientY - pan.y;
        if (Math.abs(dx) + Math.abs(dy) > 8) pan.moved = true;
        if (!isZoomed(pan.z)) return; // not zoomed: the page scrolls as normal
        e.preventDefault();
        const f = frac(0, 0);
        zoom.current = panBy(pan.z, -dx / f.w, -dy / f.h);
        applyView();
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (pinch) {
        if (e.touches.length < 2) { pinch = null; pan = null; commitZoom(zoom.current.s < 1.05 ? IDENTITY : zoom.current); }
        return;
      }
      if (!pan || e.touches.length) return;
      const p = pan; pan = null;
      if (p.moved) { if (isZoomed(p.z)) { suppressClick.current = true; commitZoom(zoom.current); } lastTap = null; return; }
      if (multi) { multi = false; return; }
      const t = e.changedTouches[0], now = e.timeStamp;
      if (lastTap && now - lastTap.t < 320 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 32) {
        e.preventDefault(); // a double-tap zooms; it doesn't also select
        const f = frac(t.clientX, t.clientY);
        commitZoom(isZoomed(zoom.current) ? IDENTITY : zoomAt(zoom.current, TAP_ZOOM, f.fx, f.fy));
        lastTap = null;
      } else lastTap = { t: now, x: t.clientX, y: t.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const f = frac(e.clientX, e.clientY);
      commitZoom(zoomAt(zoom.current, zoom.current.s * Math.exp(-e.deltaY * 0.01), f.fx, f.fy));
    };
    /* Mouse and pen: once zoomed, drag the drawing by hand. A drag never also selects a part. */
    let drag: { id: number; x: number; y: number; z: Zoom; moved: boolean } | null = null;
    const onDown = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0 || !isZoomed(zoom.current)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, z: zoom.current, moved: false };
    };
    const onDragMove = (e: globalThis.PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 4) return;
        drag.moved = true;
        svg.setPointerCapture?.(e.pointerId);
        svg.classList.add('is-dragging');
      }
      e.preventDefault();
      const f = frac(0, 0);
      zoom.current = panBy(drag.z, -dx / f.w, -dy / f.h);
      applyView();
    };
    const onUp = (e: globalThis.PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) { suppressClick.current = true; commitZoom(zoom.current); }
      svg.classList.remove('is-dragging');
      drag = null;
    };
    const opts = { passive: false } as const;
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onDragMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('touchstart', onStart, opts);
    svg.addEventListener('touchmove', onMove, opts);
    svg.addEventListener('touchend', onEnd, opts);
    svg.addEventListener('touchcancel', onEnd, opts);
    svg.addEventListener('wheel', onWheel, opts);
    return () => {
      svg.removeEventListener('touchstart', onStart); svg.removeEventListener('touchmove', onMove);
      svg.removeEventListener('touchend', onEnd); svg.removeEventListener('touchcancel', onEnd); svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('pointerdown', onDown); svg.removeEventListener('pointermove', onDragMove);
      svg.removeEventListener('pointerup', onUp); svg.removeEventListener('pointercancel', onUp);
    };
  }, [zoomable, applyView, commitZoom]);


  /* Play the swap: departures first, then arrivals; leaving parts are dropped once they have gone. */
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!swap.seq || !host) return;
    const { enter, leave, from } = swap;
    const after = leave.length ? IN_AFTER_OUT : 0;
    leave.forEach((id) => {
      void playSwap(host, PART_OF.get(id)!, 'out', 0).then(() => {
        setLeaving((l) => { if (!l.has(id)) return l; const n = new Set(l); n.delete(id); return n; });
      });
    });
    enter.forEach((id) => void playSwap(host, PART_OF.get(id)!, 'in', after));
    if (from && build && from.gears !== build.gears) {
      shiftMech(host, after + IN_MS * 0.7);
      if (build.gears === 'electronic') setPulse((n) => n + 1);
    }
  }, [swap]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Deeper or shallower rims: grow the rim while the wheels spin once. */
  useEffect(() => {
    if (depth === targetDepth) return;
    if (!motionOk || !hostRef.current) { setDepth(targetDepth); return; }
    spinWheels(hostRef.current);
    const from = depth;
    let start: number | null = null, raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const k = clamp((ts - start) / RIM_MS);
      setDepth(k < 1 ? from + (targetDepth - from) * ease(k) : targetDepth);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetDepth]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A part that has left the bike can't stay selected. */
  useEffect(() => {
    if (active && !parts.some((p) => p.key === active)) select(null, false);
    setTabStop((t) => Math.min(t, parts.length - 1));
  }, [parts, active, select]);

  /* With a card host (phones), the card always docks there; otherwise it always floats. One
     source of truth, so no width can leave the card nowhere. */
  const docked = cardHost !== undefined;

  /* Place the card again whenever its own size changes (a web font arriving, copy changing). */
  const [cardTick, setCardTick] = useState(0);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || docked || typeof ResizeObserver === 'undefined') return;
    let last = '';
    const ro = new ResizeObserver(() => {
      const k = el.offsetWidth + 'x' + el.offsetHeight;
      if (k !== last) { last = k; setCardTick((n) => n + 1); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [docked]);

  /* The card rule (AGENTS.md §5.1): avoid the selected part, and cover as few other parts as
     possible. When no shape misses the part, the card takes the place that covers least; the
     drawing itself never moves or zooms for the card. */
  useLayoutEffect(() => {
    if (!interactive || !active || docked) { setCardPos(null); return; }
    const hostEl = hostRef.current!;
    const host = hostEl.getBoundingClientRect();
    const stage = hostEl.querySelector('.bx-stage')!.getBoundingClientRect();
    // The selected part's pieces, one rect per fragment group (a tyre is drawn on each wheel).
    const byFrag = new Map<string, Rect>();
    hostEl.querySelectorAll<SVGGElement>(`.bx-part[data-part="${active}"]:not(.is-leaving)`).forEach((g) => {
      byFrag.set(g.dataset.frag!, unionRect(byFrag.get(g.dataset.frag!) ?? null, g.getBoundingClientRect()));
    });
    const mine = [...byFrag.values()];
    if (!mine.length) return;
    const el = cardRef.current!, others = partRects(hostEl, active);
    const prev = lastCard.current?.key === active ? lastCard.current.pos : null;
    // Try the standard card first, then wider, shorter shapes, until one misses the part.
    const bestFor = (keep: Rect[], rest: Rect[]) => {
      let pos: CardPos | null = null;
      for (const w of CARD_WIDTHS) {
        const width = Math.min(w, host.width - 16);
        el.style.width = width + 'px';
        const p = placeCard(keep, rest, host, stage.bottom, { width, height: el.offsetHeight }, prev && prev.width === width ? prev : null);
        const cand = { left: p.left, top: p.top, width, clear: p.clear, covers: p.covers };
        if (!pos || (cand.clear && (!pos.clear || cand.covers < pos.covers))) pos = cand;
        if (cand.clear && cand.covers === 0) break;
      }
      return pos!;
    };
    let pos = bestFor(mine, others);
    // A part drawn more than once (both tyres span the whole bike): when nowhere misses every
    // copy, keep one copy whole rather than half-covering them all.
    for (let i = 0; !pos.clear && mine.length > 1 && i < mine.length; i++) {
      const cand = bestFor([mine[i]], [...others, ...mine.filter((_, j) => j !== i)]);
      if (cand.clear) pos = cand;
    }
    el.style.width = pos.width + 'px'; // React won't re-apply an unchanged style, so leave the chosen width set
    lastCard.current = { key: active, pos };
    setCardPos(pos);
  }, [interactive, active, docked, progress, size, vectors, zoomTick, build, cardTick]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Escape clears the selection from anywhere. */
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && state.current.active) select(null, false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [interactive, select]);

  const setRef = useCallback((i: number, el: SVGGElement | null) => { partRefs.current[i] = el; }, []);
  const onFocusPart = useCallback((key: string) => {
    // A click focuses the part too; let the click decide, so a second click can clear it.
    if (pointerDown.current) return;
    setTabStop(parts.findIndex((p) => p.key === key));
    select(key, true);
  }, [select, parts]);
  const onKeyPart = useCallback((e: KeyboardEvent<SVGGElement>, i: number) => {
    const n = parts.length;
    const next = ({ ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (e.key === 'Escape') { select(null, false); return; }
    if (next === undefined) return;
    e.preventDefault();
    setTabStop(next);
    partRefs.current[next]?.focus();
  }, [select, parts]);

  const partAt = (target: EventTarget) => (target as Element).closest?.('.bx-part:not(.is-leaving)')?.getAttribute('data-part') ?? null;
  const pointerHandlers = interactive ? {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      pointerDown.current = true;
      // Touch adjustment can retarget a tap to the svg itself: hit-test the exact point too.
      const under = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(e.clientX, e.clientY) : null;
      downPart.current = partAt(e.target) ?? (under ? partAt(under) : null);
    },
    onPointerOver: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'touch' || state.current.pinned || svgRef.current?.classList.contains('is-dragging')) return;
      const k = partAt(e.target);
      if (k) select(k, false);
    },
    onPointerLeave: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType !== 'touch' && !state.current.pinned) select(null, false);
    },
    onClick: (e: MouseEvent<SVGSVGElement>) => {
      pointerDown.current = false;
      if (suppressClick.current) { suppressClick.current = false; return; } // the end of a pan, not a tap
      // The click lands where the finger lifted, which can be a pixel off a thin part (the
      // saddle, a cable): fall back to the part the press started on.
      const k = partAt(e.target) ?? downPart.current;
      downPart.current = null;
      if (!k) { select(null, false); return; }
      const i = parts.findIndex((p) => p.key === k);
      setTabStop(i);
      if (state.current.pinned && state.current.active === k) select(null, false);
      else select(k, true);
    },
  } : {};

  const card = interactive ? (
    <Paper
      ref={cardRef}
      className="bx-card"
      role="status"
      aria-live="polite"
      sx={{
        border: '1px solid var(--rule)', borderRadius: '14px', boxShadow: 'var(--shadow)', p: '16px 18px', fontSize: 14, lineHeight: 1.45,
        // Kept in the accessibility tree when empty, so the live region is ready to announce.
        '&:empty': { position: 'absolute', width: 1, height: 1, p: 0, border: 0, overflow: 'hidden', clipPath: 'inset(50%)' },
        '& p': { mt: 0 },
        '& a': { fontWeight: 600, color: 'var(--ink)' },
      }}
      style={cardPos ? { left: cardPos.left, top: cardPos.top, width: cardPos.width } : undefined}
    >
      {active ? <InfoCard partKey={active} lessonHref={lessonHref} build={build} /> : null}
    </Paper>
  ) : null;

  return (
    <div
      ref={hostRef}
      className={['bx', interactive && 'bx--interactive', active && 'has-active', docked && 'bx--docked', relayout && 'bx--relayout', zoomed && 'is-zoomed', className].filter(Boolean).join(' ')}
    >
      <div className="bx-stage">
        <svg
          ref={svgRef}
          className="bx-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          role={interactive ? 'group' : 'img'}
          aria-label="Road bike diagram, drawn from the drive side"
          style={zoomable ? { touchAction: zoomed ? 'none' : 'pan-y' } : undefined}
          {...pointerHandlers}
        >
          {bench && <g ref={benchRef} className="bx-bench" data-testid="bx-bench" dangerouslySetInnerHTML={{ __html: benchMarkup }} />}
          <g ref={rootRef} className="bx-root">
            <g className="bx-ground" style={{ opacity: clamp(1 - progress * 3) }} dangerouslySetInnerHTML={{ __html: groundMarkup }} />
            {shown.map((f) => {
              const o = explodeOffset({ v: vec(f.part), w: f.part.w }, progress);
              const out = leaving.has(f.fragId);
              const fi = interactive && !out ? focusIndex.get(fragKey(f)) : undefined;
              const info = parts.find((p) => p.key === f.key);
              return (
                <Frag
                  key={fragKey(f)}
                  frag={f}
                  label={info ? info.name + ', ' + info.sys : ''}
                  active={f.key === active}
                  leaving={out}
                  transform={o.x || o.y ? `translate(${o.x}px, ${o.y}px)` : undefined}
                  focusIndex={fi}
                  tabStop={fi === tabStop}
                  setRef={setRef}
                  onFocusPart={onFocusPart}
                  onKeyPart={onKeyPart}
                />
              );
            })}
          </g>
          {pulse > 0 && build && (
            <g key={pulse} className="bx-pulses" aria-hidden="true" onAnimationEnd={(e) => { if (e.currentTarget.lastChild === e.target) setPulse(0); }}>
              {pulseSpots(build, progress, vec).map((s, i) => (
                <circle key={i} className="bx-pulse" cx={s.at.x} cy={-s.at.y} r={46} style={{ animationDelay: IN_AFTER_OUT + IN_MS * 0.55 + s.delay + 'ms' }} />
              ))}
            </g>
          )}
        </svg>
        {zoomable && zoomed && (
          <button type="button" className="bx-zoom-reset" onClick={() => commitZoom(IDENTITY)}>Reset zoom</button>
        )}
      </div>
      {docked ? (cardHost ? createPortal(card, cardHost) : null) : card}
    </div>
  );
}
