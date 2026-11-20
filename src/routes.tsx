import { Navigate, type RouteObject } from 'react-router';
import { AppShell } from './components/AppShell';
import type { SourceId } from './content/sources';
import { ExploreBikePage } from './pages/ExploreBikePage';
import { NotFound } from './pages/NotFound';

/** Route metadata read by the shell. */
export interface RouteHandle {
  /** Sources cited on the page, listed in the footer. */
  sources?: SourceId[];
}

/** The app's routes. Explore the bike is the only tool so far, so the home page sends you there. */
export function routes(): RouteObject[] {
  return [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="/bike" replace /> },
        { path: 'bike', element: <ExploreBikePage />, handle: { sources: ['cyclefit-cleats', 'empfield-stack-reach', 'hogg-height'] } satisfies RouteHandle },
        { path: '*', element: <NotFound /> },
      ],
    },
  ];
}

/** The tools in the main nav, in Workstand order.
    `short` is the label the nav shows on every screen; `label` is the link's accessible name. */
export function navTools() {
  return [{ pillar: 'bike' as const, to: '/bike', label: 'Explore the bike', short: 'Explore' }];
}
