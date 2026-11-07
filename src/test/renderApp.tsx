import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { AppProviders } from '../AppProviders';
import type { Flag } from '../flags';
import { routes } from '../routes';

const ENV: Record<Flag, string> = { exploreBike: 'VITE_FLAG_EXPLORE_BIKE' };

/** Render the whole app at a path, with every flag set explicitly. */
export function renderApp(path: string, flags: Record<Flag, boolean>) {
  for (const [f, on] of Object.entries(flags)) vi.stubEnv(ENV[f as Flag], on ? 'true' : 'false');
  const router = createMemoryRouter(routes(), { initialEntries: [path] });
  const utils = render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { ...utils, router };
}
