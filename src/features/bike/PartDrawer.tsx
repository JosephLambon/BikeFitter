/* The part drawer on portrait phones (flag bikeDrawer): a window at the thumb, between the bike
   and the explode controls. It holds the selected part's info card (the same copy as the card on
   desktop). It is always there and open on load, holding a short guide until a part is selected. It moves
   only by the thumb: a swipe up or down on the grab handle opens or hides it (no Show/Hide
   button). Closed, it is a tab naming the selected part. Selecting a part opens it. Keyboard and
   screen-reader users toggle it with the tab, which is a button. It opens into the space between the stage and
   the dock, so the bike never moves and the card never covers the drawing (AGENTS.md §5.1). */
import { useId, useRef, type PointerEvent } from 'react';
import Box from '@mui/material/Box';
import { motion } from '../../theme/tokens';
import { partInfo } from './parts';
import type { Build } from './build';

const REDUCED = '@media (prefers-reduced-motion: reduce)';
/** How far the thumb must travel on the tab before a swipe opens or hides the drawer. */
export const SWIPE_PX = 24;

export interface PartDrawerProps {
  /** The selected part, or null for none. */
  partKey: string | null;
  build?: Build;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the element the info card is portalled into. */
  hostRef: (el: HTMLElement | null) => void;
}

export function PartDrawer({ partKey, build, open, onOpenChange, hostRef }: PartDrawerProps) {
  const bodyId = useId();
  const name = partKey ? partInfo(partKey, build).name : 'Part details';
  const expanded = open;
  const swipe = useRef<{ y: number; done: boolean } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swipe.current = { y: e.clientY, done: false };
    swiped.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const s = swipe.current;
    if (!s || s.done) return;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) < SWIPE_PX) return;
    s.done = true;
    swiped.current = true;
    onOpenChange(dy < 0);
  };
  const onPointerEnd = () => { swipe.current = null; };

  return (
    <Box
      data-testid="drawer" data-open={expanded}
      sx={{
        // A window: --bg, hairline, 12 px radius, the one shadow. It may grow up to the stage.
        display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0,
        mx: 'var(--gutter)', mb: '12px', background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: '12px',
        boxShadow: 'var(--shadow)', overflow: 'hidden',
      }}
    >
      <Box
        component="button" type="button" aria-expanded={expanded} aria-controls={bodyId}
        aria-label={open ? 'Hide part details' : partKey ? `Show details: ${name}` : 'Show part details'}
        data-testid="drawer-tab"
        // Only the thumb moves it: a tap does nothing. Enter or Space (a click with no pointer,
        // detail 0) still toggles it, for keyboard and screen-reader users.
        onClick={(e) => { if (swiped.current) { swiped.current = false; return; } if (e.detail === 0) onOpenChange(!open); }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
        sx={{
          position: 'relative', flex: 'none', display: 'flex', alignItems: 'center', width: '100%', minHeight: open ? 22 : 52, p: open ? 0 : '16px 18px 8px',
          border: 0, background: 'none', color: 'var(--ink)', font: 'inherit', textAlign: 'left', cursor: 'grab',
          // The thumb drags the tab; the page mustn't scroll under it.
          touchAction: 'none', userSelect: 'none',
          // The grab handle says "this pulls up and down".
          '&::before': { content: '""', position: 'absolute', top: 6, left: '50%', width: 36, height: 4, ml: '-18px', borderRadius: '2px', background: 'var(--rule)' },
          '&:focus-visible': { outlineOffset: '-2px' },
        }}
      >
        <Box component="span" aria-hidden="true" sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 650, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: open ? 'none' : 'block' }}>
          {name}
        </Box>
      </Box>
      <Box
        id={bodyId} inert={!expanded} data-testid="drawer-body"
        sx={{
          // Grid rows 0fr ↔ 1fr animate the height, like the build tray.
          flex: '0 1 auto', minHeight: 0, display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', opacity: expanded ? 1 : 0,
          transition: `grid-template-rows .45s ${motion.rise}, opacity .3s ease`,
          [REDUCED]: { transition: 'none' },
        }}
      >
        <Box sx={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!partKey && <DrawerGuide />}
          <Box
            ref={hostRef} data-testid="card-slot"
            sx={{
              minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', p: partKey ? '0 18px 16px' : 0,
              // The drawer is the window; the card inside it is plain content.
              '& .bx-card': { position: 'static', width: 'auto', m: 0, p: 0, border: 0, boxShadow: 'none', background: 'none', borderRadius: 0, pointerEvents: 'auto' },
              '& .bx-card:not(:empty)': { animation: `bf-rise .5s ${motion.rise}` },
              '@keyframes bf-rise': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
              [REDUCED]: { '& .bx-card:not(:empty)': { animation: 'none' } },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/** What the open drawer holds before a part is selected: laid out like the info card it makes
    way for (system chip, title, lines, a --surface box), so the drawer never looks empty. Short
    screens (an iPhone SE) keep only the title and the tip, so nothing is cut off. */
function DrawerGuide() {
  return (
    <Box
      data-testid="drawer-idle"
      sx={{
        minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', p: '2px 18px 16px', fontSize: 14, lineHeight: 1.45,
        '@media (max-height: 720px)': { pb: '12px', '& .dg-more': { display: 'none' }, '& .dg-tip': { p: 0, background: 'none' } },
      }}
    >
      <Box component="p" className="dg-more" sx={{ display: 'inline-block', m: '0 0 8px', px: 1, py: '2px', borderRadius: '6px', background: 'var(--bike-tint)', color: 'var(--bike)', fontSize: 12, fontWeight: 600 }}>
        Part details
      </Box>
      <Box component="h3" data-testid="part-hint" sx={{ fontSize: 20, fontWeight: 650, letterSpacing: '-0.02em', m: '0 0 6px', lineHeight: 1.25 }}>
        Tap a part to learn more.
      </Box>
      <Box component="p" className="dg-more" sx={{ color: 'var(--ink-2)', m: '0 0 10px' }}>
        Its name, what it does and how it works appear here, with why it matters for your fit.
      </Box>
      <Box component="p" className="dg-tip" sx={{ color: 'var(--ink-2)', m: 0, p: '10px 12px', borderRadius: '10px', background: 'var(--surface)' }}>
        Pinch the drawing to zoom. Drag this panel down to hide it.
      </Box>
    </Box>
  );
}
