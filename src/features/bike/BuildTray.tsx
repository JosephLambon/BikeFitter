/* The build tray on Explore the bike: swap common road-bike variations (build.ts) and watch the
   exploded bike change. A "Build" button in the explode controls opens a tray of shelf cards
   above them, one per option, each with a Workstand segmented control. The tray collapses
   smoothly, is inert while closed and never moves the page; the page announces each change to
   screen readers. */
import Box from '@mui/material/Box';
import { Icon } from '../../components/Icon';
import { Segmented } from '../../components/Segmented';
import { motion } from '../../theme/tokens';
import { SCRUBBER_H } from './ExplodeScrubber';
import { BUILD_OPTIONS, DEFAULT_BUILD, changedKeys, type Build, type BuildKey } from './build';

export interface BuildTrayProps {
  build: Build;
  onChange: (key: BuildKey, value: Build[BuildKey]) => void;
  open: boolean;
  /** The id the toggle's aria-controls points at. */
  id: string;
  /** One card per row at any width, filling its container (the phone panel). */
  stacked?: boolean;
  /** With `stacked`: label beside its control (a wide panel), not above it (a narrow column). */
  inline?: boolean;
  /** Fills a bounded slot (the portrait phone layout): sits in a window and scrolls inside it. */
  fit?: boolean;
}

const REDUCED = '@media (prefers-reduced-motion: reduce)';

/** Opens and closes the tray. Shows how many options differ from the standard build. */
export function BuildToggle({ open, onOpenChange, build, controls, opensDown = false }: { open: boolean; onOpenChange: (open: boolean) => void; build: Build; controls: string; /** The tray sits below the button (portrait phones). */ opensDown?: boolean }) {
  const n = changedKeys(DEFAULT_BUILD, build).length;
  return (
    <Box
      component="button" type="button" aria-label={n ? `Build, ${n} changed` : 'Build'} aria-expanded={open} aria-controls={controls} onClick={() => onOpenChange(!open)}
      sx={{
        flex: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', height: SCRUBBER_H, px: '16px', border: 0, borderRadius: '10px',
        background: 'var(--surface-2)', color: 'var(--ink)', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        transition: 'background .2s ease',
        '@media (hover: hover)': { '&:hover': { background: 'var(--rule)' } },
        '&:focus-visible': { outline: '2px solid var(--tone)', outlineOffset: '2px' },
        '& .ico': { fontSize: 20 },
        '& .bt-chev': { color: 'var(--ink-3)', transform: open !== opensDown ? 'none' : 'rotate(180deg)', transition: `transform .35s ${motion.rise}` },
        [REDUCED]: { '& .bt-chev': { transition: 'none' } },
        '@media (max-width: 760px)': { px: '14px', '& .bt-word': { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } },
      }}
    >
      <Icon name="build" style={{ color: 'var(--tone)' }} />
      <span className="bt-word">Build</span>
      {n > 0 && (
        <Box
          component="span" aria-hidden="true"
          sx={{
            minWidth: 20, height: 20, px: '6px', borderRadius: '6px', display: 'inline-grid', placeItems: 'center',
            background: 'var(--tone)', color: 'var(--on-tone)', font: '600 12px/1 var(--f-mono)',
            animation: `bt-pop .4s ${motion.rise}`, '@keyframes bt-pop': { from: { transform: 'scale(.4)', opacity: 0 } }, [REDUCED]: { animation: 'none' },
          }}
        >
          {n}
        </Box>
      )}
      <Icon name="chevron" className="bt-chev" />
    </Box>
  );
}

export function BuildTray({ build, onChange, open, id, stacked = false, inline = false, fit = false }: BuildTrayProps) {
  const row = { gridTemplateColumns: '88px minmax(0, 1fr)', alignItems: 'center', p: '8px' };
  return (
    <Box
      id={id} data-open={open} inert={!open} data-testid="build-tray"
      sx={{
        // Grid rows 0fr ↔ 1fr animate the height; a fade and a small rise go with it.
        display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(8px)',
        width: stacked ? '100%' : 'min(1120px, 100% - 32px)', mx: 'auto',
        // In a bounded slot: a window no taller than the slot; the options scroll inside it.
        ...(fit && { minHeight: 0, maxHeight: '100%', borderRadius: '12px', background: 'var(--bg)', boxShadow: '0 0 0 1px var(--rule), var(--shadow)', p: open ? '4px' : 0 }),
        transition: `grid-template-rows .45s ${motion.rise}, opacity .3s ease, transform .45s ${motion.rise}`,
        [REDUCED]: { transition: 'none' },
      }}
    >
      <Box data-testid="build-tray-scroll" sx={{ minHeight: 0, overflow: 'hidden', ...(fit && open && { overflowY: 'auto', overscrollBehavior: 'contain' }) }}>
        <Box
          sx={{
            display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px', pt: fit ? 0 : '12px',
            // Tablets: three cards over two, both rows full width.
            '@media (max-width: 980px)': { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', '& > *': { gridColumn: 'span 2' }, '& > :nth-of-type(n+4)': { gridColumn: 'span 3' } },
            '@media (max-width: 760px)': { gridTemplateColumns: '1fr', gap: '6px', '& > *, & > :nth-of-type(n+4)': { gridColumn: 'auto' } },
            ...(stacked && { '&&': { gridTemplateColumns: '1fr', gap: fit ? '4px' : '6px', '& > *, & > :nth-of-type(n+4)': { gridColumn: 'auto' } } }),
          }}
        >
          {BUILD_OPTIONS.map((o) => {
            const labelId = id + '-' + o.key;
            return (
              <Box
                key={o.key} data-changed={build[o.key] !== DEFAULT_BUILD[o.key]}
                sx={{
                  // Shelf card: --surface, 14 px radius, equal padding on every side.
                  display: 'grid', gap: '8px', p: '12px', borderRadius: '14px', background: 'var(--surface)',
                  '@media (max-width: 760px)': row,
                  ...(stacked && { '&&': inline ? row : { gridTemplateColumns: '1fr', p: '12px' } }),
                  // A tight slot: denser rows, so more options show before it scrolls.
                  ...(fit && { '&&&': { p: '4px 4px 4px 8px', borderRadius: '10px' } }),
                }}
              >
                <Box component="span" id={labelId} sx={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', '@media (max-width: 760px)': { pl: '6px' }, ...(stacked && { '&&': { pl: inline ? '6px' : 0 } }) }}>
                  {o.label}
                  {build[o.key] !== DEFAULT_BUILD[o.key] && <Box component="span" aria-hidden="true" sx={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tone)' }} />}
                </Box>
                <Segmented
                  labelledBy={labelId}
                  options={o.choices.map((c) => ({ value: c.value, label: c.label }))}
                  value={build[o.key]}
                  onChange={(v) => onChange(o.key, v as Build[BuildKey])}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
