/* Explore the bike (AGENTS.md §5). Scrolling through the reel takes the bike apart. The button
   and slider do the same in place, without moving the page; whichever was used last is in
   control, and scroll only takes control back once it catches the bike's current state, so the
   drawing never jumps (§6.1). */
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icon } from '../components/Icon';
import { Wrap } from '../components/layout';
import { ExplodedBike } from '../features/bike/ExplodedBike';
import { caughtUp, clamp, headBlend, reelProgress } from '../features/bike/explode';
import { ExplodeScrubber, SCRUBBER_H } from '../features/bike/ExplodeScrubber';
import { benchWall, motion } from '../theme/tokens';
import { isEnabled } from '../flags';
import { DEFAULT_BUILD, choiceOf, type Build, type BuildKey } from '../features/bike/build';
import { BuildToggle, BuildTray } from '../features/bike/BuildTray';

const REDUCED = '(prefers-reduced-motion: reduce)';
const PORTRAIT = '(max-width: 760px)';
/** A phone turned sideways: short and wide. */
const LANDSCAPE = '(max-height: 500px) and (orientation: landscape)';

function useExplodeStage(reelRef: RefObject<HTMLElement | null>, reduce: boolean) {
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
    if (reduce) return;
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
  }, [reduce, mapped, set]);

  useEffect(() => stop, []);
  return { progress, fromSlider, toggle };
}

export function ExploreBikePage() {
  const reduce = useMediaQuery(REDUCED, { noSsr: true });
  const reelRef = useRef<HTMLElement>(null);
  const { progress, fromSlider, toggle } = useExplodeStage(reelRef, reduce);
  const canHover = useMediaQuery('(hover: hover)', { noSsr: true });
  // Reduced motion: no cue to scroll, so the hint shows from the start.
  const t = reduce ? 1 : headBlend(progress, false);
  const apart = progress > 0.5;

  // The build tray (flag bikeBuild): swap gears, brakes, rims, chainrings and mudguards.
  const buildOn = isEnabled('bikeBuild');
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD);
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState('');
  const [last, setLast] = useState<BuildKey>();
  const trayId = useId();
  const change = useCallback((key: BuildKey, value: Build[BuildKey]) => {
    setBuild((b) => {
      const next = { ...b, [key]: value };
      setSaid(choiceOf(key, next).name + ' fitted.');
      return next;
    });
    setLast(key);
  }, []);

  /* Phones. Portrait: title, then the stage (in proportion to the bike), the controls, and a
     panel below them for the hint, the build tray and the info card, so the card never covers the
     drawing. Landscape (a phone turned sideways): the stage and controls fill the left, and the
     title and panel sit in a column on the right, so the bike gets the whole height. Portrait
     invites riders to turn the phone for a bigger bike. */
  const land = useMediaQuery(LANDSCAPE, { noSsr: true });
  const portrait = useMediaQuery(PORTRAIT, { noSsr: true }) && !land;
  const compact = land || portrait;
  const coarse = useMediaQuery('(pointer: coarse)', { noSsr: true });
  const [cardHost, setCardHost] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const hint = (canHover ? 'Hover a part to learn more.' : 'Tap a part to learn more.') + (canHover ? '' : ' Pinch to zoom.');
  // The bouncing scroll cue turns into the hint as the bike starts to come apart.
  const cue = (
    <Box sx={{ display: 'grid', placeItems: 'center', mt: compact ? 0 : '12px', minHeight: 32, '& > *': { gridArea: '1 / 1' } }}>
      {!reduce && (
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
        sx={{ m: 0, fontSize: compact ? 15 : 'clamp(19px, 1.9vw, 22px)', lineHeight: 1.4, color: 'var(--ink-2)' }}
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
        position: 'relative', minHeight: 0, width: compact ? '100%' : 'min(1320px, 100% - 32px)', mx: 'auto', mt: compact ? 0 : '24px',
        // clip, not hidden: nothing (focus, a zoomed drawing) can ever scroll the stage.
        p: compact ? '12px 12px 0' : '24px 24px 0', borderRadius: compact ? '16px' : '20px', overflow: 'clip', background: benchWall,
        boxShadow: 'inset 0 0 0 1px var(--bench-line)',
        '& .bx, & .bx-stage': { height: '100%' },
        [`@media ${REDUCED}`]: { height: compact ? undefined : '60vh', '& .bx-card:not(:empty)': { animation: 'none' } },
        // Portrait phones: the stage is in proportion to the bike, not the leftover height.
        ...(portrait && { height: 'auto', aspectRatio: '4 / 3' }),
        ...(land && { height: '100%' }),
        '& .bx-card:not(:empty)': { animation: `bf-rise .5s ${motion.rise}` },
        '@keyframes bf-rise': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
      }}
    >
      <ExplodedBike
        progress={progress} bench zoomable build={buildOn ? build : undefined}
        cardHost={compact ? cardHost : undefined} onSelect={setSelected}
      />
    </Box>
  );

  const controls = (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: compact ? '100%' : buildOn ? 'min(680px, 100% - 32px)' : 'min(560px, 100% - 32px)', mx: 'auto', mt: compact ? 0 : '12px',
      }}
    >
      {buildOn && <BuildToggle open={open} onOpenChange={setOpen} build={build} controls={trayId} opensDown={portrait} />}
      {buildOn && (
        <Box component="span" aria-live="polite" data-testid="build-live" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
          {said}
        </Box>
      )}
      <Button
        variant="quiet" onClick={toggle}
        aria-label={apart ? 'Put the bike back together' : 'Take the bike apart'}
        title={apart ? 'Put the bike back together' : 'Take the bike apart'}
        sx={{ flex: 'none', minWidth: 0, width: SCRUBBER_H, height: SCRUBBER_H, p: 0, fontSize: 22 }}
      >
        <Icon name={apart ? 'collapse' : 'expand'} />
      </Button>
      <ExplodeScrubber progress={progress} onChange={fromSlider} />
    </Box>
  );

  const tray = buildOn && <BuildTray build={build} onChange={change} open={open} last={last} id={trayId} stacked={compact} inline={portrait} />;

  // Phones: the panel holds the build tray, then the docked info card, or (with nothing
  // selected) the hint and, in portrait on a touch screen, the invitation to turn the phone.
  const panel = compact && (
    <Box
      data-testid="panel"
      sx={{
        minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        // Room for the card's window shadow inside the scroll box.
        mx: '-8px', px: '8px', pb: '8px',
        '& .bx-card': { position: 'static', width: 'auto', m: '12px 0 0', pointerEvents: 'auto' },
        '& .bx-card:not(:empty)': { animation: `bf-rise .5s ${motion.rise}` },
        '@keyframes bf-rise': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        [`@media ${REDUCED}`]: { '& .bx-card:not(:empty)': { animation: 'none' } },
      }}
    >
      {tray}
      <div ref={setCardHost} data-testid="card-slot" />
      {!selected && (
        <Box sx={{ display: 'grid', justifyItems: land ? 'start' : 'center', gap: '16px', pt: land ? '12px' : '24px', textAlign: land ? 'left' : 'center', '& > div': { justifyItems: land ? 'start' : 'center' } }}>
          {cue}
          {portrait && coarse && (
            <Box
              component="p" data-testid="rotate-invite"
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', m: 0, p: '6px 12px', borderRadius: '8px',
                background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                '& .ico': { fontSize: 20, color: 'var(--tone)' },
              }}
            >
              <Icon name="rotate" />
              Turn your phone sideways for a bigger bike.
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box component="main" id="main" data-pillar="bike">
      <title>Explore the bike · BikeFitter</title>
      <meta name="description" content="Take a road bike apart, part by part. Select any part to see what it does, how it works and whether it affects your fit." />

      <Box
        component="section" id="reel" ref={reelRef} aria-labelledby="bike-h"
        sx={{
          position: 'relative', height: '300vh', mt: 'calc(-1 * var(--head-h))',
          [`@media ${REDUCED}`]: { height: 'auto', mt: 0 },
        }}
      >
        <Box
          data-layout={land ? 'landscape' : portrait ? 'portrait' : 'wide'}
          sx={{
            position: 'sticky', top: 0, height: '100svh', display: 'grid', overflow: 'hidden',
            [`@media ${REDUCED}`]: { position: 'relative', height: 'auto', minHeight: '100vh', pt: '32px' },
            ...(!compact && { gridTemplateRows: 'auto minmax(0, 1fr) auto auto', p: 'calc(var(--head-h) + 32px) 0 24px' }),
            ...(portrait && {
              gridTemplateRows: 'auto auto auto minmax(0, 1fr)', rowGap: '16px', alignContent: 'start',
              p: 'calc(var(--head-h) + 24px) var(--gutter) 0', width: 'min(560px, 100%)', mx: 'auto',
            }),
            ...(land && {
              gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 34%)', gridTemplateRows: 'minmax(0, 1fr) auto', gap: '12px 20px',
              p: 'calc(var(--head-h) + 12px) max(var(--gutter), env(safe-area-inset-right)) 12px max(var(--gutter), env(safe-area-inset-left))',
            }),
          }}
        >
          {!compact && (
            <>
              <Wrap sx={{ textAlign: 'center' }}>{title}{cue}</Wrap>
              {stage}
              {tray}
              {controls}
            </>
          )}
          {portrait && (
            <>
              <Box sx={{ textAlign: 'center' }}>{title}</Box>
              {stage}
              {controls}
              {panel}
            </>
          )}
          {land && (
            <>
              <Box sx={{ gridColumn: 1, gridRow: 1, minHeight: 0 }}>{stage}</Box>
              <Box sx={{ gridColumn: 1, gridRow: 2 }}>{controls}</Box>
              <Box sx={{ gridColumn: 2, gridRow: '1 / span 2', minHeight: 0, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', alignContent: 'start' }}>
                {title}
                {panel}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
