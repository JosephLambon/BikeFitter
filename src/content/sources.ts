/* Source register (AGENTS.md §7.3). Content cites sources by id only, never by raw URL.
   Every entry's link and content were checked on the date in lastVerified (§7.4). */

export interface Source {
  id: string;
  title: string;
  author: string;
  org?: string;
  tier: 1 | 2 | 3;
  url: string;
  /** YYYY-MM-DD */
  lastVerified: string;
  checkMethod: string;
  notes?: string;
}

const register = {
  'cyclefit-cleats': {
    id: 'cyclefit-cleats', title: 'How to fit cycling cleats correctly', author: 'Jimmy Wilson', org: 'Cyclefit', tier: 2,
    url: 'https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly',
    lastVerified: '2026-11-07', checkMethod: 'HTTP 200 and content confirmed',
    notes: 'Pedal axle at least 10 mm behind the 1st MPJ as a starting point.',
  },
  'empfield-stack-reach': {
    id: 'empfield-stack-reach', title: 'Stack & Reach Primer: Chapter One', author: 'Dan Empfield', org: 'Slowtwitch', tier: 2,
    url: 'https://www.slowtwitch.com/industry/stack-reach-primer-chapter-one/',
    lastVerified: '2026-11-07', checkMethod: 'HTTP 200 and content confirmed',
    notes: 'Stack and reach are measured from the bottom bracket to the head tube top; argues against seat-tube sizing.',
  },
  'hogg-height': {
    id: 'hogg-height', title: 'Seat Height – How Hard Can It Be?', author: 'Steve Hogg', org: 'Steve Hogg Bike Fitting', tier: 2,
    url: 'https://www.stevehoggbikefitting.com/bikefit/2011/02/seat-height-how-hard-can-it-be/',
    lastVerified: '2026-11-07', checkMethod: 'HTTP 200 and content confirmed',
    notes: 'Seat height measured from bottom bracket centre to top of seat; inside-leg formulas ignore crank length, setback and more.',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof register;
export const SOURCES: Readonly<Record<SourceId, Source>> = register;

/** Last content review, shown in the footer. */
export const LAST_REVIEW = '2026-11-07';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
/** "7 November 2026" from "2026-11-07". */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso + 'T00:00:00Z'));
