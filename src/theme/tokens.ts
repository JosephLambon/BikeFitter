/* Workstand tokens for the app. Ported from designs/site/styles/workstand.css, which holds the
   values (AGENTS.md §6). If the two disagree, the stylesheet wins: fix this file in the same change.
   Full reference and contrast table: .claude/skills/workstand-design/references/tokens.md */

export type Scheme = 'light' | 'dark';

export interface Palette {
  bg: string; surface: string; surface2: string;
  ink: string; ink2: string; ink3: string; rule: string;
  learn: string; learnTint: string; learnDot: string;
  fit: string; fitTint: string; fitDot: string;
  bike: string; bikeTint: string; bikeDot: string;
  /** Pegboard dots on pages that aren't a tool. */
  inkDot: string;
  onTone: string;
  /** Form errors only: the one exception to "three colours". */
  error: string;
  /** Windows only. */
  shadow: string;
  /** The workbench wall behind the bike on Explore the bike: fill, dots and edge. */
  benchWall: string; benchDot: string; benchLine: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: '#ffffff', surface: '#f6f6f3', surface2: '#ececE7',
    ink: '#1a1a19', ink2: '#5f5f5b', ink3: '#6b6b66', rule: '#e6e6e1',
    learn: '#2b63e0', learnTint: '#eaf0fd', learnDot: '#c3d4f7',
    fit: '#107a44', fitTint: '#e5f4eb', fitDot: '#b6dfc6',
    bike: '#a85100', bikeTint: '#fdf0de', bikeDot: '#efcf9f',
    inkDot: '#dcdcd6', onTone: '#ffffff', error: '#c01a1a',
    shadow: '0 1px 2px rgba(0, 0, 0, .06), 0 10px 30px rgba(0, 0, 0, .09)',
    benchWall: '#ffffff', benchDot: '#ecc89a', benchLine: '#e6e6e1',
  },
  dark: {
    bg: '#151515', surface: '#1d1d1d', surface2: '#262626',
    ink: '#ededea', ink2: '#a8a8a3', ink3: '#91918c', rule: '#2c2c2c',
    learn: '#7da6ff', learnTint: '#17223a', learnDot: '#2a3f66',
    fit: '#4fcb86', fitTint: '#12291d', fitDot: '#22503a',
    bike: '#f2a65a', bikeTint: '#2d2012', bikeDot: '#5a3e1d',
    inkDot: '#343432', onTone: '#151515', error: '#ff8a80',
    shadow: '0 1px 2px rgba(0, 0, 0, .4), 0 12px 32px rgba(0, 0, 0, .45)',
    benchWall: '#2d2012', benchDot: '#5a3e1d', benchLine: 'transparent',
  },
};

/** The bike drawing's tokens (set on `.bx`). */
export const bikeTokens: Record<Scheme, Record<string, string>> = {
  light: {
    '--bx-frame': '#ffffff', '--bx-frame-hi': '#f0f0ec', '--bx-dark': '#f4f4f1', '--bx-dark-hi': '#e6e6e1',
    '--bx-metal': '#e2e5e7', '--bx-metal-hi': '#c3c8cc', // polished alloy
    '--bx-tyre': '#dcc29d', '--bx-tyre-hi': '#b48d5a', '--bx-leather': '#b98a55', '--bx-leather-hi': '#d2a876', // tan walls, honey leather
    '--bx-spoke': 'rgba(26, 26, 25, .28)', '--bx-wire': 'rgba(26, 26, 25, .78)', '--bx-teeth': 'rgba(26, 26, 25, .5)',
    '--bx-chain': '#f4f4f1', '--bx-chain-hi': 'rgba(26, 26, 25, .4)', '--bx-hole': 'var(--bg)',
    '--bx-outline': 'rgba(26, 26, 25, .78)', '--bx-outline-w': '1px',
    '--bx-active-fill': 'var(--bike)', '--bx-active-fill-hi': '#e3913f', '--bx-active-line': '#1a1a19',
    '--bx-ghost': '#ffffff', '--bx-ghost-hi': '#fbfbfa', '--bx-ghost-line': 'rgba(26, 26, 25, .1)', '--bx-ghost-outline': 'rgba(26, 26, 25, .16)',
    '--bx-dim': '1', '--bx-shadow': 'rgba(0, 0, 0, .05)', '--bx-ground': 'rgba(26, 26, 25, .16)', '--bx-dim-line': 'var(--ink-2)',
    '--bx-lift': 'drop-shadow(0 6px 10px rgba(0, 0, 0, .14))',
    '--bx-bench-top': 'var(--bg)', '--bx-bench-front': 'var(--surface-2)', '--bx-bench-line': 'rgba(26, 26, 25, .16)',
  },
  dark: {
    '--bx-frame': '#232323', '--bx-frame-hi': '#2f2f2f', '--bx-dark': '#1b1b1b', '--bx-dark-hi': '#2a2a2a',
    '--bx-metal': '#3b3e41', '--bx-metal-hi': '#4c5054',
    '--bx-tyre': '#8c7050', '--bx-tyre-hi': '#a98a62', '--bx-leather': '#86613a', '--bx-leather-hi': '#a47b4d',
    '--bx-spoke': 'rgba(237, 237, 234, .28)', '--bx-wire': 'rgba(237, 237, 234, .75)', '--bx-teeth': 'rgba(237, 237, 234, .5)',
    '--bx-chain': '#1b1b1b', '--bx-chain-hi': 'rgba(237, 237, 234, .4)', '--bx-hole': 'var(--bg)',
    '--bx-outline': 'rgba(237, 237, 234, .72)', '--bx-outline-w': '1px',
    '--bx-active-fill': 'var(--bike)', '--bx-active-fill-hi': '#f7c48f', '--bx-active-line': '#151515',
    '--bx-ghost': '#191919', '--bx-ghost-hi': '#1d1d1d', '--bx-ghost-line': 'rgba(237, 237, 234, .09)', '--bx-ghost-outline': 'rgba(237, 237, 234, .14)',
    '--bx-dim': '1', '--bx-shadow': 'transparent', '--bx-ground': 'rgba(237, 237, 234, .14)', '--bx-dim-line': 'var(--ink-2)',
    '--bx-lift': 'drop-shadow(0 6px 12px rgba(0, 0, 0, .5))',
    '--bx-bench-top': 'var(--surface-2)', '--bx-bench-front': 'var(--surface)', '--bx-bench-line': 'rgba(237, 237, 234, .14)',
  },
};

export const layout = { max: 1120, gutter: 16, headH: 60, sectionPad: 112 } as const;

/** Workstand's radius scale, in px. */
export const radius = { panel: 20, panelPhone: 16, card: 14, window: 12, button: 10, chip: 8, badge: 6 } as const;

export const fonts = {
  text: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

export const motion = { rise: 'cubic-bezier(.2, .8, .2, 1)' } as const;

/** The custom properties every component reads (`var(--ink)` and so on). */
export function cssVars(p: Palette): Record<string, string> {
  return {
    '--bg': p.bg, '--surface': p.surface, '--surface-2': p.surface2,
    '--ink': p.ink, '--ink-2': p.ink2, '--ink-3': p.ink3, '--rule': p.rule, '--link': 'var(--ink)',
    '--learn': p.learn, '--learn-tint': p.learnTint, '--learn-dot': p.learnDot,
    '--fit': p.fit, '--fit-tint': p.fitTint, '--fit-dot': p.fitDot,
    '--bike': p.bike, '--bike-tint': p.bikeTint, '--bike-dot': p.bikeDot,
    '--tone': 'var(--ink)', '--tone-tint': 'var(--surface)', '--tone-dot': p.inkDot, '--on-tone': p.onTone,
    '--error': p.error, '--shadow': p.shadow,
    '--bench-wall': p.benchWall, '--bench-dot': p.benchDot, '--bench-line': p.benchLine,
    '--f-text': fonts.text, '--f-display': 'var(--f-text)', '--f-mono': fonts.mono,
    '--max': layout.max + 'px', '--gutter': layout.gutter + 'px', '--head-h': layout.headH + 'px',
  };
}

/** The pegboard: the style's only pattern. Write it at the element, so --tone-dot resolves there. */
export const pegboard = 'radial-gradient(circle at 2px 2px, var(--tone-dot) 1.3px, transparent 1.6px) 0 0 / 18px 18px, var(--tone-tint)';

/** The workbench wall on Explore the bike: sparse Bike-amber dots on white with a hairline edge
    (light), the Bike pegboard tint (dark). Chosen 7 November 2026. */
export const benchWall = 'radial-gradient(circle at 2.1px 2.1px, var(--bench-dot) 1.4px, transparent 1.7px) 0 0 / 22px 22px, var(--bench-wall)';
