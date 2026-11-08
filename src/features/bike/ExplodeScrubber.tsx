/* The explode scrubber: a tall, iOS-brightness-style track whose fill is a gear cable, kinked
   into loops when the bike is together and pulled taut as it comes apart. The MUI Slider
   underneath does the input and accessibility; its thumb is the tone-coloured grip at the
   cable's end. While the bike is together, a small arrow nudges right to say "drag me". */
import { useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { clamp, sliderText } from './explode';
import { cablePath, FILL_LEAD, MIN_SPAN, PAD, span } from './scrubber';
import { motion } from '../../theme/tokens';

export const SCRUBBER_H = 56;

export function ExplodeScrubber({ progress, onChange }: { progress: number; onChange: (p: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  useLayoutEffect(() => {
    const el = ref.current!;
    const measure = () => { if (el.clientWidth) setWidth(el.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = SCRUBBER_H;
  const end = span(progress, width).x1;
  const cable = cablePath(progress, width, H);
  const nudge = clamp(1 - progress * 12); // gone as soon as the bike starts to come apart

  return (
    <Box
      ref={ref} data-scrubber="cable"
      sx={{
        position: 'relative', flex: '1 1 240px', minWidth: 0, height: H, borderRadius: '14px', overflow: 'hidden', background: 'var(--surface-2)',
        '& .nudge': { animation: `bf-nudge 1.8s ${motion.rise} infinite` },
        '@keyframes bf-nudge': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(5px)' } },
        '@media (prefers-reduced-motion: reduce)': { '& .nudge': { animation: 'none' } },
      }}
    >
      <svg aria-hidden="true" width="100%" height={H} style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <rect x={0} y={0} width={end + FILL_LEAD} height={H} fill="var(--tone-tint)" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={cable.d} stroke="var(--tone)" strokeWidth={5} />
          <path d={cable.d} stroke="var(--tone-tint)" strokeWidth={1.5} />
        </g>
        {nudge > 0 && (
          <g transform={`translate(${end + FILL_LEAD + 14} ${H / 2})`} opacity={nudge} data-testid="scrubber-nudge">
            <path className="nudge" d="M-3 -6 L3 0 L-3 6" fill="none" stroke="var(--tone)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      {/* The slider spans only where the grip can travel, so the grip sits exactly at the cable's end. */}
      <Slider
        value={Math.round(progress * 100)}
        min={0} max={100}
        onChange={(_e, v) => onChange((v as number) / 100)}
        getAriaValueText={() => sliderText(progress)}
        slotProps={{ input: { 'aria-label': 'How far apart the bike is' } }}
        sx={{
          position: 'absolute', top: 0, bottom: 0, left: PAD + MIN_SPAN, right: PAD, width: 'auto', height: '100%', p: 0, m: 0,
          // MUI pads the slider 20 px top and bottom on touch screens, which drops the grip
          // below the cable's end. The track is already tall enough to grab.
          '@media (pointer: coarse)': { p: 0 },
          '& .MuiSlider-rail, & .MuiSlider-track': { opacity: 0 },
          '& .MuiSlider-thumb': {
            width: 4, height: 28, borderRadius: '6px', background: 'var(--tone)', transition: 'none',
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
