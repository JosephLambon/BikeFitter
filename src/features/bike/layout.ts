/* The exploded layout: where every part sits when the bike is fully apart.
   Each part starts at its own explode vector (parts.ts), then a deterministic solver pushes any
   two that overlap apart along the shorter way out, until every part has at least `gap` of clear
   space around it. Fixed pieces (the frame, which is one welded or moulded piece) never move.
   Boxes are in SVG space (y down), measured at the assembled position. */
import type { Box } from './explode';

export interface Offset { x: number; y: number }
export interface Piece {
  id: string;
  /** Where the piece's drawing sits when the bike is together. */
  box: Box;
  /** Its own explode vector, before separation. */
  offset: Offset;
  fixed?: boolean;
}

export function separate(pieces: readonly Piece[], gap: number, maxRounds = 800): Record<string, Offset> {
  const at = pieces.map((p) => ({ ...p.offset }));
  for (let round = 0; round < maxRounds; round++) {
    let moved = false;
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const A = pieces[i], B = pieces[j];
        if (A.fixed && B.fixed) continue;
        const ax = A.box.x + at[i].x, ay = A.box.y + at[i].y, bx = B.box.x + at[j].x, by = B.box.y + at[j].y;
        const ox = Math.min(ax + A.box.width, bx + B.box.width) - Math.max(ax, bx) + gap;
        const oy = Math.min(ay + A.box.height, by + B.box.height) - Math.max(ay, by) + gap;
        if (ox <= 1e-6 || oy <= 1e-6) continue;
        moved = true;
        // Push along the shorter way out, away from each other's centre (ties: the later piece
        // moves right or down, which keeps the result deterministic).
        const dcx = bx + B.box.width / 2 - (ax + A.box.width / 2), dcy = by + B.box.height / 2 - (ay + A.box.height / 2);
        const alongX = ox < oy;
        const sign = (alongX ? dcx : dcy) < 0 ? -1 : 1;
        const amount = (alongX ? ox : oy) + 0.5;
        const shareA = A.fixed ? 0 : B.fixed ? 1 : 0.5, shareB = 1 - shareA;
        if (alongX) { at[i].x -= sign * amount * shareA; at[j].x += sign * amount * shareB; }
        else { at[i].y -= sign * amount * shareA; at[j].y += sign * amount * shareB; }
      }
    }
    if (!moved) break;
  }
  const r = (v: number) => Math.round(v * 10) / 10 + 0;
  return Object.fromEntries(pieces.map((p, i) => [p.id, { x: r(at[i].x), y: r(at[i].y) }]));
}
