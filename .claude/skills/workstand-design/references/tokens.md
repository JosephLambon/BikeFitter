# Workstand tokens (full reference)

Copied from `designs/site/styles/workstand.css` on 6 November 2026. If the stylesheet changes, it wins: update this file in the same change.

## Colour

| Token | Light | Dark | Name and job |
|---|---|---|---|
| `--bg` | `#ffffff` | `#151515` | Bench: page and window fill |
| `--surface` | `#f6f6f3` | `#1d1d1d` | Shelf: cards, footer, quiet links, field fill |
| `--surface-2` | `#ececE7` | `#262626` | Hover, current nav item, quiet button, empty progress |
| `--ink` | `#1a1a19` | `#ededea` | Text; the tone of pages that aren't a tool |
| `--ink-2` | `#5f5f5b` | `#a8a8a3` | Label: secondary text, deks, descriptions |
| `--ink-3` | `#6b6b66` | `#91918c` | Metadata, captions, bylines, units |
| `--rule` | `#e6e6e1` | `#2c2c2c` | 1 px hairlines and field borders |
| `--link` | `var(--ink)` | `var(--ink)` | Links are ink; colour belongs to tools |
| `--learn` | `#2b63e0` | `#7da6ff` | Learn blue |
| `--learn-tint` | `#eaf0fd` | `#17223a` | Learn panel and chip fill |
| `--learn-dot` | `#c3d4f7` | `#2a3f66` | Learn pegboard dots |
| `--fit` | `#107a44` | `#4fcb86` | Fit green |
| `--fit-tint` | `#e5f4eb` | `#12291d` | Fit panel and chip fill |
| `--fit-dot` | `#b6dfc6` | `#22503a` | Fit pegboard dots |
| `--bike` | `#a85100` | `#f2a65a` | Bike amber; the selected bike part |
| `--bike-tint` | `#fdf0de` | `#2d2012` | Bike panel and chip fill |
| `--bike-dot` | `#efcf9f` | `#5a3e1d` | Bike pegboard dots |
| `--tone` | `var(--ink)` | `var(--ink)` | The current tool's colour (set by `data-page` or `data-pillar`) |
| `--tone-tint` | `var(--surface)` | `var(--surface)` | The current tool's tint |
| `--tone-dot` | `#dcdcd6` | `#343432` | The current tool's dots (ink pages use grey dots) |
| `--on-tone` | `#ffffff` | `#151515` | Text on a solid tone fill |
| Error text | `#c01a1a` | `#ff8a80` | Form errors only, the one exception to "three colours" |

Light `--fit` and `--bike` were darkened on 6 November 2026 (from `#13834a` and `#b25600`) so that tool-coloured chip text on its own tint passes WCAG AA.

**How tone is set** (in the stylesheet):
- `body[data-page="learn"]`, `body[data-page="lesson"]` and `[data-pillar="learn"]` → Learn
- `body[data-page="fit"]` and `[data-pillar="fit"]` → Fit
- `body[data-page="bike"]` and `[data-pillar="bike"]` → Bike
- Anything else → ink
- `.site-head [data-pillar]` keeps `--tone-tint` as `--surface`

## Shape and depth

| Token or value | Use |
|---|---|
| Radius 20 px (16 px at ≤ 760 px) | Pegboard panels: hero figure, `.figure`, `.result`, `.takeaway`, `.next` |
| Radius 14 px | Cards, the bike host window, fit question card, info card, evidence, levels, facts |
| Radius 12 px | Windows (12 12 0 0 when they sit on a pegboard's bottom edge), fields, pager |
| Radius 10 px | Buttons, `.more`, nav links, icon buttons, the fit box inside the info card |
| Radius 8 px | Chips, tags, the brand mark, number badges |
| Radius 6–7 px | Inline badges: `kbd`, mini-list numbers, explode percentage, lesson numbers, focus ring |
| `--shadow` light | `0 1px 2px rgba(0,0,0,.06), 0 10px 30px rgba(0,0,0,.09)`, windows only |
| `--shadow` dark | `0 1px 2px rgba(0,0,0,.4), 0 12px 32px rgba(0,0,0,.45)`, windows only |
| Hairline | `1px solid var(--rule)` |
| Pegboard | `radial-gradient(circle at 2px 2px, var(--tone-dot) 1.3px, transparent 1.6px) 0 0 / 18px 18px, var(--tone-tint)`, written at the element |

## Type

| Token | **Chosen** (default, `data-font="1"`) | Comparison only: `data-font="2"` | Comparison only: `data-font="3"` |
|---|---|---|---|
| `--f-text` and `--f-display` | **Plus Jakarta Sans** (400–800) | Geist | Figtree |
| `--f-mono` | **JetBrains Mono** (400–700) | Geist Mono | DM Mono |

The user chose Plus Jakarta Sans + JetBrains Mono on 6 November 2026. The other two pairings exist only in the prototype's Preview bar.

In the prototypes, all six families load from the Workstand Google Fonts link. In the real build, load only the chosen pair: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&family=JetBrains+Mono:wght@400..700&display=swap` (returned 200 on 6 November 2026). Fallbacks: `ui-sans-serif, system-ui, sans-serif` and `ui-monospace, Menlo, monospace`.

## Layout

| Token | Value |
|---|---|
| `--max` | 1120 px |
| `--gutter` | 16 px (from `base.css`) |
| `--head-h` | 60 px |

## Bike drawing (`--bx-*`, set on `.bx`)

| Token | Light | Dark |
|---|---|---|
| `--bx-frame` / `-hi` | `#ffffff` / `#f0f0ec` | `#232323` / `#2f2f2f` |
| `--bx-dark` / `-hi` | `#f4f4f1` / `#e6e6e1` | `#1b1b1b` / `#2a2a2a` |
| `--bx-metal` / `-hi` | `#fafaf8` / `#eaeae5` | `#262626` / `#333333` |
| `--bx-spoke` | `rgba(26,26,25,.28)` | `rgba(237,237,234,.28)` |
| `--bx-wire` | `rgba(26,26,25,.78)` | `rgba(237,237,234,.75)` |
| `--bx-teeth` | `rgba(26,26,25,.5)` | `rgba(237,237,234,.5)` |
| `--bx-chain` / `-hi` | `#f4f4f1` / `rgba(26,26,25,.4)` | `#1b1b1b` / `rgba(237,237,234,.4)` |
| `--bx-hole` | `#ffffff` (on figures: `var(--bg)`) | `#151515` |
| `--bx-outline` | `rgba(26,26,25,.78)`, width 1 px | `rgba(237,237,234,.72)` |
| `--bx-active-fill` / `-hi` | `var(--bike)` / `#e3913f` | `var(--bike)` / `#f7c48f` |
| `--bx-active-line` | `#1a1a19` | `#151515` |
| `--bx-ghost` / `-hi` | `#ffffff` / `#fbfbfa` | `#191919` / `#1d1d1d` |
| `--bx-ghost-line` / `-outline` | `rgba(26,26,25,.1)` / `rgba(26,26,25,.16)` | `rgba(237,237,234,.09)` / `rgba(237,237,234,.14)` |
| `--bx-shadow` | `rgba(0,0,0,.05)` | `transparent` |
| `--bx-ground` | `rgba(26,26,25,.16)` | `rgba(237,237,234,.14)` |
| `--bx-dim-line` | `var(--ink-2)` | `var(--ink-2)` |
| `--bx-lift` | `drop-shadow(0 6px 10px rgba(0,0,0,.14))` | `drop-shadow(0 6px 12px rgba(0,0,0,.5))` |

## Contrast (WCAG 2.1, checked 6 November 2026)

Normal text needs 4.5:1. Large text (24 px and up, or 18.66 px bold) and UI graphics need 3:1.

| Text on background | Light | Dark |
|---|---|---|
| ink on bg / surface / surface-2 | 17.42 / 16.09 / 14.70 | 15.57 / 14.37 / 12.90 |
| ink-2 on bg / surface / surface-2 | 6.41 / 5.92 / 5.41 | 7.65 / 7.06 / 6.34 |
| ink-3 on bg / surface / surface-2 | 5.36 / 4.95 / 4.52 | 5.77 / 5.32 / 4.78 |
| learn on bg / surface / learn-tint | 5.30 / 4.89 / 4.64 | 7.63 / 7.04 / 6.61 |
| fit on bg / surface / fit-tint | 5.40 / 4.99 / 4.75 | 8.89 / 8.20 / 7.51 |
| bike on bg / surface / bike-tint | 5.47 / 5.05 / 4.87 | 9.02 / 8.33 / 7.82 |
| on-tone on learn / fit / bike | 5.30 / 5.40 / 5.47 | 7.63 / 8.89 / 9.02 |
| error on bg / surface | 6.17 / 5.70 | 8.00 / 7.38 |

The tightest pairs are ink-3 on surface-2 (4.52) and Learn on its tint (4.64). Don't put small text on anything darker than `--surface-2`, and don't lighten a tool colour without re-checking.

Fields are a soft boundary (`--surface` fill and a `--rule` hairline on white, well under 3:1). We accept this only because every field has a visible label, a large value and a unit, and gets a tone border and a 3 px tint ring on focus. Keep all of those.
