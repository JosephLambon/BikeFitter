/* Feature flags. Each is read at call time from a Vite env var, so tests can flip it with
   vi.stubEnv. Production builds leave every flag off unless the env var is "true";
   .env.development turns them on for `npm run dev`. */
const ENV = {
  exploreBike: 'VITE_FLAG_EXPLORE_BIKE',
  /** The build panel on Explore the bike: swap gears, brakes, rims, chainrings and mudguards. */
  bikeBuild: 'VITE_FLAG_BIKE_BUILD',
} as const;

export type Flag = keyof typeof ENV;

export function isEnabled(flag: Flag): boolean {
  return import.meta.env[ENV[flag]] === 'true';
}
