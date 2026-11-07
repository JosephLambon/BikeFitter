import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/renderApp';

describe('app routes and the exploreBike flag', () => {
  it('flag on: serves Explore the bike, links it from the nav, and sends the home page there', async () => {
    const { router } = renderApp('/', { exploreBike: true });
    expect(await screen.findByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/bike');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Explore the bike' })).toHaveAttribute('aria-current', 'page');
  });

  it('flag off: the page does not exist and the nav does not offer it', () => {
    renderApp('/bike', { exploreBike: false });
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Explore the bike' })).not.toBeInTheDocument();
  });

  it('flag off: the home page stays a holding page', () => {
    renderApp('/', { exploreBike: false });
    expect(screen.getByRole('heading', { level: 1, name: 'BikeFitter' })).toBeInTheDocument();
  });

  it('switches between light and dark from the header', async () => {
    renderApp('/bike', { exploreBike: true });
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
