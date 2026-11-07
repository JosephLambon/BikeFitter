---
name: workstand-design
description: BikeFitter's locked-in visual style, Workstand ("a tidy workshop - every tool has its place and its own colour"), chosen on 6 November 2026. Use it for ANY design work in this repo, even when the request doesn't say "Workstand" or "design" - building or changing a page, section, component, layout, colour, type, icon, diagram or the bike drawing; choosing between visual options; writing UI copy layout; or reviewing, critiquing or auditing a screen or screenshot. It holds the seven rules, tokens, typeface (Plus Jakarta Sans + JetBrains Mono), type scale, components, signature moves, a decision procedure for new work and the review checklist every BikeFitter screen must pass.
---

# Workstand: BikeFitter's design style

**In one line:** a tidy workshop. Every tool has its place and its own colour.

**Lineage:** leads with Notion (modern, smart, modular). Takes Apple's polish, The Verge's clear labels and claude.dev's plain structure. It copies none of them: no Apple pill buttons or true-black hero, no Verge slash nav or track lines, no Notion illustrations.

**Status:** the user chose Workstand on 6 November 2026. Every design choice and every design review in this repo goes through this skill. Logbook, Velodrome and Carbon remain in `designs/` for reference only; never borrow their moves.

## Where the truth lives

| What | Where | Wins when they disagree on… |
|---|---|---|
| Token values and component styling | `designs/site/styles/workstand.css` (scoped to `:root[data-style="workstand"]`), with layout in `designs/site/styles/base.css` | Values |
| The same values in the app | `src/theme/tokens.ts` (custom properties) and `src/theme/theme.ts` (MUI theme), ported from `workstand.css` | Nothing: change them together with the stylesheet |
| The rules, palette, type and components, live | `designs/site/style.html?style=workstand` | Wording shown to people |
| How to apply the rules, and how to review | This skill | Process |
| Content rules (sources, British English, safety copy) | `AGENTS.md` §0, §1.1, §4.5, §7 | Always apply on top of this skill |

If this skill and the stylesheet disagree on a value, the stylesheet is right: fix the skill in the same change. Changing a *rule* is the user's decision. Ask first, then update the stylesheet header, `style.html`, this skill and `AGENTS.md` §6.5, and log it in `AGENTS.md` §13.

Exact values for every token, the bike drawing's tokens and the contrast table are in [references/tokens.md](references/tokens.md). Read it before you choose a colour or check contrast.

## The seven rules

1. **Each tool has its colour.** Learn is blue, Check your fit is green, Explore the bike is amber. The colour follows the tool everywhere: nav icon, eyebrow chip, panel tint, primary button, number badges, focus ring, and (for the bike) the selected part. Pages that aren't a tool (home, style guide, sources, glossary) are ink.
2. **Tools hang on pegboard.** Previews sit in white windows on tinted, dotted panels, like tools on a workshop pegboard.
3. **Windows show the real thing.** Every preview is a small, true version of BikeFitter's own interface (real step names, real lesson titles, the real bike drawing). Never a stock image, a mock-up of something that doesn't exist, or lorem ipsum.
4. **Shapes, not colours, for evidence.** ◆ Research, ● Expert practice, ▲ Rule of thumb. Tags are ink on white with a hairline. They must still work in greyscale and for colour-blind readers.
5. **Friendly geometry.** 14 px cards, 10 px buttons, 8 px chips, 1 px hairlines. Only windows get a shadow.
6. **One icon set.** A 24 px grid, 1.75 px strokes, round caps and joins, no fill (the evidence shapes are the only filled icons). Drawn for BikeFitter. No emoji.
7. **Plain headings.** Sentence case, semibold (650), tight tracking, left-aligned. Only a page's opening hero and its closing "next" panel are centred; lesson heroes stay left, like articles. Anything that takes you somewhere ends with an arrow.

## Decision procedure for anything new

Work through these in order. Each step has one right answer in Workstand; if none fits, see step 9.

1. **Which tool owns it?** Set `data-page` on `<body>` for a whole page, or `data-pillar="learn|fit|bike"` on a block that belongs to another tool (for example the Fit card on the home page). Everything inside picks up `--tone`, `--tone-tint`, `--tone-dot` and `--on-tone`. Not a tool? Leave it ink. Never put two tool colours inside one component. The only places all three appear together are the nav, the home tool grid and the tool-colour demo on the style guide.
2. **Which container?** Choose by role, never by taste:

   | Role | Recipe | Use for |
   |---|---|---|
   | Shelf card | `--surface` fill, 14 px radius, no border, no shadow, 24–32 px padding | Grouped content: levels, how-it-works steps, evidence cards, facts, checklists |
   | Hairline card | 1 px `--rule` border, 14 px radius, no fill | Lighter lists where shelf cards would feel heavy (anatomy of a lesson, style-guide cells) |
   | Pegboard panel | The dotted tint (recipe below), 20 px radius (16 px at ≤ 760 px) | The stage behind a window or the one big moment: hero figure, result, takeaway, "next" panel, tool previews |
   | Window | `--bg` fill, 12 px radius, `--shadow`, optional 1 px `--rule` title bar with a tool icon | Anything live or previewed: the bike host, fit question card, result details, part info card, interface previews |
   | Chip | 8 px radius, 4 × 10 px padding, 13 px semibold | Eyebrows, level and unit numbers, field pairs, tool pills |

3. **What does it do?** One primary action per section: `.btn` (tone fill, `--on-tone` text, 10 px). A secondary action is `.btn--quiet` (`--surface-2`, ink, tone-coloured icon). A text-style "go somewhere" link is `.more`, which adds `→` itself. Never type an arrow where the CSS already adds one (`.more`, `.tool-title`, `.level-title`, `.lessons a`).
4. **Does it carry evidence?** Use `.tag[data-ev]` with the `#i-research`, `#i-expert` or `#i-thumb` symbol, and the source by register id (`AGENTS.md` §7.3). Never colour-code it.
5. **Does it need a number?** Steps, levels and ordered items use a tinted rounded-square badge (8–9 px radius, `--tone-tint` fill with `--tone` figure; solid `--tone` with `--on-tone` for "do this" steps). Never bare numerals, outlined lap-board figures or `[01]` brackets.
6. **Does it need an icon?** Use the sprite in `designs/site/site.js` (`mark`, `learn`, `fit`, `bike`, `arrow`, `sun`, `moon`, `menu`, `research`, `expert`, `thumb`, `info`; the app's `src/components/Icon.tsx` adds `expand` and `collapse` for the bike's take-apart toggle). A new icon is drawn on the same 24 px grid at 1.75 px and added to the sprite, never pulled from an icon library.
7. **Which type?** Pick from the scale below. Don't invent sizes.
8. **Check it.** Light and dark, 375 px to 1920 px, keyboard focus, contrast. Then run the review checklist.
9. **Nothing fits?** Extend with the fewest new tokens, built from the existing palette and radius scale. Add it to the stylesheet, to `style.html` (Components or Signature) and to this skill, and tell the user what you added and why.

## Tokens (summary)

| Token | Light | Dark | Job |
|---|---|---|---|
| `--bg` | `#ffffff` (Bench) | `#151515` | Page; window fill |
| `--surface` | `#f6f6f3` (Shelf) | `#1d1d1d` | Shelf cards, footer, quiet links |
| `--surface-2` | `#ececE7` | `#262626` | Hover, current nav item, quiet button |
| `--ink` | `#1a1a19` | `#ededea` | Text, non-tool tone |
| `--ink-2` | `#5f5f5b` (Label) | `#a8a8a3` | Secondary text, deks |
| `--ink-3` | `#6b6b66` | `#91918c` | Metadata, captions, bylines |
| `--rule` | `#e6e6e1` | `#2c2c2c` | 1 px hairlines |
| `--learn` | `#2b63e0` | `#7da6ff` | Learn tool |
| `--fit` | `#107a44` | `#4fcb86` | Check your fit tool |
| `--bike` | `#a85100` | `#f2a65a` | Explore the bike tool; the selected bike part |

Each tool colour has a `-tint` (panel and chip fill) and a `-dot` (pegboard dots); see the reference file. Links are ink (`--link: var(--ink)`) and underline on hover; colour belongs to tools, not to links.

**The one exception to "three colours":** form errors use red (`#c01a1a` light, `#ff8a80` dark), for error text only.

**Pegboard recipe.** Write it at the element, never as a `:root` variable, because `--tone-dot` must resolve on the element that sets `data-pillar`:

```css
background: radial-gradient(circle at 2px 2px, var(--tone-dot) 1.3px, transparent 1.6px) 0 0 / 18px 18px, var(--tone-tint);
```

The pegboard is the only pattern or gradient in the style. No decorative gradients anywhere else.

**Shadow:** `--shadow` (light `0 1px 2px rgba(0,0,0,.06), 0 10px 30px rgba(0,0,0,.09)`; dark is heavier). Windows only.

## Type

- **Faces: Plus Jakarta Sans + JetBrains Mono.** The user chose this pairing on 6 November 2026.
  - Plus Jakarta Sans (variable, 400–800) is used for every heading and everything you read.
  - JetBrains Mono (400–700) is used only for small metadata.
  - Both are free on Google Fonts. Load them with `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&family=JetBrains+Mono:wght@400..700&display=swap`.
  - Fallbacks are `ui-sans-serif, system-ui, sans-serif` and `ui-monospace, Menlo, monospace`.
- **Build with the tokens** (`--f-text`, `--f-display`, `--f-mono`). Never write a family name in a component.
- **No other typefaces.** Geist + Geist Mono (`data-font="2"`) and Figtree + DM Mono (`data-font="3"`) stay in the prototype's Preview bar for comparison only. Never use them, or any other face, in new work.
- **Plus Jakarta Sans is wide and geometric.** Keep the tight heading tracking (-0.03em). Check that long titles still balance at 375 px.
- **Voice:** one family, weight does the work. Headings 650 with -0.03em tracking. Body 17 px / 1.55 with -0.011em. Labels 13 px 600. Sentence case everywhere. No all caps, no letter-spaced capitals, no italics for emphasis.
- **Mono** is for small metadata only (12–13 px): tool meta lines, level meta, the explode percentage, `kbd`, hex codes. Never paragraphs, buttons or headings.

| Role | Class | Size |
|---|---|---|
| Page title | `.title` | `clamp(44px, 6.6vw, 80px)`, line-height 1.02 |
| Section title | `.sec-title` | `clamp(32px, 4.4vw, 52px)`, 1.06 |
| Statement, takeaway | `.statement`, `.takeaway` | `clamp(26px, 3.4vw, 40px)` |
| Fit question | `.q` | `clamp(28px, 3.4vw, 40px)` |
| Result figure | `.result .v` | `clamp(64px, 10vw, 128px)`, -0.05em |
| Card titles | `.level-title` 28, `.tool-title` 26, `.point h3` 23, `.how h3` 21, `.evidence h3` / `.facts h3` 20 | px |
| Dek | `.dek` | `clamp(19px, 1.9vw, 22px)`; `.sec-dek` 19 px |
| Lesson reading text | `.point p` | 18 px / 1.6 |
| Body | `body` | 17 px / 1.55 |
| Section label | `.sec-label` | 15 px 600 in `--tone` |
| Small, captions | | 13–15 px in `--ink-2` or `--ink-3` |

## Layout, space and motion

- **Frame:** content max 1120 px, 16 px gutter, sticky 60 px header (translucent `--bg` at 88% with a 14 px blur and a hairline). Breakpoints 980 px (bike tile stacks) and 760 px (phone padding; fields stack). At ≤ 751 px the bike info card sits over the heading area.
- **Rhythm:** section padding 112 px; hero padding-top 88 px; 40 px under a section head; 64 px between the hero text and its figure; 12–16 px gaps in card grids. Try more whitespace before adding anything.
- **Page shape:** centred hero (eyebrow chip in tone → title → dek → field chips → actions → pegboard figure), then left-aligned sections, then a centred pegboard "next" panel pointing to the next tool.
- **Motion:** quiet and explanatory. Hover changes a fill over 0.2 s; new content rises in over 0.5 s on `cubic-bezier(.2, .8, .2, 1)`; the bike explodes on scroll *and* by button or slider without moving the page (`AGENTS.md` §6.1). No bounce, parallax or auto-playing loops. Everything respects `prefers-reduced-motion`.
- **Focus:** a 2 px `--tone` outline, 2 px offset, 6 px radius. Fields add a 3 px `--tone-tint` ring and a tone border.

## The bike drawing

The bike belongs to Explore the bike, so it uses Bike amber on every page, whatever the page tone. Parts are white (dark mode: near-black) with crisp 1 px ink outlines, finished in natural materials: tan-wall tyres (`--bx-tyre`), a honey leather saddle and bar tape (`--bx-leather`) and polished alloy (`--bx-metal`). Materials aren't UI colours, so they never count as a fourth colour; don't add paint colours to the bike. The selected part fills amber with an ink line. Other parts ghost to white. The info card is a window: hairline, 14 px radius, shadow, an amber system chip, a 20 px semibold title and a `--surface` "why it matters for fit" box. Theme it only through the `--bx-*` tokens (see the reference file). Never change the geometry in `shared/bike.js` for styling. On Explore the bike the drawing stands on a **workbench**: the stage is the **bench wall** (`benchWall` in `src/theme/tokens.ts`: sparse Bike-amber dots, 1.4 px on a 22 px grid, on white with a 1 px `--bench-line` hairline edge in light mode; the Bike pegboard tint in dark mode), and `<ExplodedBike bench />` draws a worktop and bench front (`--bx-bench-*`) under the tyres, anchored to the bottom of the stage. The bench drops as the bike comes apart, so falling parts always land on the worktop.

## Copy in the Workstand voice

Plain, friendly and exact, in British English with UK cycling terms (`AGENTS.md` §1.1).
- The eyebrow chip names the feature ("Check your fit"). The headline says what it does in plain words. The dek says what you'll get.
- Section titles describe the content as a short sentence with a full stop ("What's in every lesson.", "Every number has a source."), never puns.
- Buttons start with a verb and match the destination ("Check your fit", "Take it apart").
- Field chips state facts as label and value ("You'll need: Tape measure, hardback book").

## Don't

- Add a fourth colour, or use a tool colour for something that isn't that tool.
- Use colour, or weight, to show evidence.
- Shadow a card, chip or button. Only windows float.
- Use emoji, stock photos, clip art or third-party icon packs.
- Use gradients other than the pegboard, or glass and blur effects other than the header.
- Use pill buttons (980 px radius), true black (`#000`), all-caps labels, slash navigation, track lines, `[01]` numbering, tree lines or highlighter marks. Those belong to Carbon, Velodrome and Logbook.
- Centre reading text, or centre headings below the hero.
- Use borders thicker than 1 px (the only exception is the 2 px bottom edge of `kbd`), or radii outside the scale (20, 14, 12, 10, 8, 6 px).
- Hard-code a hex value in a component. Use tokens, so dark mode and tool tones keep working.

## Review checklist (the Workstand lens)

Run this on every UI change and every design review, together with `AGENTS.md` §6.4. Look at real screenshots in light and dark (screenshot tooling is in `AGENTS.md` §11). For a structured critique you may also use the `design:design-critique` or `design:accessibility-review` skills, but judge against these rules, not generic taste.

1. **Recognisable.** Squint at it. Would someone who has seen the style guide say "Workstand"? Look for the tool colour, pegboard and window, shape-coded evidence and arrows on links.
2. **Tone.** Is the page or block on the right tool's tone? Is any colour used outside its tool? Are two tool colours mixed in one component?
3. **Containers.** Is each container the right role (shelf card, hairline card, pegboard, window, chip)? Is a shadow on anything that isn't a window?
4. **Geometry.** Are all radii on the scale and all lines 1 px hairlines?
5. **Type.** Is everything in Plus Jakarta Sans, with JetBrains Mono only on metadata? Are all sizes from the scale? Are headings sentence case, weight 650 and left-aligned below the hero?
6. **Icons.** Are they from the sprite, 24 px grid and 1.75 px stroke? Is there any emoji?
7. **Evidence.** Are tags shape-coded, ink on white, and linked to a source by register id?
8. **Links.** Does everything that navigates end with an arrow? Is there exactly one primary `.btn` per section?
9. **Windows are real.** Is every preview a true slice of BikeFitter's interface?
10. **Both themes.** Does it work in light and dark, with no hard-coded hex values?
11. **Contrast.** Is text 4.5:1 or better (3:1 for text at 24 px and up, or 18.66 px bold)? Use the reference table. Fields have a soft boundary, so they always need a visible label and the tone focus ring.
12. **Responsive.** Does it work at 375, 768, 1280 and 1920 px, with no horizontal scroll and the pegboard padding tightened on phones?
13. **Motion and input.** Does it respect reduced motion, and work by keyboard, touch and screen reader?
14. **Copy.** Is it British English with UK terms? Are the eyebrow, headline and dek self-explanatory to a first-time visitor?

Report the review like this, with the most serious problem first:

```
Workstand review: <page or component>, <light/dark>, <widths checked>
✗ <rule or item>: <what's wrong> → <fix>
✓ <items that pass, briefly>
Verdict: ships / ships after fixes / rethink
```

## Gotchas

- A custom property that uses another custom property resolves where it is declared. This is why the pegboard gradient is written at each element, not as a `:root` token.
- Inside the site header, `[data-pillar]` resets `--tone-tint` to `--surface`, so the nav doesn't turn into three coloured blocks.
- The Preview bar (style and typeface switcher) is a design-review tool, not part of Workstand. Leave it out of the real build.
- Changing a token's lightness changes contrast in both themes. Re-run the contrast check in [references/tokens.md](references/tokens.md) after any colour change.
