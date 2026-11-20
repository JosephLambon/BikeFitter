import { describe, expect, it } from 'vitest';
import { separate, type Piece } from './layout';

const overlaps = (a: Piece, ao: { x: number; y: number }, b: Piece, bo: { x: number; y: number }, gap: number) =>
  Math.min(a.box.x + ao.x + a.box.width, b.box.x + bo.x + b.box.width) - Math.max(a.box.x + ao.x, b.box.x + bo.x) > -gap + 1e-6 &&
  Math.min(a.box.y + ao.y + a.box.height, b.box.y + bo.y + b.box.height) - Math.max(a.box.y + ao.y, b.box.y + bo.y) > -gap + 1e-6;

describe('separate', () => {
  it('leaves pieces that are already apart where their own explode vectors put them', () => {
    const pieces: Piece[] = [
      { id: 'a', box: { x: 0, y: 0, width: 10, height: 10 }, offset: { x: 0, y: 0 } },
      { id: 'b', box: { x: 100, y: 0, width: 10, height: 10 }, offset: { x: 20, y: 5 } },
    ];
    expect(separate(pieces, 10)).toEqual({ a: { x: 0, y: 0 }, b: { x: 20, y: 5 } });
  });

  it('never moves a fixed piece, and pushes the others clear of it by the gap', () => {
    const pieces: Piece[] = [
      { id: 'frame', box: { x: 0, y: 0, width: 100, height: 100 }, offset: { x: 0, y: 0 }, fixed: true },
      { id: 'cage', box: { x: 40, y: 40, width: 20, height: 20 }, offset: { x: 10, y: 0 } },
    ];
    const out = separate(pieces, 12);
    expect(out.frame).toEqual({ x: 0, y: 0 });
    expect(overlaps(pieces[0], out.frame, pieces[1], out.cage, 12)).toBe(false);
  });

  it('separates a crowd of concentric pieces (a wheel) so no two overlap', () => {
    const ring = (id: string, r: number): Piece => ({ id, box: { x: -r, y: -r, width: 2 * r, height: 2 * r }, offset: { x: 0, y: 0 } });
    const pieces = [ring('tyre', 340), ring('rim', 311), ring('spokes', 275), ring('hub', 34), ring('valve', 20), ring('thru', 16)];
    const out = separate(pieces, 24);
    for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
      expect(overlaps(pieces[i], out[pieces[i].id], pieces[j], out[pieces[j].id], 24), pieces[i].id + '/' + pieces[j].id).toBe(false);
    }
  });

  it('is deterministic', () => {
    const pieces: Piece[] = [0, 1, 2, 3].map((i) => ({ id: 'p' + i, box: { x: i, y: 0, width: 50, height: 50 }, offset: { x: 0, y: 0 } }));
    expect(separate(pieces, 8)).toEqual(separate(pieces, 8));
  });
});
