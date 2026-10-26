// Every YAML file in this folder defines one or more programs; adding a degree is adding a file.
// See README.md for the format and load.ts for how a file becomes a Program.
import type { Program, SharingRule } from "../types";
import { loadProgramFile } from "./load";

const files = import.meta.glob<unknown>("./*.yaml", { eager: true, import: "default" });
const loaded = Object.keys(files)
  .sort()
  .flatMap((f) => loadProgramFile(f.slice(2), files[f]));
for (const [i, p] of loaded.entries())
  if (loaded.findIndex((q) => q.id === p.id) !== i) throw new Error(`Two program files define the id "${p.id}"`);

const ofKind = (...kinds: Program["kind"][]) => loaded.filter((p) => kinds.includes(p.kind));
export const MAJORS: Program[] = ofKind("major");
export const MINORS: Program[] = ofKind("minor");
export const ALWAYS: Program[] = ofKind("gened", "university");
export const ALL_PROGRAMS: Program[] = [...MAJORS, ...MINORS, ...ALWAYS];

export const programById = (id: string) => ALL_PROGRAMS.find((p) => p.id === id);

// Compact name for chips and buttons ("CS", "Math", "RAS minor").
export const abbrev = (p: Program): string => p.short ?? p.name.replace(/ Major| Minor/, "");

// "Computer Science Major (Data Science)" -> "Computer Science"; "Data Science" is the track.
export const displayName = (p: Program) => p.name.replace(/\s*\(.*\)$/, "").replace(/ (Major|Minor)$/, "");
export const trackName = (p: Program) => p.name.match(/\((.*)\)$/)?.[1] ?? p.name;
// Programs sharing a key are tracks of one major (or minor); a plan holds at most one of them.
export const familyKey = (p: Program) => p.family ?? p.id;

// One picker entry per major or minor; a major's tracks share its entry.
export interface ProgramEntry {
  key: string;
  name: string;
  kind: "major" | "minor";
  college: string;
  programs: Program[];
  search: string; // normalized name, short name, college and aliases
}

const norm = (s: string) =>
  s
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
export const normalizeName = norm;

export const ENTRIES: ProgramEntry[] = [...MAJORS, ...MINORS].reduce<ProgramEntry[]>((out, p) => {
  const key = familyKey(p);
  const e = out.find((x) => x.key === key);
  if (e) e.programs.push(p);
  else out.push({ key, name: displayName(p), kind: p.kind as "major" | "minor", college: p.college ?? "", programs: [p], search: "" });
  return out;
}, []);
for (const e of ENTRIES)
  e.search = norm([e.name, e.college, ...e.programs.flatMap((p) => [p.name, p.short ?? "", ...(p.aliases ?? [])])].join(" "));
ENTRIES.sort((a, b) => a.name.localeCompare(b.name));

// The program a transcript's "Major: ..." or "Minor: ..." line refers to, if we have it. An exact name
// wins; then the longest name the line starts with ("BIOLOGICAL SCIENCES: PHYSIOLOGY..."); then, since
// Testudo truncates ("Minor: ROBOTICS AND AUTONOMOUS"), a name the line is the start of, but only if
// that fits a single program ("ENGINEERING" alone matches nothing). Within a major, a track named in
// the line is picked; otherwise the first track.
export function matchTranscriptName(raw: string, kind: "major" | "minor"): Program | undefined {
  const t = norm(raw);
  if (t.length < 4) return undefined;
  let exact: ProgramEntry | undefined;
  let longer: { e: ProgramEntry; len: number } | undefined;
  const truncated = new Set<ProgramEntry>();
  for (const e of ENTRIES) {
    if (e.kind !== kind) continue;
    for (const n of [e.name, ...e.programs.flatMap((p) => [p.name, p.short ?? "", ...(p.aliases ?? [])])].map(norm)) {
      if (n.length < 4) continue;
      if (n === t) exact = e;
      else if (t.startsWith(`${n} `) && n.length > (longer?.len ?? 0)) longer = { e, len: n.length };
      else if (n.startsWith(t)) truncated.add(e);
    }
  }
  const e = exact ?? longer?.e ?? (truncated.size === 1 ? [...truncated][0] : undefined);
  if (!e) return undefined;
  return e.programs.find((p) => e.programs.length > 1 && t.includes(norm(trackName(p)))) ?? e.programs[0];
}

const majorIds = MAJORS.map((p) => p.id);

export const SHARING_RULES: SharingRule[] = [
  // Catalog: "No more than six credits (or two courses) may be applied to satisfy both the requirements
  // of a minor and a major program." RAS: "A maximum of 2 courses ..." Applied across all of the
  // student's majors combined (conservative; per-major vs total is unspecified).
  ...MINORS.map(
    (m): SharingRule => ({
      kind: "maxShared",
      id: `${m.id}-major-overlap`,
      label: `${m.name}: ≤ 2 courses shared with major(s)`,
      a: m.id,
      b: majorIds,
      unit: "courses",
      max: 2,
    }),
  ),
  // "No course may be used to satisfy the requirements of more than one minor."
  ...MINORS.map(
    (m): SharingRule => ({
      kind: "maxShared",
      id: `${m.id}-minor-overlap`,
      label: `${m.name}: no courses shared with another minor`,
      a: m.id,
      b: MINORS.filter((o) => o.id !== m.id).map((o) => o.id),
      unit: "courses",
      max: 0,
    }),
  ),
];
