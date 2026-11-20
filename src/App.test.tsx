import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/renderApp';

describe('app routes', () => {
  it('serves Explore the bike, links it from the nav, and sends the home page there', async () => {
    const { router } = renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/bike');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const link = within(nav).getByRole('link', { name: 'Explore the bike' });
    expect(link).toHaveAttribute('aria-current', 'page');
    // Every screen shows the short label; the link's name stays in full.
    expect(link).toHaveTextContent(/^Explore$/);
  });

  it('sends unknown paths to Page not found', () => {
    renderApp('/nowhere');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeInTheDocument();
  });

  it('switches between light and dark from the header', async () => {
    renderApp('/bike');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
