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
const meter = () => screen.getByTestId('explode-pc');

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
  it('says what the page is for, and how to use it', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true });
    const main = screen.getByRole('main');
    expect(within(main).getAllByText('Explore the bike')[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /^What every part of a road bike\s+does\.$/u })).toBeInTheDocument();
    expect(screen.getByText(/Scroll down, or press Take it apart/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'What you’re looking at.' })).toBeInTheDocument();
    expect(document.title).toBe('Explore the bike · BikeFitter');
  });

  it('drops the scroll instructions when motion is reduced', () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true });
    expect(screen.getByText(/Press Take it apart, or use the slider/)).toBeInTheDocument();
    expect(screen.queryByText(/Scroll down/)).not.toBeInTheDocument();
  });

  it('takes the bike apart with the slider, in place, and says how far', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true });
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
    fireEvent.change(slider(), { target: { value: 42 } });
    expect(slider()).toHaveAttribute('aria-valuetext', '42% apart');
    expect(meter()).toHaveTextContent('42%');
    expect(screen.getByRole('button', { name: 'Take it apart' })).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: 80 } });
    expect(screen.getByRole('button', { name: 'Put it back together' })).toBeInTheDocument();
  });

  it('takes it apart and puts it back with the button', async () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true });
    await userEvent.click(screen.getByRole('button', { name: 'Take it apart' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Fully apart');
    expect(meter()).toHaveTextContent('100%');
    await userEvent.click(screen.getByRole('button', { name: 'Put it back together' }));
    expect(slider()).toHaveAttribute('aria-valuetext', 'Together');
  });

  it('explodes the bike as you scroll through the reel', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true });
    sizeReel();
    scrollTo(900);
    expect(meter()).toHaveTextContent('50%');
    scrollTo(1600);
    expect(meter()).toHaveTextContent('100%');
  });

  it('never makes the drawing jump after the slider is used: scroll takes over only once it catches up', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true });
    sizeReel();
    scrollTo(200); // together
    fireEvent.change(slider(), { target: { value: 80 } });
    scrollTo(480); // scroll maps to 20%: still behind the slider's 80%
    expect(meter()).toHaveTextContent('80%');
    scrollTo(1320); // maps to 80%: caught up, scroll is back in control
    scrollTo(900);
    expect(meter()).toHaveTextContent('50%');
  });

  it('ignores scroll when motion is reduced', () => {
    reducedMotion(true);
    renderApp('/bike', { exploreBike: true });
    sizeReel();
    scrollTo(1600);
    expect(meter()).toHaveTextContent('00%');
  });

  it('lists the sources behind its fit notes in the footer', () => {
    reducedMotion(false);
    renderApp('/bike', { exploreBike: true });
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('link', { name: /How to fit cycling cleats correctly/ })).toHaveAttribute('href', 'https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly');
    expect(within(foot).getAllByText(/Last verified 7 November 2026/).length).toBe(3);
    expect(within(foot).getByText(/isn’t medical advice/)).toBeInTheDocument();
  });
});
