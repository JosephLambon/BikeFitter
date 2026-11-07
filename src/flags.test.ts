import { describe, expect, it, vi } from 'vitest';
import { isEnabled } from './flags';

describe('isEnabled', () => {
  it.each([['true', true], ['false', false], ['', false], ['1', false]])('VITE_FLAG_EXPLORE_BIKE=%j gives %s', (v, on) => {
    vi.stubEnv('VITE_FLAG_EXPLORE_BIKE', v);
    expect(isEnabled('exploreBike')).toBe(on);
  });
});
