// Several alternative plans ("scenarios") kept side by side. Stored under a new key so the
// single-plan v1 entry is left untouched (it doubles as a backup of pre-scenario data).
import type { Plan } from "./types";
import { emptyPlan, loadPlan, uid } from "./plan";

const STORAGE_KEY = "degreeplan.v2";

export interface Scenario {
  id: string;
  name: string;
  plan: Plan;
}

export interface Workspace {
  active: string;
  scenarios: Scenario[];
}

export const normalizePlan = (p: Plan): Plan => ({ ...p, genedExemptions: p.genedExemptions ?? [], waived: p.waived ?? [] });

export function newWorkspace(plan: Plan): Workspace {
  const s = { id: uid(), name: "Plan A", plan };
  return { active: s.id, scenarios: [s] };
}

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const w = JSON.parse(raw) as Workspace;
      if (w.scenarios?.length) {
        const scenarios = w.scenarios.map((s) => ({ ...s, plan: normalizePlan(s.plan) }));
        return { active: scenarios.some((s) => s.id === w.active) ? w.active : scenarios[0].id, scenarios };
      }
    }
  } catch {
    /* fall through */
  }
  return newWorkspace(loadPlan() ?? emptyPlan(new Date().getFullYear()));
}

export function saveWorkspace(w: Workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {
    /* storage unavailable */
  }
}

// Accepts either an exported workspace or a single plan (older exports).
export function parseImport(text: string): { workspace?: Workspace; plan?: Plan } {
  const d = JSON.parse(text);
  if (Array.isArray(d?.scenarios) && d.scenarios.length && d.scenarios.every((s: Scenario) => Array.isArray(s?.plan?.semesters)))
    return { workspace: { active: d.active ?? d.scenarios[0].id, scenarios: d.scenarios.map((s: Scenario) => ({ ...s, plan: normalizePlan(s.plan) })) } };
  if (Array.isArray(d?.semesters)) return { plan: normalizePlan(d) };
  throw new Error("not a plan file");
}

export function nextScenarioName(w: Workspace): string {
  for (let i = 0; ; i++) {
    const name = `Plan ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) + 1 : ""}`;
    if (!w.scenarios.some((s) => s.name === name)) return name;
  }
}
