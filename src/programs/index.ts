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
