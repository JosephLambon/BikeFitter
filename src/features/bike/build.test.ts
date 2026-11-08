import { describe, expect, it } from 'vitest';
import { BUILD_OPTIONS, DEFAULT_BUILD, changedKeys, choiceOf, otherChoice } from './build';

const US = /\b(crankset|derailleurs?|tires?|calipers?|fenders?|cogs?|color|center|aluminum|gray)\b/i;

describe('bike build options', () => {
  it('defaults every option to its first choice', () => {
    for (const o of BUILD_OPTIONS) expect(DEFAULT_BUILD[o.key]).toBe(o.choices[0].value);
  });

  it('finds the current and the other choice for a toggle', () => {
    expect(choiceOf('brakes', DEFAULT_BUILD).name).toBe('Disc brakes');
    expect(otherChoice('brakes', DEFAULT_BUILD).name).toBe('Rim brakes');
    expect(otherChoice('brakes', { ...DEFAULT_BUILD, brakes: 'rim' }).name).toBe('Disc brakes');
  });

  it('lists the options that changed, in panel order', () => {
    expect(changedKeys(DEFAULT_BUILD, DEFAULT_BUILD)).toEqual([]);
    expect(changedKeys(DEFAULT_BUILD, { ...DEFAULT_BUILD, mudguards: 'on', gears: 'electronic' })).toEqual(['gears', 'mudguards']);
  });

  it.each(BUILD_OPTIONS.flatMap((o) => o.choices.map((c) => [o.label + ': ' + c.label, c] as const)))('%s uses British English', (_n, c) => {
    expect([c.label, c.name].join(' ')).not.toMatch(US);
  });
});
