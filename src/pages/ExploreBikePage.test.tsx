import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/renderApp';

/** Fake media queries: `matches` decides which ones hold. */
function stubMedia(matches: (query: string) => boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches(query), media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }));
}
const reducedMotion = (on: boolean) => stubMedia((q) => on && q.includes('prefers-reduced-motion: reduce'));
const PORTRAIT = '(max-width: 760px)';
const LANDSCAPE = '(max-height: 500px) and (orientation: landscape)';
const portraitPhone = () => stubMedia((q) => q === PORTRAIT);
const landscapePhone = () => stubMedia((q) => q === LANDSCAPE);
const part = (name: string) => screen.getByRole('button', { name: new RegExp('^' + name + ', ') });
const slider = () => screen.getByRole('slider', { name: 'How far apart the bike is' });

/** Give the reel a real size (jsdom has no layout): 3000 px tall at y = 0, 1000 px viewport. */
function sizeReel() {
  const reel = document.getElementById('reel')!;
  Object.defineProperty(reel, 'offsetHeight', { configurable: true, value: 3000 });
  Object.defineProperty(reel, 'offsetTop', { configurable: true, value: 0 });
  vi.stubGlobal('innerHeight', 1000);
}
function scrollTo(y: number) {
  act(() => {
    vi.stubGlobal('scrollY', y);
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('Explore the bike page', () => {
  it('names the page and cues a scroll, with nothing else below the drawing', () => {
    reducedMotion(false);
    renderApp('/bike');
    expect(screen.getByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeInTheDocument();
    expect(screen.getByTestId('scroll-cue')).toHaveAttribute('aria-hidden', 'true');
    expect(within(screen.getByRole('main')).queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByTestId('bx-bench')).toBeInTheDocument();
    expect(document.title).toBe('Explore the bike · BikeFitter');
  });

  it('uses the coil scrubber, with no nudge arrow and no percentage', () => {
    reducedMotion(false);
    renderApp('/bike');
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(document.querySelector('[data-scrubber]')).toHaveAttribute('data-scrubber', 'coil');
    expect(screen.queryByTestId('scrubber-nudge')).not.toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: 30 } });
    expect(slider()).toHaveAttribute('aria-valuenow', '30');
  });

  it('keeps the heading and turns the scroll cue into a hint as the bike comes apart', () => {
    reducedMotion(false);
    renderApp('/bike');
    const hint = screen.getByTestId('part-hint');
    expect(hint).toHaveTextContent('a part to learn more.');
    expect(hint).toHaveStyle({ opacity: '0' });
    fireEvent.change(slider(), { target: { value: 50 } });
    expect(hint).toHaveStyle({ opacity: '1' });
    expect(screen.getByTestId('scroll-cue')).toHaveStyle({ opacity: '0' });
    expect(screen.getByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeVisible();
  });

  it('has no design-review pickers left on the page', () => {
    reducedMotion(false);
    renderApp('/bike');
    expect(screen.queryByRole('group', { name: /^Preview/ })).not.toBeInTheDocument();
  });

  it('drops the scroll cue and shows the hint straight away when motion is reduced', () => {
    reducedMotion(true);
    renderApp('/bike');
    expect(screen.queryByTestId('scroll-cue')).not.toBeInTheDocument();
    expect(screen.getByTestId('part-hint')).toHaveStyle({ opacity: '1' });
  });

  it('takes the bike apart with the slider, in place, and says how far', () => {
    reducedMotion(false);
    renderApp('/bike');
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
    fireEvent.change(slider(), { target: { value: 42 } });
    expect(slider()).toHaveAttribute('aria-valuetext', '42% apart');
    
    expect(screen.getByRole('button', { name: 'Take the bike apart' })).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: 80 } });
    expect(screen.getByRole('button', { name: 'Put the bike back together' })).toBeInTheDocument();
  });

  it('takes it apart and puts it back with the button', async () => {
    reducedMotion(true);
    renderApp('/bike');
    await userEvent.click(screen.getByRole('button', { name: 'Take the bike apart' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
    await userEvent.click(screen.getByRole('button', { name: 'Put the bike back together' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('explodes the bike as you scroll through the reel', () => {
    reducedMotion(false);
    renderApp('/bike');
    sizeReel();
    scrollTo(900);
    expect(slider()).toHaveAttribute('aria-valuetext', '50% apart');
    scrollTo(1600);
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
  });

  it('tucks the heading away and grows the bench wall once the reel is most of the way through', () => {
    reducedMotion(false);
    renderApp('/bike');
    sizeReel();
    const layout = document.querySelector<HTMLElement>('[data-layout="wide"]')!;
    scrollTo(900);
    expect(layout.style.getPropertyValue('--tuck')).toBe('0');
    scrollTo(2000);
    expect(layout.style.getPropertyValue('--tuck')).toBe('1');
    expect(screen.getByTestId('bike-head')).toHaveAttribute('data-tuck');
    scrollTo(0);
    expect(layout.style.getPropertyValue('--tuck')).toBe('0');
  });

  it('never tucks the heading with reduced motion', () => {
    reducedMotion(true);
    renderApp('/bike');
    sizeReel();
    scrollTo(2000);
    expect(screen.getByTestId('bike-head')).not.toHaveAttribute('data-tuck');
  });

  it('never makes the drawing jump after the slider is used: scroll takes over only once it catches up', () => {
    reducedMotion(false);
    renderApp('/bike');
    sizeReel();
    scrollTo(200); // together
    fireEvent.change(slider(), { target: { value: 80 } });
    scrollTo(480); // scroll maps to 20%: still behind the slider's 80%
    expect(slider()).toHaveAttribute('aria-valuetext', '80% apart');
    scrollTo(1320); // maps to 80%: caught up, scroll is back in control
    scrollTo(900);
    expect(slider()).toHaveAttribute('aria-valuetext', '50% apart');
  });

  it('ignores scroll when motion is reduced', () => {
    reducedMotion(true);
    renderApp('/bike');
    sizeReel();
    scrollTo(1600);
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('names a picked part in the label above the drawing, with no floating card', async () => {
    reducedMotion(false);
    renderApp('/bike');
    await userEvent.click(screen.getByRole('button', { name: /^Saddle,/ }));
    expect(screen.getByTestId('part-label')).toHaveTextContent('Saddle');
    expect(document.querySelector('.bx-card')).toBeNull();
  });

  it('lists the sources behind its fit notes in the footer', () => {
    reducedMotion(false);
    renderApp('/bike');
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('link', { name: /How to fit cycling cleats correctly/ })).toHaveAttribute('href', 'https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly');
    expect(within(foot).getAllByText(/Last verified 7 November 2026/).length).toBe(3);
    expect(within(foot).getByText(/isn’t medical advice/)).toBeInTheDocument();
  });
});

describe('Explore the bike: build tray', () => {
  const partButton = (name: string) => screen.queryByRole('button', { name: new RegExp('^' + name + ',') });
  const toggle = () => screen.getByRole('button', { name: /^Build/ });
  const pick = (option: string, choice: string) =>
    userEvent.click(within(screen.getByRole('radiogroup', { name: option })).getByRole('radio', { name: choice }));

  it('starts closed and inert, and opens from the Build button', async () => {
    reducedMotion(true);
    renderApp('/bike');
    const tray = document.getElementById(toggle().getAttribute('aria-controls')!)!;
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(tray).toHaveAttribute('inert');
    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(tray).not.toHaveAttribute('inert');
    await userEvent.click(toggle());
    expect(tray).toHaveAttribute('inert');
  });

  it('offers every option as a two-way switch with the standard build picked', async () => {
    reducedMotion(false);
    renderApp('/bike');
    await userEvent.click(toggle());
    for (const [option, picked] of [['Gears', 'Mechanical'], ['Brakes', 'Disc'], ['Rims', 'Shallow'], ['Chainrings', 'Two (2×)'], ['Mudguards', 'Off']]) {
      const radios = within(screen.getByRole('radiogroup', { name: option })).getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(within(screen.getByRole('radiogroup', { name: option })).getByRole('radio', { name: picked })).toBeChecked();
    }
  });

  it('swaps parts on the bike, announces the change without showing a note, and counts it', async () => {
    reducedMotion(false);
    renderApp('/bike');
    await userEvent.click(toggle());
    await pick('Brakes', 'Rim');
    expect(partButton('Rim brake calliper')).toBeInTheDocument();
    expect(partButton('Quick-release skewer')).toBeInTheDocument();
    expect(partButton('Rotor \\(disc\\)')).not.toBeInTheDocument();
    expect(screen.getByTestId('build-live')).toHaveTextContent('Rim brakes fitted.');
    // Announced to screen readers only: no line of text appears under the cards.
    expect(screen.getByTestId('build-tray')).not.toHaveTextContent('Rim brakes');
    expect(toggle()).toHaveAccessibleName('Build, 1 changed');
    await pick('Mudguards', 'On');
    expect(partButton('Mudguards')).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName('Build, 2 changed');
    await pick('Brakes', 'Disc');
    expect(partButton('Rotor \\(disc\\)')).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName('Build, 1 changed');
  });
});

describe('Explore the bike on a portrait phone', () => {

  it('no drawer; the hint waits above the dock and the label stays hidden until a part is picked', () => {
    portraitPhone();
    renderApp('/bike');
    expect(document.querySelector('[data-layout="portrait"]')).toBeInTheDocument();
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('dock')).toBeInTheDocument();
    const slot = screen.getByTestId('label-slot');
    expect(within(slot).getByTestId('part-hint')).toHaveTextContent('Tap a part to learn more. Pinch to zoom.');
    expect(within(slot).getByTestId('part-hint')).toHaveStyle({ opacity: '1' });
    expect(within(slot).getByTestId('part-label-window')).toHaveAttribute('data-shown', 'false');
  });

  it('a narrow window with a mouse is told to hover, not tap or pinch', () => {
    stubMedia((q) => q === PORTRAIT || q === '(hover: hover)');
    renderApp('/bike');
    expect(within(screen.getByTestId('label-slot')).getByTestId('part-hint')).toHaveTextContent('Hover a part to learn more.');
  });

  it('picking a part shows only its name and what it is; picking it again lets it go', async () => {
    portraitPhone();
    renderApp('/bike');
    await userEvent.click(part('Saddle'));
    const label = within(screen.getByTestId('label-slot')).getByRole('status');
    expect(label).toHaveTextContent('Saddle');
    expect(label).toHaveTextContent('Where you sit');
    expect(label).not.toHaveTextContent('Why it matters for fit');
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'true');
    expect(screen.getByTestId('part-hint')).toHaveStyle({ opacity: '0' });
    expect(document.querySelector('.bx-card')).toBeNull(); // no info card anywhere
    await userEvent.click(part('Saddle'));
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'false');
    expect(screen.getByTestId('part-hint')).toHaveStyle({ opacity: '1' });
  });

  it('the build tray and the label never show together', async () => {
    portraitPhone();
    renderApp('/bike');
    const tray = screen.getByTestId('build-tray');
    await userEvent.click(screen.getByRole('button', { name: /^Build/ }));
    expect(tray).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('label-slot')).toHaveAttribute('data-hidden', 'true');
    await userEvent.click(part('Saddle'));
    expect(tray).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('label-slot')).not.toHaveAttribute('data-hidden');
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'true');
  });

  it('never takes the bike apart on scroll', () => {
    portraitPhone();
    renderApp('/bike');
    sizeReel();
    scrollTo(1600);
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('keeps the explode button, coil scrubber and Build button in the dock, and opens the tray on the wall above it', () => {
    portraitPhone();
    renderApp('/bike');
    const dock = within(screen.getByTestId('dock'));
    expect(dock.getByRole('button', { name: 'Take the bike apart' })).toBeInTheDocument();
    expect(dock.getByRole('slider', { name: 'How far apart the bike is' })).toBeInTheDocument();
    expect(screen.getByTestId('dock').querySelector('[data-scrubber="coil"]')).toBeInTheDocument();
    expect(dock.getByRole('button', { name: /^Build/ })).toBeInTheDocument();
    expect(dock.queryByTestId('build-tray')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('wall')).getByTestId('build-tray')).toBeInTheDocument();
  });
});

describe('Explore the bike on a landscape phone', () => {

  it('shows the same label as portrait: the hint waits in its space, and the label stays hidden until a part is picked', () => {
    landscapePhone();
    renderApp('/bike');
    expect(document.querySelector('[data-layout="landscape"]')).toBeInTheDocument();
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rotate-invite')).not.toBeInTheDocument();
    const slot = within(screen.getByTestId('side')).getByTestId('label-slot');
    expect(within(slot).getByTestId('part-hint')).toHaveTextContent('Tap a part to learn more. Pinch to zoom.');
    expect(within(slot).getByTestId('part-label-window')).toHaveAttribute('data-shown', 'false');
  });

  it('picking a part shows only its name and what it is, in the portrait label; picking it again lets it go', async () => {
    landscapePhone();
    renderApp('/bike');
    await userEvent.click(part('Saddle'));
    const label = within(screen.getByTestId('label-slot')).getByRole('status');
    expect(label).toHaveClass('bx-label--phone');
    expect(label).toHaveTextContent('Saddle');
    expect(label).toHaveTextContent('Where you sit');
    expect(label).not.toHaveTextContent('Why it matters for fit');
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'true');
    expect(screen.getByTestId('part-hint')).toHaveStyle({ opacity: '0' });
    expect(document.querySelector('.bx-card')).toBeNull();
    await userEvent.click(part('Saddle'));
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'false');
  });

  it('the build tray and the label never show together', async () => {
    landscapePhone();
    renderApp('/bike');
    const tray = within(screen.getByTestId('side')).getByTestId('build-tray');
    await userEvent.click(screen.getByRole('button', { name: /^Build/ }));
    expect(tray).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('label-slot')).toHaveAttribute('data-hidden', 'true');
    await userEvent.click(part('Saddle'));
    expect(tray).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('label-slot')).not.toHaveAttribute('data-hidden');
    expect(screen.getByTestId('part-label-window')).toHaveAttribute('data-shown', 'true');
  });

  it('a mouse hovering a part does not close the build tray; only a pick does', async () => {
    stubMedia((q) => q === LANDSCAPE || q === '(hover: hover)');
    renderApp('/bike');
    const tray = screen.getByTestId('build-tray');
    await userEvent.click(screen.getByRole('button', { name: /^Build/ }));
    fireEvent.pointerOver(part('Fork'), { pointerType: 'mouse' });
    expect(tray).toHaveAttribute('data-open', 'true');
    await userEvent.click(part('Fork'));
    expect(tray).toHaveAttribute('data-open', 'false');
  });
});
