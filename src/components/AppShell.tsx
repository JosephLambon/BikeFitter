import Box from '@mui/material/Box';
import { Outlet, useMatches } from 'react-router';
import type { RouteHandle } from '../routes';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppShell() {
  const sources = useMatches().flatMap((m) => (m.handle as RouteHandle | undefined)?.sources ?? []);
  return (
    <>
      <Box
        component="a" href="#main"
        sx={{ position: 'absolute', left: 16, top: -80, zIndex: 60, background: 'var(--ink)', color: 'var(--bg)', p: '8px 14px', borderRadius: '10px', '&:focus': { top: 8 } }}
      >
        Skip to content
      </Box>
      <SiteHeader />
      <Outlet />
      <SiteFooter sources={sources} />
    </>
  );
}
