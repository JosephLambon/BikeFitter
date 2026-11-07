import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Wrap } from '../components/layout';

/** Shown at / until the home page is built (and while every tool's flag is off). */
export function HomePlaceholder() {
  return (
    <Box component="main" id="main" sx={{ py: '112px', textAlign: 'center' }}>
      <title>BikeFitter</title>
      <Wrap>
        <Typography variant="h1" sx={{ mb: 2 }}>BikeFitter</Typography>
        <Typography sx={{ color: 'var(--ink-2)', fontSize: 19, maxWidth: '30em', mx: 'auto' }}>
          Learn how a road bike should fit you, measure yourself and see how a bike fits together. Coming soon.
        </Typography>
      </Wrap>
    </Box>
  );
}
