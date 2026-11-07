---
name: workstand-design
description: BikeFitter's Workstand design style. Use for ANY visual or design work in this repo, even when the request never says "design" or "Workstand" - building or changing a page, section, component, layout, spacing, colour, dark mode, type, icon, CSS, diagram or the bike drawing; "make it look better"; choosing between visual options; or reviewing, critiquing or auditing a screen, screenshot or style.html ("does this look right?"). In this repo use it instead of frontend-design or the design:* skills, which may only assist after it loads. Not for source research, wording accuracy (AGENTS.md §1.1, §7), calculator logic or bike.js geometry.
---

# Workstand: BikeFitter's design style

A tidy workshop: every tool has its place and its own colour. Locked in by the user on 6 November 2026. Retired styles (Logbook, Velodrome, Carbon) stay in `designs/` for reference; never borrow their moves.

## Where the truth lives

Order matches `AGENTS.md` §6:
1. `designs/site/styles/workstand.css` holds the values (every rule nested in `:root[data-style="workstand"]`).
2. This skill says how to apply the rules and how to review.
3. `AGENTS.md` §6 summarises. Content rules (`AGENTS.md` §0, §1.1, §4.5, §7) always apply on top.

`designs/site/style.html?style=workstand` mirrors the stylesheet for people; when it drifts, fix it. If this skill and the stylesheet disagree on a value, the stylesheet is right: fix the skill in the same change. Changing a *rule* is the user's decision: ask first, then update the stylesheet header, `style.html`, this skill, `references/tokens.md` and `AGENTS.md` §6.5, and log it in `AGENTS.md` §13.

Core tokens are in `AGENTS.md` §6.2. Exact values for every token, tints, dots, the bike drawing's `--bx-*` tokens and the contrast table are in [references/tokens.md](references/tokens.md). Read it before you choose a colour or check contrast.

## The seven rules

1. **Each tool has its colour.** Learn is blue, Check your fit is green, Explore the bike is amber. The colour follows the tool everywhere: nav icon, eyebrow chip, panel tint, primary button, number badges, focus ring, and (for the bike) the selected part. Pages that aren't a tool (home, style guide, sources, glossary) are ink.
2. **Tools hang on pegboard.** Previews sit in `--bg` windows on tinted, dotted panels, like tools on a workshop pegboard.
3. **Windows show the real thing.** Every preview is a small, true version of BikeFitter's own interface (real step names, real lesson titles, the real bike drawing). Never a stock image, a mock-up of something that doesn't exist, or lorem ipsum.
4. **Shapes, not colours, for evidence.** ◆ Research, ● Expert practice, ▲ Rule of thumb. Tags are ink on `--bg` with a hairline. They must still work in greyscale and for colour-blind readers.
5. **Friendly geometry.** 14 px cards, 10 px buttons, 8 px chips, 1 px hairlines. Only windows get a shadow.
6. **One icon set.** A 24 px grid, 1.75 px strokes (the brand mark alone uses 1.9), round caps and joins, no fill (the evidence shapes are the only filled icons). Drawn for BikeFitter. No emoji.
7. **Plain headings.** Sentence case, semibold (650), tight tracking, left-aligned. Only a page's opening hero and its closing "next" panel are centred; lesson heroes stay left, like articles. Anything that takes you somewhere ends with an arrow.

## Decision procedure for anything new

Work through these in order. Each step has one right answer in Workstand; if none fits, see step 9.

1. **Which tool owns it?** Set `data-page` on `<body>` for a whole page, or `data-pillar="learn|fit|bike"` on a block that belongs to another tool (for example the Fit card on the home page). Everything inside picks up `--tone`, `--tone-tint`, `--tone-dot` and `--on-tone`. Not a tool? Leave it ink. Never put two tool colours inside one component. The only places all three appear together are the nav, the home tool grid and the tool-colour demo on the style guide.
2. **Which container?** Choose by role, never by taste:

   | Role | Recipe | Use for |
   |---|---|---|
   | Shelf card | `--surface` fill, 14 px radius, no border, no shadow, 24–32 px padding | Grouped content: levels, how-it-works steps, evidence cards, facts, checklists |
   | Hairline card | 1 px `--rule` border, 14 px radius, no fill | Lighter lists where shelf cards would feel heavy (anatomy of a lesson, style-guide cells) |
   | Pegboard panel | The dotted tint (recipe below), 20 px radius; `.hero-figure` and `.figure` drop to 16 px at ≤ 760 px | The stage behind a window or the one big moment: hero figure, result, takeaway, "next" panel, tool previews |
   | Window | `--bg` fill, `--shadow`. Stand-alone windows (bike host, `.fitq`, `.bx-card`, `.result dl`) are 14 px; `.window` interface previews are 12 px, `12px 12px 0 0` on a pegboard's bottom edge | Anything live or previewed |
   | Chip | 8 px radius, 4 × 10 px padding, 13 px semibold; `.tag` and `.fig-n` shrink to 12 px with a hairline on `--bg` | Eyebrows, tool pills, level numbers, evidence tags, figure numbers |
   | Field chip | 8 px radius, 1 px `--rule`, 6 × 12 px, 14 px | "You'll need" label and value pairs (`.fields`) |
   | Inline badge | 6 px radius, 2 × 6–8 px | `.bx-card-sys`, explode percentage, `kbd` |

3. **What does it do?** One primary action per section: `.btn` (tone fill, `--on-tone` text, 10 px). A secondary action is `.btn--quiet` (`--surface-2`, ink, tone-coloured icon). `.more` is a quiet `--surface`-filled arrow button that adds `→` itself; on a `--surface` or tinted background give it `background: var(--bg)`, as `.next .more` does. Never type an arrow where the CSS already adds one (`.more`, `.tool-title`, `.level-title`, `.lessons a`).
4. **Does it carry evidence?** Use `.tag[data-ev]` with the `#i-research`, `#i-expert` or `#i-thumb` symbol, and the source by register id (`AGENTS.md` §7.3). Never colour-code it.
5. **Does it need a number?** Steps, levels and ordered items use a rounded-square badge: large step badges 8–9 px radius, inline list numbers 6–7 px. `--tone-tint` fill with `--tone` figure; solid `--tone` with `--on-tone` for "do this" steps. Never bare numerals, outlined lap-board figures or `[01]` brackets.
6. **Does it need an icon?** Use the sprite in `designs/site/site.js` (`mark`, `learn`, `fit`, `bike`, `arrow`, `sun`, `moon`, `menu`, `research`, `expert`, `thumb`, `info`). A new icon is drawn on the same 24 px grid at 1.75 px and added to the sprite, never pulled from an icon library.
7. **Which type?** Pick from the scale below, or reuse a size already in `workstand.css`. Don't invent sizes.
8. **Check it.** Run the review checklist.
9. **Nothing fits?** Propose the smallest extension, built from the existing palette and radius scale, and ask the user. Once approved, add it to `workstand.css`, `style.html` (Components or Signature), this skill, `references/tokens.md` and `AGENTS.md` §6.2/§6.3, and log it in §13.

## Colour notes

- Links are ink (`--link: var(--ink)`) and underline on hover; colour belongs to tools, not to links.
- **The one exception to "three colours":** form errors use red (`#c01a1a` light, `#ff8a80` dark), for error text only.
- **Pegboard recipe.** Write it at the element, never as a `:root` variable, because `--tone-dot` must resolve on the element that sets `data-pillar`:

  ```css
  background: radial-gradient(circle at 2px 2px, var(--tone-dot) 1.3px, transparent 1.6px) 0 0 / 18px 18px, var(--tone-tint);
  ```

  It is the only pattern or gradient in the style.
- **Shadow:** `--shadow`, windows only (values in the reference file).

## Type

- **Faces: Plus Jakarta Sans + JetBrains Mono** (chosen 6 November 2026). Load with `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&family=JetBrains+Mono:wght@400..700&display=swap`. Fallbacks `ui-sans-serif, system-ui, sans-serif` and `ui-monospace, Menlo, monospace`.
- **Build with the tokens** (`--f-text`, `--f-display`, `--f-mono`). Never write a family name in a component.
- **No other typefaces.** Geist (`data-font="2"`) and Figtree (`data-font="3"`) stay in the Preview bar for comparison only.
- Plus Jakarta Sans is wide: keep -0.03em on headings and check long titles balance at 375 px.
- Body text adds -0.011em tracking. Sentence case everywhere. No all caps, no letter-spaced capitals, no italics for emphasis.
- **Mono** is for small metadata only (12–13 px): tool meta lines, level meta, the explode percentage, `kbd`, hex codes. Never paragraphs, buttons or headings.

| Role | Class | Size |
|---|---|---|
| Page title | `.title` | `clamp(44px, 6.6vw, 80px)`, line-height 1.02; in a page `.head`, `clamp(36px, 5vw, 64px)` |
| Section title | `.sec-title` | `clamp(32px, 4.4vw, 52px)`, 1.06 |
| Statement, takeaway | `.statement`, `.takeaway` | `clamp(26px, 3.4vw, 40px)` |
| Fit question | `.q` | `clamp(28px, 3.4vw, 40px)` |
| Fit input value | `.field input` | `clamp(48px, 6vw, 72px)` |
| Result figure | `.result .v` | `clamp(64px, 10vw, 128px)`, -0.05em; `.marks .v` 34 px |
| Card titles | `.try h2` 30, `.level-title` / `.unit-head h3` 28, `.tool-title` 26, `.point h3` 23, `.how h3` 21, `.evidence h3` / `.facts h3` 20, `.anatomy h3` 17 | px |
| Dek | `.dek` | `clamp(19px, 1.9vw, 22px)`; `.head .dek` 18 px; `.sec-dek` 19 px |
| Lesson reading text | `.point p` | 18 px / 1.6 |
| Body | `body` | 17 px / 1.55 |
| Controls | `.btn`, `.more` 15 px; nav links 14 px | 600 / 500 |
| Section label | `.sec-label` | 15 px 600 in `--tone` |
| Small, captions | `.tool-desc` 16; `.tag` 12 | 13–15 px in `--ink-2` or `--ink-3` |

## Layout, space and motion

What `AGENTS.md` §6.1–§6.2 doesn't already say:
- Header is `--bg` at 88% opacity. Breakpoints: 980 px (bike tile stacks), 760 px (phone padding; fields stack). At ≤ 751 px the bike info card sits over the heading area.
- Hero padding-top 88 px; 40 px under a section head; 64 px between hero text and its figure; 12–16 px gaps in card grids. At ≤ 760 px `base.css` drops section padding to 80 px; its 56 px hero padding loses to Workstand's 88 px, which has higher specificity.
- **Page shape:** centred hero (eyebrow chip in tone → title → dek → field chips → actions → pegboard figure), then left-aligned sections, then a centred pegboard "next" panel pointing to the next tool.
- **Motion:** hover changes a fill over 0.2 s; new content rises in over 0.5 s on `cubic-bezier(.2, .8, .2, 1)`. No bounce, parallax or auto-playing loops.
- **Focus:** a 2 px `--tone` outline, 2 px offset, 6 px radius. Fields add a 3 px `--tone-tint` ring and a tone border.

## The bike drawing

The bike belongs to Explore the bike, so it uses Bike amber on every page, whatever the page tone. Parts are white (dark mode: near-black) with crisp 1 px ink outlines. The selected part fills amber with a `--bx-active-line` outline; other parts ghost to `--bx-ghost`. The info card is a window: hairline, 14 px radius, shadow, an amber system chip, a 20 px semibold title and a `--surface` "why it matters for fit" box. Theme it only through the `--bx-*` tokens. Never change the geometry in `shared/bike.js` for styling.

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
- Use borders thicker than 1 px (the only exception is the 2 px bottom edge of `kbd`), or radii off the scale: 20 (16 on phones), 14, 12, 10, 8 and 6 px, plus 9 and 7 px for number badges and 3 px for progress bars.
- Hard-code a hex value in a component. Use tokens, so dark mode and tool tones keep working.

## Review checklist (the Workstand lens)

Run this on every UI change and every design review. Look at real screenshots in light and dark (tooling in `AGENTS.md` §11). `design:design-critique` or `design:accessibility-review` may assist, but judge against these rules, not generic taste.

1. **Recognisable.** Squint at it. Would someone who has seen the style guide say "Workstand"? Look for the tool colour, pegboard and window, shape-coded evidence and arrows on links.
2. **Tone.** Is the page or block on the right tool's tone? Is any colour used outside its tool? Are two tool colours mixed in one component?
3. **Containers.** Is each container the right role? Is a shadow on anything that isn't a window?
4. **Geometry.** Are all radii on the scale and all lines 1 px hairlines?
5. **Type.** Plus Jakarta Sans everywhere, JetBrains Mono only on metadata? Sizes from the scale? Headings sentence case, 650, left-aligned below the hero?
6. **Icons.** From the sprite, 24 px grid, 1.75 px stroke? Any emoji?
7. **Evidence.** Tags shape-coded, ink on `--bg`, linked to a source by register id?
8. **Links.** Does everything that navigates end with an arrow? Exactly one primary `.btn` per section?
9. **Windows are real.** Is every preview a true slice of BikeFitter's interface?
10. **`AGENTS.md` §6.4 items 5–9** (motion, widths, themes and contrast, input, British English), plus: no hard-coded hex; pegboard padding tightened on phones; fields keep their visible label and tone focus ring. For contrast use the reference table: "bold" means 700+, so 650 headings under 24 px need 4.5:1.

Report the review like this, with the most serious problem first:

```
Workstand review: <page or component>, <light/dark>, <widths checked>
✗ <rule or item>: <what's wrong> → <fix>
✓ <items that pass, briefly>
Verdict: ships / ships after fixes / rethink
```

## Gotchas

- Every Workstand rule must sit inside `:root[data-style="workstand"]` in `workstand.css`, or it leaks into the retired styles, which share the same markup and `base.css`.
- `base.css` defaults are `--max: 1160px` and `--head-h: 56px`; only `workstand.css` sets 1120 / 60. Read values from `workstand.css`, not `base.css`.
- Inside the site header, `[data-pillar]` resets `--tone-tint` to `--surface`, so the nav doesn't turn into three coloured blocks.
- The Preview bar (style and typeface switcher) is a design-review tool, not part of Workstand. Leave it out of the real build.
- Changing a token's lightness changes contrast in both themes. Recompute the affected pairs by hand and update the table in [references/tokens.md](references/tokens.md).
