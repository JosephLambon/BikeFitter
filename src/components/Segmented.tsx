/* Workstand segmented control: a choice between a few options, one always picked.
   A --surface-2 track (10 px radius, 3 px inset) holds equal-width options; the picked one sits
   on a sliding thumb (8 px radius, --tone-tint fill, 1 px --tone hairline) with --tone text.
   Every option has the same padding (0 12 px) and height, and the thumb keeps the same 3 px
   inset on all four sides, so the control is symmetrical whichever option is picked.
   Built from native radios, so arrow keys, focus and screen readers work as they do for any
   radio group. */
import { useId } from 'react';
import Box from '@mui/material/Box';
import { motion } from '../theme/tokens';

export interface SegmentedOption<V extends string> { value: V; label: string }

export interface SegmentedProps<V extends string> {
  /** The id of the element that names the group. */
  labelledBy: string;
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}

const INSET = 3;

export function Segmented<V extends string>({ labelledBy, options, value, onChange, className }: SegmentedProps<V>) {
  const name = useId();
  const n = options.length;
  const pos = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <Box
      role="radiogroup" aria-labelledby={labelledBy} className={className}
      sx={{
        position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        p: `${INSET}px`, borderRadius: '10px', background: 'var(--surface-2)',
      }}
    >
      <Box
        aria-hidden="true" data-testid="segmented-thumb"
        style={{ transform: `translateX(${pos * 100}%)` }}
        sx={{
          position: 'absolute', top: INSET, bottom: INSET, left: INSET, width: `calc((100% - ${2 * INSET}px) / ${n})`,
          borderRadius: '8px', background: 'var(--tone-tint)', boxShadow: 'inset 0 0 0 1px var(--tone)',
          transition: `transform .4s ${motion.rise}`,
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Box
            component="label" key={o.value}
            sx={{
              position: 'relative', display: 'grid', placeItems: 'center', minHeight: 36, px: '12px',
              borderRadius: '8px', fontSize: 13, fontWeight: 600, lineHeight: 1.2, textAlign: 'center',
              color: on ? 'var(--tone)' : 'var(--ink-2)', cursor: 'pointer', transition: 'color .2s ease',
              '@media (hover: hover)': { '&:hover': { color: on ? 'var(--tone)' : 'var(--ink)' } },
              '&:has(input:focus-visible)': { outline: '2px solid var(--tone)', outlineOffset: '1px' },
              '& input': { position: 'absolute', inset: 0, m: 0, opacity: 0, cursor: 'pointer' },
            }}
          >
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </Box>
        );
      })}
    </Box>
  );
}
