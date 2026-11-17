import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../AppProviders';
import { routes } from '../routes';

/** Render the whole app at a path. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes(), { initialEntries: [path] });
  const utils = render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { ...utils, router };
}
