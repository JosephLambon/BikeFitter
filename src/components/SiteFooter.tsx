import Box from '@mui/material/Box';
import { Link } from 'react-router';
import { formatDate, LAST_REVIEW, SOURCES, type SourceId } from '../content/sources';
import { navTools } from '../routes';
import { Wrap } from './layout';

/** Footer: the page's sources, the disclaimer (AGENTS.md §4.5) and the last content review. */
export function SiteFooter({ sources = [] }: { sources?: SourceId[] }) {
  return (
    <Box component="footer" sx={{ background: 'var(--surface)', borderTop: '1px solid var(--rule)', color: 'var(--ink-2)', fontSize: 13 }}>
      <Wrap sx={{ p: '56px 0 96px', '& p': { m: '0 0 12px', maxWidth: '70em' } }}>
        {sources.length > 0 && (
          <>
            <Box component="h2" sx={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', m: '0 0 8px', letterSpacing: '-0.01em' }}>Sources</Box>
            <Box component="ol" sx={{ m: '0 0 24px', pl: '18px', '& li': { mb: '6px' }, '& a': { color: 'var(--ink)' } }}>
              {sources.map((id) => {
                const s = SOURCES[id];
                return (
                  <li key={id}>
                    {s.author}, <a href={s.url}>{s.title}</a>{s.org ? `, ${s.org}` : ''}. Last verified {formatDate(s.lastVerified)}.
                  </li>
                );
              })}
            </Box>
          </>
        )}
        <p>BikeFitter gives starting points, not prescriptions. It isn’t medical advice: if you have pain, numbness or an injury, see a qualified bike fitter, a physiotherapist or your GP.</p>
        <Box component="nav" aria-label="Footer" sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', m: '20px 0 16px', '& a': { color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } } }}>
          {navTools().map((t) => <Link key={t.to} to={t.to}>{t.label}</Link>)}
        </Box>
        <p>Last content review {formatDate(LAST_REVIEW)}.</p>
      </Wrap>
    </Box>
  );
}
