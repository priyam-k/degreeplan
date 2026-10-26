// Helpers for program-file tests (src/programs/tests): load one YAML file on its own and audit sample
// plans against it, so a test exercises exactly that file.
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import highsLoader from "highs";
import { loadProgramFile } from "./load";
import { solve, type Highs } from "../engine/solver";
import type { AuditResult, CatalogCourse, Program, SolverCourse } from "../types";
import { TRANSFER_TERM } from "../transcript";

const catalog = new Map((JSON.parse(readFileSync("public/courses.json", "utf8")) as CatalogCourse[]).map((c) => [c.c, c]));

export const inCatalog = (code: string) => catalog.has(code);

// Programs defined by one file, e.g. loadFile("cs.yaml").
export function loadFile(name: string): Program[] {
  return loadProgramFile(name, parse(readFileSync(`src/programs/${name}`, "utf8")));
}

let highs: Promise<Highs> | undefined;

// A sample course: a code, or { code, term, credits, transfer, ap }. Credits default to the catalog's.
export type Sample = string | { code: string; term?: string; credits?: number; transfer?: boolean; ap?: boolean; geneds?: string[][] };

export interface Audit {
  result: AuditResult;
  unmet: string[]; // "program-id/requirement-id: label (detail)" for everything unsatisfied
}

// Audits `courses` against `programs` (no cross-program sharing rules unless given).
export async function audit(programs: Program[], courses: Sample[], opts: { waived?: string[] } = {}): Promise<Audit> {
  highs ??= highsLoader() as unknown as Promise<Highs>;
  const solverCourses: SolverCourse[] = courses.map((s, i) => {
    const o = typeof s === "string" ? { code: s } : s;
    const cat = catalog.get(o.code.replace(/H$/, "")) ?? catalog.get(o.code);
    const transfer = !!(o.transfer || o.ap);
    return {
      id: `c${i}`,
      code: o.code,
      credits: o.credits ?? cat?.cr ?? 3,
      geneds: o.geneds ?? cat?.g ?? [],
      notes: "",
      status: transfer ? "transfer" : "completed",
      term: transfer ? TRANSFER_TERM : (o.term ?? "Fall 2025"),
      ...(o.ap && { ap: true }),
    };
  });
  const result = solve(await highs, solverCourses, programs, [], { waived: opts.waived });
  const unmet = result.programs.flatMap((r) => [
    ...r.buckets.filter((b) => !b.satisfied).map((b) => `${r.program.id}/${b.bucket.id}: ${b.bucket.label} (${b.courseCount} courses, ${b.creditCount} cr)`),
    ...r.constraints.filter((c) => !c.satisfied).map((c) => `${r.program.id}/${c.id}: ${c.label} (${c.detail})`),
  ]);
  return { result, unmet };
}
