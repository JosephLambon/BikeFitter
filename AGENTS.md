# AGENTS.md — BikeFitter

> Read this whole file before you start any task in this repo. It is the single source of truth for what we're building, how it should look, and how content must be sourced. `CLAUDE.md` imports this file, so Claude Code loads it automatically each session.

---

## 0. Non-negotiables (read first)

1. **Accuracy is the product.** Every fact, number, range or formula shown to users must trace to a cited, reputable source (see §7). If you can't source it, don't publish it. Add it to §12 *Open questions* instead.
2. **No dead links.** Every external link must be checked before it ships (HTTP 200 after redirects **and** the page content matches what we cite). Record the date you checked it. See §7.4.
3. **Apple-grade quality, in the Workstand style.** Workstand is BikeFitter's design style (chosen 2026-11-06). Match Apple's level of polish, restraint and clarity, but never copy Apple's look.
   - Make every design choice and every design review through the `workstand-design` skill at `.claude/skills/workstand-design/`. Agents that can't load skills read its `SKILL.md` directly.
   - Review every screen with this question: *"Does this follow every Workstand rule, and would anyone recognise it as Workstand?"* If the answer isn't a clear yes, iterate. See §6.
4. **Estimates, not prescriptions.** The fit tool gives starting points and explains why. It never replaces a professional fit or medical advice. Pain or numbness means: see a qualified fitter or physio.
5. **Original artwork only.** Diagrams take inspiration from Bartosz Ciechanowski's *Bicycle* article (https://ciechanow.ski/bicycle/). Never copy its assets, code or exact drawings. The same goes for Apple: inspiration only, no Apple logos, assets or trademarks.
6. **Don't write code until the user asks.** When the user asks for a plan or a spec, deliver that. Confirm the tech stack (§10) before scaffolding.
7. **UK-first, British English.** The site is for UK riders. Every word uses British spelling, grammar and cycling vocabulary, including the names of bike parts (for example *chainset*, not *crankset*; *tyre*, not *tire*). See §1.1.

---

## 1. Vision and audience

**What:** A website that teaches road cyclists how a bike *should* fit them, lets them measure themselves and get an explained starting-point fit, and shows how a road bike is put together.

**Primary user:** The project owner is a road cyclist with about 18 months of riding. They know their current bike doesn't fit well, but they don't know what a good fit looks like, how to measure or rate one, or how often to adjust it. Design for this person: keen and capable, but not a professional.

**Secondary user:** Riders who want to go deeper and understand exactly how a professional fitter works.

**Questions the site must answer clearly:**
- What should a well-fitting road bike feel like and look like on me?
- How do I measure my body and my current bike?
- How do I rate my current fit?
- What should I change first, by how much, and how do I test it?
- How often should I re-check or re-fit? (Answer honestly: there's no evidence-based fixed interval. See §9.)

### 1.1 UK-first locale and language

The site is for UK riders, and its owner is British. Write everything in **British English**: page copy, part names, UI labels, alt text, error messages, metadata, and code comments meant for people. This applies to chat with the user as well.

**Spelling and grammar**
- Use British spelling: colour, centre, metre, tyre, calliper, aluminium, grey, analyse, organise, optimise, licence (noun) / license (verb), practice (noun) / practise (verb), and programme (but a computer *program*). Use *-ise*, not *-ize*.
- Use British grammar and idiom: "at the weekend", "different from/to" (not "different than"), and "maths". Avoid Americanisms such as "gotten".
- Display dates as "6 November 2026" or `06/11/2026`. Show money in £ (GBP). Set `<html lang="en-GB">` and use the `en-GB` locale for all `Intl` date and number formatting. Stored data can keep ISO dates (`YYYY-MM-DD`).
- **Exceptions:** keep code keywords exactly as the language requires (CSS `color`, `text-align: center`). Quote sources verbatim, including their American spelling and titles. Write brand and product names as their owners do.

**Cycling vocabulary (always use the UK term)**

| UK term (use this) | US or other term (glossary alias only) |
|---|---|
| Chainset | Crankset |
| Rear mech / front mech | Rear derailleur / front derailleur |
| Mech hanger | Derailleur hanger |
| Tyre | Tire |
| Brake calliper | Brake caliper |
| Mudguards | Fenders |
| Inside leg | Inseam |
| Sprocket | Cog |
| Jockey wheels | Pulley wheels |
| Puncture | Flat |
| Allen key / hex key | Allen wrench |
| Saddle | Seat (the *seat tube* and *seatpost* keep their names) |
| Physiotherapist (physio), GP | Physical therapist, doctor |
| Postcode | Zip code |

- Use the UK term everywhere. The glossary also gives the US alias so riders reading American sources can match terms up, for example "Chainset (US: crankset)".
- Terms that are the same in both (bottom bracket, cassette, headset, stem, thru-axle, cleat, drivetrain, stack, reach) stay as they are.
- Some UK media also use "derailleur". Still use the UK terms above, for consistency.

**Units**
- Bike measurements: always mm.
- Body measurements: cm by default, with a feet-and-inches toggle.
- Rider weight (if it's ever asked for): kg by default, with a stones-and-pounds toggle.
- Ride distance and speed: miles and mph by default, with a km and km/h toggle, matching UK road signs.

**UK context**
- In the UK, bikes are conventionally set up with the **right-hand lever working the front brake**. Bikes from the US and most of continental Europe are set up the other way round. The anatomy explorer and all brake copy must follow the UK convention and mention the difference for imported bikes. ⚠ Find a source before publishing.
- Prefer UK-based sources when they're equal in quality (for example Phil Burt, Cyclefit, Cycling Weekly and BikeRadar). Link to the UK version of brand sites (`/gb/` or `/uk/` paths) where one exists. Never choose a weaker source just because it's British.
- When advising someone to see a professional, use UK routes: a qualified bike fitter, a physiotherapist, or their GP.
- Any price shown must be in £, sourced and dated.

---

## 2. Site map

| Route (proposed) | Page | Purpose |
|---|---|---|
| `/` | Home | Workstand hero (centred, in ink). Three clear entry points: **Learn**, **Fit Me**, **Explore the Bike**. |
| `/learn` | Learning pathway | Overview of levels and progress (stored client-side). |
| `/learn/[level]/[lesson]` | Lesson | One concept per lesson, with visuals, takeaways and sources. |
| `/fit` | Fit calculator | Step-by-step measurement input. |
| `/fit/summary` | Fit summary | Recommendations, each with **What**, **Why**, **How to check** and **Sources**. Optionally rates the user's current bike. |
| `/anatomy` | Bike anatomy explorer | Interactive exploded diagram with hover explainers. |
| `/sources` | Sources and methodology | Every source, its tier and the date it was last verified. How the calculator works. |
| `/glossary` | Glossary | Terms such as stack, reach, setback, BDC, Q-factor and float. UK term first, US alias second (see §1.1). Linked from everywhere. |

Global elements: a slim translucent top nav, and a footer with the disclaimer, a sources link and a "last content review" date.

---

## 3. Pillar 1: Learn (education pathway)

### 3.1 Structure

There are three levels plus reference material. Each lesson has:
- **Learning outcome:** one sentence.
- **Content:** short and scannable, with a diagram where one helps more than words.
- **Key takeaway:** one bold line.
- **Try it:** a practical at-home step, where safe and relevant.
- **Evidence label** on each claim: `Research`, `Expert practice` or `Rule of thumb`. See §7.2.
- **Sources:** at least one Tier 1 or Tier 2 source (§7.1), with a "last verified" date.
- **Next lesson** and related links to Fit and Anatomy.

### 3.2 Level 1: Fundamentals ("Get comfortable")

For the rider who is a bit into cycling and wants to fit their own bike sensibly.

1. What a bike fit is and why it matters: comfort, injury prevention, power and sustainability.
2. The three contact points: saddle, handlebars and pedals.
3. Signs your bike doesn't fit: a symptom map (knees, hips, lower back, neck and shoulders, hands, saddle area, feet).
4. Measuring yourself at home: inside leg (book method), height, torso, arms, shoulder width, sit bones and foot.
5. Saddle height basics: the heel method, LeMond (0.883 × inside leg) and Hamley & Thomas (109% of inside leg). All three are starting points only.
6. Saddle fore-aft and tilt basics.
7. Reach, drop and handlebar basics.
8. Cleats 101: fore-aft, rotation and float.
9. Making changes safely: mark current positions, change one thing at a time, use small increments, do short test rides first, and use correct torque.
10. When to see a pro, and how often to re-check.

### 3.3 Level 2: Intermediate ("Understand your bike")

1. Frame geometry: stack, reach, effective top tube, seat and head tube angles, BB drop, wheelbase.
2. Sizing: why stack and reach beat "frame size" (Empfield).
3. Saddle height in depth: static vs dynamic knee angles (Holmes 1994; Swart & Holliday 2019), plus Hogg's under-load method.
4. Setback and balance: KOPS and its critics (Bontrager), and Hogg on setback.
5. The cockpit: stem length and angle, spacers, bar width, reach and drop, hood position.
6. Crank length: what the research says (Martin & Spirduso 2001) and what fitters do.
7. Saddles and sit bones: width, shape, pressure and saddle health.
8. Feet first: shoes, insoles, cleat fore-aft, rotation, stance width (Q-factor), float, wedges and shims.
9. The body sets the position: flexibility, mobility and core.
10. Adaptation: how much to change, and how long to ride before judging it.

### 3.4 Level 3: Professional ("How a pro fits you")

1. Fit philosophy: fit the rider, not the bike. There is an "optimum window", not one perfect number (Phil Burt).
2. The intake interview: riding history, goals, volume, injuries and pain points.
3. Physical assessment: range of motion, hamstring and hip flexibility, leg length discrepancy, foot structure and pelvic stability.
4. Order of operations. Many fitters start at the feet, then saddle height, setback and the front end. Some start with crank length. Present this as practice that varies between fitters, not as a single rule.
5. Static vs dynamic fitting, 2D video vs 3D motion capture (for example Retül), and why the measurement method changes the "ideal" angle.
6. Tools: goniometer, plumb bob or laser, fit bike or sizing cycle, saddle and in-shoe pressure mapping, power and cadence data.
7. Knee tracking, varus/valgus, wedges, shims and leg length discrepancy (BikeFit / Paul Swift).
8. Fit-first bike buying: sizing cycle, then target position, then choosing a frame by stack and reach.
9. The fit report and follow-up: what you should receive, and how much to self-adjust afterwards (Steinmetz).
10. Fit systems and credentials: Retül, BikeFit, IBFI's four accreditation levels, how to choose a fitter and what to bring.
11. Research corner: where the evidence is strong, where it's thin, and how to read it.

### 3.5 Reference

- Glossary
- Symptom troubleshooter (symptom → likely causes → what to check → source)
- Further reading (curated from §8)

---

## 4. Pillar 2: Fit Me (calculator)

### 4.1 Principles

- Runs **entirely client-side**. Measurements are never sent to a server. Saving is optional (localStorage).
- Units follow §1.1: body measurements in cm by default with a feet-and-inches toggle, bike dimensions always in mm, and ride distances in miles.
- One question per step, with a progress indicator. Each measurement has an illustrated how-to.
- Every output shows the **method** used, the **evidence label** and the **sources**.
- **No invented numbers.** Every formula or range used must appear in §9 with a source. Anything not yet sourced stays out of the calculator.

### 4.2 Inputs

**Body (required)**
| Input | How to measure (shown with an illustration) |
|---|---|
| Height | Barefoot, back against a wall. |
| Inside leg (cycling) | Barefoot, feet about 15–20 cm apart. Pull a hardback book firmly up into the crotch, spine level, and measure from the floor to the top of the spine. Take three readings and use the average. |

**Body (recommended, improves the output)**
| Input | Used for |
|---|---|
| Torso length (sternal notch to the top of the book at crotch height) | Reach context |
| Arm length (acromion to the centre of a clenched fist, arm hanging) | Reach context |
| Shoulder width (acromion to acromion, bony points) | Handlebar width |
| Foot length / shoe size | Cleat position guidance |
| Sit-bone width (corrugated cardboard or foam impression) | Saddle width guidance via manufacturer sizing |
| Flexibility (standing forward bend, straight legs: palms flat / fingertips touch floor / reach ankles / reach mid-shin / above knees) | Saddle-to-bar drop guidance, given qualitatively |

**Rider profile**
- Goal: comfort/endurance, all-round, or performance/racing.
- Typical ride length and weekly volume (miles by default).
- Riding experience.
- Current symptoms: a checklist mapped to the troubleshooter in §3.5.

**Current bike (optional, enables "Rate my fit")**
- Saddle height (BB centre to top of saddle, along the seat tube)
- Saddle setback
- Saddle-to-hood reach
- Saddle-to-bar drop
- Crank length
- Bar width (centre to centre)
- Stem length and angle
- Spacer stack
- Frame stack and reach (from the manufacturer's geometry chart)

### 4.3 Outputs (`/fit/summary`)

Each recommendation is a card with: **Recommendation** (a value or range), **Why** (in plain English), **Method** (formula or rule, with evidence label), **How to check it on the bike**, **Sources**, and a **See a pro if…** trigger.

| Area | Basis (must match §9) |
|---|---|
| Saddle height starting range | LeMond and Hamley & Thomas from inside leg, shown together. Then validate with a static knee angle check (Holmes 25–35°) and/or Hogg's under-load check. Explain that formulas ignore setback, crank length, shoes, cleats and pedals. |
| Saddle setback starting point | Balance-based approach (Bontrager, Hogg). KOPS may be shown only as a rough starting reference, and its criticism must be stated. |
| Handlebar width | Relates to shoulder width. *Needs a source before release; see §12.* |
| Reach and drop | Qualitative, from flexibility, goal and symptoms. No numeric thresholds unless sourced. |
| Frame size guidance | Compare stack and reach on manufacturer charts. Explain why height-only size charts are approximate. |
| Crank length context | Martin & Spirduso 2001. Present the research honestly; no hard prescription. |
| Saddle width | Sit-bone width, then manufacturer sizing guides. |
| Cleat starting position | Cyclefit: pedal axle at least 10 mm behind the 1st MPJ as a starting point; rotation matched to the natural foot angle. |
| Symptom notes | Each ticked symptom gives its likely causes and what to check, with sources. |
| Adjustment plan | Ordered steps, small increments (Steinmetz: 2–3 mm at the saddle, 5–10 mm at the front end), test rides, re-check. |

### 4.4 Rate my fit

Compare each current-bike value with its recommended range and show one of three states: **Within range**, **Close**, or **Outside range**. Explain each result. Any overall score must be transparent: show the weighting, and label it "a guide, not a diagnosis". Don't present it as scientific.

### 4.5 Safety copy (required)

- This is not medical advice. Persistent pain, numbness or an injury means seeing a qualified bike fitter, a physiotherapist or your GP.
- Before telling users to adjust something, remind them to use manufacturer torque specs (especially with carbon), respect seatpost minimum-insertion marks, follow steerer spacer limits, and not make big changes before a long ride.

---

## 5. Pillar 3: Explore the Bike (anatomy explorer)

### 5.1 Interaction spec

- **Diagram:** a clean side-elevation (drive side) road bike with disc brakes, drawn as layered inline SVG. 3D is optional later and needs user sign-off.
- **UK set-up:** brake copy follows the UK convention (right-hand lever = front brake; see §1.1). All part names use UK terms.
- **Explode slider:** goes from 0% (assembled) to 100% (fully exploded). Each part moves smoothly along its own predefined vector away from its mount point, staggered so sub-assemblies separate logically (for example, wheels out first, then the cockpit lifts away, then the drivetrain fans out). It must stay readable at every slider position.
- **Rule: fully apart, no two pieces overlap.** Every piece must be clearly distinct and viewable on its own. A piece is a *unit* (`unitOf` in `parts.ts`, relaxed 2026-11-08): the frame is one welded or moulded piece, so its tubes stay joined; each wheel's tyre, rim, spokes, hub and valve stay nested in each other, like a wheel off the bike; every other part is a piece of its own. `src/features/bike/layout.ts` measures each unit in the browser and pushes overlapping units apart (with clear space between them) from their own explode vectors. Regression: `e2e/bike-layout.spec.ts` hit-tests the whole stage for the standard build and a fully changed one.
- **Rule: the info card avoids the selected part, and covers as few other parts as possible.** `placeCard` in `explode.ts` scores every place on the stage. If no place misses the part, the card tries wider, shorter shapes. A part drawn more than once (a tyre on each wheel) may lose one copy behind the card, never every copy. The drawing never zooms or moves to make room for the card (removed 2026-11-08 at the user's request). On phones the card docks in a panel beside or below the stage, never over the drawing. Regression: `e2e/bike-layout.spec.ts` checks every part, together and apart, at 1280, 1440 and 1920 px; that selecting never changes the view; and that the card is on screen and unclipped at every width from 600 to 840 px.
- **Phones: no scroll-to-explode** (chosen 2026-11-08). On phones (portrait and landscape) scrolling never takes the bike apart and there is no bouncing scroll cue; only the explode button and the cable scrubber do it. Larger screens keep the scroll reel. Regression: the "scrolling never takes the bike apart" tests in `e2e/bike-layout.spec.ts`.
- **Coil scrubber** (chosen 2026-11-08, flag `bikeCoil`; off: the gear cable below). The explode scrubber's fill is a steel coil from an anchor cap to the grip: the back half of each turn lighter than the front, the middle coils lagging a moving grip and wobbling when it stops (`coilPaths` and `CoilMotion` in `scrubber.ts`, `CoilScrubber.tsx`). Until it is first moved (a drag, a tap on the track or a key; a stray touch that starts a scroll doesn't count), the grip gives a small tug (8 px with a mouse, 12 px on touch screens, whose CSS pixels are physically smaller; then an under-damped spring back) 1.2 seconds after it appears and every 4 seconds after that, out while together and in once apart; never with reduced motion. The tugs keep one beat from when the page opened (`nextTug`), and the page remembers that the scrubber has been moved, so turning a phone (which mounts the controls again) neither restarts the rhythm nor brings a stopped invitation back. A frame stamped before the timer that woke the loop never stops a tug, and each tug plays to the clock, not the frame rate. It replaces the cable's nudge arrow. The user picked it from twelve concepts in `designs/explorations/bike-scrubber.html`. Regression: the "coil" tests in `e2e/bike-layout.spec.ts`, `CoilScrubber.test.tsx` and `scrubber.test.ts`.
- **Cable scrubber alignment.** The grip (slider thumb) and the nudge arrow sit on the cable's end, on the track's centre line, at every progress, on desktop and touch screens (MUI pads its slider 20 px on coarse pointers; `ExplodeScrubber.tsx` removes it). Regression: `e2e/cable-scrubber.spec.ts`, run by the Playwright `cable` project against a server with `bikeCoil` off.
- **Phones, portrait** (≤ 760 px wide; chosen 2026-11-08, flag `bikeDrawer`): the title sits on the page's white (`--bg`); below it the bench wall runs to the bottom of the screen. On the wall: the stage in the bike's proportions (4:3) near the top, then the **part drawer** just above a **dock** fixed along the bottom (`--bg`, hairline top) holding the Build button, the explode button and the cable scrubber, with the build tray opening above them. The drawer is a window (12 px, hairline, shadow) holding the selected part's info card, the same copy as the desktop card. It is open on load, holding a guide laid out like the card it makes way for ("Part details" chip, "Tap a part to learn more.", a line on what the card shows, and a `--surface` tip: "Pinch the drawing to zoom. Drag this panel down to hide it."); screens 720 px tall or less keep only the title and the tip. It moves only by the thumb: a swipe up or down (24 px) on its grab handle opens or hides it. There is no Show/Hide button, and a tap on the tab does nothing; the tab is still a button, so Enter or Space toggles it for keyboard and screen-reader users. Hidden, it is a tab naming the selected part (or "Part details"). Selecting a part opens it; clearing the selection brings the guide back. It opens into the space between the stage and the dock, so the bike never moves and the card never covers the drawing; the card scrolls inside it. The drawer and the build tray never open together: the tray opens in the same space (between the stage and the dock, never inside the dock), as a window no taller than that space, its options scrolling inside it, above the drawer's tab. On screens 720 px tall or less the stage caps at 38svh (42svh otherwise) and the tab steps aside while the tray is open, so at least two options always show. Regression: "Phone, portrait: the build tray" in `e2e/bike-layout.spec.ts`, at 390 × 844, 390 × 664 and 375 × 667. No invitation to turn the phone. With the flag off: title, stage (4:3), controls, then a panel holding the hint, tray, card and the invitation to turn the phone. `src/features/bike/PartDrawer.tsx`. Regression: the portrait tests in `e2e/bike-layout.spec.ts`.
- **Phones, landscape** (≤ 500 px tall, landscape): the stage and controls fill the left; the title and the panel (hint, tray, card) sit in a column on the right, so the bike gets the full height.
- **Zoom:** the drawing zooms on its own (pinch, double-tap, ctrl + wheel or trackpad pinch on desktop) without zooming or scrolling the page and without scrollbars (`zoom.ts`). Once zoomed, a finger or the mouse drags it around; a drag never selects a part. "Reset zoom" (and a double-tap while zoomed) brings back the whole bike with a quick 240 ms ease-out zoom, instant with reduced motion. Regression: the zoom and phone tests in `e2e/bike-layout.spec.ts`.
- **Build swaps never move the view.** The view is fitted to where parts rest at the current explode, not to their swap animations, so the wheels can spin while the rims change depth without the bike jumping. Regression: the rim-depth test in `e2e/bike-layout.spec.ts` checks the viewBox every frame.
- **Hover or focus:** the part is highlighted (Bike amber plus a subtle lift) and other parts dim. A **rectangular info card** appears near the part with: name, what it is, how it works (2–3 sentences), why it matters for fit (if relevant), and a link to the related lesson.
- **Touch and keyboard:** tapping selects a part. Parts can be reached with Tab and the arrow keys, and the card is announced to screen readers. Hover can never be the only way in.
- **Build tray** (chosen 2026-11-08, flag `bikeBuild`): swap common road-bike variations and watch the drawing change. A `Build` button in the explode controls opens a tray of shelf cards above them, one per option, each with a segmented control: gears (mechanical / electronic), brakes (disc / rim), rims (shallow / deep-section), chainrings (two / one) and mudguards (off / on). No line of text appears under the cards when a setting changes; screen readers hear "… fitted.". Each change swaps parts with its own fun, smooth animation (rotors roll away, rim callipers drop in, cables draw themselves, the wheels spin while the rims deepen, an electronic shift rings out from the lever to the mechs), updates the parts' info-card copy for that build, and never moves the page. Options and copy live in `src/features/bike/build.ts`; the variant parts in `parts.ts`.
- **Optional extras:** a system filter (Frame, Cockpit, Contact points, Drivetrain, Brakes, Wheels) and a "fit-relevant parts" toggle.

### 5.2 Parts list (minimum)

- **Frame:** top tube, down tube, head tube, seat tube, seat stays, chain stays, bottom bracket shell, dropouts, mech hanger.
- **Fork:** steerer, crown, blades, thru-axle.
- **Cockpit:** headset, spacers, stem, handlebar (tops, hoods, drops), bar tape, brake/gear levers (shifters).
- **Contact points:** saddle (shell, rails), seatpost, seat clamp, pedals.
- **Drivetrain:** chainset (crank arms, chainrings), bottom bracket, chain, cassette (sprockets), front mech, rear mech (jockey wheels).
- **Brakes:** disc brake callipers, rotors (discs), hoses or cables.
- **Wheels:** rims, spokes, hubs, tyres, valves, thru-axles.
- **Accessories:** bottle cages.

All explainer copy follows the accuracy rules in §7 and the UK vocabulary in §1.1.

### 5.3 Diagram style (a nod to Ciechanowski, not a copy)

- Precise, technical and calm. Thin, consistent strokes. A soft neutral palette (warm greys and off-white) with subtle tonal shading to show form, and no heavy outlines.
- One accent colour for highlights, used sparingly: Bike amber (§6). In Workstand the parts are white with crisp 1 px ink outlines, finished in natural materials: tan-wall tyres, a honey leather saddle and bar tape, and polished alloy (chosen 2026-11-07). Materials aren't UI colours; don't add paint colours. Theme the drawing only through its `--bx-*` tokens.
- Accurate proportions based on real road geometry (for example, a mid-size endurance or race frame). Parts must be mechanically plausible: correct chain path, crank and chainring relationship, and so on.
- Labels and leader lines use the site typography. Lots of negative space around the bike.

---

## 6. Design system: Workstand

**Workstand is BikeFitter's design style.** The user chose it on 2026-11-06. In one line: *a tidy workshop, where every tool has its place and its own colour.* It leads with Notion and takes Apple's polish, The Verge's clear labels and claude.dev's plain structure, but it copies none of them.

**Every design choice and every design review goes through the `workstand-design` skill.** "Design work" means anything visual:
- new pages, sections or components
- layout, colour, type and icons
- diagrams and the bike drawing
- choosing between visual options
- critiquing or auditing a screen or screenshot

How to use the skill:
- **Claude Code:** the skill lives in `.claude/skills/workstand-design/`. It should trigger on its own for design work. If it doesn't, invoke it before you start.
- **Other agents:** before any design task, read `.claude/skills/workstand-design/SKILL.md` and `.claude/skills/workstand-design/references/tokens.md`.

Precedence, in order:
1. `designs/site/styles/workstand.css` holds the values. The app ports them into `src/theme/tokens.ts` (custom properties and the MUI theme); keep the two in step.
2. The skill says how to apply the rules and how to review.
3. This section is the summary.

If two of them disagree, fix the one that is out of date in the same change.

Changing a Workstand rule is the user's decision. Ask first. Then update the stylesheet header, `designs/site/style.html`, the skill and §6.5, and log the change in §13.

§6.1 applies to every page. §6.2–§6.5 summarise Workstand; the skill holds the detail.

### 6.1 Principles

- **Content first.** One idea per section. A big confident headline, a short subhead, then the visual.
- **Generous whitespace.** Large vertical section padding (roughly 96–160 px on desktop). Let the diagrams be the hero.
- **Restraint.** One primary call to action per section. No clutter, heavy borders, harsh shadows, gradients for decoration, stock photos, clip art or emoji icons. Workstand's dotted pegboard is the one permitted pattern.
- **Clarity in copy.** Short, plain, confident English. No jargon without a glossary link.
- **Motion that explains.** Subtle scroll-reveals (small fades and translates), smooth easing, 60 fps. Respect `prefers-reduced-motion`.
- **Scroll is never the only control.** A scroll-driven animation (such as the bike explode) is a bonus. Every one must also have a button or slider that works in place, without moving the page. Controls must never scroll the page, and scroll must never make the drawing jump after someone has used a control.
- **One feature per page.** Learn, Check your fit and Explore the bike each get their own page. The home page explains the site and points to them; it doesn't contain them.
- **Self-explanatory to a newcomer.** Assume the visitor has never heard of BikeFitter. Every page opens with a small eyebrow naming the feature, a headline that says what it does in plain words, and a subhead that says what you'll get. Headings describe content ("What's in every lesson") rather than being clever ("Take it apart"). Show the steps of any tool before asking for input.

### 6.2 Tokens (Workstand; the full set, including tints, dots, bike-drawing tokens and contrast ratios, is in the skill's `references/tokens.md`)

| Token | Light | Dark | Job |
|---|---|---|---|
| Bench `--bg` | `#ffffff` | `#151515` | Page and window fill |
| Shelf `--surface` | `#f6f6f3` | `#1d1d1d` | Cards, footer |
| `--surface-2` | `#ececE7` | `#262626` | Hover, current item, quiet button |
| Ink `--ink` | `#1a1a19` | `#ededea` | Text; the colour of pages that aren't a tool; links |
| Label `--ink-2` / `--ink-3` | `#5f5f5b` / `#6b6b66` | `#a8a8a3` / `#91918c` | Secondary text / metadata |
| Hairline `--rule` | `#e6e6e1` | `#2c2c2c` | 1 px lines |
| Learn blue `--learn` | `#2b63e0` | `#7da6ff` | Learn tool |
| Fit green `--fit` | `#107a44` | `#4fcb86` | Check your fit tool |
| Bike amber `--bike` | `#a85100` | `#f2a65a` | Explore the bike tool and the selected bike part |

| Element | Value |
|---|---|
| Type | **Plus Jakarta Sans + JetBrains Mono**, from Google Fonts (the user chose these on 2026-11-06). Plus Jakarta Sans is for headings and reading; JetBrains Mono is for small metadata only. Headings weight 650 with -0.03em tracking. Body 17 px / 1.55. Labels 13 px semibold. Mono only for small metadata. |
| Radii | 20 px pegboard panels, 14 px cards, 12 px windows, 10 px buttons, 8 px chips, 6 px inline badges |
| Depth | 1 px hairlines. One shadow token, used on windows only. |
| Pattern | A dotted pegboard in the current tool's tint. It is the only pattern or gradient. |
| Nav | Sticky, 60 px tall, translucent `--bg` with a 14 px blur and a hairline. Tool icons appear in their tool colours. |
| Layout | Content up to 1120 px wide, 16 px gutters, 112 px section padding, breakpoints at 980 px and 760 px |

Workstand supports light and dark mode through tokens, with a toggle in the nav. It follows the device setting until the visitor toggles it (see §12). Carbon's Apple-faithful tokens now live only in `designs/carbon/carbon.css`.

### 6.3 Components (Workstand versions)

- **Global nav:** brand mark, the three tool links with their coloured icons, theme toggle, and a phone menu.
- **Per-page sub-nav** (page title on the left, one action on the right). Not designed yet. When it's needed, design it with the skill's decision procedure.
- **Buttons:** 10 px radius. The primary button (`.btn`) is filled with the tool colour, the secondary is `.btn--quiet`, and arrow links use `.more` ("Learn the basics →"). One primary action per section.
- **Cards and panels:** flat 14 px shelf cards, and pegboard panels holding windows that preview the real interface.
- **Segmented controls** (`src/components/Segmented.tsx`; chosen 2026-11-08): a `--surface-2` track with a 3 px inset all round, equal options with symmetrical padding, and a sliding 8 px tone-tint thumb on the picked one. Used by the bike's build tray; reuse it for the unit toggle.
- **Sliders** in the tool colour (`accent-color: var(--tone)`), such as the explode slider.
- **Stepper forms** with one question per screen, in a window with a tool-coloured progress bar.
- **Evidence badges** by shape: ◆ `Research`, ● `Expert practice`, ▲ `Rule of thumb`.
- **Source chips** that cite the register by id (§7.3).

### 6.4 Design review checklist (run on every UI change)

1. Does it follow every Workstand rule and pass the review checklist in the `workstand-design` skill? Would anyone who has seen `designs/site/style.html?style=workstand` recognise it as Workstand? Is the polish Apple-grade? If not, what would Workstand's rules change or remove?
2. Is there exactly one focal point and one primary action per section?
3. Is the type hierarchy obvious at a glance? Is the copy short enough?
4. Is there enough whitespace? Try doubling it before adding anything.
5. Is the motion subtle and purposeful, and is reduced motion respected?
6. Does it work and look intentional at 375 px, 768 px, 1280 px and 1920 px, with no horizontal scroll?
7. Does it work in both light and dark themes, and is contrast WCAG AA or better? The contrast table is in the skill's `references/tokens.md`.
8. Has every interaction been checked with keyboard, touch and screen reader?
9. Is every word British English, using UK cycling terms (§1.1)?

When possible, screenshot the running page and critique it against this list before calling the work done.

### 6.5 Design direction: Workstand (chosen 2026-11-06)

**Status: Workstand is locked in.** Build and review everything in Workstand.

How we got here: the user chose Carbon first. They then asked for an identity that didn't copy Apple, so we built three new styles. The user chose Workstand from those three. Daylight and Manual had already been deleted.

**Retired directions.** Logbook, Velodrome and Carbon stay in `designs/` for reference only. Don't use their signature moves unless the user asks to revisit them. Those moves are:
- pill buttons
- true-black heroes
- slash navigation
- track lines
- `[01]` numbering
- tree lines
- highlighter marks

**How the prototypes are built.** All styles share one set of pages in `designs/site/`:
- `index`, `learn`, `lesson`, `fit` and `bike`
- `style.html`, a style guide showing the active style's rules, palette, type, components and signature moves. The live Workstand rules are at `style.html?style=workstand`.

The markup is the same for every style. Each look lives in one stylesheet, scoped with native CSS nesting under `:root[data-style="<name>"]`.

Workstand is the default. The Preview bar (bottom left, for design review only) can still switch to the retired styles and between typefaces. You can also set these directly with URL parameters: `?style=logbook|velodrome|workstand`, `&font=1|2|3` and `&theme=light|dark`. Choices are remembered in localStorage.

| Name | Leads with | In one line | Palette (light / dark) | Type (Google Fonts; first is default) | Rules and signature moves |
|---|---|---|---|---|---|
| **Workstand (chosen)** | Notion | A tidy workshop: every tool has its place and its own colour | White `#ffffff`, shelf `#f6f6f3`, ink `#1a1a19`; Learn `#2b63e0`, Fit `#107a44`, Bike `#a85100` / `#151515`, `#1d1d1d`, `#ededea`; `#7da6ff`, `#4fcb86`, `#f2a65a` | **Plus Jakarta Sans + JetBrains Mono** (chosen; the Preview bar also offers 2 Geist + Geist Mono and 3 Figtree + DM Mono for comparison) | See the `workstand-design` skill. Tool colours follow the tool everywhere, and pages that aren't a tool are ink. Dotted pegboard panels hold white windows that preview the real interface. Evidence is shown by shape (◆ Research, ● Expert practice, ▲ Rule of thumb), never by colour. 14 px cards, 10 px buttons, 8 px chips; only windows get a shadow. One 24 px line-icon set, no emoji. Sentence-case, left-aligned headings; only the opening hero and the closing panel are centred. Anything that links ends with an arrow. The bike wears tan walls, honey leather and polished alloy, and stands on a bench wall of amber dots on white; the selected bike part goes amber. |

Retired directions (reference only):

| Name | Leads with | In one line | Palette (light / dark) | Type (Google Fonts; first is default) | Rules and signature moves |
|---|---|---|---|---|---|
| **Logbook** | claude.dev | A fitter's notebook: every page measured, labelled and indexed | Paper `#f7f5ef`, graphite `#1b1a17`, ink blue `#2443c9` (= you can act), highlighter `#ffe870` (= remember this) / `#151412`, `#eae6dc`, `#93a6ff`, `#e8d24a` | 1 Instrument Sans + IBM Plex Mono · 2 Schibsted Grotesk + Martian Mono · 3 Newsreader + JetBrains Mono | Mono for structure, sans for reading; [01] numbered nav and sections; tree lines (└); "On this page" index rail with hatched reading progress; job-card field grid at the top of each page; flat and square (1 px rules, ≤ 2 px corners, no shadows); graphite block buttons; the selected bike part is highlighted yellow |
| **Velodrome** | The Verge | A race-day programme: bold headlines, painted track lines, big numbers | Paper `#ffffff`, ink `#111113`, band `#a8d4f2`, red `#e0251b` (= where you are / selected), blue `#2338e0` (= clickable) / `#0e0e10`, `#f2f2ee`, `#2a6a99`, `#ff5e52`, `#8a97ff` | 1 Archivo (62% width) + Source Serif 4 + JetBrains Mono · 2 Barlow Condensed + Literata + IBM Plex Mono · 3 Sofia Sans Extra Condensed + Newsreader + Space Mono | Three voices: condensed headlines, serif reading text, mono caps labels; four velodrome track lines under each page title and nowhere else; outlined lap-board numerals; 2 px ink rules opening each numbered section; square corners, no shadows; evidence by weight (Research solid, Expert practice outlined, Rule of thumb dashed); slash navigation; inverted footer ending with a full-width wordmark; the selected bike part goes red |
| Carbon (first baseline) | Apple | Apple Pro page: true black, monochrome, cinematic | `designs/carbon/carbon.css` (dark by default, light toggle) | SF Pro (system) | Kept for comparison only, in `designs/carbon/` (its own pages, `carbon.css`, `carbon.js`) |

**Shared building blocks**
- `designs/shared/bike.js` + `bike.css`: the exploded-bike engine. It's original artwork, with geometry in mm from a real endurance frame (stack 570, reach 390, 73°/73.5°). Features: explode slider with staggered windows, opaque "ghost" dimming, roving keyboard focus, part info cards, an optional dimension overlay (`dims`: `true` or a list such as `['saddle']`; `dimValues: false` hides the mm numbers so the reference bike's sizes don't read as advice), an optional docked panel (`dock`), and theming through `--bx-*` custom properties.
- `designs/site/boot.js` (runs in `<head>`: sets `data-style`, `data-font`, `data-theme` before first paint), `designs/site/site.js` (writes the shared header and footer, holds the source register by id, icon set, theme toggle, phone menu, Preview bar, "On this page" index, and each page's behaviour: bike stage, fit demo, ruler, style guide swatches) and `designs/site/styles/base.css` (structure and behaviour only).
- The bike stage: scrolling explodes the bike; the button and slider do it in place without moving the page; scroll only takes control back once it "catches" the bike's current state, so the drawing never jumps.
- Part explainer copy lives in `bike.js`. It must follow §1.1 and §7.
- Gotcha: a custom property that uses another custom property is resolved where it is declared. Anything that depends on a per-element token (such as Workstand's `--tone-dot`) must be written at the element, not as a `:root` variable.

**What the previews deliberately avoid:** no inside-leg saddle formula is used in the calculator. Hogg (Tier 2) now confirms the LeMond formula's definition, but he argues against using it (see §9), and no source supporting it has been verified (see §12). The fit demo instead shows a ±3 mm small-change window, based on Steinmetz's 2–3 mm, checked under load in Hogg's 3 mm steps.


---

## 7. Content accuracy and sourcing policy

### 7.1 Source tiers

| Tier | What | Use |
|---|---|---|
| **1** | Peer-reviewed research (DOI or PubMed) | Numbers, ranges and claims about effects |
| **2** | Recognised professional fitters and educators with many years of experience: Steve Hogg, Phil Burt, Mat Steinmetz (51 Speedshop), Cyclefit (Jimmy Wilson), Paul Swift (BikeFit), Retül, Keith Bontrager, Dan Empfield, IBFI | Methods, professional practice, practical guidance |
| **3** | Reputable cycling media quoting Tier 1 or 2 (Cycling Weekly, BikeRadar, TrainingPeaks) | Supporting context only, never the sole source for a number |
| **Banned** | SEO calculator sites, AI-generated content farms, forums, affiliate listicles, uncredited blogs | Never cite |

### 7.2 Writing rules

- Label every claim `Research`, `Expert practice` or `Rule of thumb`.
- When experts disagree (for example KOPS, or fixed refit intervals), present both views and attribute each one.
- Say how a measurement was taken: static or dynamic, where it was measured, and at what crank position. Ranges aren't interchangeable between methods.
- Use exact figures as stated in the source. Never round, merge or "average" sources into a new number unless the methodology page explains it.
- Every lesson and card needs a `lastVerified: YYYY-MM-DD` field.
- Write in British English with UK cycling terms (§1.1). Translate US terms from sources into UK terms in our own copy, but keep direct quotes verbatim.

### 7.3 Content data model (suggested)

Keep sources in one registry (in the app: `src/content/sources.ts`): `id`, `title`, `author`, `org`, `tier`, `url`, `doi?`, `lastVerified`, `checkMethod`, `notes`. Lessons and calculator rules reference sources by `id` only, never by raw URL.

### 7.4 Link verification

- Before merging, every external URL must return **HTTP 200 after redirects**, and you must open it (WebFetch or a browser) to confirm the content still matches the claim. Watch for soft 404s, parked domains and moved articles.
- Some sites return 403 or 000 to bots, or time out. That isn't proof they're dead or alive, so verify those manually with WebFetch or a browser.
- Add an automated link-check script to the build and CI that fails on non-200 links. Re-run it before each release and at least monthly.
- If a source dies, replace it with an equivalent Tier 1 or 2 source. Use a Wayback Machine snapshot only as a clearly labelled secondary link, never as the main one.

---

## 8. Source register (seed, checked 2026-11-06)

**Check** column: `200+C` means status 200 and content confirmed. `200` means status only, and content still needs confirming before use.

### Professional fitters (Tier 2)

| Source | Author / org | Use for | URL | Check |
|---|---|---|---|---|
| Seat Height – How Hard Can It Be? | Steve Hogg | Saddle height set under load ("velocity of extension of the rear of the knee under significant load"; 3+ minute hill at 80–85 rpm); 3 mm steps | https://www.stevehoggbikefitting.com/bikefit/2011/02/seat-height-how-hard-can-it-be/ | 200+C (load method, 3 mm steps and the self-test confirmed verbatim. Re-checked 2026-11-06 by downloading the full page: in his reply to a reader on 26 July 2011, Hogg lists what "Seat height formulae based on inseam measurement don't account for": foot length or pedalling technique, seat setback, general functionality, crank length and equipment choices. Same reply: "something like 80% of first time clients leave with a lower seat height than they arrived with", a formula that gets it right is "a lucky accident", and he defines the LeMond formula as "really the Guimard formula", "0.883 x inseam = seat height from bottom bracket centre to top of seat") |
| Addendum to Seat Height | Steve Hogg | Re-check height after other changes ("needs constant checking and reassessment after any further changes to other parameters") | https://www.stevehoggbikefitting.com/bikefit/2011/05/addendum-to-seat-height-how-hard-can-it-be-2/ | 200+C (in Hogg's reply to a comment, 8 May 2011) |
| Seat Set Back: for road bikes | Steve Hogg | Setback method | https://www.stevehoggbikefitting.com/bikefit/2011/05/seat-set-back-for-road-bikes/ | 200 |
| Article index | Steve Hogg Bike Fitting | Further reading | https://www.stevehoggbikefitting.com/index/ | 200 |
| Sitting Pretty DIY Bike Fit Part 2 | Steve Hogg (Bicycling Australia) | DIY saddle height | https://bicyclingaustralia.com.au/news/sitting-pretty-diy-bike-fit-part-2/ | 200 |
| KOPS / saddle setback (1998) | Keith Bontrager (hosted by Sheldon Brown) | KOPS critique; balance-based setback | https://www.sheldonbrown.com/kops.html | 200+C |
| Guidelines for Making Adjustments After a Bike Fit | Mat Steinmetz (51 Speedshop), TrainingPeaks | 2–3 mm saddle / 5–10 mm front-end self-adjust limits | https://www.trainingpeaks.com/blog/guidelines-for-making-adjustments-after-a-bike-fit/ | 200+C |
| The Benefits of Reducing Your Crank Length | TrainingPeaks (author TBC) | Crank length context | https://www.trainingpeaks.com/blog/the-benefits-of-reducing-your-crank-length/ | 200 |
| Choosing the Best Bike Saddle | TrainingPeaks (author TBC) | Saddle choice | https://www.trainingpeaks.com/blog/choosing-the-best-bike-saddle/ | 200 |
| 51 Speedshop | Mat Steinmetz | Fitter homepage | https://51-speedshop.com/ | 200 |
| How to fit cycling cleats correctly | Jimmy Wilson, Cyclefit | Cleat ≥10 mm behind 1st MPJ; rotation; stance width | https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly | 200+C |
| Stack & Reach Primer: Chapter One | Dan Empfield (byline "Slowman"), Slowtwitch, 19 Feb 2003 | Stack is how high the head tube top sits above the bottom bracket; reach is how far it sits in front. Argues against seat-tube sizing. | https://www.slowtwitch.com/industry/stack-reach-primer-chapter-one/ | 200+C (verbatim; the page says "head tube top", not "top centre") |
| The Stacktennial | Dan Empfield, Slowtwitch | Stack and reach history | https://www.slowtwitch.com/industry/the-stacktennial/ | 200 |
| Retül fit | Retül | 3D motion-capture fitting | https://www.retul.com/fit | 200 |
| BikeFit | Paul Swift / BikeFit | Wedges, knee tracking, fitter education | https://www.bikefit.com/ | 200 (`blog.bikefit.com` timed out, so re-check) |
| Phil Burt Innovation | Phil Burt | Fitter homepage | https://www.philburtinnovation.co.uk/ | 200 |
| Bike fitting with Phil Burt (podcast) | Scientific Triathlon | Burt's philosophy | https://scientifictriathlon.com/tts232/ | 200 |
| IBFI certification | International Bike Fitting Institute | Four accreditation levels | https://www.ibfi-certification.com/certification | 200 |
| IBFI advice for cyclists | IBFI | Choosing a fitter | https://www.ibfi-certification.com/adviceforcyclists | 200 |

### Research (Tier 1)

| Source | Use for | URL | Check |
|---|---|---|---|
| Bini, Hume & Croft (2011), *Sports Med* 41(6):463–476 | Saddle height, knee injury risk and performance | https://doi.org/10.2165/11588740-000000000-00000 | 200 |
| Martin & Spirduso (2001), *Eur J Appl Physiol* 84:413–418 | Crank length and maximal power | https://link.springer.com/article/10.1007/s004210100400 | 200 |
| Swart & Holliday (2019), *Curr Sports Med Rep* | Dynamic knee flexion ranges | **TODO:** find the canonical DOI/PubMed link and verify | none |
| Holmes, Pruitt & Whalen (1994), *Clin Sports Med* 13(1):187–205 | Static knee flexion 25–35° | **TODO:** find the PubMed link and verify | none |

### Media (Tier 3, supporting only)

- https://www.bikeradar.com/advice/sizing-and-fit/bike-fit-explained-what-is-a-bike-fit-and-should-you-get-one (200)
- https://www.cyclingweekly.com/fitness/bike-fit/cleats-explained-how-to-set-them-up-correctly-23575 (200)
- https://www.cyclingweekly.com/fitness/bike-fit/set-saddle-height-how-to-25379 (200; content not readable by fetch, so verify in a browser)
- https://roadmancycling.com/answers/how-often-update-bike-fit (200)

### Design references

| Source | URL | Check |
|---|---|---|
| Ciechanowski, *Bicycle* | https://ciechanow.ski/bicycle/ | 200 |
| Apple | https://www.apple.com/ | 200 |
| Apple Human Interface Guidelines | https://developer.apple.com/design/human-interface-guidelines/ | 200 |
| claude.dev blog, "How the Claude Code team does code review" (style reference for Logbook) | https://claude.dev/blog/solving-code-review-at-anthropic/ | 200 (2026-11-06) |
| The Verge (style reference for Velodrome) | https://www.theverge.com/ | 200 (2026-11-06) |
| Notion product features (style reference for Workstand) | https://www.notion.com/product/features | 200 (2026-11-06) |
| Google Fonts CSS API (all three font links return 200 and every family resolves) | https://fonts.googleapis.com/css2 | 200 (2026-11-06) |

### Blocked to automated checks (verify in a browser before use)

- Peveler, Bishop, Smith, Richardson & Whitehorn (2005), "Comparing methods for setting saddle height in trained cyclists", *J Exerc Physiol Online* 8(1):51–55. This is the best candidate Tier 1 source for the LeMond, Hamley and heel methods. Academia.edu and ResearchGate copies return 403.
- "Cycling position optimisation" (2024), *J Sports Sci*, https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2394752. Returns 403.

### Known dead URLs (do not use)

- `https://www.cyclefit.co.uk/cyclefit` (404)
- `https://www.slowtwitch.com/Tech/Stack_and_Reach_explained_3554.html` (404)

---

## 9. Domain knowledge baseline

These are vetted starting facts. The cited source still has to be re-confirmed before anything is published. Items marked ⚠ are unverified, so don't ship them until they're sourced.

**Saddle height**
- **LeMond method** (`Rule of thumb`): 0.883 × inside leg = distance from BB centre to the top of the saddle, measured along the seat tube. It was popularised by Greg LeMond. Hogg (Tier 2, verified 2026-11-06) confirms this definition and says it is "really the Guimard formula", but he gives formulas "no credence". So we can now *describe* the formula with a source, but nothing yet supports *recommending* it. ⚠ The candidate supporting source is still Peveler et al. 2005 (§8).
- **Hamley & Thomas** (`Research`, 1967): 109% of inside leg = distance from the pedal spindle (crank in line with the seat tube) to the top of the saddle. ⚠ Confirm the exact citation.
- **Holmes et al. 1994** (`Research`): a **static** knee flexion of 25–35° at bottom dead centre.
- **Swart & Holliday 2019** (`Research`): **dynamic** knee flexion at BDC of about 33–43° at low intensity and 30–40° at high intensity. The angle depends on the measurement method, so ranges can't be swapped between static and dynamic measurement.
- **Hogg** (`Expert practice`): set height by observing the leg under significant load (for example climbing). Adjust in about 3 mm steps. A saddle that's too high is the most common error he sees ("something like 80%" of first-time clients leave lower). Inside-leg formulas ignore foot length and pedalling technique, setback, flexibility, crank length and equipment (all verified). Re-check height after other changes. His DIY self-test: a hill of at least three minutes, seated, forcing a gear a bit at 80–85 rpm; lower 3 mm at a time if it feels like a step machine; if fluent on both sides, raise 3 mm at a time until one side is a touch less fluent, then lower 6 mm.
- **Heel method** (`Rule of thumb`): heel on the pedal at the bottom of the stroke, leg straight. ⚠ Needs a Tier 2 source.
- All of these are starting points. Shoes, cleat stack, pedals, crank length and setback all change the effective height.

**Setback and KOPS**
- **Bontrager (1998)**: KOPS "has no biomechanical basis". Set saddle position by balance and centre of gravity instead.
- **Hogg** has a setback method that is also balance-based.

**Frame sizing**
- Stack and reach are the vertical and horizontal distances from the BB centre to the top centre of the head tube. Dan Empfield introduced them (F.I.S.T., 2003). He later emphasised that what fits the rider is *bar* stack and reach, which depend on the front-end setup.

**Crank length**
- **Martin & Spirduso 2001**: across cranks of 120–220 mm, maximal power with 145 mm and 170 mm cranks was significantly greater than with 120 mm and 220 mm. Standard 170 mm cranks shouldn't substantially compromise maximal power in most adults. ⚠ The "about 20% of leg length / 41% of tibia length" optimum comes from secondary summaries, so check the full text.

**Cleats**
- **Cyclefit**: start with the pedal axle at least 10 mm behind the 1st MPJ. A cleat under or in front of the MPJ is linked to hotspots, toe numbness and calf or Achilles strain. Start with rotation matched to the natural foot angle. Widening stance width may help lateral knee pain.
- **Burt**: cleats set too far forward or back usually cause knee pain rather than foot pain. Copy the old cleat position when changing shoes. Replace worn cleats.

**Adjusting after a fit**
- **Steinmetz**: self-adjust no more than 2–3 mm at the saddle or 5–10 mm at the front end, then contact the fitter. Give a new position time. Once it's right, "pick and stick".
- **Burt**: there's an "optimum window" rather than one ideal position. Make small, gradual changes, test on short rides, and never make big changes before a long ride.

**How often to re-fit**
- There is **no evidence-based fixed interval**. Common professional advice is to reassess after:
  - a new bike, saddle, shoes, pedals, cleats or cranks
  - injury or surgery
  - persistent pain or numbness
  - a meaningful change in flexibility, fitness, weight or goals
- Many fitters also suggest an annual check. Present that as expert opinion, not research.

**Fitter credentials**
- IBFI has four accreditation levels, built from credits rather than a single exam. ⚠ Confirm the exact level names on the IBFI site before publishing.

---

## 10. Tech approach (stack chosen 2026-11-07)

- **Stack (the user chose it on 2026-11-07):** Vite + React + TypeScript single-page app, React Router for routes, and MUI (Material UI) components and theme system, themed as Workstand. Inline SVG for diagrams. Workstand tokens are CSS custom properties written from `src/theme/tokens.ts`; the MUI theme (`src/theme/theme.ts`) is built from the same values. No backend. This replaces the earlier Astro recommendation.
- **Layout:** `src/` holds the app. `src/features/<feature>/` holds a feature's logic, data and components (`features/bike/` is the anatomy explorer, ported from `designs/shared/bike.js`). `src/pages/` holds routed pages, `src/components/` the shell, `src/content/` the source register.
- **Feature flags:** `src/flags.ts`, one `VITE_FLAG_*` env var per feature, read at call time. Production builds leave every flag off unless set; `.env.development` turns them on for `npm run dev`. `exploreBike` (`VITE_FLAG_EXPLORE_BIKE`) gates `/bike`; `bikeBuild` (`VITE_FLAG_BIKE_BUILD`) gates its build tray; `bikeDrawer` (`VITE_FLAG_BIKE_DRAWER`) gates the portrait-phone part drawer; `bikeCoil` (`VITE_FLAG_BIKE_COIL`) swaps the cable explode scrubber for the coil spring.
- **Commands:** `npm run dev`, `npm run build`, `npm run typecheck`, `npm test` (Vitest + Testing Library), `npm run test:coverage`, `npm run test:e2e` (Playwright, Chromium), `npm run test:all`.
- **Calculator logic:** pure, unit-tested TypeScript functions. Each function references its source `id`s.
- **Quality gates:** link checker, unit tests for calculator rules, Lighthouse (aim for 95+ on Performance and Accessibility), axe accessibility checks.
- **Hosting:** any static host (Vercel, Netlify or GitHub Pages). Decide with the user. A single-page app needs the host to serve `index.html` for every route.
- **`designs/` is not the app.** It holds static HTML prototypes that open straight from disk (classic scripts, not ES modules, so `file://` works). Their only external dependency is Google Fonts; without a connection they fall back to system fonts. `shared/bike.js` is now ported to `src/features/bike/`, and Workstand's tokens to `src/theme/`. Build further components the way the skill describes. Leave the retired styles and the Preview bar behind.

---

## 11. Working agreements for agents

- Read this file first. Update it when a decision changes, and log the change in §13.
- Write all copy, and all chat with the user, in British English (§1.1).
- Before writing content, check §8 and §9. Add new sources to the registry with a `lastVerified` date.
- **Design work goes through Workstand.** Load the `workstand-design` skill before any design choice or review. Agents that can't load skills read `.claude/skills/workstand-design/SKILL.md`. Never mix in moves from the retired styles.
- Before calling UI work done, run the skill's review checklist and the §6.4 checklist, and look at real screenshots in light and dark.
- Keep changes small and reviewable. Calculator rules need tests.
- **Git workflow.** The repo is https://github.com/JosephLambon/BikeFitter (public). `main` and `develop` are protected, and the rules apply to admins too:
  - No direct pushes, force pushes or deletions.
  - Every change goes through a pull request.
  - The `branch-policy` check (`.github/workflows/branch-policy.yml`) must pass. It only lets `develop` merge into `main`.
  - A branch must be up to date with its target before it can merge.
  - No approving review is required, because GitHub doesn't let you approve your own pull request.

  To make a change, branch from `develop`, then open a pull request into `develop`. Release by opening a pull request from `develop` into `main`.

  **Agents never merge pull requests.** Merging is a human job. Only the user merges, and only after they explicitly approve that pull request. Approval for one pull request doesn't carry over to another.
  - Agents may open pull requests and babysit them:
    - Watch the checks and review comments.
    - Check whether each comment is valid.
    - Push fixes for valid comments to the pull request's branch.
    - Reply to say what was fixed, or why a comment wasn't acted on.
  - When a pull request is ready, tell the user it's ready for them to merge.
  - Never run `gh pr merge`, turn on auto-merge, or push straight to a protected branch.
  - "Commit to develop" means: open a pull request into `develop`, then stop.
- Ask the user when a choice is genuinely theirs (scope, stack, hosting, branding). Otherwise make the sensible call and say what you chose.
- Never fabricate citations, quotes, credentials or numbers.

**Screenshot tooling (macOS, no extra installs)**
- Use headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1440,900 --virtual-time-budget=3000 --screenshot=out.png file:///…`.
- Headless quirks:
  - CSS transitions freeze, so add `--force-prefers-reduced-motion` when capturing hover or selection states. The flag forces reduced motion even as `--force-prefers-reduced-motion=0`, so leave it off entirely for the normal state.
  - `requestAnimationFrame` fires only once. To test a JS animation, inject `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)` into the temporary copy and read the result with `--dump-dom`.
  - Synthetic scroll for logic tests: `window.scrollTo(0, y); window.dispatchEvent(new Event('scroll'))` updates `scrollY` and runs the handlers, even though nothing paints.
  - Programmatic scrolling doesn't paint or fire `scroll` events.
  - The viewport can't go below about 485 px. For phone widths, load the page inside a 390 px `<iframe>` on a host page.
  - A very tall window makes `100vh` sections enormous.
- To capture lower sections, inject `body{position:relative;top:-Npx}` into a temporary copy of the page. Delete temporary copies afterwards.
- Read element sizes with `--dump-dom` plus an injected script that writes measurements into a `<pre>`.

---

## 12. Open questions / TODO

- [x] Choose a design direction: **Workstand** (chosen 2026-11-06; see §6 and the `workstand-design` skill). Carbon was chosen first, then kept only as the Apple-faithful baseline after the user asked for a more unique identity.
- [x] Choose Workstand's typeface pairing: **Plus Jakarta Sans + JetBrains Mono** (chosen 2026-11-06).
- [ ] Decide whether Workstand defaults to dark, light or the device setting (it currently follows the device).
- [ ] Decide whether to keep the retired Logbook, Velodrome and Carbon prototypes in `designs/` for reference, or delete them.
- [ ] Find a verifiable Tier 1 or 2 source for the LeMond (0.883) and Hamley (109%) saddle-height formulas, for example by getting the Peveler et al. 2005 full text (§8). Until then, keep them out of the calculator. (Partly done: Hogg confirms LeMond's definition, but argues against using it. Decide with the user whether lessons may show it as a criticised rule of thumb.)
- [x] Confirm Hogg's "inseam formulas ignore setback" wording (confirmed 2026-11-06 from the full page; see §8).
- [x] Confirm the tech stack (§10): Vite + React + TypeScript + React Router + MUI (chosen 2026-11-07).
- [ ] Choose hosting (§10).
- [ ] Choose the site name and brand mark ("BikeFitter" is the working name).
- [ ] Source the bar width ↔ shoulder width guidance and the heel method from Tier 2 sources.
- [ ] Find canonical links for Holmes 1994, Swart & Holliday 2019 and Hamley & Thomas 1967.
- [ ] Confirm Martin & Spirduso's optimal ratio from the full text.
- [ ] Confirm IBFI level names, and the authors of the TrainingPeaks crank-length and saddle articles.
- [ ] Re-check `blog.bikefit.com`, and content-check every `200`-only entry in §8.
- [ ] Decide frame-size guidance wording, without unsourced formulas.
- [ ] Decide the reference bike geometry for the anatomy diagram.
- [ ] Decide whether Workstand allows the bobbing scroll arrow on Explore the bike (desktop only). The skill says "no bounce… or auto-playing loops"; it stops with reduced motion. (The scrubber's invitation is settled: the user asked on 2026-11-08 for the coil's tug every 4 seconds until first moved.)
- [ ] Source the UK brake-lever convention (right-hand lever = front brake).
- [ ] Source the build tray's variant copy before the `bikeBuild` flag ships (rim brakes, quick-release skewers, electronic gears and batteries, single chainrings, mudguards, deep-section rims). It is descriptive and makes no numeric claims, but nothing cites a source yet (§7).
- [ ] The fully-apart layout is solved automatically, so it reads as a tidy flat-lay rather than a hand-placed exploded view. Decide whether to hand-tune the explode vectors for a more "exploded from the bike" look. The no-overlap test must still pass.
- [ ] Find UK-based resources for finding a fitter (for example a UK fitter directory), then verify them.

---

## 13. Change log

- 2026-11-06: Initial spec created. Seed source register checked the same day.
- 2026-11-06: Added the UK-first locale and British English rules (§1.1). Converted the existing copy to UK terms (inside leg, chainset, mech, calliper).
- 2026-11-06: Built three named design directions in `designs/` (Daylight, Carbon, Manual) with a shared exploded-bike engine and a gallery page (§6.5). Confirmed the Hogg, Hogg addendum and Empfield sources verbatim. Recorded the LeMond source gap. Added screenshot tooling notes (§11).
- 2026-11-06: User chose **Carbon**. Split it into separate pages (Home, Learn, sample lesson, Check your fit, Explore the bike), because one page holding all three features felt messy. Added a light/dark toggle (dark by default). The bike explode now has a button and slider that work without scrolling the page; scrolling still animates it. Rewrote headings so a first-time visitor can tell what the site and each page are for. Added three principles to §6.1. Added `dims` subsets and `dimValues` to `bike.js`. Confirmed Hogg's critique of inside-leg formulas, his 80% figure and his DIY hill test (§8, §9), and used them in the sample lesson.
- 2026-11-06: User asked for a more unique identity than Carbon's close copy of Apple. Built three new named styles, each a blend of Apple, claude.dev, The Verge and Notion with its own rules: **Logbook** (led by claude.dev), **Velodrome** (led by The Verge) and **Workstand** (led by Notion). All share one page set in `designs/site/` with a Preview bar to switch style and typeface (three Google Fonts pairings each), light and dark modes, and a style guide page. Retired and deleted Daylight, Manual and `shared/common.js`. Kept Carbon as the baseline. Rewrote §0 rule 3, §6 and §6.5, and added the style references to §8.
- 2026-11-06: User locked in **Workstand** as BikeFitter's design style. Added the `workstand-design` skill (`.claude/skills/workstand-design/`: rules, tokens, type scale, containers, decision procedure, review checklist, plus `references/tokens.md` with the full tokens and contrast table). Made it mandatory for every design choice and review (§0 rule 3, §6, §11). Replaced the Carbon tokens in §6.2 and the components in §6.3 with Workstand's. Moved Logbook, Velodrome and Carbon to reference only. Made Workstand the default style in `designs/site/boot.js`. Darkened light-mode Fit green (`#13834a` → `#107a44`) and Bike amber (`#b25600` → `#a85100`), because tool-coloured chip text on its own tint was below WCAG AA (4.22 and 4.43; now 4.75 and 4.87). Clarified rule 7: only the opening hero and the closing panel are centred, and lessons stay left.
- 2026-11-06: Put the project under git at https://github.com/JosephLambon/BikeFitter. `main` holds only the repo guards (`.gitignore` and the `branch-policy` workflow); this work is on `develop`. Protected `main` and `develop` (§11 Git workflow).
- 2026-11-06: User chose **Plus Jakarta Sans + JetBrains Mono** as Workstand's typeface pairing. It is now pairing 1 (the default) in `workstand.css` and the Preview bar. Geist + Geist Mono moved to pairing 2, for comparison only. Added JetBrains Mono to the Workstand font link. Updated the `workstand-design` skill, §6.2, §6.5 and §12.
- 2026-11-06: Added the rule that agents never merge pull requests (§11 Git workflow). The user merges, after explicitly approving each one; agents may babysit pull requests and fix valid review comments.
- 2026-11-07: User chose the stack: Vite + React + TypeScript + React Router + MUI (§10). Built the first real feature, **Explore the bike** (`/bike`), in `src/`, behind the `exploreBike` flag: the exploded-bike engine ported from `designs/shared/bike.js` to typed modules and a React component, the scroll reel with in-place button and slider, Workstand tokens as CSS custom properties plus an MUI theme, and the source register in `src/content/sources.ts`. Re-checked the Cyclefit, Empfield and Hogg seat-height sources (200 and content confirmed). Added Vitest, Testing Library and Playwright. The page's closing "next" panel waits until Check your fit exists, so it never links to a page that isn't there.
- 2026-11-07: Explore the bike polish. Locked in the **cable** explode scrubber (spring and chain retired): both cable ends now sit on the centre line inside the tinted fill when the bike is together or fully apart, and a small chevron nudges right while it's together. The heading stays put on scroll, and the bouncing arrow turns into the hint "Hover a part to learn more." ("Tap…" on touch screens). User chose the bike's finish and wall from design-review pickers: **tan-wall tyres, honey leather saddle and bar tape, polished alloy** (`--bx-tyre`, `--bx-leather`, new `--bx-metal`), and the **bench wall** of sparse Bike-amber dots on white with a hairline edge (`--bench-*`, `benchWall`; dark mode keeps the Bike pegboard tint). Updated `workstand.css`, `src/theme/tokens.ts`, the `workstand-design` skill and its token reference, §5.3 and §6.5.
- 2026-11-08: Added the **build tray** to Explore the bike, behind the new `bikeBuild` flag (§5.1, §10). It swaps gears, brakes, rims, chainrings and mudguards on the drawing, each with its own swap animation, and updates the part copy for the build. The user compared three panel designs (a docked spec sheet, a tray of tiles, floating chips) and chose the tray with the sheet's segmented switches; the other two were removed. Designed Workstand's **segmented control** (`src/components/Segmented.tsx`, `.seg` in `workstand.css`, on `style.html`) and added it to the skill and §6.3. New icons: `build` and `chevron`. The variant copy still needs sources before release (§12).
- 2026-11-08: Explore the bike, portrait phones redesigned behind the new `bikeDrawer` flag (§5.1, §10). The user compared five concepts (`designs/explorations/bike-mobile.html`: workbench sheet, parts shelf, tool wall, guided tour, wall hook) and chose the workbench sheet, with concept 2's permanent bottom bar for the controls and the existing cable scrubber: a part drawer at the thumb (closed on load, opens on select, always hideable, swipeable from its tab) and a dock for the controls, on a bench wall that starts under the white title strip. The bike sits near the top in a fixed 4:3 stage so the drawer never moves it, and the invitation to turn the phone is gone from this layout. Zoom is unchanged; desktop and landscape are unchanged.
- 2026-11-08: Explore the bike, second pass on layout and phone. Removed the drawing's zoom-to-make-room for the info card; a part drawn twice (both tyres) may lose one copy behind the card. Relaxed the no-overlap rule to units: each wheel's tyre, rim, spokes, hub and valve now stay together. Redesigned phones (compared with Notion's mobile pattern of content first, controls next to it, details in a panel): portrait stacks title, stage, controls and a panel for the hint, tray and card, and invites riders to turn the phone; landscape puts the bike on the left and the title and panel on the right. Fixed: the rim-depth swap made the bike jump (the view followed the spinning wheels' rotated boxes); a mouse couldn't drag a zoomed drawing; between 600 and 800 px the card docked into nothing or was squeezed out of view; thin parts (the saddle) were hard to tap; the card could overflow the stage while the web font loaded. Regressions for each in `e2e/bike-layout.spec.ts`. New icon: `rotate`.
- 2026-11-08: Explore the bike, layout and phone. Added two rules to §5.1: fully apart, no two parts overlap (`layout.ts`); and the info card never covers the selected part and covers as few others as possible (`placeCard`, with wider card shapes and a make-room fallback). On phones the stage now fits the bike, with whitespace and the scroll cue above it, the card docks there, and the drawing pinch, double-tap and pan zooms on its own, never the page (`zoom.ts`). Added regression tests in `e2e/bike-layout.spec.ts`.
- 2026-11-08: Explore the bike, phone fixes. Removed the line of text under the build tray's cards (and the unused `note` copy in `build.ts`); changes are still announced to screen readers. Phones no longer explode the bike on scroll and show no bouncing scroll cue; the portrait drawer's tab reads "Part details" with nothing selected, and swiping it up shows the hint. Fixed the cable scrubber's grip sitting 20 px below the cable's end on touch screens. Regressions in `e2e/bike-layout.spec.ts` and `ExploreBikePage.test.tsx` (§5.1).
- 2026-11-08: Explore the bike, portrait part drawer: open on load on a guide styled like the info card (compact on short screens), so it never looks empty. Removed the Show/Hide button: the drawer moves only by a thumb swipe on its grab handle (keyboard: Enter or Space on the tab). Clearing the selection brings the guide back instead of closing the drawer. Regressions in `e2e/bike-layout.spec.ts` and `ExploreBikePage.test.tsx` (§5.1).
- 2026-11-08: Explore the bike, **coil-spring explode scrubber** behind the new `bikeCoil` flag (§5.1, §10). The user compared twelve concepts over two rounds (`designs/explorations/bike-scrubber.html`: coil spring, fitter's tape, bolt, rolling wheel, seatpost, spirit level, plumb bob, vernier calliper, bar tape, bottle, track pump, zip tie) and chose the coil. Its grip tugs slightly every 4 seconds (first asked for every second, then slowed) until someone first moves it, which the user asked for; an exception to the skill's "no auto-playing loops", recorded there. Desktop and phones share it.
- 2026-11-08: Explore the bike, portrait phones: the build tray no longer opens inside the dock (it grew up over the bike and hid the Part details tab). It opens in the drawer's space as a bounded window whose options scroll; short screens (≤ 720 px tall) give the stage 38svh and hide the tab while the tray is open. The coil's "try me" tug now waits for a real move (a stray touch that starts a scroll no longer stops it) and comes every 4 seconds (§5.1).
- 2026-11-08: The coil's tug was hard to see on phones. Diagnosed with Chrome's phone emulation at 75% and fit-to-window, headed with DevTools, and with 6× and 20× CPU throttling: the timing was steady every time, but 8 px on a squashed coil reads as about 1.3 mm on a phone (about 1.9 mm on a desktop), and the first tug waited 4 seconds. Touch screens now pull 12 px, and the first tug comes 1.2 seconds after the scrubber appears (§5.1).
- 2026-11-08: Fixed the coil's tug skipping beats on phones; the earlier "timing was steady" finding was wrong. Chrome stamps a frame with the time it began, so on a busy page (DevTools device mode, a throttled CPU, a slower phone) the first frame after a tug's timer often carries a time before the timer ran; the frame loop read that as "nothing moving" and stopped, so the tug never played. Measured in headed Chrome with DevTools, iPhone 14 metrics: at 4× CPU through taps, a drawer swipe, the build tray, the explode button and a turn of the phone, 5 of 10 beats were lost before the fix, and none after; idle at 6×, up to 2 of 5 lost before, none after. Turning the phone also restarted the rhythm and brought a stopped invitation back. Now the loop skips such frames, the tug runs on real time, the tugs keep one beat from when the page opened, and the page remembers a move (§5.1). Regressions in `e2e/bike-layout.spec.ts`, `CoilScrubber.test.tsx` and `scrubber.test.ts`.
- 2026-11-09: Coil scrubber review fixes. A tug whose first frame came late (0.14 s or more, a busy phone) was spent waiting out its hold and never pulled; the hold now runs inside the frame. The cable scrubber, which ships while `bikeCoil` is off, has its browser tests back in `e2e/cable-scrubber.spec.ts`, on a second Playwright project and server with that flag off (§5.1).
