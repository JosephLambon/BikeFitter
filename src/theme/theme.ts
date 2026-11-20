/* The MUI theme, built from Workstand's tokens. Components read colour from the Workstand
   custom properties (var(--tone), var(--surface) …) so tool tones and dark mode keep working;
   the MUI palette carries the same values for MUI's own internals. */
import { createTheme } from '@mui/material/styles';
import { palettes, radius, type Scheme } from './tokens';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    /** Secondary action: --surface-2 fill, ink text, tone-coloured icon. */
    quiet: true;
  }
}

/** The attribute that carries the colour scheme on <html>. index.html sets it before first paint. */
export const SCHEME_ATTRIBUTE = 'data-theme';
/** localStorage key for the visitor's choice: light, dark or system (the default). */
export const MODE_STORAGE_KEY = 'bf-mode';

function scheme(s: Scheme) {
  const p = palettes[s];
  return {
    palette: {
      mode: s,
      primary: { main: p.ink, contrastText: p.bg },
      error: { main: p.error },
      text: { primary: p.ink, secondary: p.ink2, disabled: p.ink3 },
      background: { default: p.bg, paper: p.bg },
      divider: p.rule,
    },
  };
}

const heading = { fontWeight: 650, letterSpacing: '-0.03em', textWrap: 'balance' } as const;

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: `[${SCHEME_ATTRIBUTE}="%s"]`, cssVarPrefix: 'mui' },
  colorSchemes: { light: scheme('light'), dark: scheme('dark') },
  shape: { borderRadius: radius.button },
  breakpoints: { values: { xs: 0, sm: 761, md: 981, lg: 1280, xl: 1920 } },
  typography: {
    fontFamily: 'var(--f-text)',
    fontSize: 15,
    h1: { ...heading, fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.02 },
    h2: { ...heading, fontSize: 'clamp(32px, 4.4vw, 52px)', lineHeight: 1.06 },
    h3: { ...heading, fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.02em' },
    body1: { fontSize: 17, lineHeight: 1.55, letterSpacing: '-0.011em' },
    body2: { fontSize: 15, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: 15, letterSpacing: '-0.005em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: 'var(--f-text)', fontSize: 17, lineHeight: 1.55, letterSpacing: '-0.011em', background: 'var(--bg)', color: 'var(--ink)' },
        a: { color: 'var(--link)', textUnderlineOffset: 3 },
        ':focus-visible': { outline: '2px solid var(--tone)', outlineOffset: 2, borderRadius: radius.badge },
        'p, li, dd': { textWrap: 'pretty' },
        kbd: { fontFamily: 'var(--f-mono)', fontSize: '.82em', background: 'var(--surface)', border: '1px solid var(--rule)', borderBottomWidth: 2, borderRadius: radius.badge, padding: '1px 6px' },
      },
    },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained' },
      styleOverrides: {
        root: {
          borderRadius: radius.button, padding: '11px 18px', fontSize: 15, fontWeight: 600, lineHeight: 1.3, gap: 8,
          transition: 'background-color .2s ease, filter .2s ease',
          '& .ico': { width: 17, height: 17 },
        },
        startIcon: { margin: 0 },
        endIcon: { margin: 0 },
      },
      variants: [
        { props: { variant: 'contained' }, style: { background: 'var(--tone)', color: 'var(--on-tone)', boxShadow: 'none', '&:hover': { background: 'var(--tone)', filter: 'brightness(1.08)', boxShadow: 'none' } } },
        { props: { variant: 'quiet' }, style: { background: 'var(--surface-2)', color: 'var(--ink)', '& .ico': { color: 'var(--tone)' }, '&:hover': { background: 'var(--rule)' } } },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: radius.button, color: 'var(--ink-2)', width: 40, height: 40, '&:hover': { background: 'var(--surface)', color: 'var(--ink)' } },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none', background: 'var(--bg)', color: 'var(--ink)' } },
    },
    MuiCard: {
      styleOverrides: { root: { background: 'var(--surface)', borderRadius: radius.card, boxShadow: 'none' } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: 'var(--tone)', height: 4, padding: '13px 0' },
        rail: { background: 'var(--surface-2)', opacity: 1 },
        thumb: {
          width: 18, height: 18, background: 'var(--tone)', boxShadow: 'none',
          '&:hover, &.Mui-focusVisible, &.Mui-active': { boxShadow: '0 0 0 6px var(--tone-tint)' },
          '&.Mui-focusVisible': { outline: '2px solid var(--tone)', outlineOffset: 2 },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent', position: 'sticky' },
    },
  },
});
