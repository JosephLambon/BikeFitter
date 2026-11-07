/* The exploded road bike: original artwork (see drawing.ts). Hover, tap or keyboard selects a
   part; the selected part goes Bike amber and the rest ghost; an info card explains it.
   Ported from designs/shared/bike.js. */
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { SOURCES } from '../../content/sources';
import { clamp, explodeOffset, fitViewBox, placeCard, type Rect } from './explode';
import { BENCH_BOTTOM, REST_BOTTOM, benchMarkup, groundMarkup } from './drawing';
import { FRAGMENTS, PART_BY_KEY, PART_LIST, type Fragment } from './parts';
import './bike.css';

/** Below this host width the card docks under the drawing instead of floating. */
const DOCK_BELOW = 720;

/* The fragment that takes keyboard focus for each part: the front wheel's, not the rear's. */
const FOCUS_FRAG = new Map<string, Fragment>();
for (const p of PART_LIST) {
  const frags = FRAGMENTS.filter((f) => f.key === p.key);
  FOCUS_FRAG.set(p.key, frags.find((f) => !f.fragId.endsWith('-r')) ?? frags[0]);
}
const FOCUS_INDEX = new Map(PART_LIST.map((p, i) => [FOCUS_FRAG.get(p.key)!, i]));

export interface ExplodedBikeProps {
  /** 0 assembled, 1 fully apart. */
  progress: number;
  /** Hover, tap and keyboard selection with an info card. Default true. */
  interactive?: boolean;
  /** Where "Related lesson" links point, once lessons exist. */
  lessonHref?: string;
  onSelect?: (key: string | null) => void;
  /** Stand the bike on a workbench that runs to the host's edges (clip it there). Default false. */
  bench?: boolean;
  className?: string;
}

interface FragProps {
  frag: Fragment;
  active: boolean;
  transform?: string;
  focusIndex?: number;
  tabStop: boolean;
  setRef?: (i: number, el: SVGGElement | null) => void;
  onFocusPart?: (key: string) => void;
  onKeyPart?: (e: KeyboardEvent<SVGGElement>, i: number) => void;
}

const Frag = memo(function Frag({ frag, active, transform, focusIndex, tabStop, setRef, onFocusPart, onKeyPart }: FragProps) {
  const focusable = focusIndex !== undefined;
  const info = PART_BY_KEY.get(frag.key)!;
  return (
    <g
      className={'bx-part' + (active ? ' is-active' : '')}
      data-part={frag.key}
      data-frag={frag.fragId}
      transform={transform}
      {...(focusable && {
        ref: (el: SVGGElement | null) => setRef?.(focusIndex, el),
        role: 'button',
        tabIndex: tabStop ? 0 : -1,
        'aria-label': info.name + ', ' + info.sys,
        'aria-pressed': active,
        onFocus: () => onFocusPart?.(frag.key),
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => onKeyPart?.(e, focusIndex),
      })}
    >
      <g className="bx-lift" dangerouslySetInnerHTML={{ __html: frag.markup }} />
    </g>
  );
});

function InfoCard({ partKey, lessonHref }: { partKey: string; lessonHref?: string }) {
  const p = PART_BY_KEY.get(partKey)!;
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

export function ExplodedBike({ progress, interactive = true, lessonHref, onSelect, bench = false, className }: ExplodedBikeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<SVGGElement>(null);
  const benchRef = useRef<SVGGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const partRefs = useRef<(SVGGElement | null)[]>([]);
  const pointerDown = useRef(false);

  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [tabStop, setTabStop] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);

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
    const { x, y, width, height } = root.getBBox(); // an SVGRect: its fields are getters, so copy them out
    let box = { x, y, width, height };
    if (bench) {
      // Parts that fall as the bike comes apart land on the worktop, never inside the bench:
      // the bench drops to stay under the lowest part. Always show a strip of the bench front.
      const drop = Math.max(0, y + height - REST_BOTTOM);
      benchRef.current?.setAttribute('transform', drop ? `translate(0 ${Math.round(drop)})` : '');
      box = { x, y, width, height: Math.max(height, BENCH_BOTTOM + drop - y) };
    }
    const vb = fitViewBox(box, progress, aspect, bench);
    if (vb) svg.setAttribute('viewBox', vb.join(' '));
  }, [progress, size, bench]);

  const docked = size.w > 0 && size.w < DOCK_BELOW;

  /* Float the card beside the selected part. */
  useLayoutEffect(() => {
    if (!interactive || !active || docked) { setCardPos(null); return; }
    const host = hostRef.current!.getBoundingClientRect();
    const stage = hostRef.current!.querySelector('.bx-stage')!.getBoundingClientRect();
    let r: Rect | null = null;
    hostRef.current!.querySelectorAll(`.bx-part[data-part="${active}"]`).forEach((g) => {
      const b = g.getBoundingClientRect();
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) }
        : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });
    if (!r) return;
    const card = cardRef.current!;
    setCardPos(placeCard(r, host, stage.bottom, { width: card.offsetWidth, height: card.offsetHeight }));
  }, [interactive, active, docked, progress, size]);

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
    setTabStop(PART_LIST.findIndex((p) => p.key === key));
    select(key, true);
  }, [select]);
  const onKeyPart = useCallback((e: KeyboardEvent<SVGGElement>, i: number) => {
    const n = PART_LIST.length;
    const next = ({ ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (e.key === 'Escape') { select(null, false); return; }
    if (next === undefined) return;
    e.preventDefault();
    setTabStop(next);
    partRefs.current[next]?.focus();
  }, [select]);

  const partAt = (target: EventTarget) => (target as Element).closest?.('.bx-part')?.getAttribute('data-part') ?? null;
  const pointerHandlers = interactive ? {
    onPointerDown: () => { pointerDown.current = true; },
    onPointerOver: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'touch' || state.current.pinned) return;
      const k = partAt(e.target);
      if (k) select(k, false);
    },
    onPointerLeave: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType !== 'touch' && !state.current.pinned) select(null, false);
    },
    onClick: (e: MouseEvent<SVGSVGElement>) => {
      pointerDown.current = false;
      const k = partAt(e.target);
      if (!k) { select(null, false); return; }
      const i = PART_LIST.findIndex((p) => p.key === k);
      setTabStop(i);
      if (state.current.pinned && state.current.active === k) select(null, false);
      else select(k, true);
    },
  } : {};

  return (
    <div
      ref={hostRef}
      className={['bx', interactive && 'bx--interactive', active && 'has-active', docked && 'bx--docked', className].filter(Boolean).join(' ')}
    >
      <div className="bx-stage">
        <svg
          ref={svgRef}
          className="bx-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          role={interactive ? 'group' : 'img'}
          aria-label="Road bike diagram, drawn from the drive side"
          {...pointerHandlers}
        >
          {bench && <g ref={benchRef} className="bx-bench" data-testid="bx-bench" dangerouslySetInnerHTML={{ __html: benchMarkup }} />}
          <g ref={rootRef} className="bx-root">
            <g className="bx-ground" style={{ opacity: clamp(1 - progress * 3) }} dangerouslySetInnerHTML={{ __html: groundMarkup }} />
            {FRAGMENTS.map((f) => {
              const o = explodeOffset(f.part, progress);
              const fi = interactive ? FOCUS_INDEX.get(f) : undefined;
              return (
                <Frag
                  key={f.fragId + '@' + f.layer}
                  frag={f}
                  active={f.key === active}
                  transform={o.x || o.y ? `translate(${o.x} ${o.y})` : undefined}
                  focusIndex={fi}
                  tabStop={fi === tabStop}
                  setRef={setRef}
                  onFocusPart={onFocusPart}
                  onKeyPart={onKeyPart}
                />
              );
            })}
          </g>
        </svg>
      </div>
      {interactive && (
        <Paper
          ref={cardRef}
          className="bx-card"
          role="status"
          aria-live="polite"
          sx={{
            border: '1px solid var(--rule)', borderRadius: '14px', boxShadow: 'var(--shadow)', p: '18px 20px', fontSize: 14, lineHeight: 1.5,
            // Kept in the accessibility tree when empty, so the live region is ready to announce.
            '&:empty': { position: 'absolute', width: 1, height: 1, p: 0, border: 0, overflow: 'hidden', clipPath: 'inset(50%)' },
            '& p': { mt: 0 },
            '& a': { fontWeight: 600, color: 'var(--ink)' },
          }}
          style={cardPos ? { left: cardPos.left, top: cardPos.top } : undefined}
        >
          {active ? <InfoCard partKey={active} lessonHref={lessonHref} /> : null}
        </Paper>
      )}
    </div>
  );
}
