/* The bike's build: common road-bike variations the control panel can swap. Each option has two
   choices; the first is the default and matches the original drawing. Copy follows AGENTS.md
   §1.1 (British English, UK part names) and §7: it describes how parts work and makes no
   numeric or performance claims beyond what the part copy already says. */

export interface Build {
  gears: 'mechanical' | 'electronic';
  brakes: 'disc' | 'rim';
  rims: 'shallow' | 'deep';
  chainrings: 'double' | 'single';
  mudguards: 'off' | 'on';
}
export type BuildKey = keyof Build;

export const DEFAULT_BUILD: Build = { gears: 'mechanical', brakes: 'disc', rims: 'shallow', chainrings: 'double', mudguards: 'off' };

export interface BuildChoice<K extends BuildKey = BuildKey> {
  value: Build[K];
  /** Short label for a segmented control or chip. */
  label: string;
  /** The choice in a sentence, announced to screen readers as it is fitted ("Rim brakes fitted."). */
  name: string;
}
export interface BuildOption<K extends BuildKey = BuildKey> {
  key: K;
  label: string;
  choices: readonly [BuildChoice<K>, BuildChoice<K>];
}

const option = <K extends BuildKey>(o: BuildOption<K>) => o;

export const BUILD_OPTIONS = [
  option({ key: 'gears', label: 'Gears', choices: [
    { value: 'mechanical', label: 'Mechanical', name: 'Mechanical gears' },
    { value: 'electronic', label: 'Electronic', name: 'Electronic gears' },
  ] }),
  option({ key: 'brakes', label: 'Brakes', choices: [
    { value: 'disc', label: 'Disc', name: 'Disc brakes' },
    { value: 'rim', label: 'Rim', name: 'Rim brakes' },
  ] }),
  option({ key: 'rims', label: 'Rims', choices: [
    { value: 'shallow', label: 'Shallow', name: 'Shallow rims' },
    { value: 'deep', label: 'Deep', name: 'Deep-section rims' },
  ] }),
  option({ key: 'chainrings', label: 'Chainrings', choices: [
    { value: 'double', label: 'Two (2×)', name: 'Two chainrings' },
    { value: 'single', label: 'One (1×)', name: 'One chainring' },
  ] }),
  option({ key: 'mudguards', label: 'Mudguards', choices: [
    { value: 'off', label: 'Off', name: 'No mudguards' },
    { value: 'on', label: 'On', name: 'Mudguards' },
  ] }),
] as const satisfies readonly BuildOption[];

export function choiceOf<K extends BuildKey>(key: K, build: Build): BuildChoice<K> {
  const o = BUILD_OPTIONS.find((x) => x.key === key)! as unknown as BuildOption<K>;
  return o.choices.find((c) => c.value === build[key])!;
}

/** The other choice for an option: what a toggle would swap to. */
export function otherChoice<K extends BuildKey>(key: K, build: Build): BuildChoice<K> {
  const o = BUILD_OPTIONS.find((x) => x.key === key)! as unknown as BuildOption<K>;
  return o.choices.find((c) => c.value !== build[key])!;
}

/** The option keys that differ between two builds, in panel order. */
export const changedKeys = (a: Build, b: Build): BuildKey[] => BUILD_OPTIONS.map((o) => o.key).filter((k) => a[k] !== b[k]);
