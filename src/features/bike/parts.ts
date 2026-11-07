/* Parts of the exploded bike: drawing, explode vector and explainer copy.
   Ported from designs/shared/bike.js. Copy follows AGENTS.md §1.1 (British English, UK part
   names) and §7 (accuracy). Fit notes cite sources by register id in `sources`. */
import {
  AX, B, BAR, BB, FA, J1, J2, JR, PEDAL, PEDAL_ND, RA, RING, RING_S, CRANK, STEM, ST, S,
  add, along, capsule, chainPath, circle, dir, draw, fillShape, fwd, hit, mul, P, perp, poly, polar, pt,
  sDown, sector, slab, teeth, thick, tube, unit,
} from './drawing';
import type { SourceId } from '../../content/sources';

export type System = 'Frame' | 'Fork' | 'Cockpit' | 'Contact points' | 'Drivetrain' | 'Brakes' | 'Wheels' | 'Accessories';
export const SYSTEM_ORDER: System[] = ['Frame', 'Fork', 'Cockpit', 'Contact points', 'Drivetrain', 'Brakes', 'Wheels', 'Accessories'];

export interface PartCopy {
  what: string;
  how: string;
  /** Why it matters for fit, where relevant. */
  fit?: string;
  /** Source register ids backing the fit note. */
  sources?: SourceId[];
  /** True when a lesson covers this part (shown once Learn exists). */
  lesson?: boolean;
}

export interface PartDef extends Partial<PartCopy> {
  id: string;
  /** Fragments sharing a group select and move together (front and rear wheel parts). */
  group?: string;
  name: string;
  sys: System;
  /** Drawing layer, 0 (back) to 9 (front). */
  layer: number;
  /** Explode vector in mm (y up). */
  v: [number, number];
  /** Stagger window: [start, end] of the slider (0..1). */
  w: [number, number];
  svg: () => string;
  front?: () => string;
  back?: () => string;
}

const FW: [number, number] = [430, -150], RW: [number, number] = [-430, -150];

export const PARTS: PartDef[] = [
  // Frame (stays put; each tube is selectable)
  { id: 'chainstays', name: 'Chainstays', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => tube(pt(-6, 6), RA, 26, 15),
    what: 'A pair of tubes running from the bottom bracket back to the rear axle.',
    how: 'They carry your pedalling load to the rear wheel. Their length affects the wheelbase and how the bike handles.' },
  { id: 'seatstays', name: 'Seat stays', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => tube(ST(455), RA, 17, 13),
    what: 'A pair of slim tubes running from the seat tube down to the rear axle.',
    how: 'With the chainstays they make the rear triangle. They are often shaped to flex slightly, which can take the edge off road buzz.' },
  { id: 'downtube', name: 'Down tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => tube(AX(140), BB, 52, 54),
    what: 'The large tube running from the head tube down to the bottom bracket.',
    how: 'Usually the biggest tube on the frame, it resists twisting from pedalling and steering. It often carries bottle-cage mounts and internal cable or hose routing.' },
  { id: 'toptube', name: 'Top tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => tube(AX(24), ST(505), 36, 30),
    what: 'Joins the head tube to the seat tube along the top of the frame.',
    how: 'With the down tube and seat tube it forms the front triangle. On many modern road frames it slopes down towards the saddle.',
    fit: 'Its effective length appears on geometry charts, but stack and reach describe the fit more reliably.', sources: ['empfield-stack-reach'], lesson: true },
  { id: 'seattube', name: 'Seat tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => tube(BB, ST(532), 40, 33),
    what: 'Runs from the bottom bracket up to where the seatpost goes in.',
    how: 'The seatpost slides inside it. Its angle sets how far behind the bottom bracket the saddle sits, before you add any setback.',
    fit: 'Saddle height is usually measured along this line, from the bottom bracket centre to the top of the saddle.', sources: ['hogg-height'], lesson: true },
  { id: 'headtube', name: 'Head tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => { const n = perp(sDown); return fillShape(slab(AX(0), AX(165), 46, 58), 'frame') + P(slab(along(AX(6), n, -9), along(AX(159), n, -12), 9, 11), 'hl m-frame-hi'); },
    what: 'The short tube at the front of the frame that holds the headset bearings.',
    how: 'The fork’s steerer turns inside it. Its angle and length shape how the bike steers and, with the spacers and stem, how high your handlebars sit.',
    fit: 'Stack and reach are measured from the bottom bracket to the top of the head tube.', sources: ['empfield-stack-reach'], lesson: true },
  { id: 'bbshell', name: 'Bottom bracket shell', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => fillShape(circle(BB, 29), 'frame') + P(sector(BB, 20, 25, 95, 175), 'hl m-frame-hi'),
    what: 'The part of the frame where the down tube, seat tube and chainstays meet.',
    how: 'It houses the bottom bracket bearings that the chainset turns on. Depending on the frame it is threaded or press-fit.',
    fit: 'Its centre is the reference point for almost every fit measurement: saddle height, setback, stack and reach.', sources: ['empfield-stack-reach', 'hogg-height'], lesson: true },
  { id: 'dropouts', name: 'Dropouts', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
    svg: () => fillShape(capsule(add(RA, pt(14, 10)), add(RA, pt(-6, -6)), 40, 34), 'frame') + fillShape(circle(RA, 9), 'metal-hi'),
    what: 'Where the wheels attach to the frame and fork.',
    how: 'On modern disc-brake road bikes they are usually closed holes that a thru-axle slides through.' },

  // Fork
  { id: 'fork', name: 'Fork', sys: 'Fork', layer: 3, v: [130, -230], w: [0.1, 0.6],
    svg: () => {
      const n = perp(sDown);
      return fillShape(capsule(AX(186), AX(-66), 30, 28), 'frame') +
        tube(add(AX(182), mul(fwd, 6)), FA, 44, 20) +
        fillShape(slab(along(AX(172), n, 0), along(AX(200), n, 0), 64, 50), 'frame') +
        P(slab(along(AX(176), n, -14), along(AX(196), n, -12), 10, 8), 'hl m-frame-hi') +
        fillShape(circle(FA, 15), 'frame');
    },
    what: 'Holds the front wheel and turns with the handlebars.',
    how: 'The steerer runs up through the head tube and is clamped by the stem. The crown joins it to the two blades, and the front wheel’s thru-axle passes through the dropouts at the bottom.',
    fit: 'The steerer is cut to length, which limits how many spacers you can fit under the stem.' },

  // Wheels: front
  { id: 'tyre-f', group: 'tyre', name: 'Tyre', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
    svg: () => draw.tyre(FA),
    what: 'The only part of the bike that touches the road.',
    how: 'The air inside it supports your weight. Wider tyres can usually run lower pressures, for more comfort and grip.' },
  { id: 'rim-f', group: 'rim', name: 'Rim', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
    svg: () => draw.rim(FA),
    what: 'The outer hoop of the wheel that holds the tyre.',
    how: 'The tyre’s bead locks into the rim. Deeper rims can be more aerodynamic; shallower ones are usually lighter.' },
  { id: 'spokes-f', group: 'spokes', name: 'Spokes', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
    svg: () => draw.spokes(FA),
    what: 'Tensioned wires connecting the hub to the rim.',
    how: 'The hub effectively hangs from them. Even tension keeps the wheel true, so it spins straight without wobbling.' },
  { id: 'hub-f', group: 'hub', name: 'Hub', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
    svg: () => draw.hub(FA, false),
    what: 'The centre of the wheel, spinning on bearings around the axle.',
    how: 'The rear hub includes a freehub, which drives the wheel when you pedal and lets it freewheel when you stop.' },
  { id: 'valve-f', group: 'valve', name: 'Valve', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
    svg: () => draw.valve(FA, 232),
    what: 'Where you pump up the tyre.',
    how: 'Road bikes use Presta valves: unscrew the small locknut at the tip before pumping, and tighten it again afterwards.' },
  // Wheels: rear
  { id: 'tyre-r', group: 'tyre', name: 'Tyre', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: () => draw.tyre(RA) },
  { id: 'rim-r', group: 'rim', name: 'Rim', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: () => draw.rim(RA) },
  { id: 'spokes-r', group: 'spokes', name: 'Spokes', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: () => draw.spokes(RA) },
  { id: 'hub-r', group: 'hub', name: 'Hub', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: () => draw.hub(RA, true) },
  { id: 'valve-r', group: 'valve', name: 'Valve', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: () => draw.valve(RA, 300) },
  { id: 'thru-f', group: 'thru', name: 'Thru-axle', sys: 'Wheels', layer: 8, v: [160, -430], w: [0.35, 0.85],
    svg: () => draw.thru(FA),
    what: 'A bolt-through axle that holds the wheel in the fork or frame.',
    how: 'It slides through one dropout and the hub, then threads into the other side, locating the wheel firmly.' },
  { id: 'thru-r', group: 'thru', name: 'Thru-axle', sys: 'Wheels', layer: 8, v: [-150, -40], w: [0.35, 0.85], svg: () => draw.thru(RA) },

  // Brakes (on the non-drive side, so drawn behind the wheels)
  { id: 'rotor-f', group: 'rotor', name: 'Rotor (disc)', sys: 'Brakes', layer: 0, v: [190, 260], w: [0.3, 0.8],
    svg: () => draw.rotor(FA, 80),
    what: 'The steel disc bolted to the hub that the brake pads grip.',
    how: 'It sits on the left (non-drive) side of each wheel. Larger rotors give more braking power and shed heat better.' },
  { id: 'rotor-r', group: 'rotor', name: 'Rotor (disc)', sys: 'Brakes', layer: 0, v: [-70, 250], w: [0.3, 0.8], svg: () => draw.rotor(RA, 70) },
  { id: 'calliper-f', group: 'calliper', name: 'Brake calliper', sys: 'Brakes', layer: 0, v: [120, 330], w: [0.35, 0.85],
    svg: () => draw.calliper(polar(FA, 72, 150), 150),
    what: 'Squeezes the brake pads against the rotor to slow the wheel.',
    how: 'On a hydraulic system, pulling the lever pushes fluid along the hose, forcing pistons in the calliper to press the pads onto the rotor.' },
  { id: 'calliper-r', group: 'calliper', name: 'Brake calliper', sys: 'Brakes', layer: 0, v: [10, 330], w: [0.35, 0.85], svg: () => draw.calliper(polar(RA, 63, 25), 25) },
  { id: 'hose', name: 'Brake hose', sys: 'Brakes', layer: 5, v: [140, 390], w: [0.2, 0.75],
    svg: () => thick('M' + S(B(-6, -16)) + 'C' + S(pt(452, 586)) + ' ' + S(pt(430, 580)) + ' ' + S(along(AX(-12), fwd, 20)), 6, 'dark'),
    what: 'Carries hydraulic fluid from the lever to the calliper.',
    how: 'On many modern road bikes it runs inside the handlebar, stem or frame, so only a short loop is visible.' },

  // Cockpit
  { id: 'headset', name: 'Headset', sys: 'Cockpit', layer: 5, v: [-25, 80], w: [0.2, 0.75],
    svg: () => fillShape(slab(AX(0), AX(-8), 50, 40), 'metal') + fillShape(slab(AX(165), AX(172), 60, 60), 'metal'),
    what: 'The bearings that let the fork turn smoothly inside the head tube.',
    how: 'Bearings sit at the top and bottom of the head tube. The top cap preloads them before the stem bolts are tightened.' },
  { id: 'spacers', name: 'Spacers', sys: 'Cockpit', layer: 5, v: [-50, 160], w: [0.2, 0.78],
    svg: () => fillShape(slab(AX(-8.5), AX(-18), 38, 38), 'metal-hi') + fillShape(slab(AX(-18.5), AX(-29), 38, 38), 'metal-hi'),
    what: 'Rings stacked on the fork’s steerer, under or over the stem.',
    how: 'Moving spacers from below the stem to above it lowers the handlebar; moving them below raises it.',
    fit: 'One of the simplest ways to change handlebar height. Stay within the fork maker’s limit for total spacer height.', lesson: true },
  { id: 'stem', name: 'Stem', sys: 'Cockpit', layer: 9, v: [-40, 250], w: [0.2, 0.82],
    svg: () => fillShape(slab(AX(-29.5), AX(-70), 46, 46), 'dark') +
      tube(along(STEM, fwd, 12), BAR, 34, 30, 'dark') +
      fillShape(slab(AX(-70.5), AX(-76), 36, 34), 'dark-hi') +
      fillShape(circle(BAR, 22), 'dark') + P(circle(BAR, 13), 'm-dark-hi'),
    what: 'Clamps the handlebar to the fork’s steerer.',
    how: 'Its length and angle set how far forward and how high the handlebar sits. Flipping an angled stem changes the bar height.',
    fit: 'Stem length and angle are among the main ways a fitter adjusts reach and handlebar drop.', lesson: true },
  { id: 'handlebar', name: 'Handlebar', sys: 'Cockpit', layer: 9, v: [110, 360], w: [0.22, 0.85],
    svg: () => {
      const d = 'M' + S(B(0, 0)) + 'L' + S(B(52, 4)) + 'C' + S(B(80, 6)) + ' ' + S(B(92, -30)) + ' ' + S(B(80, -70)) +
        'C' + S(B(70, -100)) + ' ' + S(B(48, -122)) + ' ' + S(B(18, -124)) + 'L' + S(B(-30, -122));
      return thick(d, 24, 'metal') + fillShape(circle(BAR, 13), 'metal-hi');
    },
    what: 'Gives you three main places to hold: the tops, the hoods and the drops.',
    how: 'Bars vary in width, reach (how far forward the hoods sit) and drop (how far down the drops go).',
    fit: 'Bar width, reach and drop all change your upper-body position, so they are part of a full fit.', lesson: true },
  { id: 'tape', name: 'Bar tape', sys: 'Cockpit', layer: 9, v: [250, 420], w: [0.3, 0.9],
    svg: () => {
      const d = 'M' + S(B(30, 3)) + 'L' + S(B(52, 4)) + 'C' + S(B(80, 6)) + ' ' + S(B(92, -30)) + ' ' + S(B(80, -70)) +
        'C' + S(B(70, -100)) + ' ' + S(B(48, -122)) + ' ' + S(B(18, -124)) + 'L' + S(B(-30, -122));
      return thick(d, 28, 'dark') + '<path class="wrap" d="' + d + '" stroke-width="27" stroke-dasharray="1.6 8"/>';
    },
    what: 'Wrapped around the handlebar for grip and cushioning.',
    how: 'It is wound from the bar ends towards the centre, overlapping as it goes, and finished with a strip of tape.' },
  { id: 'levers', name: 'Brake and gear levers', sys: 'Cockpit', layer: 9, v: [330, 300], w: [0.25, 0.88],
    svg: () => {
      const hood = 'M' + S(B(44, 10)) + 'C' + S(B(60, 30)) + ' ' + S(B(86, 38)) + ' ' + S(B(104, 44)) +
        'L' + S(B(112, 36)) + 'C' + S(B(110, 22)) + ' ' + S(B(102, 8)) + ' ' + S(B(96, -6)) +
        'L' + S(B(78, -18)) + 'C' + S(B(76, -4)) + ' ' + S(B(64, 4)) + ' ' + S(B(44, 10)) + 'Z';
      const blade = 'M' + S(B(98, -4)) + 'C' + S(B(108, -48)) + ' ' + S(B(98, -104)) + ' ' + S(B(66, -138));
      return thick(blade, 12, 'metal') + fillShape(hood, 'dark') + P(capsule(B(62, 26), B(98, 37), 5, 4), 'hl m-dark-hi');
    },
    what: 'Combined levers that brake and change gear, often called shifters.',
    how: 'Pulling the lever brakes. Sideways movements or buttons change gear, depending on the brand. The rubber hoods are a common hand position.',
    fit: 'Where the levers sit on the bar affects your reach to the hoods.', lesson: true },

  // Contact points
  { id: 'seatpost', name: 'Seatpost', sys: 'Contact points', layer: 0, v: [-55, 190], w: [0.15, 0.7],
    svg: () => tube(ST(390), ST(672), 27.2, 27.2, 'dark') + fillShape(capsule(pt(-222, 652), pt(-170, 652), 24), 'dark'),
    what: 'Connects the saddle to the frame and sets its height.',
    how: 'It slides into the seat tube and is held by the seat clamp. The clamp at its head grips the saddle rails and sets tilt.',
    fit: 'Never raise it above the minimum-insertion mark printed on the post.', lesson: true },
  { id: 'seatclamp', name: 'Seat clamp', sys: 'Contact points', layer: 5, v: [-110, 60], w: [0.25, 0.8],
    svg: () => fillShape(slab(ST(512), ST(533), 46, 46), 'metal') + fillShape(circle(add(ST(522), dir(16.5)), 6), 'metal-hi'),
    what: 'Holds the seatpost at the height you have set.',
    how: 'A bolt squeezes the top of the seat tube (or a wedge inside it) around the post. Use the torque printed on it, especially with carbon parts.' },
  { id: 'saddle', name: 'Saddle', sys: 'Contact points', layer: 9, v: [-100, 350], w: [0.15, 0.72],
    svg: () => {
      const shell = 'M' + S(pt(-54, 688)) + 'C' + S(pt(-120, 694)) + ' ' + S(pt(-200, 690)) + ' ' + S(pt(-262, 694)) +
        'C' + S(pt(-300, 697)) + ' ' + S(pt(-330, 712)) + ' ' + S(pt(-344, 706)) +
        'C' + S(pt(-352, 696)) + ' ' + S(pt(-346, 676)) + ' ' + S(pt(-326, 672)) +
        'C' + S(pt(-260, 668)) + ' ' + S(pt(-160, 678)) + ' ' + S(pt(-70, 676)) +
        'C' + S(pt(-56, 676)) + ' ' + S(pt(-48, 682)) + ' ' + S(pt(-54, 688)) + 'Z';
      const rails = 'M' + S(pt(-84, 676)) + 'C' + S(pt(-120, 660)) + ' ' + S(pt(-150, 656)) + ' ' + S(pt(-190, 656)) +
        'L' + S(pt(-262, 657)) + 'C' + S(pt(-290, 658)) + ' ' + S(pt(-306, 664)) + ' ' + S(pt(-314, 672));
      return thick(rails, 7, 'metal') + fillShape(shell, 'dark') + P(capsule(pt(-120, 689), pt(-300, 696), 4, 4), 'hl m-dark-hi');
    },
    what: 'Where you sit, supported mainly by your sit bones.',
    how: 'A shell supports the padding and cover, and two rails underneath clamp to the seatpost. Saddles vary in width and shape to suit different riders.',
    fit: 'Height, fore-aft position and tilt are three separate adjustments, and each one matters.', lesson: true },
  { id: 'pedals', name: 'Pedals', sys: 'Contact points', layer: 8, v: [300, -470], w: [0.45, 1],
    svg: () => fillShape(capsule(add(PEDAL, pt(-32, 3)), add(PEDAL, pt(50, 6)), 22, 16), 'dark') +
      P(capsule(add(PEDAL, pt(-20, 9)), add(PEDAL, pt(40, 10)), 4, 3), 'hl m-dark-hi') + fillShape(circle(PEDAL, 7), 'metal-hi'),
    what: 'Clipless road pedals that lock onto cleats on your shoes.',
    how: 'Twist your heel outwards to release. Most systems allow a few degrees of float, so your foot can rotate slightly while clipped in.',
    fit: 'Cleat position is set on the shoe. Cyclefit suggests starting with the pedal axle at least 10 mm behind the ball of the foot.', sources: ['cyclefit-cleats'], lesson: true },

  // Drivetrain
  { id: 'bb', name: 'Bottom bracket', sys: 'Drivetrain', layer: 5, v: [-150, -280], w: [0.5, 1],
    svg: () => fillShape(circle(BB, 23), 'metal-hi') + fillShape(circle(BB, 13), 'dark'),
    what: 'The bearings and axle that the chainset turns on.',
    how: 'It fits inside the frame’s bottom bracket shell. Different standards are threaded or press-fit.' },
  { id: 'chainset', name: 'Chainset', sys: 'Drivetrain', layer: 6, v: [130, -330], w: [0.4, 0.95],
    svg: () => {
      let s = fillShape(circle(BB, RING_S + 1) + circle(BB, RING_S - 10), 'metal') + teeth(BB, RING_S + 2, 34, 4);
      for (let i = 0; i < 4; i++) { const a = CRANK + 45 + i * 90; s += fillShape(capsule(polar(BB, 10, a), polar(BB, 84, a), 26, 18), 'metal-hi'); }
      s += fillShape(circle(BB, RING + 2) + circle(BB, RING - 14), 'metal') + teeth(BB, RING + 3.5, 50, 5);
      for (let i = 0; i < 4; i++) s += P(circle(polar(BB, 55, CRANK + 45 + i * 90), 5), 'm-dark');
      return s;
    },
    front: () => tube(BB, PEDAL, 34, 24, 'metal') + fillShape(circle(BB, 20), 'metal-hi') + fillShape(circle(PEDAL, 12), 'metal'),
    back: () => tube(BB, PEDAL_ND, 34, 24, 'metal'),
    what: 'The crank arms and chainrings, turned by your legs.',
    how: 'Your pedalling force goes through the crank arms to the chainrings, which drive the chain. Road chainsets usually have two rings, such as 50 and 34 teeth.',
    fit: 'Crank length changes how far your leg travels, so it interacts with saddle height.', sources: ['hogg-height'], lesson: true },
  { id: 'chain', name: 'Chain', sys: 'Drivetrain', layer: 7, v: [0, -40], w: [0.55, 1],
    svg: () => { const d = chainPath(); return thick(d, 8.5, 'chain') + '<path class="links" d="' + d + '" stroke-width="4.5" stroke-dasharray="7.6 5.1"/>'; },
    what: 'Carries power from the chainrings to the cassette.',
    how: 'Pins join the links, and rollers mesh with each tooth. Chains lengthen as they wear, and a worn chain wears out the chainrings and cassette faster.' },
  { id: 'cassette', name: 'Cassette', sys: 'Drivetrain', layer: 2, v: [-60, -450], w: [0.4, 0.95],
    svg: () => {
      const T = [34, 30, 27, 24, 21, 19, 17, 15, 14, 13, 12, 11];
      let s = '';
      T.forEach((t, i) => { const r = t * 12.7 / (2 * Math.PI); s += fillShape(circle(RA, r + 2), i % 2 ? 'metal-hi' : 'metal'); if (i === 0) s += teeth(RA, r + 3, t, 4); });
      return s + fillShape(circle(RA, 15), 'dark');
    },
    what: 'The cluster of sprockets on the rear wheel.',
    how: 'Each sprocket gives a different gear. Smaller sprockets are harder to push but faster; larger ones make climbing easier.' },
  { id: 'mechhanger', name: 'Mech hanger', sys: 'Drivetrain', layer: 5, v: [-60, -170], w: [0.55, 1],
    svg: () => fillShape(capsule(add(RA, pt(-4, -6)), add(RA, pt(-14, -44)), 22, 18), 'metal'),
    what: 'A small, replaceable bracket that attaches the rear mech to the frame.',
    how: 'It is designed to bend or break in a crash so the frame does not. A bent hanger is a common cause of poor shifting.' },
  { id: 'rearmech', name: 'Rear mech', sys: 'Drivetrain', layer: 6, v: [120, -360], w: [0.45, 1],
    svg: () => {
      const body = poly([add(RA, pt(-8, -40)), add(RA, pt(-50, -46)), add(RA, pt(-48, -84)), add(J1, pt(6, 8)), add(RA, pt(-4, -60))]);
      return fillShape(body, 'dark') + fillShape(circle(add(RA, pt(-14, -46)), 13), 'dark-hi') +
        fillShape(circle(J1, JR), 'dark') + teeth(J1, JR + 1, 11, 3) +
        fillShape(circle(J2, JR), 'dark') + teeth(J2, JR + 1, 11, 3);
    },
    front: () => fillShape(capsule(J1, J2, 24, 26), 'metal') + fillShape(circle(J1, 5), 'metal-hi') + fillShape(circle(J2, 5), 'metal-hi'),
    what: 'Moves the chain across the cassette’s sprockets.',
    how: 'A sprung cage with two jockey wheels guides the chain and keeps it under tension as you change gear.' },
  { id: 'frontmech', name: 'Front mech', sys: 'Drivetrain', layer: 8, v: [-120, 140], w: [0.5, 1],
    svg: () => fillShape(capsule(ST(150), ST(186), 22, 22), 'dark') + fillShape(sector(BB, RING + 7, RING + 22, 96, 134), 'metal'),
    what: 'Moves the chain between the chainrings.',
    how: 'A cage either side of the chain pushes it sideways onto the larger or smaller ring when you change gear.' },

  // Accessories
  { id: 'cage', name: 'Bottle cage', sys: 'Accessories', layer: 5, v: [-140, 140], w: [0.3, 0.9],
    svg: () => {
      const u = unit(AX(140)), n = perp(u), q = (s: number, o: number) => add(mul(u, s), mul(n, o));
      const d = 'M' + S(q(170, 30)) + 'L' + S(q(330, 30)) + 'M' + S(q(186, 30)) + 'C' + S(q(186, 70)) + ' ' + S(q(196, 98)) + ' ' + S(q(214, 104)) +
        'L' + S(q(300, 104)) + 'C' + S(q(318, 100)) + ' ' + S(q(324, 84)) + ' ' + S(q(320, 62)) + 'M' + S(q(214, 104)) + 'L' + S(q(232, 30));
      return hit(capsule(q(180, 66), q(326, 66), 84)) + thick(d, 5, 'wire') + P(circle(q(214, 30), 5), 'm-metal-hi') + P(circle(q(278, 30), 5), 'm-metal-hi');
    },
    what: 'Holds a bottle on the down tube or seat tube.',
    how: 'It bolts to threaded mounts on the frame.' },
];

/** One drawn fragment. Fragments sharing `key` select and move together. */
export interface Fragment { key: string; fragId: string; layer: number; part: PartDef; markup: string }

/** A selectable part: the group key, with the copy from whichever fragment carries it. */
export interface PartInfo extends PartCopy { key: string; name: string; sys: System }

function build() {
  const frags: Fragment[] = [];
  const info = new Map<string, PartInfo>();
  for (const p of PARTS) {
    const key = p.group ?? p.id;
    if (p.back) frags.push({ key, fragId: p.id, layer: 0, part: p, markup: p.back() });
    frags.push({ key, fragId: p.id, layer: p.layer, part: p, markup: p.svg() });
    if (p.front) frags.push({ key, fragId: p.id, layer: 8, part: p, markup: p.front() });
    if (p.what && p.how && !info.has(key)) {
      info.set(key, { key, name: p.name, sys: p.sys, what: p.what, how: p.how, fit: p.fit, sources: p.sources, lesson: p.lesson });
    }
  }
  // Stable sort by layer keeps the prototype's draw order within each layer.
  frags.sort((a, b) => a.layer - b.layer);
  const parts = [...info.values()].sort((a, b) => SYSTEM_ORDER.indexOf(a.sys) - SYSTEM_ORDER.indexOf(b.sys));
  return { frags, parts };
}

const built = build();
/** Every fragment, in draw order (back to front). */
export const FRAGMENTS: readonly Fragment[] = built.frags;
/** Every selectable part, in system order. This is also the keyboard order. */
export const PART_LIST: readonly PartInfo[] = built.parts;
export const PART_BY_KEY: ReadonlyMap<string, PartInfo> = new Map(PART_LIST.map((p) => [p.key, p]));
