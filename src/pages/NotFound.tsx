import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';
import { Wrap } from '../components/layout';

export function NotFound() {
  return (
    <Box component="main" id="main" sx={{ py: '112px', textAlign: 'center' }}>
      <title>Page not found · BikeFitter</title>
      <Wrap>
        <Typography variant="h1" sx={{ mb: 2 }}>Page not found.</Typography>
        <Typography sx={{ color: 'var(--ink-2)', fontSize: 19, mb: 4 }}>There’s nothing at this address.</Typography>
        <Box component={Link} to="/" sx={{ display: 'inline-flex', p: '11px 18px', borderRadius: '10px', background: 'var(--surface)', color: 'var(--ink)', fontSize: 15, fontWeight: 600, textDecoration: 'none', '&:hover': { background: 'var(--surface-2)' }, '&::after': { content: '"→"', ml: 1 } }}>
          Go to the home page
        </Box>
      </Wrap>
    </Box>
  );
}
