import { describe, expect, it } from 'vitest';
import { SOURCES } from '../../content/sources';
import { FRAGMENTS, PART_LIST, SYSTEM_ORDER } from './parts';

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
