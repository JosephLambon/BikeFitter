import { StrictMode, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../AppProviders';
import { CoilScrubber } from './CoilScrubber';
import { INVITE } from './scrubber';

function reducedMotion(on: boolean, touch = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: (on && query.includes('prefers-reduced-motion: reduce')) || (touch && query.includes('pointer: coarse')), media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }));
}

const box = () => document.querySelector<HTMLElement>('[data-scrubber="coil"]')!;
const tug = () => parseFloat(box().style.getPropertyValue('--tug') || '0');
/** The biggest tug seen over `ms`, sampled every frame. */
function maxTug(ms: number) {
  let most = 0;
  for (let t = 0; t < ms; t += 16) { act(() => { vi.advanceTimersByTime(16); }); most = Math.max(most, Math.abs(tug())); }
  return most;
}

/** Owns the invitation's beat and the moved state, as ExploreBikePage does. */
function Host({ progress, onChange, since, moved: movedAlready = false }: {
  progress: number; onChange: (p: number) => void; since?: number; moved?: boolean;
}) {
  const [from] = useState(() => since ?? performance.now());
  const [moved, setMoved] = useState(movedAlready);
  return <CoilScrubber progress={progress} since={from} moved={moved} onChange={(p) => { setMoved(true); onChange(p); }} />;
}

function mount(progress = 0, props: { since?: number; moved?: boolean } = {}) {
  const onChange = vi.fn();
  // StrictMode, as in the app: it unmounts and remounts effects, which once stalled the frame loop.
  const ui = (p: typeof props) => <StrictMode><AppProviders><Host progress={progress} onChange={onChange} {...p} /></AppProviders></StrictMode>;
  const r = render(ui(props));
  return Object.assign(onChange, { rerender: (p: typeof props) => r.rerender(ui(p)), unmount: r.unmount });
}

/** Frames as Chrome runs them on a busy page: a frame that has already begun when a timer asks
    for one runs a moment later, stamped with the time it began, which is before the timer ran. */
function lateFrames(soon = 3, lag = 8) {
  const queued = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const n = ++id;
    queued.set(n, cb);
    setTimeout(() => { const f = queued.get(n); queued.delete(n); f?.(performance.now() - lag); }, soon);
    return n;
  });
  vi.stubGlobal('cancelAnimationFrame', (n: number) => { queued.delete(n); });
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('CoilScrubber', () => {
  it('draws the coil and its end, with the slider on top', () => {
    reducedMotion(false);
    mount(0.4);
    expect(box().querySelector('[data-part="front"]')!.getAttribute('d')).toMatch(/^M/);
    expect(box().querySelector('[data-end]')!.getAttribute('d')).toMatch(/^M/);
    expect(screen.getByRole('slider', { name: 'How far apart the bike is' })).toHaveAttribute('aria-valuenow', '40');
  });

  it('gives a small tug soon after it appears, then every few seconds, until someone moves it', () => {
    reducedMotion(false);
    mount();
    expect(box()).toHaveAttribute('data-invite', 'on');
    expect(maxTug(INVITE.first - 50)).toBe(0); // nothing before the first tug
    const pulled = maxTug(600);
    expect(pulled).toBeGreaterThan(INVITE.pull * 0.6);
    expect(pulled).toBeLessThanOrEqual(INVITE.pull * 1.3);
    maxTug(800); // the tug springs back and settles
    expect(maxTug(INVITE.every - 1750)).toBe(0); // then a pause
    expect(maxTug(800)).toBeGreaterThan(0); // and again, on the beat (INVITE.first + INVITE.every)
  });

  it('pulls further on a touch screen, so it reads at a phone’s smaller pixels', () => {
    reducedMotion(false, true);
    mount();
    expect(maxTug(INVITE.first + 600)).toBeGreaterThan(INVITE.pull * 1.2);
  });

  it('keeps inviting after a press that moves nothing, such as a thumb starting a scroll', () => {
    reducedMotion(false);
    mount();
    act(() => { fireEvent.pointerDown(box()); fireEvent.pointerUp(box()); });
    expect(box()).toHaveAttribute('data-invite', 'on');
    expect(maxTug(INVITE.first + 600)).toBeGreaterThan(0);
  });

  it('stops inviting for good once it is moved', () => {
    reducedMotion(false);
    const onChange = mount();
    act(() => { fireEvent.change(screen.getByRole('slider'), { target: { value: 20 } }); });
    expect(onChange).toHaveBeenCalledWith(0.2);
    expect(box()).toHaveAttribute('data-invite', 'off');
    maxTug(400); // any tug already under way settles
    expect(maxTug(INVITE.every * 4)).toBe(0);
  });

  it('plays every tug when each frame is stamped before the timer that woke it ran (busy phones)', () => {
    reducedMotion(false, true);
    lateFrames();
    mount();
    maxTug(INVITE.first - 50);
    for (let beat = 0; beat < 4; beat++) {
      expect(maxTug(1000), `tug ${beat + 1}`).toBeGreaterThan(INVITE.touchPull * 0.6);
      expect(maxTug(INVITE.every - 1000)).toBeLessThan(1); // and a pause between
    }
  });

  it('stays on the page’s beat when it is mounted again, as the phone layouts do when a phone turns', () => {
    reducedMotion(false);
    const since = performance.now();
    const first = mount(0, { since });
    maxTug(INVITE.first + 300);
    first.unmount();
    act(() => { vi.advanceTimersByTime(1200); }); // mounted again 2.7 s in: the next tug is still due at 5.2 s
    mount(0, { since });
    const at = performance.now() - since;
    expect(maxTug(INVITE.first + INVITE.every - at - 300)).toBe(0); // not 1.2 s after mounting again
    expect(maxTug(800)).toBeGreaterThan(INVITE.pull * 0.6); // on the beat
  });

  it('stays still once the page says it has been moved, even mounted again', () => {
    reducedMotion(false);
    mount(0, { moved: true });
    expect(box()).toHaveAttribute('data-invite', 'off');
    expect(maxTug(INVITE.every * 2)).toBe(0);
  });

  it('never invites with reduced motion', () => {
    reducedMotion(true);
    mount();
    expect(box()).toHaveAttribute('data-invite', 'off');
    expect(maxTug(INVITE.every * 3)).toBe(0);
  });

  it('pulls in, not out, once the bike is apart', () => {
    reducedMotion(false);
    mount(1);
    act(() => { vi.advanceTimersByTime(INVITE.first + 120); });
    expect(tug()).toBeLessThan(0);
  });
});
