import { describe, expect, it } from 'vitest';
import { SOURCES } from '../../content/sources';
import { DEFAULT_BUILD, type Build } from './build';
import { FRAGMENTS, PARTS, PART_LIST, SYSTEM_ORDER, VARIANT_COPY, drawnFragments, fragmentsFor, partInfo, partsFor, unitOf } from './parts';

/* AGENTS.md §1.1: UK cycling terms everywhere. US terms may only appear as glossary aliases. */
const US_TERMS = /\b(crankset|derailleurs?|tires?|calipers?|fenders?|inseam|cogs?|pulley wheels|allen wrench|flat tyre|zip code)\b/i;
const US_SPELLING = /\b(color|center|meter|aluminum|gray|analyze|organize|optimize)\b/i;

describe('bike parts', () => {
  it('covers the minimum parts list from AGENTS.md §5.2', () => {
    const names = PART_LIST.map((p) => p.name);
    for (const n of ['Top tube', 'Down tube', 'Head tube', 'Seat tube', 'Seat stays', 'Chainstays', 'Bottom bracket shell', 'Dropouts',
      'Mech hanger', 'Fork', 'Headset', 'Spacers', 'Stem', 'Handlebar', 'Bar tape', 'Brake and gear levers', 'Saddle', 'Seatpost',
      'Seat clamp', 'Pedals', 'Chainset', 'Bottom bracket', 'Chain', 'Cassette', 'Front mech', 'Rear mech', 'Brake calliper',
      'Rotor (disc)', 'Brake hose', 'Rim', 'Spokes', 'Hub', 'Tyre', 'Valve', 'Thru-axle', 'Bottle cage']) {
      expect(names).toContain(n);
    }
  });

  it('gives every selectable part a name, system, what and how, once', () => {
    const keys = PART_LIST.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of PART_LIST) {
      expect(SYSTEM_ORDER).toContain(p.sys);
      expect(p.what.length).toBeGreaterThan(10);
      expect(p.how.length).toBeGreaterThan(10);
    }
  });

  it('draws every selectable part, and only parts that have copy', () => {
    const drawn = new Set(FRAGMENTS.map((f) => f.key));
    expect([...drawn].sort()).toEqual(PART_LIST.map((p) => p.key).sort());
  });

  it('lists parts in system order, which is the keyboard order', () => {
    const order = PART_LIST.map((p) => SYSTEM_ORDER.indexOf(p.sys));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('draws back to front', () => {
    const layers = FRAGMENTS.map((f) => f.layer);
    expect(layers).toEqual([...layers].sort((a, b) => a - b));
  });

  it('cites only sources in the register', () => {
    for (const p of PART_LIST) for (const id of p.sources ?? []) expect(SOURCES).toHaveProperty(id);
  });

  it.each(PART_LIST.map((p) => [p.name, p] as const))('%s uses British English and UK part names', (_n, p) => {
    const text = [p.name, p.what, p.how, p.fit ?? ''].join(' ');
    expect(text).not.toMatch(US_TERMS);
    expect(text).not.toMatch(US_SPELLING);
  });
});

describe('bike parts for a build', () => {
  const names = (b: Build) => partsFor(b).map((p) => partInfo(p.key, b).name);

  it('shows the original bike without a build, and adds only the gear cable for the default build', () => {
    const original = partsFor().map((p) => p.name);
    expect(original).toHaveLength(36);
    for (const n of ['Rim brake calliper', 'Brake cable', 'Quick-release skewer', 'Battery', 'Mudguards', 'Gear cable']) expect(original).not.toContain(n);
    expect(names(DEFAULT_BUILD)).toEqual([...original, 'Gear cable'].sort((a, b) => names(DEFAULT_BUILD).indexOf(a) - names(DEFAULT_BUILD).indexOf(b)));
  });

  it.each([
    ['rim brakes', { brakes: 'rim' }, ['Rim brake calliper', 'Brake cable', 'Quick-release skewer'], ['Rotor (disc)', 'Brake hose', 'Thru-axle', 'Brake calliper']],
    ['electronic gears', { gears: 'electronic' }, ['Battery'], ['Gear cable']],
    ['one chainring', { chainrings: 'single' }, [], ['Front mech']],
    ['mudguards', { mudguards: 'on' }, ['Mudguards'], []],
  ] as const)('swaps parts for %s', (_n, change, added, removed) => {
    const b = { ...DEFAULT_BUILD, ...change } as Build;
    for (const n of added) expect(names(b)).toContain(n);
    for (const n of removed) expect(names(b)).not.toContain(n);
  });

  it('drops the front-mech battery with the front mech', () => {
    const frags = (b: Build) => fragmentsFor(b).filter((f) => f.key === 'battery').map((f) => f.fragId);
    expect(frags({ ...DEFAULT_BUILD, gears: 'electronic' })).toEqual(['battery-r', 'battery-f']);
    expect(frags({ ...DEFAULT_BUILD, gears: 'electronic', chainrings: 'single' })).toEqual(['battery-r']);
  });

  it.each([
    ['levers', { gears: 'electronic' }, /signal/],
    ['rearmech', { gears: 'electronic' }, /motor/],
    ['chainset', { chainrings: 'single' }, /single/i],
    ['rim', { rims: 'deep' }, /deep-section/i],
    ['rim', { brakes: 'rim' }, /braking surface/],
  ] as const)('%s explains itself for the build', (key, change, text) => {
    const b = { ...DEFAULT_BUILD, ...change } as Build;
    const p = partInfo(key, b);
    expect(p.what + ' ' + p.how).toMatch(text);
    expect(partInfo(key, DEFAULT_BUILD).what + ' ' + partInfo(key, DEFAULT_BUILD).how).not.toMatch(text);
  });

  it('redraws only the wheel parts for deep rims', () => {
    const shallow = drawnFragments(0), deep = drawnFragments(1);
    const changed = shallow.filter((f, i) => f.markup !== deep[i].markup).map((f) => f.key);
    expect(new Set(changed)).toEqual(new Set(['rim', 'spokes', 'valve']));
  });

  it.each(VARIANT_COPY.map((v) => [v.name ?? v.key, v] as const))('variant copy for %s uses British English', (_n, v) => {
    const text = [v.name ?? '', v.what ?? '', v.how ?? '', v.fit ?? ''].join(' ');
    expect(text).not.toMatch(US_TERMS);
    expect(text).not.toMatch(US_SPELLING);
  });
});

describe('exploded units', () => {
  const unit = (id: string) => unitOf(PARTS.find((p) => p.id === id)!);
  it('keeps the frame as one piece', () => {
    expect(new Set(PARTS.filter((p) => p.sys === 'Frame').map(unitOf))).toEqual(new Set(['frame']));
  });
  it('keeps each wheel’s tyre, rim, spokes, hub and valve together, front and rear apart', () => {
    for (const s of ['f', 'r']) for (const id of ['tyre', 'rim', 'spokes', 'hub', 'valve']) expect(unit(`${id}-${s}`)).toBe('wheel-' + s);
  });
  it('gives every other part a piece of its own', () => {
    for (const id of ['rotor-f', 'thru-f', 'saddle', 'chain', 'cassette', 'fork']) {
      if (PARTS.some((p) => p.id === id)) expect(unit(id)).toBe(id);
    }
  });
});
