/* Explore the bike (AGENTS.md §5). Scrolling through the reel takes the bike apart. The button
   and slider do the same in place, without moving the page; whichever was used last is in
   control, and scroll only takes control back once it catches the bike's current state, so the
   drawing never jumps (§6.1). */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
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

const REDUCED = '(prefers-reduced-motion: reduce)';

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
          sx={{
            position: 'sticky', top: 0, height: '100svh', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto',
            p: 'calc(var(--head-h) + 32px) 0 24px', overflow: 'hidden',
            [`@media ${REDUCED}`]: { position: 'relative', height: 'auto', minHeight: '100vh', pt: '32px' },
          }}
        >
          <Wrap sx={{ textAlign: 'center' }}>
            <Typography variant="h1" id="bike-h" sx={{ m: 0 }}>Explore your bike’s anatomy.</Typography>
            {/* The bouncing scroll cue turns into the hint as the bike starts to come apart. */}
            <Box sx={{ display: 'grid', placeItems: 'center', mt: '12px', minHeight: 32, '& > *': { gridArea: '1 / 1' } }}>
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
                sx={{ m: 0, fontSize: 'clamp(19px, 1.9vw, 22px)', lineHeight: 1.4, color: 'var(--ink-2)' }}
              >
                {canHover ? 'Hover a part to learn more.' : 'Tap a part to learn more.'}
              </Typography>
            </Box>
          </Wrap>

          <Box
            className="stage-bike"
            sx={{
              // The workbench: amber dots on a white wall, with the bench drawn under the tyres.
              position: 'relative', minHeight: 0, width: 'min(1320px, 100% - 32px)', mx: 'auto', mt: '24px',
              p: '24px 24px 0', borderRadius: '20px', overflow: 'hidden', background: benchWall,
              boxShadow: 'inset 0 0 0 1px var(--bench-line)',
              '@media (max-width: 760px)': { borderRadius: '16px', p: '16px 12px 0' },
              '& .bx, & .bx-stage': { height: '100%' },
              [`@media ${REDUCED}`]: { height: '60vh', '& .bx-card:not(:empty)': { animation: 'none' } },
              // On phones the card covers the heading area, never the controls.
              '@media (max-width: 751px)': {
                '&, & .bx': { position: 'static' },
                '& .bx.bx--docked .bx-card': {
                  position: 'absolute', top: 'calc(var(--head-h) + 12px)', left: 16, right: 16, width: 'auto', m: 0,
                  maxHeight: 'calc(100% - var(--head-h) - 150px)', overflow: 'auto', pointerEvents: 'auto', zIndex: 3,
                },
              },
              '& .bx-card:not(:empty)': { animation: `bf-rise .5s ${motion.rise}` },
              '@keyframes bf-rise': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
            }}
          >
            <ExplodedBike progress={progress} bench />
          </Box>

          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: 'min(560px, 100% - 32px)', mx: 'auto', mt: '12px',
            }}
          >
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
        </Box>
      </Box>
    </Box>
  );
}
