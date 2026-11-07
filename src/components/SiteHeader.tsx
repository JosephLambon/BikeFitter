import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { Link, NavLink } from 'react-router';
import { navTools } from '../routes';
import { Icon } from './Icon';
import { Wrap } from './layout';
import { ThemeToggle } from './ThemeToggle';

/** Slim translucent header: brand, the tools (each in its own colour) and the theme toggle. */
export function SiteHeader() {
  const tools = navTools();
  return (
    <AppBar
      component="header"
      className="site-head"
      sx={{
        zIndex: 30, color: 'var(--ink)', borderBottom: '1px solid var(--rule)',
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <Wrap component="nav" aria-label="Main" sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 'var(--head-h)' }}>
        <Box component={Link} to="/" sx={{ display: 'inline-flex', alignItems: 'center', gap: '10px', mr: 'auto', color: 'var(--ink)', textDecoration: 'none' }}>
          <Box component="span" aria-hidden="true" sx={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: '8px', background: 'var(--ink)', color: 'var(--bg)', '& .ico': { width: 20, height: 20 } }}>
            <Icon name="mark" strokeWidth={1.9} />
          </Box>
          <Box component="span" sx={{ fontWeight: 650, fontSize: 17, letterSpacing: '-0.02em' }}>BikeFitter</Box>
        </Box>
        {tools.length > 0 && (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, mr: 1, p: 0, display: 'flex', gap: '4px' }}>
            {tools.map((t) => (
              <li key={t.to} data-pillar={t.pillar}>
                <Box
                  component={NavLink}
                  to={t.to}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 1, p: '7px 12px', borderRadius: '10px',
                    fontSize: 14, fontWeight: 500, color: 'var(--ink-2)', textDecoration: 'none', transition: 'background-color .2s ease',
                    '&:hover': { background: 'var(--surface)', color: 'var(--ink)' },
                    '&[aria-current="page"]': { background: 'var(--surface-2)', color: 'var(--ink)' },
                    '& .ico': { width: 17, height: 17, color: 'var(--tone)' },
                  }}
                >
                  <Icon name={t.pillar} />
                  <span>{t.label}</span>
                </Box>
              </li>
            ))}
          </Box>
        )}
        <ThemeToggle />
      </Wrap>
    </AppBar>
  );
}
