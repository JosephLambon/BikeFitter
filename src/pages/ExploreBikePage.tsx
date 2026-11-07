/* Explore the bike (AGENTS.md §5). Scrolling through the reel takes the bike apart. The button
   and slider do the same in place, without moving the page; whichever was used last is in
   control, and scroll only takes control back once it catches the bike's current state, so the
   drawing never jumps (§6.1). */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icon } from '../components/Icon';
import { Eyebrow, SectionHead, Wrap } from '../components/layout';
import { ExplodedBike } from '../features/bike/ExplodedBike';
import { caughtUp, clamp, headBlend, reelProgress, sliderText } from '../features/bike/explode';
import { motion } from '../theme/tokens';

const REDUCED = '(prefers-reduced-motion: reduce)';

const FACTS = [
  { title: 'Seven systems', body: 'Frame, fork, cockpit, contact points, drivetrain, brakes and wheels, plus a bottle cage.' },
  { title: 'Three contact points', body: 'You touch the bike at the saddle, the handlebar and the pedals. These are where fit is set.' },
  { title: 'UK names', body: 'Parts use UK terms, such as chainset and rear mech. The glossary will list the US names too.' },
];

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
  const t = headBlend(progress, reduce);
  const pc = Math.round(progress * 100);

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
          <Wrap sx={{ display: 'grid', textAlign: 'center', '& > *': { gridArea: '1 / 1' }, '& .dek': { fontSize: 18, lineHeight: 1.45, color: 'var(--ink-2)', mx: 'auto', maxWidth: '30em', mb: '28px' } }}>
            <div style={{ opacity: 1 - t, transform: `translateY(${-16 * t}px)` }}>
              <Eyebrow>Explore the bike</Eyebrow>
              <Typography variant="h1" id="bike-h" sx={{ m: '0 0 20px' }}>What every part of a road bike&nbsp;does.</Typography>
              <p className="dek">
                {reduce ? 'Press Take it apart, or use the slider, to see how a road bike fits together.' : 'Scroll down, or press Take it apart, to see how a road bike fits together.'}
                {' '}Then select any part to find out what it does.
              </p>
            </div>
            {!reduce && (
              <div aria-hidden="true" style={{ opacity: t, transform: `translateY(${16 * (1 - t)}px)`, pointerEvents: 'none' }}>
                <Eyebrow>Explore the bike</Eyebrow>
                <Typography component="p" variant="h1" sx={{ m: '0 0 20px' }}>Select any part.</Typography>
                <p className="dek">Hover over it or tap it. You can also press <kbd>Tab</kbd>, then use the arrow keys. Parts that affect your fit say why.</p>
              </div>
            )}
          </Wrap>

          <Box
            className="stage-bike"
            sx={{
              position: 'relative', minHeight: 0, width: 'min(1320px, 100% - 32px)', mx: 'auto',
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
            <ExplodedBike progress={progress} />
          </Box>

          <Box
            sx={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px 20px',
              width: 'min(680px, 100% - 32px)', mx: 'auto', mt: '12px', p: '10px 12px', borderRadius: '14px', background: 'var(--surface)',
            }}
          >
            <Button variant="quiet" startIcon={<Icon name="bike" />} onClick={toggle}>
              {progress > 0.5 ? 'Put it back together' : 'Take it apart'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px', fontSize: 13, color: 'var(--ink-3)' }}>
              <span aria-hidden="true">Together</span>
              <Slider
                value={pc}
                min={0} max={100}
                onChange={(_e, v) => fromSlider((v as number) / 100)}
                getAriaValueText={() => sliderText(progress)}
                slotProps={{ input: { 'aria-label': 'How far apart the bike is' } }}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <span aria-hidden="true">Apart</span>
              <Box component="span" aria-hidden="true" data-testid="explode-pc" sx={{ fontFamily: 'var(--f-mono)', fontSize: 13, background: 'var(--bg)', borderRadius: '6px', p: '2px 6px', color: 'var(--ink)', minWidth: '4.2ch', textAlign: 'center' }}>
                {String(pc).padStart(2, '0')}%
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="section" aria-labelledby="about-h" sx={{ py: '112px', '@media (max-width: 760px)': { py: '80px' } }}>
        <Wrap>
          <SectionHead label="The drawing" title="What you’re looking at." id="about-h">
            A modern road bike with disc brakes, drawn from the drive side: the side with the chain. Its proportions come from a real mid-size endurance frame.
          </SectionHead>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2, '@media (max-width: 980px)': { gridTemplateColumns: '1fr' } }}>
            {FACTS.map((f) => (
              <Card component="li" key={f.title} sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ m: '0 0 6px' }}>{f.title}</Typography>
                <Typography sx={{ m: 0, fontSize: 15, color: 'var(--ink-2)' }}>{f.body}</Typography>
              </Card>
            ))}
          </Box>
        </Wrap>
      </Box>
    </Box>
  );
}
