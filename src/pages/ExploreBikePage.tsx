/* Explore the bike (AGENTS.md §5). On larger screens, scrolling through the reel takes the bike
   apart. The button and slider do the same in place, without moving the page; whichever was used
   last is in control, and scroll only takes control back once it catches the bike's current
   state, so the drawing never jumps (§6.1). On phones scroll does nothing: the page is one screen
   and only the button and slider take the bike apart. */
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icon } from '../components/Icon';
import { Wrap } from '../components/layout';
import { ExplodedBike, PartLabel } from '../features/bike/ExplodedBike';
import { caughtUp, clamp, headBlend, reelProgress, tuckProgress } from '../features/bike/explode';
import { SCRUBBER_H } from '../features/bike/scrubber';
import { CoilScrubber } from '../features/bike/CoilScrubber';
import { benchWall, motion } from '../theme/tokens';
import { DEFAULT_BUILD, choiceOf, type Build, type BuildKey } from '../features/bike/build';
import { BuildToggle, BuildTray } from '../features/bike/BuildTray';

const REDUCED = '(prefers-reduced-motion: reduce)';
/** Short portrait phones (iPhone 14 in Safari is 664 px): the stage gives the build tray more room. */
const SHORT = '@media (max-height: 720px)';
const PORTRAIT = '(max-width: 760px)';
/** The part label's space on phones: the 104 px window and 16 px below it. */
const LABEL_SLOT = 120;
/** A phone turned sideways: short and wide. */
const LANDSCAPE = '(max-height: 500px) and (orientation: landscape)';

/** `scroll`: whether scrolling through the reel takes the bike apart. `reduce`: reduced motion. */
function useExplodeStage(reelRef: RefObject<HTMLElement | null>, scroll: boolean, reduce: boolean) {
  const [progress, setProgress] = useState(0);
  const live = useRef({ progress: 0, follow: true, lastMapped: 0, anim: 0 });

  const set = useCallback((p: number) => { live.current.progress = clamp(p); setProgress(live.current.progress); }, []);
  const mapped = useCallback(() => {
    const reel = reelRef.current;
    if (!reel) return live.current.progress;
    return reelProgress(window.scrollY, reel.offsetTop, reel.offsetHeight, window.innerHeight, live.current.progress);
  }, [reelRef]);
  const stop = () => { if (live.current.anim) { cancelAnimationFrame(live.current.anim); live.current.anim = 0; } };
  const takeOver = useCallback(() => { live.current.follow = false; live.current.lastMapped = mapped(); }, [mapped]);

  const fromSlider = useCallback((p: number) => { stop(); takeOver(); set(p); }, [set, takeOver]);
  const toggle = useCallback(() => {
    const target = live.current.progress > 0.5 ? 0 : 1;
    stop(); takeOver();
    if (reduce) { set(target); return; }
    const from = live.current.progress, dur = 300 + 1100 * Math.abs(target - from);
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const k = clamp((ts - start) / dur);
      set(from + (target - from) * k);
      live.current.anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    live.current.anim = requestAnimationFrame(step);
  }, [reduce, set, takeOver]);

  useEffect(() => {
    if (!scroll) return;
    const onScroll = () => {
      const l = live.current, m = mapped();
      if (!l.follow && !l.anim && caughtUp(m, l.lastMapped, l.progress)) l.follow = true;
      l.lastMapped = m;
      if (l.follow) set(m);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [scroll, mapped, set]);

  useEffect(() => stop, []);
  return { progress, fromSlider, toggle };
}

/** Larger screens: once the reel is most of the way through, the heading and hint
    scroll up out of view and the bench wall grows into their space. Writes `--tuck` (0..1) on the
    layout and the heading's height as `--head-size`, straight to the style on every scroll, so
    the page never re-renders for it. */
function useTuck(on: boolean, reelRef: RefObject<HTMLElement | null>, layoutRef: RefObject<HTMLElement | null>, headRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const layout = layoutRef.current, head = headRef.current;
    if (!on || !layout || !head) return;
    const onScroll = () => {
      const reel = reelRef.current;
      if (reel) layout.style.setProperty('--tuck', String(Number(tuckProgress(window.scrollY, reel.offsetTop, reel.offsetHeight, window.innerHeight).toFixed(4))));
    };
    const size = () => layout.style.setProperty('--head-size', head.offsetHeight + 'px');
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll(); size();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(size);
    ro?.observe(head);
    return () => {
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); ro?.disconnect();
      layout.style.removeProperty('--tuck'); layout.style.removeProperty('--head-size');
    };
  }, [on, reelRef, layoutRef, headRef]);
}

export function ExploreBikePage() {
  const reduce = useMediaQuery(REDUCED, { noSsr: true });
  /* Phones. Portrait: the title on white, then a bench wall down to a dock that holds the
     controls. The bike sits centred on the wall above the part label's space. Landscape (a phone
     turned sideways): the stage and controls fill the left, and the title and the same label sit
     in a column on the right, so the bike gets the whole height. */
  const land = useMediaQuery(LANDSCAPE, { noSsr: true });
  const portrait = useMediaQuery(PORTRAIT, { noSsr: true }) && !land;
  const compact = land || portrait;
  // Scroll takes the bike apart only on larger screens, and never with reduced motion.
  const scrolls = !reduce && !compact;
  const reelRef = useRef<HTMLElement>(null);
  const { progress, fromSlider, toggle } = useExplodeStage(reelRef, scrolls, reduce);
  const layoutRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLElement>(null);
  useTuck(scrolls, reelRef, layoutRef, headRef);
  const canHover = useMediaQuery('(hover: hover)', { noSsr: true });
  // No scroll to cue (reduced motion, or a phone): the hint shows from the start.
  const t = scrolls ? headBlend(progress, false) : 1;
  const apart = progress > 0.5;

  // The build tray: swap gears, brakes, rims, chainrings and mudguards.
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD);
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState('');
  const trayId = useId();
  const change = useCallback((key: BuildKey, value: Build[BuildKey]) => {
    setBuild((b) => {
      const next = { ...b, [key]: value };
      setSaid(choiceOf(key, next).name + ' fitted.');
      return next;
    });
  }, []);

  // The coil's "try me" invitation lives here, not in the scrubber: the phone layouts mount the
  // controls again when a phone turns, which must neither restart its 4 s beat nor bring it back
  // once the rider has moved it.
  const [inviteSince] = useState(() => performance.now());
  const [scrubbed, setScrubbed] = useState(false);
  const fromCoil = useCallback((p: number) => { setScrubbed(true); fromSlider(p); }, [fromSlider]);

  const [selected, setSelected] = useState<string | null>(null);
  // On phones the build tray and the part label share one space: picking a part (not only
  // hovering it with a mouse) closes the tray.
  const onSelect = useCallback((key: string | null, picked: boolean) => {
    setSelected(key);
    if (picked && compact) setOpen(false);
  }, [compact]);
  const hint = (canHover ? 'Hover a part to learn more.' : 'Tap a part to learn more.') + (canHover ? '' : ' Pinch to zoom.');
  // Turning a phone (or resizing a window) across layouts mounts the drawing again with nothing
  // picked, so let go of the page's pick too: the label never names a part that isn't picked.
  const layout = land ? 'landscape' : portrait ? 'portrait' : 'wide';
  const [seenLayout, setSeenLayout] = useState(layout);
  if (layout !== seenLayout) { setSeenLayout(layout); setSelected(null); }
  // The bouncing scroll cue turns into the hint as the bike starts to come apart. Larger screens
  // only: phones show the hint in the label's space.
  const cue = (
    <Box sx={{ display: 'grid', placeItems: 'center', mt: '12px', minHeight: 32, '& > *': { gridArea: '1 / 1' } }}>
      {scrolls && (
        <Box
          aria-hidden="true" data-testid="scroll-cue"
          style={{ opacity: 1 - t, transform: `translateY(${-10 * t}px) scale(${1 - 0.4 * t})` }}
          sx={{ display: 'inline-flex', color: 'var(--tone)', fontSize: 28, pointerEvents: 'none' }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex', animation: `bf-bob 2.4s ${motion.rise} infinite`,
              '@keyframes bf-bob': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(6px)' } },
              '& .ico': { transform: 'rotate(90deg)' },
            }}
          >
            <Icon name="arrow" />
          </Box>
        </Box>
      )}
      <Typography
        component="p" data-testid="part-hint"
        style={{ opacity: t, transform: `translateY(${10 * (1 - t)}px)` }}
        sx={{ m: 0, fontSize: 'clamp(19px, 1.9vw, 22px)', lineHeight: 1.4, color: 'var(--ink-2)' }}
      >
        {hint}
      </Typography>
    </Box>
  );

  const title = (
    <Typography
      variant="h1" id="bike-h"
      sx={{ m: 0, ...(portrait && { fontSize: 32, lineHeight: 1.06 }), ...(land && { fontSize: 26, lineHeight: 1.1, textAlign: 'left' }) }}
    >
      Explore your bike’s anatomy.
    </Typography>
  );

  const stage = (
    <Box
      className="stage-bike" data-testid="stage"
      sx={{
        // The workbench: amber dots on a white wall, with the bench drawn under the tyres.
        position: 'relative', minHeight: 0, width: compact ? '100%' : 'min(1320px, 100% - 32px)', mx: 'auto',
        mt: compact ? 0 : 'calc(24px - 40px * var(--tuck, 0))',
        // clip, not hidden: nothing (focus, a zoomed drawing) can ever scroll the stage.
        p: compact ? '12px 12px 0' : '24px 24px 0', borderRadius: compact ? '16px' : '20px', overflow: 'clip', background: benchWall,
        boxShadow: 'inset 0 0 0 1px var(--bench-line)',
        '& .bx, & .bx-stage': { height: '100%' },
        ...(!compact && { [`@media ${REDUCED}`]: { height: '60vh' } }),
        ...(land && { height: '100%' }),
        /* Portrait: the whole wall is the bench, so the stage is just the bike, at a definite size
           (the bike's 4:3, as wide as the screen allows under a height cap), so the wall's grid can
           centre it and nothing on the wall can resize it. On a small phone it also shrinks to
           leave the label's space and 16 px of wall above and below (cqh: the wall's height; the
           wall is a size container). Short screens give a little more height to the build tray. */
        ...(portrait && {
          height: 'auto', aspectRatio: '4 / 3', p: '4px', borderRadius: 0, background: 'none', boxShadow: 'none',
          width: `min(100%, 42svh * 4 / 3, (100cqh - ${LABEL_SLOT + 32}px) * 4 / 3)`,
          [SHORT]: { width: `min(100%, 38svh * 4 / 3, (100cqh - ${LABEL_SLOT + 32}px) * 4 / 3)` },
        }),
      }}
    >
      <ExplodedBike progress={progress} bench zoomable centred={portrait} build={build} label={!compact} onSelect={onSelect} />
    </Box>
  );

  const controls = (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: compact ? '100%' : 'min(680px, 100% - 32px)', mx: 'auto', mt: compact ? 0 : '12px',
      }}
    >
      <BuildToggle open={open} onOpenChange={setOpen} build={build} controls={trayId} />
      <Box component="span" aria-live="polite" data-testid="build-live" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        {said}
      </Box>
      <Button
        variant="quiet" onClick={toggle}
        aria-label={apart ? 'Put the bike back together' : 'Take the bike apart'}
        title={apart ? 'Put the bike back together' : 'Take the bike apart'}
        sx={{ flex: 'none', minWidth: 0, width: SCRUBBER_H, height: SCRUBBER_H, p: 0, fontSize: 22 }}
      >
        <Icon name={apart ? 'collapse' : 'expand'} />
      </Button>
      <CoilScrubber progress={progress} onChange={fromCoil} since={inviteSince} moved={scrubbed} />
    </Box>
  );

  const tray = <BuildTray build={build} onChange={change} open={open} id={trayId} fit={compact} beside={portrait} />;

  /* Phones, portrait and landscape alike: the part label (the desktop window: name and what it
     is) waits in its own space and shows only while a part is picked; until then the hint sits
     there. The build tray opens over the same space, and the label hides while it is open. */
  const labelSlot = compact && (
    <Box
      data-testid="label-slot" data-hidden={open || undefined}
      sx={{
        gridArea: '4 / 1', height: LABEL_SLOT, p: portrait ? '0 var(--gutter) 16px' : '0 0 16px', display: 'grid', alignItems: 'end',
        '& > *': { gridArea: '1 / 1' }, ...(open && { visibility: 'hidden' }),
      }}
    >
      <Typography
        component="p" data-testid="part-hint" aria-hidden={selected ? true : undefined}
        style={{ opacity: selected ? 0 : 1 }}
        sx={{ m: 0, pb: '8px', textAlign: 'center', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.45, transition: 'opacity .2s ease', [`@media ${REDUCED}`]: { transition: 'none' } }}
      >
        {hint}
      </Typography>
      <PartLabel partKey={selected} build={build} className="bx-label--phone" />
    </Box>
  );
  const traySlot = compact && (
    <Box sx={{ gridArea: '3 / 1 / 5', alignSelf: 'end', minHeight: 0, maxHeight: '100%', display: 'flex', flexDirection: 'column', p: portrait ? '12px var(--gutter) 16px' : '12px 0 16px', pointerEvents: open ? undefined : 'none' }}>
      {tray}
    </Box>
  );

  return (
    <Box component="main" id="main" data-pillar="bike">
      <title>Explore the bike · BikeFitter</title>
      <meta name="description" content="Take a road bike apart, part by part, and swap common parts. Select any part to see its name and what it is." />

      <Box
        component="section" id="reel" ref={reelRef} aria-labelledby="bike-h"
        sx={{
          // Phones: one screen, no reel to scroll through. Reduced motion only changes the larger
          // screens' reel: a phone's screen is the same either way, and always tucks under the header.
          position: 'relative', height: compact ? 'auto' : '300vh', mt: 'calc(-1 * var(--head-h))',
          ...(!compact && { [`@media ${REDUCED}`]: { height: 'auto', mt: 0 } }),
        }}
      >
        <Box
          ref={layoutRef}
          data-layout={layout}
          sx={{
            position: 'sticky', top: 0, height: '100svh', display: 'grid', overflow: 'hidden',
            ...(!compact && {
              gridTemplateRows: 'auto minmax(0, 1fr) auto auto', p: 'calc(var(--head-h) + 32px) 0 24px',
              [`@media ${REDUCED}`]: { position: 'relative', height: 'auto', minHeight: '100vh', pt: '32px' },
            }),
            ...(portrait && { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'auto minmax(0, 1fr) auto', pt: 'var(--head-h)', background: 'var(--bg)' }),
            ...(land && {
              gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 34%)', gridTemplateRows: 'minmax(0, 1fr) auto', gap: '12px 20px',
              p: 'calc(var(--head-h) + 12px) max(var(--gutter), env(safe-area-inset-right)) 12px max(var(--gutter), env(safe-area-inset-left))',
            }),
          }}
        >
          {!compact && (
            <>
              <Wrap
                ref={headRef} data-testid="bike-head" data-tuck={scrolls || undefined}
                sx={{
                  textAlign: 'center',
                  /* The heading rides up with the top of the bench wall and fades under the header,
                     while its row collapses so the wall takes its space. The stage's margin does the
                     last 40 px, so the wall ends 16 px under the header. */
                  ...(scrolls && {
                    '--tuck-by': 'calc(var(--tuck, 0) * (var(--head-size, 0px) + 40px))',
                    mb: 'calc(-1 * var(--tuck, 0) * var(--head-size, 0px))', transform: 'translateY(calc(-1 * var(--tuck-by)))',
                    opacity: 'calc(1 - 1.25 * var(--tuck, 0))', willChange: 'transform, opacity',
                  }),
                }}
              >
                {title}{cue}
              </Wrap>
              {stage}
              {tray}
              {controls}
            </>
          )}
          {portrait && (
            <>
              <Box sx={{ textAlign: 'center', p: '24px var(--gutter) 20px' }}>{title}</Box>
              {/* The bench wall, from under the title to the dock: equal space above and below the
                  bike, then the label's space. The build tray opens over the space below the bike
                  and the label's, never over the bike. Every item names its cell: the tray shares
                  the label's row, and auto-placement would push it into a second column. */}
              <Box
                data-testid="wall"
                sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) auto minmax(0, 1fr) auto', minHeight: 0, containerType: 'size', background: benchWall, boxShadow: 'inset 0 1px 0 var(--bench-line)' }}
              >
                <Box sx={{ gridArea: '2 / 1', minHeight: 0 }}>{stage}</Box>
                {labelSlot}
                {traySlot}
              </Box>
              <Box
                data-testid="dock"
                sx={{
                  // Stays at the bottom of the screen, always the same height: the build tray opens
                  // on the wall above it, so it can never push the bike.
                  background: 'var(--bg)', borderTop: '1px solid var(--rule)',
                  p: '0 var(--gutter) calc(12px + env(safe-area-inset-bottom))',
                  '& > :last-child': { mt: '12px' },
                }}
              >
                {controls}
              </Box>
            </>
          )}
          {land && (
            <>
              <Box sx={{ gridColumn: 1, gridRow: 1, minHeight: 0 }}>{stage}</Box>
              <Box sx={{ gridColumn: 1, gridRow: 2 }}>{controls}</Box>
              {/* The title, then the same label and tray as portrait, at the foot of the column. */}
              <Box
                data-testid="side"
                sx={{ gridColumn: 2, gridRow: '1 / span 2', minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'auto 0 minmax(0, 1fr) auto' }}
              >
                <Box sx={{ gridArea: '1 / 1' }}>{title}</Box>
                {labelSlot}
                {traySlot}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
