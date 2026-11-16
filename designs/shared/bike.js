/* BikeFitter design prototypes: shared exploded-bike diagram.
   Original artwork, drawn from first principles. Geometry is in millimetres
   (y up) with the bottom bracket centre at the origin, based on a mid-size
   endurance road bike: stack 570, reach 390, 73° head angle, 73.5° seat
   angle, 410 mm chainstays, 172.5 mm cranks, 50/34 chainset, 11-34 cassette.

   Usage:
     var api = BikeExplorer.mount(el, {
       interactive: true,        // hover/tap/keyboard selection + info card
       slider: inputElement,     // optional <input type="range" min=0 max=100>
       dims: false,              // true, or a list such as ['saddle'] or ['stack', 'reach']
       dimValues: true,          // false: label the dimensions without their mm values
       lessonHref: '#learn',     // where "Related lesson" links point
       dock: false,              // true: info panel sits under the drawing instead of floating
       placeholder: '',          // dock only: HTML shown when nothing is selected
       onSelect: function (id) {}
     });
     api.setProgress(0..1); api.select(id | null); api.parts -> [{id,name,system}]

   Theme hooks (CSS custom properties, set on the container or :root):
     --bx-frame --bx-frame-hi --bx-dark --bx-dark-hi --bx-metal --bx-metal-hi
     --bx-spoke --bx-wire --bx-teeth --bx-chain --bx-chain-hi --bx-hole
     --bx-outline --bx-outline-w --bx-active-fill --bx-active-fill-hi
     --bx-active-line --bx-dim --bx-shadow --bx-ground --bx-dim-line */
(function () {
  'use strict';

  /* ---------- maths ---------- */
  var RAD = Math.PI / 180;
  function pt(x, y) { return { x: x, y: y }; }
  function add(a, b) { return pt(a.x + b.x, a.y + b.y); }
  function sub(a, b) { return pt(a.x - b.x, a.y - b.y); }
  function mul(a, k) { return pt(a.x * k, a.y * k); }
  function len(a) { return Math.sqrt(a.x * a.x + a.y * a.y); }
  function unit(a) { var l = len(a) || 1; return pt(a.x / l, a.y / l); }
  function perp(a) { return pt(-a.y, a.x); }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function dir(deg) { return pt(Math.cos(deg * RAD), Math.sin(deg * RAD)); }
  function along(p, d, k) { return add(p, mul(d, k)); }
  function polar(c, r, deg) { return along(c, dir(deg), r); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function S(p) { return r1(p.x) + ' ' + r1(-p.y); }           // to SVG space (y down)
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- path builders ---------- */
  function capsule(a, b, wa, wb) {
    wb = wb == null ? wa : wb;
    var n = perp(unit(sub(b, a))), ra = wa / 2, rb = wb / 2;
    return 'M' + S(along(a, n, ra)) + 'L' + S(along(b, n, rb)) +
      'A' + r1(rb) + ' ' + r1(rb) + ' 0 0 1 ' + S(along(b, n, -rb)) +
      'L' + S(along(a, n, -ra)) +
      'A' + r1(ra) + ' ' + r1(ra) + ' 0 0 1 ' + S(along(a, n, ra)) + 'Z';
  }
  function slab(a, b, wa, wb) {
    wb = wb == null ? wa : wb;
    var n = perp(unit(sub(b, a)));
    return 'M' + S(along(a, n, wa / 2)) + 'L' + S(along(b, n, wb / 2)) +
      'L' + S(along(b, n, -wb / 2)) + 'L' + S(along(a, n, -wa / 2)) + 'Z';
  }
  function circle(c, r) {
    return 'M' + S(pt(c.x - r, c.y)) + 'A' + r + ' ' + r + ' 0 1 0 ' + S(pt(c.x + r, c.y)) +
      'A' + r + ' ' + r + ' 0 1 0 ' + S(pt(c.x - r, c.y)) + 'Z';
  }
  function annulus(c, ro, ri) { return circle(c, ro) + circle(c, ri); }
  function sector(c, ri, ro, a1, a2) {
    var large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    return 'M' + S(polar(c, ro, a1)) + 'A' + ro + ' ' + ro + ' 0 ' + large + ' 0 ' + S(polar(c, ro, a2)) +
      'L' + S(polar(c, ri, a2)) + 'A' + ri + ' ' + ri + ' 0 ' + large + ' 1 ' + S(polar(c, ri, a1)) + 'Z';
  }
  function poly(pts) { return 'M' + pts.map(S).join('L') + 'Z'; }
  function line(pts) { return 'M' + pts.map(S).join('L'); }

  /* ---------- element builders ---------- */
  function P(d, cls, attrs) { return '<path class="' + cls + '" d="' + d + '"' + (attrs || '') + '/>'; }
  function fillShape(d, mat) { return P(d, 'm-' + mat, ' fill-rule="evenodd"'); }
  var LIGHT = unit(pt(-0.35, 1));
  function tube(a, b, wa, wb, mat) {
    mat = mat || 'frame';
    wb = wb == null ? wa : wb;
    var d = unit(sub(b, a)), n = perp(d);
    if (dot(n, LIGHT) < 0) n = mul(n, -1);
    var a2 = along(along(a, n, wa * 0.2), d, wa * 0.25), b2 = along(along(b, n, wb * 0.2), d, -wb * 0.25);
    return fillShape(capsule(a, b, wa, wb), mat) +
      P(capsule(a2, b2, wa * 0.2, wb * 0.2), 'hl m-' + mat + '-hi');
  }
  /* A stroked path with an outline drawn underneath (for bars, rails, chain). */
  function thick(d, w, mat, extra) {
    return '<path class="o" d="' + d + '" stroke-width="' + r1(w + 4.4) + '"/>' +
      '<path class="t-' + mat + '" d="' + d + '" stroke-width="' + w + '"' + (extra || '') + '/>';
  }
  function hit(d) { return '<path class="hit" d="' + d + '"/>'; }

  /* ---------- geometry ---------- */
  var BB = pt(0, 0);
  var RA = pt(-404, 70);                 // rear axle
  var FA = pt(590, 70);                  // front axle (45 mm fork offset)
  var HTT = pt(390, 570);                // head-tube top: stack 570, reach 390
  var sDown = dir(-73), sUp = dir(107), seatDir = dir(106.5), fwd = dir(17);
  function AX(l) { return along(HTT, sDown, l); }
  function ST(l) { return along(BB, seatDir, l); }
  var STEM = AX(-50);
  var BAR = along(STEM, dir(11), 100);
  var SADDLE_H = 725;
  var TYRE_R = 339, RIM_R = 311, RIM_IN = 276, GROUND = 70 - TYRE_R;
  var CRANK_DEG = -32, CRANK_L = 172.5;
  var PEDAL = polar(BB, CRANK_L, CRANK_DEG), PEDAL_ND = polar(BB, CRANK_L, CRANK_DEG + 180);
  var RING = 101.1, RING_S = 68.7, COG = 34.4;
  var J1 = pt(-410, -24), J2 = pt(-396, -100), JR = 20;
  var B = function (dx, dy) { return add(BAR, pt(dx, dy)); };

  /* ---------- chain (true tangent path around rings, jockey wheels and sprocket) ---------- */
  function tangent(A, Bc) {
    var D = sub(Bc.c, A.c), L = len(D), u = mul(D, 1 / L);
    var ra = A.s * A.r, rb = Bc.s * Bc.r, h = (rb - ra) / L, k = Math.sqrt(Math.max(0, 1 - h * h));
    var n = add(mul(u, h), mul(perp(u), k));
    return [sub(A.c, mul(n, ra)), sub(Bc.c, mul(n, rb))];
  }
  function ang(c, p) { return Math.atan2(p.y - c.y, p.x - c.x); }
  function arcPts(c, r, a0, a1, s) {
    var da = a1 - a0, out = [], i, n;
    if (s > 0) { while (da <= 0) da += 2 * Math.PI; } else { while (da >= 0) da -= 2 * Math.PI; }
    n = Math.max(2, Math.ceil(Math.abs(da) / 0.1));
    for (i = 1; i < n; i++) out.push(pt(c.x + r * Math.cos(a0 + da * i / n), c.y + r * Math.sin(a0 + da * i / n)));
    return out;
  }
  function chainPath() {
    // Travel order: ring (clockwise) -> lower jockey (cw) -> upper jockey (anticlockwise) -> sprocket (cw)
    var C = [{ c: BB, r: RING, s: -1 }, { c: J2, r: JR, s: -1 }, { c: J1, r: JR, s: 1 }, { c: RA, r: COG, s: -1 }];
    var segs = C.map(function (c, i) { return tangent(c, C[(i + 1) % C.length]); });
    var pts = [];
    C.forEach(function (c, i) {
      var inP = segs[(i + C.length - 1) % C.length][1], outP = segs[i][0];
      pts.push(inP);
      pts = pts.concat(arcPts(c.c, c.r, ang(c.c, inP), ang(c.c, outP), c.s));
      pts.push(outP);
    });
    return 'M' + pts.map(S).join('L') + 'Z';
  }

  /* ---------- drawings ---------- */
  function teeth(c, r, count, w) {
    var circ = 2 * Math.PI * r, t = circ / count;
    return '<circle class="teeth" cx="' + r1(c.x) + '" cy="' + r1(-c.y) + '" r="' + r + '" stroke-width="' + w +
      '" stroke-dasharray="' + r1(t * 0.48) + ' ' + r1(t * 0.52) + '"/>';
  }
  function spokes(c, count, flange) {
    var d = '', i, a, b;
    for (i = 0; i < count; i++) {
      a = (360 / count) * i;
      b = a + (i % 2 ? 1 : -1) * 18;
      d += 'M' + S(polar(c, flange, a)) + 'L' + S(polar(c, RIM_IN - 2, b));
    }
    return '<path class="m-spoke" d="' + d + '"/>';
  }
  function holes(c, r, count, size) {
    var s = '', i;
    for (i = 0; i < count; i++) s += P(circle(polar(c, r, i * 360 / count + 9), size), 'm-hole');
    return s;
  }
  var draw = {
    tyre: function (c) { return fillShape(annulus(c, TYRE_R, RIM_R), 'dark') + P(annulus(c, TYRE_R - 7, TYRE_R - 9), 'hl m-dark-hi', ' fill-rule="evenodd"'); },
    rim: function (c) { return fillShape(annulus(c, RIM_R, RIM_IN), 'dark') + P(annulus(c, RIM_R - 3, RIM_R - 7), 'hl m-dark-hi', ' fill-rule="evenodd"'); },
    spokes: function (c) { return hit(annulus(c, RIM_IN - 1, 92)) + spokes(c, 24, 24); },
    hub: function (c, rear) {
      return fillShape(circle(c, rear ? 34 : 28), 'metal') + fillShape(circle(c, rear ? 20 : 17), 'metal-hi');
    },
    valve: function (c, deg) {
      var a = polar(c, RIM_IN + 2, deg), b = polar(c, RIM_IN - 30, deg);
      return hit(capsule(a, b, 22)) + fillShape(capsule(a, b, 7), 'metal') + fillShape(capsule(polar(c, RIM_IN - 4, deg), polar(c, RIM_IN - 12, deg), 12), 'metal-hi');
    },
    thru: function (c) { return hit(circle(c, 16)) + fillShape(circle(c, 11), 'dark') + fillShape(circle(c, 5), 'metal-hi'); },
    rotor: function (c, r) {
      var s = fillShape(annulus(c, r, r - 17), 'metal') + holes(c, r - 8.5, 18, 2.6), i;
      for (i = 0; i < 6; i++) s += fillShape(capsule(polar(c, 16, i * 60 + 15), polar(c, r - 15, i * 60 + 35), 9, 7), 'metal-hi');
      return s + fillShape(circle(c, 18), 'dark');
    },
    calliper: function (c, deg) {
      var t = dir(deg + 90);
      return fillShape(capsule(along(c, t, -30), along(c, t, 30), 34, 30), 'dark') +
        fillShape(capsule(along(along(c, t, -18), dir(deg), 4), along(along(c, t, 18), dir(deg), 4), 10), 'dark-hi');
    }
  };

  /* ---------- parts ---------- */
  // Each fragment is drawn on a layer; fragments with the same id select and move together.
  // v: explode vector in mm (y up); w: [start, end] of the stagger window (0..1 of the slider).
  var FW = [430, -150], RW = [-430, -150];
  var PARTS = [
    // Frame (stays put; each tube is selectable)
    { id: 'chainstays', name: 'Chainstays', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return tube(pt(-6, 6), RA, 26, 15); },
      what: 'A pair of tubes running from the bottom bracket back to the rear axle.',
      how: 'They carry your pedalling load to the rear wheel. Their length affects the wheelbase and how the bike handles.' },
    { id: 'seatstays', name: 'Seat stays', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return tube(ST(455), RA, 17, 13); },
      what: 'A pair of slim tubes running from the seat tube down to the rear axle.',
      how: 'With the chainstays they make the rear triangle. They are often shaped to flex slightly, which can take the edge off road buzz.' },
    { id: 'downtube', name: 'Down tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return tube(AX(140), BB, 52, 54); },
      what: 'The large tube running from the head tube down to the bottom bracket.',
      how: 'Usually the biggest tube on the frame, it resists twisting from pedalling and steering. It often carries bottle-cage mounts and internal cable or hose routing.' },
    { id: 'toptube', name: 'Top tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return tube(AX(24), ST(505), 36, 30); },
      what: 'Joins the head tube to the seat tube along the top of the frame.',
      how: 'With the down tube and seat tube it forms the front triangle. On many modern road frames it slopes down towards the saddle.',
      fit: 'Its effective length appears on geometry charts, but stack and reach describe the fit more reliably.', lesson: true },
    { id: 'seattube', name: 'Seat tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return tube(BB, ST(532), 40, 33); },
      what: 'Runs from the bottom bracket up to where the seatpost goes in.',
      how: 'The seatpost slides inside it. Its angle sets how far behind the bottom bracket the saddle sits, before you add any setback.',
      fit: 'Saddle height is usually measured along this line, from the bottom bracket centre to the top of the saddle.', lesson: true },
    { id: 'headtube', name: 'Head tube', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { var n = perp(sDown); return fillShape(slab(AX(0), AX(165), 46, 58), 'frame') + P(slab(along(AX(6), n, -9), along(AX(159), n, -12), 9, 11), 'hl m-frame-hi'); },
      what: 'The short tube at the front of the frame that holds the headset bearings.',
      how: 'The fork’s steerer turns inside it. Its angle and length shape how the bike steers and, with the spacers and stem, how high your handlebars sit.',
      fit: 'Stack and reach are measured from the bottom bracket to the top of the head tube.', lesson: true },
    { id: 'bbshell', name: 'Bottom bracket shell', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return fillShape(circle(BB, 29), 'frame') + P(sector(BB, 20, 25, 95, 175), 'hl m-frame-hi'); },
      what: 'The part of the frame where the down tube, seat tube and chainstays meet.',
      how: 'It houses the bottom bracket bearings that the chainset turns on. Depending on the frame it is threaded or press-fit.',
      fit: 'Its centre is the reference point for almost every fit measurement: saddle height, setback, stack and reach.', lesson: true },
    { id: 'dropouts', name: 'Dropouts', sys: 'Frame', layer: 4, v: [0, 0], w: [0, 1],
      svg: function () { return fillShape(capsule(add(RA, pt(14, 10)), add(RA, pt(-6, -6)), 40, 34), 'frame') + fillShape(circle(RA, 9), 'metal-hi'); },
      what: 'Where the wheels attach to the frame and fork.',
      how: 'On modern disc-brake road bikes they are usually closed holes that a thru-axle slides through.' },

    // Fork
    { id: 'fork', name: 'Fork', sys: 'Fork', layer: 3, v: [130, -230], w: [0.1, 0.6],
      svg: function () {
        var n = perp(sDown);
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
      svg: function () { return draw.tyre(FA); },
      what: 'The only part of the bike that touches the road.',
      how: 'The air inside it supports your weight. Wider tyres can usually run lower pressures, for more comfort and grip.' },
    { id: 'rim-f', group: 'rim', name: 'Rim', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
      svg: function () { return draw.rim(FA); },
      what: 'The outer hoop of the wheel that holds the tyre.',
      how: 'The tyre’s bead locks into the rim. Deeper rims can be more aerodynamic; shallower ones are usually lighter.' },
    { id: 'spokes-f', group: 'spokes', name: 'Spokes', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
      svg: function () { return draw.spokes(FA); },
      what: 'Tensioned wires connecting the hub to the rim.',
      how: 'The hub effectively hangs from them. Even tension keeps the wheel true, so it spins straight without wobbling.' },
    { id: 'hub-f', group: 'hub', name: 'Hub', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
      svg: function () { return draw.hub(FA, false); },
      what: 'The centre of the wheel, spinning on bearings around the axle.',
      how: 'The rear hub includes a freehub, which drives the wheel when you pedal and lets it freewheel when you stop.' },
    { id: 'valve-f', group: 'valve', name: 'Valve', sys: 'Wheels', layer: 1, v: FW, w: [0, 0.45],
      svg: function () { return draw.valve(FA, 232); },
      what: 'Where you pump up the tyre.',
      how: 'Road bikes use Presta valves: unscrew the small locknut at the tip before pumping, and tighten it again afterwards.' },
    // Wheels: rear
    { id: 'tyre-r', group: 'tyre', name: 'Tyre', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: function () { return draw.tyre(RA); } },
    { id: 'rim-r', group: 'rim', name: 'Rim', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: function () { return draw.rim(RA); } },
    { id: 'spokes-r', group: 'spokes', name: 'Spokes', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: function () { return draw.spokes(RA); } },
    { id: 'hub-r', group: 'hub', name: 'Hub', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: function () { return draw.hub(RA, true); } },
    { id: 'valve-r', group: 'valve', name: 'Valve', sys: 'Wheels', layer: 1, v: RW, w: [0, 0.45], svg: function () { return draw.valve(RA, 300); } },
    { id: 'thru-f', group: 'thru', name: 'Thru-axle', sys: 'Wheels', layer: 8, v: [160, -430], w: [0.35, 0.85],
      svg: function () { return draw.thru(FA); },
      what: 'A bolt-through axle that holds the wheel in the fork or frame.',
      how: 'It slides through one dropout and the hub, then threads into the other side, locating the wheel firmly.' },
    { id: 'thru-r', group: 'thru', name: 'Thru-axle', sys: 'Wheels', layer: 8, v: [-150, -40], w: [0.35, 0.85], svg: function () { return draw.thru(RA); } },

    // Brakes (on the non-drive side, so drawn behind the wheels)
    { id: 'rotor-f', group: 'rotor', name: 'Rotor (disc)', sys: 'Brakes', layer: 0, v: [190, 260], w: [0.3, 0.8],
      svg: function () { return draw.rotor(FA, 80); },
      what: 'The steel disc bolted to the hub that the brake pads grip.',
      how: 'It sits on the left (non-drive) side of each wheel. Larger rotors give more braking power and shed heat better.' },
    { id: 'rotor-r', group: 'rotor', name: 'Rotor (disc)', sys: 'Brakes', layer: 0, v: [-70, 250], w: [0.3, 0.8], svg: function () { return draw.rotor(RA, 70); } },
    { id: 'calliper-f', group: 'calliper', name: 'Brake calliper', sys: 'Brakes', layer: 0, v: [120, 330], w: [0.35, 0.85],
      svg: function () { return draw.calliper(polar(FA, 72, 150), 150); },
      what: 'Squeezes the brake pads against the rotor to slow the wheel.',
      how: 'On a hydraulic system, pulling the lever pushes fluid along the hose, forcing pistons in the calliper to press the pads onto the rotor.' },
    { id: 'calliper-r', group: 'calliper', name: 'Brake calliper', sys: 'Brakes', layer: 0, v: [10, 330], w: [0.35, 0.85], svg: function () { return draw.calliper(polar(RA, 63, 25), 25); } },
    { id: 'hose', name: 'Brake hose', sys: 'Brakes', layer: 5, v: [140, 390], w: [0.2, 0.75],
      svg: function () { var d = 'M' + S(B(-6, -16)) + 'C' + S(pt(452, 586)) + ' ' + S(pt(430, 580)) + ' ' + S(along(AX(-12), fwd, 20)); return thick(d, 6, 'dark'); },
      what: 'Carries hydraulic fluid from the lever to the calliper.',
      how: 'On many modern road bikes it runs inside the handlebar, stem or frame, so only a short loop is visible.' },

    // Cockpit
    { id: 'headset', name: 'Headset', sys: 'Cockpit', layer: 5, v: [-25, 80], w: [0.2, 0.75],
      svg: function () { return fillShape(slab(AX(0), AX(-8), 50, 40), 'metal') + fillShape(slab(AX(165), AX(172), 60, 60), 'metal'); },
      what: 'The bearings that let the fork turn smoothly inside the head tube.',
      how: 'Bearings sit at the top and bottom of the head tube. The top cap preloads them before the stem bolts are tightened.' },
    { id: 'spacers', name: 'Spacers', sys: 'Cockpit', layer: 5, v: [-50, 160], w: [0.2, 0.78],
      svg: function () { return fillShape(slab(AX(-8.5), AX(-18), 38, 38), 'metal-hi') + fillShape(slab(AX(-18.5), AX(-29), 38, 38), 'metal-hi'); },
      what: 'Rings stacked on the fork’s steerer, under or over the stem.',
      how: 'Moving spacers from below the stem to above it lowers the handlebar; moving them below raises it.',
      fit: 'One of the simplest ways to change handlebar height. Stay within the fork maker’s limit for total spacer height.', lesson: true },
    { id: 'stem', name: 'Stem', sys: 'Cockpit', layer: 9, v: [-40, 250], w: [0.2, 0.82],
      svg: function () {
        return fillShape(slab(AX(-29.5), AX(-70), 46, 46), 'dark') +
          tube(along(STEM, fwd, 12), BAR, 34, 30, 'dark') +
          fillShape(slab(AX(-70.5), AX(-76), 36, 34), 'dark-hi') +
          fillShape(circle(BAR, 22), 'dark') + P(circle(BAR, 13), 'm-dark-hi');
      },
      what: 'Clamps the handlebar to the fork’s steerer.',
      how: 'Its length and angle set how far forward and how high the handlebar sits. Flipping an angled stem changes the bar height.',
      fit: 'Stem length and angle are among the main ways a fitter adjusts reach and handlebar drop.', lesson: true },
    { id: 'handlebar', name: 'Handlebar', sys: 'Cockpit', layer: 9, v: [110, 360], w: [0.22, 0.85],
      svg: function () {
        var d = 'M' + S(B(0, 0)) + 'L' + S(B(52, 4)) + 'C' + S(B(80, 6)) + ' ' + S(B(92, -30)) + ' ' + S(B(80, -70)) +
          'C' + S(B(70, -100)) + ' ' + S(B(48, -122)) + ' ' + S(B(18, -124)) + 'L' + S(B(-30, -122));
        return thick(d, 24, 'metal') + fillShape(circle(BAR, 13), 'metal-hi');
      },
      what: 'Gives you three main places to hold: the tops, the hoods and the drops.',
      how: 'Bars vary in width, reach (how far forward the hoods sit) and drop (how far down the drops go).',
      fit: 'Bar width, reach and drop all change your upper-body position, so they are part of a full fit.', lesson: true },
    { id: 'tape', name: 'Bar tape', sys: 'Cockpit', layer: 9, v: [250, 420], w: [0.3, 0.9],
      svg: function () {
        var d = 'M' + S(B(30, 3)) + 'L' + S(B(52, 4)) + 'C' + S(B(80, 6)) + ' ' + S(B(92, -30)) + ' ' + S(B(80, -70)) +
          'C' + S(B(70, -100)) + ' ' + S(B(48, -122)) + ' ' + S(B(18, -124)) + 'L' + S(B(-30, -122));
        return thick(d, 28, 'dark') + '<path class="wrap" d="' + d + '" stroke-width="27" stroke-dasharray="1.6 8"/>';
      },
      what: 'Wrapped around the handlebar for grip and cushioning.',
      how: 'It is wound from the bar ends towards the centre, overlapping as it goes, and finished with a strip of tape.' },
    { id: 'levers', name: 'Brake and gear levers', sys: 'Cockpit', layer: 9, v: [330, 300], w: [0.25, 0.88],
      svg: function () {
        var hood = 'M' + S(B(44, 10)) + 'C' + S(B(60, 30)) + ' ' + S(B(86, 38)) + ' ' + S(B(104, 44)) +
          'L' + S(B(112, 36)) + 'C' + S(B(110, 22)) + ' ' + S(B(102, 8)) + ' ' + S(B(96, -6)) +
          'L' + S(B(78, -18)) + 'C' + S(B(76, -4)) + ' ' + S(B(64, 4)) + ' ' + S(B(44, 10)) + 'Z';
        var blade = 'M' + S(B(98, -4)) + 'C' + S(B(108, -48)) + ' ' + S(B(98, -104)) + ' ' + S(B(66, -138));
        return thick(blade, 12, 'metal') + fillShape(hood, 'dark') + P(capsule(B(62, 26), B(98, 37), 5, 4), 'hl m-dark-hi');
      },
      what: 'Combined levers that brake and change gear, often called shifters.',
      how: 'Pulling the lever brakes. Sideways movements or buttons change gear, depending on the brand. The rubber hoods are a common hand position.',
      fit: 'Where the levers sit on the bar affects your reach to the hoods.', lesson: true },

    // Contact points
    { id: 'seatpost', name: 'Seatpost', sys: 'Contact points', layer: 0, v: [-55, 190], w: [0.15, 0.7],
      svg: function () { return tube(ST(390), ST(672), 27.2, 27.2, 'dark') + fillShape(capsule(pt(-222, 652), pt(-170, 652), 24), 'dark'); },
      what: 'Connects the saddle to the frame and sets its height.',
      how: 'It slides into the seat tube and is held by the seat clamp. The clamp at its head grips the saddle rails and sets tilt.',
      fit: 'Never raise it above the minimum-insertion mark printed on the post.', lesson: true },
    { id: 'seatclamp', name: 'Seat clamp', sys: 'Contact points', layer: 5, v: [-110, 60], w: [0.25, 0.8],
      svg: function () { return fillShape(slab(ST(512), ST(533), 46, 46), 'metal') + fillShape(circle(add(ST(522), dir(16.5)), 6), 'metal-hi'); },
      what: 'Holds the seatpost at the height you have set.',
      how: 'A bolt squeezes the top of the seat tube (or a wedge inside it) around the post. Use the torque printed on it, especially with carbon parts.' },
    { id: 'saddle', name: 'Saddle', sys: 'Contact points', layer: 9, v: [-100, 350], w: [0.15, 0.72],
      svg: function () {
        var shell = 'M' + S(pt(-54, 688)) + 'C' + S(pt(-120, 694)) + ' ' + S(pt(-200, 690)) + ' ' + S(pt(-262, 694)) +
          'C' + S(pt(-300, 697)) + ' ' + S(pt(-330, 712)) + ' ' + S(pt(-344, 706)) +
          'C' + S(pt(-352, 696)) + ' ' + S(pt(-346, 676)) + ' ' + S(pt(-326, 672)) +
          'C' + S(pt(-260, 668)) + ' ' + S(pt(-160, 678)) + ' ' + S(pt(-70, 676)) +
          'C' + S(pt(-56, 676)) + ' ' + S(pt(-48, 682)) + ' ' + S(pt(-54, 688)) + 'Z';
        var rails = 'M' + S(pt(-84, 676)) + 'C' + S(pt(-120, 660)) + ' ' + S(pt(-150, 656)) + ' ' + S(pt(-190, 656)) +
          'L' + S(pt(-262, 657)) + 'C' + S(pt(-290, 658)) + ' ' + S(pt(-306, 664)) + ' ' + S(pt(-314, 672));
        return thick(rails, 7, 'metal') + fillShape(shell, 'dark') + P(capsule(pt(-120, 689), pt(-300, 696), 4, 4), 'hl m-dark-hi');
      },
      what: 'Where you sit, supported mainly by your sit bones.',
      how: 'A shell supports the padding and cover, and two rails underneath clamp to the seatpost. Saddles vary in width and shape to suit different riders.',
      fit: 'Height, fore-aft position and tilt are three separate adjustments, and each one matters.', lesson: true },
    { id: 'pedals', name: 'Pedals', sys: 'Contact points', layer: 8, v: [300, -470], w: [0.45, 1],
      svg: function () {
        return fillShape(capsule(add(PEDAL, pt(-32, 3)), add(PEDAL, pt(50, 6)), 22, 16), 'dark') +
          P(capsule(add(PEDAL, pt(-20, 9)), add(PEDAL, pt(40, 10)), 4, 3), 'hl m-dark-hi') + fillShape(circle(PEDAL, 7), 'metal-hi');
      },
      what: 'Clipless road pedals that lock onto cleats on your shoes.',
      how: 'Twist your heel outwards to release. Most systems allow a few degrees of float, so your foot can rotate slightly while clipped in.',
      fit: 'Cleat position is set on the shoe. Cyclefit suggests starting with the pedal axle at least 10 mm behind the ball of the foot.', lesson: true },

    // Drivetrain
    { id: 'bb', name: 'Bottom bracket', sys: 'Drivetrain', layer: 5, v: [-150, -280], w: [0.5, 1],
      svg: function () { return fillShape(circle(BB, 23), 'metal-hi') + fillShape(circle(BB, 13), 'dark'); },
      what: 'The bearings and axle that the chainset turns on.',
      how: 'It fits inside the frame’s bottom bracket shell. Different standards are threaded or press-fit.' },
    { id: 'chainset', name: 'Chainset', sys: 'Drivetrain', layer: 6, v: [130, -330], w: [0.4, 0.95],
      svg: function () {
        var s = fillShape(annulus(BB, RING_S + 1, RING_S - 10), 'metal') + teeth(BB, RING_S + 2, 34, 4), i, a;
        for (i = 0; i < 4; i++) { a = CRANK_DEG + 45 + i * 90; s += fillShape(capsule(polar(BB, 10, a), polar(BB, 84, a), 26, 18), 'metal-hi'); }
        s += fillShape(annulus(BB, RING + 2, RING - 14), 'metal') + teeth(BB, RING + 3.5, 50, 5);
        for (i = 0; i < 4; i++) s += P(circle(polar(BB, 55, CRANK_DEG + 45 + i * 90), 5), 'm-dark');
        return s;
      },
      front: function () { return tube(BB, PEDAL, 34, 24, 'metal') + fillShape(circle(BB, 20), 'metal-hi') + fillShape(circle(PEDAL, 12), 'metal'); },
      back: function () { return tube(BB, PEDAL_ND, 34, 24, 'metal'); },
      what: 'The crank arms and chainrings, turned by your legs.',
      how: 'Your pedalling force goes through the crank arms to the chainrings, which drive the chain. Road chainsets usually have two rings, such as 50 and 34 teeth.',
      fit: 'Crank length changes how far your leg travels, so it interacts with saddle height.', lesson: true },
    { id: 'chain', name: 'Chain', sys: 'Drivetrain', layer: 7, v: [0, -40], w: [0.55, 1],
      svg: function () { var d = chainPath(); return thick(d, 8.5, 'chain') + '<path class="links" d="' + d + '" stroke-width="4.5" stroke-dasharray="7.6 5.1"/>'; },
      what: 'Carries power from the chainrings to the cassette.',
      how: 'Pins join the links, and rollers mesh with each tooth. Chains lengthen as they wear, and a worn chain wears out the chainrings and cassette faster.' },
    { id: 'cassette', name: 'Cassette', sys: 'Drivetrain', layer: 2, v: [-60, -450], w: [0.4, 0.95],
      svg: function () {
        var T = [34, 30, 27, 24, 21, 19, 17, 15, 14, 13, 12, 11], s = '';
        T.forEach(function (t, i) { var r = t * 12.7 / (2 * Math.PI); s += fillShape(circle(RA, r + 2), i % 2 ? 'metal-hi' : 'metal'); if (i === 0) s += teeth(RA, r + 3, t, 4); });
        return s + fillShape(circle(RA, 15), 'dark');
      },
      what: 'The cluster of sprockets on the rear wheel.',
      how: 'Each sprocket gives a different gear. Smaller sprockets are harder to push but faster; larger ones make climbing easier.' },
    { id: 'mechhanger', name: 'Mech hanger', sys: 'Drivetrain', layer: 5, v: [-60, -170], w: [0.55, 1],
      svg: function () { return fillShape(capsule(add(RA, pt(-4, -6)), add(RA, pt(-14, -44)), 22, 18), 'metal'); },
      what: 'A small, replaceable bracket that attaches the rear mech to the frame.',
      how: 'It is designed to bend or break in a crash so the frame does not. A bent hanger is a common cause of poor shifting.' },
    { id: 'rearmech', name: 'Rear mech', sys: 'Drivetrain', layer: 6, v: [120, -360], w: [0.45, 1],
      svg: function () {
        var body = poly([add(RA, pt(-8, -40)), add(RA, pt(-50, -46)), add(RA, pt(-48, -84)), add(J1, pt(6, 8)), add(RA, pt(-4, -60))]);
        return fillShape(body, 'dark') + fillShape(circle(add(RA, pt(-14, -46)), 13), 'dark-hi') +
          fillShape(circle(J1, JR), 'dark') + teeth(J1, JR + 1, 11, 3) +
          fillShape(circle(J2, JR), 'dark') + teeth(J2, JR + 1, 11, 3);
      },
      front: function () { return fillShape(capsule(J1, J2, 24, 26), 'metal') + fillShape(circle(J1, 5), 'metal-hi') + fillShape(circle(J2, 5), 'metal-hi'); },
      what: 'Moves the chain across the cassette’s sprockets.',
      how: 'A sprung cage with two jockey wheels guides the chain and keeps it under tension as you change gear.' },
    { id: 'frontmech', name: 'Front mech', sys: 'Drivetrain', layer: 8, v: [-120, 140], w: [0.5, 1],
      svg: function () { return fillShape(capsule(ST(150), ST(186), 22, 22), 'dark') + fillShape(sector(BB, RING + 7, RING + 22, 96, 134), 'metal'); },
      what: 'Moves the chain between the chainrings.',
      how: 'A cage either side of the chain pushes it sideways onto the larger or smaller ring when you change gear.' },

    // Accessories
    { id: 'cage', name: 'Bottle cage', sys: 'Accessories', layer: 5, v: [-140, 140], w: [0.3, 0.9],
      svg: function () {
        var u = unit(AX(140)), n = perp(u), q = function (s, o) { return add(mul(u, s), mul(n, o)); };
        var d = 'M' + S(q(170, 30)) + 'L' + S(q(330, 30)) + 'M' + S(q(186, 30)) + 'C' + S(q(186, 70)) + ' ' + S(q(196, 98)) + ' ' + S(q(214, 104)) +
          'L' + S(q(300, 104)) + 'C' + S(q(318, 100)) + ' ' + S(q(324, 84)) + ' ' + S(q(320, 62)) + 'M' + S(q(214, 104)) + 'L' + S(q(232, 30));
        return hit(capsule(q(180, 66), q(326, 66), 84)) + thick(d, 5, 'wire') + P(circle(q(214, 30), 5), 'm-metal-hi') + P(circle(q(278, 30), 5), 'm-metal-hi');
      },
      what: 'Holds a bottle on the down tube or seat tube.',
      how: 'It bolts to threaded mounts on the frame.' }
  ];
  var SYSTEM_ORDER = ['Frame', 'Fork', 'Cockpit', 'Contact points', 'Drivetrain', 'Brakes', 'Wheels', 'Accessories'];

  /* ---------- dimensions overlay (stack, reach, saddle height) ---------- */
  function dimensions(which, values) {
    var s = '', top = HTT.y + 150, xr = HTT.x + 120;
    function on(k) { return which === true || (which && which.indexOf(k) !== -1); }
    function mm(text, v) { return values === false ? text : text + ' ' + v + ' mm'; }
    function arrowLine(a, b) {
      var d = unit(sub(b, a)), n = perp(d), k = 14, w = 5;
      return '<path class="dim" d="' + line([a, b]) + '"/>' +
        '<path class="dim-head" d="' + poly([a, add(along(a, d, k), mul(n, w)), add(along(a, d, k), mul(n, -w))]) + poly([b, add(along(b, d, -k), mul(n, w)), add(along(b, d, -k), mul(n, -w))]) + '"/>';
    }
    function ext(a, b) { return '<path class="dim-ext" d="' + line([a, b]) + '"/>'; }
    function label(p, text, anchor, rot) {
      return '<text class="dim-label" x="' + r1(p.x) + '" y="' + r1(-p.y) + '" text-anchor="' + (anchor || 'middle') + '"' +
        (rot ? ' transform="rotate(' + rot + ' ' + r1(p.x) + ' ' + r1(-p.y) + ')"' : '') + '>' + text + '</text>';
    }
    // reach (horizontal, above)
    if (on('reach')) {
      s += ext(pt(0, 40), pt(0, top + 16)) + ext(pt(HTT.x, HTT.y + 10), pt(HTT.x, top + 16));
      s += arrowLine(pt(0, top), pt(HTT.x, top)) + label(pt(HTT.x / 2, top + 14), mm('Reach', 390));
    }
    // stack (vertical, in front)
    if (on('stack')) {
      s += ext(pt(40, 0), pt(xr + 16, 0)) + ext(pt(HTT.x + 30, HTT.y), pt(xr + 16, HTT.y));
      s += arrowLine(pt(xr, 0), pt(xr, HTT.y)) + label(pt(xr + 16, 470), mm('Stack', 570), 'start');
    }
    // saddle height (along the seat tube, offset behind it)
    if (on('saddle')) {
      var n = perp(seatDir), a = along(BB, n, 100), b = along(ST(SADDLE_H), n, 100);
      s += ext(along(BB, n, 30), along(a, n, 10)) + ext(along(ST(SADDLE_H), n, 10), along(b, n, 10));
      s += arrowLine(a, b) + label(along(along(a, seatDir, SADDLE_H * 0.74), n, 30), mm('Saddle height', 725), 'middle', -(90 - 16.5));
    }
    return s;
  }

  /* ---------- mount ---------- */
  var uid = 0;
  function mount(el, opts) {
    opts = opts || {};
    var interactive = opts.interactive !== false;
    var id = 'bx' + (++uid);
    var layers = [[], [], [], [], [], [], [], [], [], []];
    PARTS.forEach(function (p) {
      var key = p.group || p.id;
      function frag(svg, layer) {
        layers[layer].push('<g class="bx-part" data-part="' + key + '" data-frag="' + p.id + '"><g class="bx-lift">' + svg + '</g></g>');
      }
      if (p.back) frag(p.back(), 0);
      frag(p.svg(), p.layer);
      if (p.front) frag(p.front(), 8);
    });
    var ground = '<g class="bx-ground"><ellipse class="bx-shadow" cx="90" cy="' + (-GROUND + 6) + '" rx="820" ry="20"/>' +
      '<path class="bx-groundline" d="M-820 ' + (-GROUND) + 'H1000"/></g>';
    var svg = '<svg class="bx-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Road bike diagram">' +
      '<g class="bx-root">' + ground + layers.map(function (l) { return l.join(''); }).join('') +
      (opts.dims ? '<g class="bx-dims" aria-hidden="true">' + dimensions(opts.dims, opts.dimValues) + '</g>' : '') + '</g></svg>';

    el.classList.add('bx');
    if (interactive) el.classList.add('bx--interactive');
    if (opts.dock) el.classList.add('bx--docked', 'bx--dock-fixed');
    el.innerHTML = '<div class="bx-stage">' + svg + '</div>' +
      (interactive ? '<div class="bx-card" id="' + id + '-card" role="status" aria-live="polite" hidden></div>' : '');
    var svgEl = el.querySelector('svg'), root = el.querySelector('.bx-root'), card = el.querySelector('.bx-card');
    var frags = Array.prototype.slice.call(el.querySelectorAll('.bx-part'));
    var byId = {}; PARTS.forEach(function (p) { byId[p.id] = p; });
    var info = {}; PARTS.forEach(function (p) { var k = p.group || p.id; if (!info[k] || p.what) info[k] = p; });
    var keys = Object.keys(info).sort(function (a, b) {
      return SYSTEM_ORDER.indexOf(info[a].sys) - SYSTEM_ORDER.indexOf(info[b].sys);
    });
    var dims = el.querySelector('.bx-dims'), groundEl = el.querySelector('.bx-ground');
    var progress = 0, active = null, pinned = false;

    function apply() {
      frags.forEach(function (g) {
        var p = byId[g.getAttribute('data-frag')], w = p.w, t = ease(clamp((progress - w[0]) / (w[1] - w[0]), 0, 1));
        g.setAttribute('transform', t ? 'translate(' + r1(p.v[0] * t) + ' ' + r1(-p.v[1] * t) + ')' : '');
      });
      if (dims) dims.style.opacity = clamp(1 - progress * 5, 0, 1);
      if (groundEl) groundEl.style.opacity = clamp(1 - progress * 3, 0, 1);
      fit();
    }
    function fit() {
      var b = root.getBBox(), pad = 24 + 36 * progress;
      if (!b.width) return;
      var x = b.x - pad, y = b.y - pad, w = b.width + pad * 2, h = b.height + pad * 2;
      var r = svgEl.clientWidth && svgEl.clientHeight ? svgEl.clientWidth / svgEl.clientHeight : 1.6;
      if (w / h < r) { var nw = h * r; x -= (nw - w) / 2; w = nw; } else { var nh = w / r; y -= (nh - h) / 2; h = nh; }
      svgEl.setAttribute('viewBox', [x, y, w, h].map(r1).join(' '));
    }

    function render(key) {
      var p = info[key];
      var html = '<p class="bx-card-sys">' + p.sys + '</p><h3 class="bx-card-title">' + p.name + '</h3>' +
        '<p class="bx-card-what">' + p.what + '</p><p class="bx-card-how">' + p.how + '</p>';
      if (p.fit) html += '<p class="bx-card-fit"><strong>Why it matters for fit.</strong> ' + p.fit + '</p>';
      if (p.lesson && opts.lessonHref) html += '<a class="bx-card-link" href="' + opts.lessonHref + '">Related lesson ›</a>';
      card.innerHTML = html;
    }
    function place(key) {
      var host = el.getBoundingClientRect(), stage = el.querySelector('.bx-stage').getBoundingClientRect();
      if (!opts.dock) el.classList.toggle('bx--docked', host.width < 720);
      if (opts.dock || host.width < 720) { card.style.left = card.style.top = ''; return; }
      var r = null;
      frags.forEach(function (g) {
        if (g.getAttribute('data-part') !== key) return;
        var b = g.getBoundingClientRect();
        if (!r) r = { l: b.left, t: b.top, r: b.right, b: b.bottom };
        else { r.l = Math.min(r.l, b.left); r.t = Math.min(r.t, b.top); r.r = Math.max(r.r, b.right); r.b = Math.max(r.b, b.bottom); }
      });
      if (!r) return;
      var cw = card.offsetWidth, ch = card.offsetHeight, gap = 20;
      var minX = 8, maxX = host.width - cw - 8, minY = 8, maxY = Math.max(8, stage.bottom - host.top - ch - 8);
      var cx = (r.l + r.r) / 2 - host.left, cy = (r.t + r.b) / 2 - host.top;
      var right = r.r - host.left + gap, left = r.l - host.left - cw - gap;
      var below = r.b - host.top + gap, above = r.t - host.top - ch - gap;
      var top, lft;
      if (right <= maxX) { lft = right; top = clamp(cy - ch / 2, minY, maxY); }
      else if (left >= minX) { lft = left; top = clamp(cy - ch / 2, minY, maxY); }
      else if (below <= maxY) { lft = clamp(cx - cw / 2, minX, maxX); top = below; }
      else if (above >= minY) { lft = clamp(cx - cw / 2, minX, maxX); top = above; }
      else { lft = clamp(cx - cw / 2, minX, maxX); top = clamp(cy - ch / 2, minY, maxY); }
      left = lft;
      card.style.left = Math.round(left) + 'px';
      card.style.top = Math.round(top) + 'px';
    }
    function select(key, pin) {
      if (key === active && !pin) return;
      active = key;
      pinned = !!(key && pin);
      el.classList.toggle('has-active', !!key);
      frags.forEach(function (g) { g.classList.toggle('is-active', g.getAttribute('data-part') === key); });
      if (card) {
        if (key) { render(key); card.hidden = false; place(key); }
        else if (opts.dock && opts.placeholder) { card.innerHTML = opts.placeholder; card.hidden = false; }
        else { card.hidden = true; }
      }
      if (opts.onSelect) opts.onSelect(key);
    }

    // roving keyboard focus across parts
    var focusables = [];
    if (interactive) {
      keys.forEach(function (k, i) {
        var g = el.querySelector('.bx-part[data-part="' + k + '"]:not([data-frag$="-r"])') || el.querySelector('.bx-part[data-part="' + k + '"]');
        g.setAttribute('tabindex', i === 0 ? '0' : '-1');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', info[k].name + ', ' + info[k].sys);
        focusables.push(g);
      });
      svgEl.addEventListener('pointerover', function (e) {
        if (e.pointerType === 'touch' || pinned) return;
        var g = e.target.closest('.bx-part'); if (g) select(g.getAttribute('data-part'));
      });
      svgEl.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch' && !pinned) select(null); });
      svgEl.addEventListener('click', function (e) {
        var g = e.target.closest('.bx-part');
        if (!g) { select(null); return; }
        var k = g.getAttribute('data-part');
        if (pinned && active === k) select(null); else select(k, true);
      });
      focusables.forEach(function (g, i) {
        g.addEventListener('focus', function () { select(g.getAttribute('data-part'), true); });
        g.addEventListener('keydown', function (e) {
          var j = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % focusables.length;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + focusables.length) % focusables.length;
          if (e.key === 'Home') j = 0;
          if (e.key === 'End') j = focusables.length - 1;
          if (e.key === 'Escape') { select(null); return; }
          if (j === null) return;
          e.preventDefault();
          g.setAttribute('tabindex', '-1');
          focusables[j].setAttribute('tabindex', '0');
          focusables[j].focus();
        });
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) select(null); });
    }

    function setProgress(p) {
      progress = clamp(p, 0, 1);
      apply();
      if (active && card && !card.hidden) place(active);
    }
    if (opts.slider) {
      opts.slider.addEventListener('input', function () { setProgress(opts.slider.value / 100); });
    }
    setProgress(opts.progress || (opts.slider ? opts.slider.value / 100 : 0));
    if (opts.dock && opts.placeholder && card) { card.innerHTML = opts.placeholder; card.hidden = false; }
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); if (active && card && !card.hidden) place(active); }).observe(el);

    return {
      setProgress: setProgress,
      select: function (k) { select(k, !!k); },
      parts: keys.map(function (k) { return { id: k, name: info[k].name, system: info[k].sys }; })
    };
  }

  window.BikeExplorer = { mount: mount };
})();
