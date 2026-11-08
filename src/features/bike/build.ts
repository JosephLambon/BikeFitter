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
  /** The choice in a sentence, shown as it is fitted ("Rim brakes fitted."). */
  name: string;
  /** One line on what changes on the bike. */
  note: string;
}
export interface BuildOption<K extends BuildKey = BuildKey> {
  key: K;
  label: string;
  choices: readonly [BuildChoice<K>, BuildChoice<K>];
}

const option = <K extends BuildKey>(o: BuildOption<K>) => o;

export const BUILD_OPTIONS = [
  option({ key: 'gears', label: 'Gears', choices: [
    { value: 'mechanical', label: 'Mechanical', name: 'Mechanical gears', note: 'Steel cables pull the mechs when you change gear.' },
    { value: 'electronic', label: 'Electronic', name: 'Electronic gears', note: 'Buttons send a signal to small motors in the mechs. No gear cables.' },
  ] }),
  option({ key: 'brakes', label: 'Brakes', choices: [
    { value: 'disc', label: 'Disc', name: 'Disc brakes', note: 'Pads grip a rotor on each hub. Wheels are held by thru-axles.' },
    { value: 'rim', label: 'Rim', name: 'Rim brakes', note: 'Pads grip the sides of the rim. Wheels are held by quick-release skewers.' },
  ] }),
  option({ key: 'rims', label: 'Rims', choices: [
    { value: 'shallow', label: 'Shallow', name: 'Shallow rims', note: 'A low rim with longer spokes. Usually lighter.' },
    { value: 'deep', label: 'Deep', name: 'Deep-section rims', note: 'A taller rim with shorter spokes. Can be more aerodynamic.' },
  ] }),
  option({ key: 'chainrings', label: 'Chainrings', choices: [
    { value: 'double', label: 'Two (2×)', name: 'Two chainrings', note: 'A front mech moves the chain between two rings.' },
    { value: 'single', label: 'One (1×)', name: 'One chainring', note: 'A single ring and no front mech. All the gears are at the back.' },
  ] }),
  option({ key: 'mudguards', label: 'Mudguards', choices: [
    { value: 'off', label: 'Off', name: 'No mudguards', note: 'Lighter and simpler, but you get the spray.' },
    { value: 'on', label: 'On', name: 'Mudguards', note: 'Keep road spray off you and the bike. The frame needs mounts and clearance.' },
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
