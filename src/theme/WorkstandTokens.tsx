/* Writes Workstand's custom properties for both colour schemes, and the tool tones.
   Tone follows the tool: anything inside [data-pillar="learn|fit|bike"] picks up that tool's
   colour; everything else is ink. */
import GlobalStyles from '@mui/material/GlobalStyles';
import { bikeTokens, cssVars, palettes } from './tokens';
import { SCHEME_ATTRIBUTE } from './theme';

const tone = (t: 'learn' | 'fit' | 'bike') => ({ '--tone': `var(--${t})`, '--tone-tint': `var(--${t}-tint)`, '--tone-dot': `var(--${t}-dot)` });

const styles = {
  ':root': { ...cssVars(palettes.light), colorScheme: 'light' },
  [`:root[${SCHEME_ATTRIBUTE}="dark"]`]: { ...cssVars(palettes.dark), colorScheme: 'dark' },
  '[data-pillar="learn"]': tone('learn'),
  '[data-pillar="fit"]': tone('fit'),
  '[data-pillar="bike"]': tone('bike'),
  // In the header each tool keeps its colour for the icon, but not a coloured fill.
  '.site-head [data-pillar]': { '--tone-tint': 'var(--surface)' },
  '.bx': bikeTokens.light,
  [`:root[${SCHEME_ATTRIBUTE}="dark"] .bx`]: bikeTokens.dark,
} as const;

export function WorkstandTokens() {
  return <GlobalStyles styles={styles} />;
}
