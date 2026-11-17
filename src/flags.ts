/* Feature flags. Each is read at call time from a Vite env var, so tests can flip it with
   vi.stubEnv. Production builds leave every flag off unless the env var is "true";
   .env.development turns them on for `npm run dev`. */
const ENV = {
  exploreBike: 'VITE_FLAG_EXPLORE_BIKE',
  /** The build panel on Explore the bike: swap gears, brakes, rims, chainrings and mudguards. */
  bikeBuild: 'VITE_FLAG_BIKE_BUILD',
  /** Portrait phones on Explore the bike: the part drawer at the thumb, over a screen-high bench wall. */
  bikeDrawer: 'VITE_FLAG_BIKE_DRAWER',
  /** The coil-spring explode scrubber on Explore the bike, with its "try me" tug. Off: the gear cable. */
  bikeCoil: 'VITE_FLAG_BIKE_COIL',
  /** Larger screens on Explore the bike: the selected part's name and what it is, in a fixed label
      centred above the drawing. Off: the floating info card. Phones keep their docked card. */
  bikeLabel: 'VITE_FLAG_BIKE_LABEL',
  /** Larger screens on Explore the bike: near the end of the scroll reel the heading and hint
      scroll up out of view and the bench wall grows into their space. */
  bikeTuck: 'VITE_FLAG_BIKE_TUCK',
  /** Portrait phones on Explore the bike: the part label (name and what it is) just above the dock,
      only while a part is picked, with the bike centred above it. Replaces the part drawer. */
  bikeThumbLabel: 'VITE_FLAG_BIKE_THUMB_LABEL',
} as const;

export type Flag = keyof typeof ENV;

export function isEnabled(flag: Flag): boolean {
  return import.meta.env[ENV[flag]] === 'true';
}
