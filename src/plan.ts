import type { Plan, PlanCourse, Semester } from "./types";
import type { Catalog } from "./catalog";
import { TRANSFER_TERM, type TranscriptResult } from "./transcript";
import { normalizeCode } from "./engine/match";

const STORAGE_KEY = "degreeplan.v1"; // pre-scenario storage; read once to migrate (see workspace.ts)
const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;

export const uid = () => Math.random().toString(36).slice(2, 10);

// CMNS per-term credit limits (more needs approval).
export function creditCap(term: string): number {
  if (term.startsWith("Winter")) return 4;
  if (term.startsWith("Summer")) return 16;
  return 17;
}

// Sort key; Winter YYYY is the January term before Spring YYYY.
export function termKey(term: string): number {
  if (term === TRANSFER_TERM) return -1;
  const [season, year] = term.split(" ");
  return Number(year) * 10 + SEASONS.indexOf(season as (typeof SEASONS)[number]);
}

// Academic year label: Fall Y .. Summer Y+1
export function academicYear(term: string): number {
  const [season, year] = term.split(" ");
  return season === "Fall" ? Number(year) : Number(year) - 1;
}

export function sortSemesters(s: Semester[]): Semester[] {
  return [...s].sort((a, b) => termKey(a.term) - termKey(b.term));
}

export function emptyPlan(startFall = new Date().getFullYear()): Plan {
  const semesters: Semester[] = [{ id: uid(), term: TRANSFER_TERM, courses: [] }];
  for (let y = 0; y < 4; y++) {
    semesters.push({ id: uid(), term: `Fall ${startFall + y}`, courses: [] });
    semesters.push({ id: uid(), term: `Spring ${startFall + y + 1}`, courses: [] });
  }
  return {
    semesters,
    programIds: ["cs-general", "math-applied", "ras-minor"],
    genedExemptions: [],
    waived: [],
  };
}

export function loadPlan(): Plan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Plan;
    return { ...p, genedExemptions: p.genedExemptions ?? [], waived: p.waived ?? [] };
  } catch {
    return null;
  }
}

export function courseFromCatalog(code: string, catalog: Catalog, extra: Partial<PlanCourse> = {}): PlanCourse {
  const norm = normalizeCode(code);
  const c = catalog.get(norm);
  return {
    id: uid(),
    code: norm,
    credits: c?.cr ?? 3,
    geneds: c?.g ?? [],
    notes: "",
    status: "planned",
    title: c?.n,
    ...extra,
  };
}

// Builds a plan from a parsed transcript, keeping any planned (future) courses from `base`.
export function planFromTranscript(t: TranscriptResult, catalog: Catalog, base: Plan): Plan {
  const byTerm = new Map<string, PlanCourse[]>();
  for (const tc of t.courses) {
    const cat = tc.code ? catalog.get(tc.code) : undefined;
    const course: PlanCourse = {
      id: uid(),
      code: tc.code,
      credits: tc.credits,
      // the transcript's GenEd column is authoritative for transfer/AP; otherwise use it if present
      geneds: tc.geneds ?? cat?.g ?? [],
      notes: tc.source === "transfer" ? tc.title + (tc.institution ? ` (${tc.institution})` : "") : "",
      status: tc.source === "transfer" ? "transfer" : tc.source,
      grade: tc.grade,
      title: cat?.n ?? tc.title,
      ap: tc.source === "transfer" && /Advanced Placement|International Baccalaureate|\bIB\b|A-Level|CLEP/i.test(tc.institution ?? ""),
    };
    byTerm.set(tc.term, [...(byTerm.get(tc.term) ?? []), course]);
  }

  const terms = [...byTerm.keys()].filter((x) => x !== TRANSFER_TERM).sort((a, b) => termKey(a) - termKey(b));
  const firstFall = terms.length ? academicYear(terms[0]) : new Date().getFullYear();
  const plan = emptyPlan(firstFall);
  const keep = new Map<string, PlanCourse[]>();
  for (const s of base.semesters) {
    const planned = s.courses.filter((c) => c.status === "planned");
    if (planned.length) keep.set(s.term, planned);
  }
  const allTerms = new Set([...plan.semesters.map((s) => s.term), ...byTerm.keys(), ...keep.keys()]);
  const imported = new Set(t.courses.map((c) => c.code).filter(Boolean));
  plan.semesters = sortSemesters(
    [...allTerms].map((term) => ({
      id: uid(),
      term,
      courses: [...(byTerm.get(term) ?? []), ...(keep.get(term) ?? []).filter((c) => !imported.has(c.code))],
    })),
  );

  const programIds = new Set(base.programIds);
  if (t.majors.some((m) => /computer science/i.test(m)) && !base.programIds.some((p) => p.startsWith("cs-"))) programIds.add("cs-general");
  if (t.majors.some((m) => /mathematic/i.test(m)) && !base.programIds.some((p) => p.startsWith("math-"))) programIds.add("math-applied");
  if (t.minors.some((m) => /robotics/i.test(m))) programIds.add("ras-minor");
  plan.programIds = [...programIds];
  plan.genedExemptions = [...new Set(t.exemptions)];
  plan.waived = base.waived;
  return plan;
}

export function addTerm(plan: Plan, term: string): Plan {
  if (plan.semesters.some((s) => s.term === term)) return plan;
  return { ...plan, semesters: sortSemesters([...plan.semesters, { id: uid(), term, courses: [] }]) };
}
