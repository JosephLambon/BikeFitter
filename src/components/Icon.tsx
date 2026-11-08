/* BikeFitter's one icon set: original line drawings on a 24 px grid, 1.75 px round strokes,
   no fill (the evidence shapes are the only filled icons). Ported from designs/site/site.js.
   A new icon is drawn on the same grid and added here, never pulled from an icon library. */
import type { SVGProps } from 'react';

const PATHS = {
  mark: <><circle cx="6" cy="15.5" r="3.6" /><circle cx="18" cy="15.5" r="3.6" /><path d="M6 15.5 10 8h6.5L18 15.5M10 8l3.2 7.5h-7.2M9 6h3" /></>,
  learn: <path d="M3.5 5.5c2.8-1 5.6-1 8.5.6v13c-2.9-1.6-5.7-1.6-8.5-.6zM20.5 5.5c-2.8-1-5.6-1-8.5.6v13c2.9-1.6 5.7-1.6 8.5-.6z" />,
  fit: <><circle cx="10" cy="11" r="6.5" /><circle cx="10" cy="11" r="1.6" /><path d="M10 17.5h10.5v-3H16M13.5 17.5v-1.6M16.5 17.5v-1.6" /></>,
  bike: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="1.8" /><path d="M12 3.5v6.7M4.6 16.3l5.8-3.3M19.4 16.3l-5.8-3.3" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></>,
  moon: <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" />,
  menu: <path d="M4 8h16M4 16h16" />,
  research: <path d="M12 3.5 20.5 12 12 20.5 3.5 12z" />,
  expert: <circle cx="12" cy="12" r="8" />,
  thumb: <path d="M12 4 21 19.5H3z" />,
  expand: <path d="M14.5 4H20v5.5M20 4l-6 6M9.5 20H4v-5.5M4 20l6-6" />,
  collapse: <path d="M20 4l-6 6M14 4.5V10h5.5M4 20l6-6M10 19.5V14H4.5" />,
  build: <><path d="M4 7h8.5M16.5 7H20M4 17h3.5M11.5 17H20" /><circle cx="14.5" cy="7" r="2" /><circle cx="9.5" cy="17" r="2" /></>,
  chevron: <path d="M7 10l5 5 5-5" />,
  rotate: <><rect x="3.5" y="8.5" width="11" height="12" rx="2" transform="rotate(-90 9 14.5)" /><path d="M13 3.5a7 7 0 0 1 7 6.5M20 10l1.6-2.4M20 10l-2.6-1.3" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.1" /></>,
} as const;

export type IconName = keyof typeof PATHS;
const FILLED: ReadonlySet<IconName> = new Set(['research', 'expert', 'thumb']);

export function Icon({ name, className, strokeWidth, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const filled = FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      className={'ico' + (className ? ' ' + className : '')}
      width="1em" height="1em"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth ?? 1.75} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', verticalAlign: '-0.125em' }}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
