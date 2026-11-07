import { Navigate, type RouteObject } from 'react-router';
import { AppShell } from './components/AppShell';
import type { SourceId } from './content/sources';
import { isEnabled } from './flags';
import { ExploreBikePage } from './pages/ExploreBikePage';
import { HomePlaceholder } from './pages/HomePlaceholder';
import { NotFound } from './pages/NotFound';

/** Route metadata read by the shell. */
export interface RouteHandle {
  /** Sources cited on the page, listed in the footer. */
  sources?: SourceId[];
}

/** The app's routes. Read at call time, so the feature flags can be flipped in tests. */
export function routes(): RouteObject[] {
  const bike = isEnabled('exploreBike');
  return [
    {
      element: <AppShell />,
      children: [
        { index: true, element: bike ? <Navigate to="/bike" replace /> : <HomePlaceholder /> },
        ...(bike ? [{ path: 'bike', element: <ExploreBikePage />, handle: { sources: ['cyclefit-cleats', 'empfield-stack-reach', 'hogg-height'] } satisfies RouteHandle }] : []),
        { path: '*', element: <NotFound /> },
      ],
    },
  ];
}

/** The tools in the main nav, in Workstand order, once each one is switched on. */
export function navTools() {
  return [
    ...(isEnabled('exploreBike') ? [{ pillar: 'bike' as const, to: '/bike', label: 'Explore the bike' }] : []),
  ];
}
