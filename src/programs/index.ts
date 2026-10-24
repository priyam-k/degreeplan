import type { Program, SharingRule } from "../types";
import { CS_PROGRAMS } from "./cs";
import { MATH_PROGRAMS } from "./math";
import { rasMinor } from "./ras";
import { gened, university } from "./gened";

export const MAJORS: Program[] = [...CS_PROGRAMS, ...MATH_PROGRAMS];
export const MINORS: Program[] = [rasMinor];
export const ALWAYS: Program[] = [gened, university];
export const ALL_PROGRAMS: Program[] = [...MAJORS, ...MINORS, ...ALWAYS];

export const programById = (id: string) => ALL_PROGRAMS.find((p) => p.id === id);

// Compact name for chips and buttons ("CS", "Math", "RAS minor").
export function abbrev(p: Program): string {
  if (p.family === "cs") return "CS";
  if (p.family === "math") return "Math";
  if (p.id === "ras-minor") return "RAS minor";
  if (p.kind === "gened") return "GenEd";
  return p.name.replace(/ Major| Minor/, "");
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
