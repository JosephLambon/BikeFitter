/* The coil-spring explode scrubber (flag `bikeCoil`). A steel coil stretches from an anchor
   cap to the grip as the bike comes apart: the half of each turn behind the axis is drawn
   lighter than the half in front, the middle coils lag a moving grip and wobble when it
   stops. Until someone first moves it, the grip gives a small tug every few seconds to say
   "try me". Only a real change counts: on a phone, a thumb that lands on the dock to scroll
   or swipe fires pointerdown without meaning to touch the scrubber. The tugs keep one beat
   from `since`, and the page keeps `moved`, so the phone layouts, which mount the
   scrubber again when a phone turns, neither restart the rhythm nor bring a stopped
   invitation back. The MUI Slider underneath does the input and accessibility; its thumb is
   the grip. The drawing is written straight to the DOM each frame, so React never re-renders
   for the animation, and the loop sleeps whenever nothing moves. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { sliderText } from './explode';
import { CoilMotion, coilPaths, FILL_LEAD, INVITE, MIN_SPAN, nextTug, PAD } from './scrubber';
import { SCRUBBER_H } from './ExplodeScrubber';

const H = SCRUBBER_H;

/** `since` (ms, performance clock): when the invitation began. `moved`: whether the scrubber
    has been moved. The page owns both, so they outlive the remount when a phone turns; it
    should set `moved` on the first `onChange`. */
export function CoilScrubber({ progress, onChange, since, moved }: {
  progress: number; onChange: (p: number) => void; since: number; moved: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const parts = useRef<Record<string, SVGElement | null>>({});
  const [width, setWidth] = useState(400);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const touchScreen = useMediaQuery('(pointer: coarse)', { noSsr: true });
  const inviting = !moved && !reduce;

  const motion = useRef(new CoilMotion());
  // What the frame loop and the invitation's timer read; written only once React commits.
  const now = useRef({ progress, width, reduce });
  useLayoutEffect(() => { now.current = { progress, width, reduce }; }, [progress, width, reduce]);

  const draw = useCallback(() => {
    const { progress: p, width: w, reduce: r } = now.current, m = motion.current;
    const c = coilPaths(p, w, H, r ? {} : { wave: m.wave.x, tug: m.tug.x });
    const set = (k: string, a: string, v: string) => parts.current[k]?.setAttribute(a, v);
    set('back', 'd', c.back); set('front', 'd', c.front); set('shine', 'd', c.shine); set('tang', 'd', c.tang);
    set('fill', 'width', String(Math.max(0, c.x1 + FILL_LEAD)));
    box.current?.style.setProperty('--tug', (r ? 0 : m.tug.x).toFixed(2) + 'px');
  }, []);

  // One frame loop, started on demand and stopped as soon as everything has settled.
  const frame = useRef(0);
  const wake = useCallback(() => {
    if (frame.current) return;
    let last = performance.now();
    const tick = (t: number) => {
      // Chrome stamps a frame with the time it began, which on a busy page can be before the
      // timer that woke the loop ran: such a frame has no time in it, so skip it, never stop.
      if (t <= last) { frame.current = requestAnimationFrame(tick); return; }
      // Real time, so a tug plays to the clock even at a low frame rate (capped after a stall).
      const dt = Math.min(0.25, (t - last) / 1000); last = t;
      const { progress: p, width: w, reduce: r } = now.current;
      const busy = !r && motion.current.step(dt, p, w - PAD * 2 - MIN_SPAN);
      draw();
      frame.current = busy ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw]);
  // Reset the id too: StrictMode unmounts and remounts, and a stale id would stop wake() for good.
  useEffect(() => () => { cancelAnimationFrame(frame.current); frame.current = 0; }, []);

  useLayoutEffect(() => {
    const el = box.current!;
    const measure = () => { if (el.clientWidth) setWidth(el.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw at once for every change, then let the springs animate what follows.
  useLayoutEffect(() => { draw(); if (!reduce) wake(); }, [progress, width, reduce, draw, wake]);

  // The invitation: a first tug soon after it appears, then one every INVITE.every ms, on one
  // beat from `since` (each timer aims at the next beat, so late timers never drift it); out
  // while together, in once apart; further on touch screens, whose pixels are physically smaller.
  useEffect(() => {
    if (!inviting) return;
    let timer = 0;
    const plan = (after: number) => {
      const due = nextTug(after, since);
      timer = window.setTimeout(() => {
        motion.current.kick(now.current.progress > 0.5 ? -1 : 1, touchScreen ? INVITE.touchPull : INVITE.pull);
        wake();
        plan(Math.max(due, performance.now()));
      }, Math.max(0, due - performance.now()));
    };
    plan(performance.now());
    return () => clearTimeout(timer);
  }, [inviting, touchScreen, wake, since]);

  const ref = (k: string) => (n: SVGElement | null) => { parts.current[k] = n; };

  return (
    <Box
      ref={box} data-scrubber="coil" data-invite={inviting ? 'on' : 'off'}
      sx={{ position: 'relative', flex: '1 1 240px', minWidth: 0, height: H, borderRadius: '14px', overflow: 'hidden', background: 'var(--surface-2)' }}
    >
      <svg aria-hidden="true" width="100%" height={H} style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <rect ref={ref('fill')} x={0} y={0} height={H} fill="var(--tone-tint)" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path ref={ref('back')} data-part="back" stroke="var(--ink-3)" strokeWidth={1.75} opacity={0.45} />
          <path ref={ref('front')} data-part="front" stroke="var(--tone)" strokeWidth={2.6} />
          <path ref={ref('shine')} stroke="var(--bg)" strokeWidth={0.9} opacity={0.7} />
          <path ref={ref('tang')} data-end="" stroke="var(--tone)" strokeWidth={2.6} />
        </g>
        <rect x={PAD - 3} y={H / 2 - 12} width={4} height={24} rx={2} fill="var(--ink-2)" />
      </svg>
      {/* The slider spans only where the grip can travel, so the grip sits exactly at the coil's end. */}
      <Slider
        value={Math.round(progress * 100)}
        min={0} max={100}
        onChange={(_e, v) => onChange((v as number) / 100)}
        getAriaValueText={() => sliderText(progress)}
        slotProps={{ input: { 'aria-label': 'How far apart the bike is' } }}
        sx={{
          position: 'absolute', top: 0, bottom: 0, left: PAD + MIN_SPAN, right: PAD, width: 'auto', height: '100%', p: 0, m: 0,
          // MUI pads the slider 20 px top and bottom on touch screens, which drops the grip
          // below the coil's end. The track is already tall enough to grab.
          '@media (pointer: coarse)': { p: 0 },
          '& .MuiSlider-rail, & .MuiSlider-track': { opacity: 0 },
          '& .MuiSlider-thumb': {
            width: 5, height: 28, borderRadius: '6px', background: 'var(--tone)', transition: 'none',
            marginLeft: 'var(--tug, 0px)', // the invitation's tug moves the grip with the coil's end
            '&::before': { boxShadow: 'none' },
            '&:hover, &.Mui-active': { boxShadow: 'none' },
            '&.Mui-focusVisible': { boxShadow: 'none', outline: '2px solid var(--tone)', outlineOffset: 3 },
          },
          // A wider invisible grab area round the slim grip.
          '& .MuiSlider-thumb::after': { width: 32, height: H, borderRadius: 0 },
        }}
      />
    </Box>
  );
}
