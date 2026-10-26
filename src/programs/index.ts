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

// The program a transcript's "Major: ..." or "Minor: ..." line refers to, if we have it. Testudo
// upper-cases and truncates these ("Minor: ROBOTICS AND AUTONOMOUS"), so names match by prefix either
// way, and the longest matching name wins. A track named in the line is picked; otherwise the first.
export function matchTranscriptName(raw: string, kind: "major" | "minor"): Program | undefined {
  const t = norm(raw);
  if (t.length < 4) return undefined;
  let best: { e: ProgramEntry; len: number } | undefined;
  for (const e of ENTRIES) {
    if (e.kind !== kind) continue;
    const names = [e.name, ...e.programs.flatMap((p) => [p.name, p.short ?? "", ...(p.aliases ?? [])])].map(norm).filter((n) => n.length >= 4);
    for (const n of names) if ((n.startsWith(t) || t.startsWith(n)) && n.length > (best?.len ?? 0)) best = { e, len: n.length };
  }
  if (!best) return undefined;
  return best.e.programs.find((p) => best.e.programs.length > 1 && t.includes(norm(trackName(p)))) ?? best.e.programs[0];
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
