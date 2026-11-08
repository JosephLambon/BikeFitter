import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/renderApp';

function reducedMotion(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query.includes('prefers-reduced-motion: reduce'), media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }));
}
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
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(screen.getByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeInTheDocument();
    expect(screen.getByTestId('scroll-cue')).toHaveAttribute('aria-hidden', 'true');
    expect(within(screen.getByRole('main')).queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByTestId('bx-bench')).toBeInTheDocument();
    expect(document.title).toBe('Explore the bike · BikeFitter');
  });

  it('uses the cable scrubber, nudges while together, and drops the percentage', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(document.querySelector('[data-scrubber]')).toHaveAttribute('data-scrubber', 'cable');
    expect(screen.getByTestId('scrubber-nudge')).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: 30 } });
    expect(screen.queryByTestId('scrubber-nudge')).not.toBeInTheDocument();
  });

  it('keeps the heading and turns the scroll cue into a hint as the bike comes apart', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
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
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(screen.queryByRole('group', { name: /^Preview/ })).not.toBeInTheDocument();
  });

  it('drops the scroll cue and shows the hint straight away when motion is reduced', () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(screen.queryByTestId('scroll-cue')).not.toBeInTheDocument();
    expect(screen.getByTestId('part-hint')).toHaveStyle({ opacity: '1' });
  });

  it('takes the bike apart with the slider, in place, and says how far', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
    fireEvent.change(slider(), { target: { value: 42 } });
    expect(slider()).toHaveAttribute('aria-valuetext', '42% apart');
    
    expect(screen.getByRole('button', { name: 'Take the bike apart' })).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: 80 } });
    expect(screen.getByRole('button', { name: 'Put the bike back together' })).toBeInTheDocument();
  });

  it('takes it apart and puts it back with the button', async () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    await userEvent.click(screen.getByRole('button', { name: 'Take the bike apart' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
    await userEvent.click(screen.getByRole('button', { name: 'Put the bike back together' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('explodes the bike as you scroll through the reel', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    sizeReel();
    scrollTo(900);
    expect(slider()).toHaveAttribute('aria-valuetext', '50% apart');
    scrollTo(1600);
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
  });

  it('never makes the drawing jump after the slider is used: scroll takes over only once it catches up', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
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
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    sizeReel();
    scrollTo(1600);
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('lists the sources behind its fit notes in the footer', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
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

  it('is hidden with the flag off, and the drawing is the original bike', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: false });
    expect(screen.queryByRole('button', { name: /^Build/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId('build-tray')).not.toBeInTheDocument();
    expect(partButton('Gear cable')).not.toBeInTheDocument();
    expect(partButton('Rotor \\(disc\\)')).toBeInTheDocument();
  });

  it('starts closed and inert, and opens from the Build button', async () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true, bikeBuild: true });
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
    renderApp('/bike', { exploreBike: true, bikeBuild: true });
    await userEvent.click(toggle());
    for (const [option, picked] of [['Gears', 'Mechanical'], ['Brakes', 'Disc'], ['Rims', 'Shallow'], ['Chainrings', 'Two (2×)'], ['Mudguards', 'Off']]) {
      const radios = within(screen.getByRole('radiogroup', { name: option })).getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(within(screen.getByRole('radiogroup', { name: option })).getByRole('radio', { name: picked })).toBeChecked();
    }
  });

  it('swaps parts on the bike, explains and announces the change, and counts it', async () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true, bikeBuild: true });
    await userEvent.click(toggle());
    await pick('Brakes', 'Rim');
    expect(partButton('Rim brake calliper')).toBeInTheDocument();
    expect(partButton('Quick-release skewer')).toBeInTheDocument();
    expect(partButton('Rotor \\(disc\\)')).not.toBeInTheDocument();
    expect(screen.getByTestId('build-live')).toHaveTextContent('Rim brakes fitted.');
    expect(screen.getByTestId('build-tray')).toHaveTextContent('Rim brakes. Pads grip the sides of the rim.');
    expect(toggle()).toHaveAccessibleName('Build, 1 changed');
    await pick('Mudguards', 'On');
    expect(partButton('Mudguards')).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName('Build, 2 changed');
    await pick('Brakes', 'Disc');
    expect(partButton('Rotor \\(disc\\)')).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName('Build, 1 changed');
  });
});
