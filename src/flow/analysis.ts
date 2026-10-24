// Course-sequence analysis behind the flowchart: where each course sits in time, whether its
// prerequisites are met by then, when it is usually offered, the earliest term an unplanned course
// could be taken, options for unmet requirements, and solver-backed "what if" comparisons.
import type { AuditResult, Matcher, Plan, PlanCourse, Program, SolverCourse } from "../types";
import type { Catalog } from "../catalog";
import { concurrentCodes, isSatisfied, missingReq, parsePrereq, reqCodes, type Req } from "../prereqs";
import { TRANSFER_TERM } from "../transcript";
import { sortSemesters } from "../plan";
import { solve, shortName, type Highs } from "../engine/solver";
import { SHARING_RULES } from "../programs";

export type Season = "Fall" | "Spring" | "Summer" | "Winter";
const SEASON_OF_MM: Record<number, Season> = { 1: "Spring", 5: "Summer", 8: "Fall", 12: "Winter" };
const seasonOf = (term: string) => term.split(" ")[0] as Season;

// ---------------------------------------------------------------------------
// Catalog helpers (cached per catalog instance)

const prereqCache = new WeakMap<Catalog, Map<string, Req | null>>();
export function catalogEntry(code: string, catalog: Catalog) {
  return catalog.get(code) ?? (code.endsWith("H") ? catalog.get(code.slice(0, -1)) : undefined);
}
export function prereqOf(code: string, catalog: Catalog): Req | null {
  let m = prereqCache.get(catalog);
  if (!m) prereqCache.set(catalog, (m = new Map()));
  if (!m.has(code)) m.set(code, parsePrereq(catalogEntry(code, catalog)?.p));
  return m.get(code)!;
}

// code -> courses whose prerequisites mention it
const unlockCache = new WeakMap<Catalog, Map<string, string[]>>();
export function unlocksOf(code: string, catalog: Catalog): string[] {
  let m = unlockCache.get(catalog);
  if (!m) {
    m = new Map();
    for (const c of catalog.keys())
      for (const p of reqCodes(prereqOf(c, catalog))) m.set(p, [...(m.get(p) ?? []), c]);
    unlockCache.set(catalog, m);
  }
  const base = code.endsWith("H") ? code.slice(0, -1) : code;
  return [...new Set([...(m.get(code) ?? []), ...(base !== code ? m.get(base) ?? [] : [])])];
}

// Offering history: how many Falls/Springs/... in the data window the course was on the schedule.
const windowCache = new WeakMap<Catalog, Record<Season, number>>();
function offeringWindow(catalog: Catalog): Record<Season, number> {
  let w = windowCache.get(catalog);
  if (!w) {
    const terms = new Set<number>();
    for (const c of catalog.values()) c.t?.forEach((t) => terms.add(t));
    w = { Fall: 0, Spring: 0, Summer: 0, Winter: 0 };
    for (const t of terms) w[SEASON_OF_MM[t % 100]]++;
    windowCache.set(catalog, w);
  }
  return w;
}

// Still on the books: appeared on a recent schedule. Without offering data, assume yes.
export function isCurrent(code: string, catalog: Catalog): boolean {
  const w = offeringWindow(catalog);
  return !(w.Fall + w.Spring) || !!catalogEntry(code, catalog)?.t?.length;
}

export type OfferedLevel = "yes" | "sometimes" | "no" | "unknown";
export interface Offering {
  known: boolean;
  seasons: Record<Season, { hit: number; of: number; level: OfferedLevel }>;
}
export function offeringOf(code: string, catalog: Catalog): Offering {
  const win = offeringWindow(catalog);
  const t = catalogEntry(code, catalog)?.t;
  const known = !!t?.length;
  const seasons = {} as Offering["seasons"];
  for (const s of ["Fall", "Spring", "Summer", "Winter"] as Season[]) {
    const hit = t?.filter((x) => SEASON_OF_MM[x % 100] === s).length ?? 0;
    const of = win[s];
    const level: OfferedLevel = !known || !of ? "unknown" : hit === 0 ? "no" : hit / of >= 0.5 ? "yes" : "sometimes";
    seasons[s] = { hit, of, level };
  }
  return { known, seasons };
}
export const offeredIn = (code: string, term: string, catalog: Catalog): OfferedLevel =>
  term === TRANSFER_TERM ? "unknown" : offeringOf(code, catalog).seasons[seasonOf(term)].level;

// ---------------------------------------------------------------------------
// Timeline

export interface Slot {
  term: string;
  idx: number;
  virtual: boolean; // past the end of the plan (only used for projecting options)
}

export interface Placed {
  course: PlanCourse;
  idx: number;
  term: string;
}

export interface Timeline {
  slots: Slot[];
  placed: Placed[];
  firstOpen: number; // first slot you can still register for
  lastReal: number;
  exempt: Set<string>; // satisfied without credit (waived single-course requirements)
  idxOf: (code: string) => number | undefined; // earliest slot a code is placed in
  hasBefore: (code: string, idx: number) => boolean;
}

const variants = (code: string) => (code.endsWith("H") ? [code, code.slice(0, -1)] : [code, `${code}H`]);

function nextTerm(term: string): string {
  const [s, y] = term.split(" ");
  return s === "Fall" ? `Spring ${Number(y) + 1}` : `Fall ${y}`;
}

export function buildTimeline(plan: Plan, programs: Program[], catalog: Catalog, extra = 4): Timeline {
  const sems = sortSemesters(plan.semesters);
  const slots: Slot[] = sems.map((s, idx) => ({ term: s.term, idx, virtual: false }));
  if (!slots.length || slots[0].term !== TRANSFER_TERM) slots.unshift({ term: TRANSFER_TERM, idx: 0, virtual: false });
  slots.forEach((s, i) => (s.idx = i));
  const lastReal = slots.length - 1;
  let t = slots[lastReal].term === TRANSFER_TERM ? `Fall ${new Date().getFullYear()}` : nextTerm(slots[lastReal].term);
  for (let i = 0; i < extra; i++, t = nextTerm(t)) slots.push({ term: t, idx: slots.length, virtual: true });

  const idxOfTerm = new Map(slots.map((s) => [s.term, s.idx]));
  const placed: Placed[] = sems.flatMap((s) => s.courses.filter((c) => c.code).map((course) => ({ course, idx: idxOfTerm.get(s.term)!, term: s.term })));
  let firstOpen = 1;
  for (const p of placed) if (p.course.status !== "planned") firstOpen = Math.max(firstOpen, p.idx + 1);

  const first = new Map<string, number>();
  for (const p of placed) for (const v of variants(p.course.code)) first.set(v, Math.min(first.get(v) ?? Infinity, p.idx));

  // Waived single-course requirements (e.g. CMSC132 by exemption exam) satisfy prerequisites.
  const exempt = new Set<string>();
  for (const key of plan.waived) {
    const [pid, bid] = key.split("/");
    const b = programs.find((p) => p.id === pid)?.buckets.find((x) => x.id === bid);
    if (!b || b.courses !== 1 || b.credits) continue;
    const hits = [...catalog.keys()].filter((c) => b.match(c, { term: "", transfer: false, ap: false }));
    if (hits.length && hits.length <= 4) hits.forEach((h) => exempt.add(h));
  }

  return {
    slots,
    placed,
    firstOpen,
    lastReal,
    exempt,
    idxOf: (code) => first.get(code),
    hasBefore: (code, idx) => exempt.has(code) || (first.get(code) ?? Infinity) < idx || (idx === 0 && first.get(code) === 0),
  };
}

// Prerequisite status of a course placed (or hypothetically placed) at slot idx.
// "Completed or concurrently enrolled" prerequisites may be in the same term.
export function prereqAt(code: string, idx: number, tl: Timeline, catalog: Catalog) {
  const req = prereqOf(code, catalog);
  const conc = concurrentCodes(catalogEntry(code, catalog)?.p);
  const have = (c: string) => tl.hasBefore(c, idx) || (conc.includes(c) && tl.hasBefore(c, idx + 1));
  return { req, ok: isSatisfied(req, have), missing: missingReq(req, have) };
}

// ---------------------------------------------------------------------------
// Earliest possible term for a course that isn't in the plan (following prerequisite chains,
// including courses that would themselves have to be added).

export interface Projection {
  idx: number; // Infinity if not reachable within the timeline
  chain: string[]; // unplaced prerequisite courses that would also be needed (deepest first)
}

export function projector(tl: Timeline, catalog: Catalog) {
  const memo = new Map<string, Projection>();
  const visiting = new Set<string>();

  // slot after which `code` is available, plus courses that must be added for it
  const ready = (code: string): Projection => {
    if (tl.exempt.has(code)) return { idx: 0, chain: [] };
    const at = tl.idxOf(code);
    if (at !== undefined) return { idx: at === 0 ? 0 : at + 1, chain: [] };
    const p = project(code);
    return { idx: p.idx + 1, chain: [...p.chain, code] };
  };

  const readyReq = (req: Req): Projection => {
    if (req.kind === "course") return ready(req.code);
    const parts = req.of.map(readyReq);
    if (req.kind === "all")
      return { idx: Math.max(0, ...parts.map((p) => p.idx)), chain: [...new Set(parts.flatMap((p) => p.chain))] };
    const best = [...parts].sort((a, b) => a.idx - b.idx || a.chain.length - b.chain.length).slice(0, req.k ?? 1);
    return { idx: Math.max(0, ...best.map((p) => p.idx)), chain: [...new Set(best.flatMap((p) => p.chain))] };
  };

  function project(code: string): Projection {
    const hit = memo.get(code);
    if (hit) return hit;
    if (visiting.has(code) || visiting.size > 8) return { idx: Infinity, chain: [] };
    visiting.add(code);
    const req = prereqOf(code, catalog);
    const pre = req ? readyReq(req) : { idx: 0, chain: [] };
    let idx = Infinity;
    for (let i = Math.max(tl.firstOpen, pre.idx); i < tl.slots.length; i++) {
      const lvl = offeredIn(code, tl.slots[i].term, catalog);
      const season = seasonOf(tl.slots[i].term);
      const main = season === "Fall" || season === "Spring";
      if (main ? lvl !== "no" : lvl === "yes" || lvl === "sometimes") {
        idx = i;
        break;
      }
    }
    visiting.delete(code);
    const r = { idx, chain: idx === Infinity ? [] : pre.chain };
    memo.set(code, r);
    return r;
  }

  return project;
}

// ---------------------------------------------------------------------------
// Unmet requirements and options for them

export interface Need {
  key: string; // "programId/bucketOrConstraintId"
  programId: string;
  program: string;
  label: string;
  detail: string;
  match?: Matcher; // courses that could help
  gened?: string[];
}

export function unmetNeeds(audit: AuditResult): Need[] {
  const out: Need[] = [];
  for (const pr of audit.programs) {
    const p = pr.program;
    const base = { programId: p.id, program: shortName(p) };
    for (const b of pr.buckets) {
      if (b.satisfied) continue;
      const need = [
        b.bucket.courses && b.courseCount < b.bucket.courses ? `${b.bucket.courses - b.courseCount} more course${b.bucket.courses - b.courseCount > 1 ? "s" : ""}` : "",
        b.bucket.credits && b.creditCount < b.bucket.credits ? `${b.bucket.credits - b.creditCount} more credits` : "",
      ].filter(Boolean);
      out.push({
        ...base,
        key: `${p.id}/${b.bucket.id}`,
        label: b.bucket.label,
        detail: need.join(", "),
        match: p.kind === "university" ? undefined : b.bucket.gened ? undefined : b.bucket.match,
        gened: b.bucket.gened,
      });
    }
    for (const c of pr.constraints) {
      if (c.satisfied) continue;
      const con = p.constraints?.find((x) => x.id === c.id);
      let match: Matcher | undefined;
      if (con?.kind === "minFrom") match = con.match;
      else if (con?.kind === "distinct") match = (code, ctx) => con.groups.some((g) => g.match(code, ctx));
      else if (con?.kind === "anySet") match = (code, ctx) => con.options.some((o) => o.slots.some((s) => s.match(code, ctx)));
      out.push({ ...base, key: `${p.id}/${c.id}`, label: c.label, detail: c.detail, match });
    }
  }
  for (const s of audit.sharing)
    if (!s.satisfied) out.push({ key: `sharing/${s.id}`, programId: "sharing", program: "Double counting", label: s.label, detail: s.detail });
  return out;
}

export interface Option {
  code: string;
  title: string;
  credits: number;
  idx: number; // earliest slot
  chain: string[];
  needs: string[]; // need keys it matches
}

// Courses that could fill `need`, soonest-available first. Skips courses not offered since the
// start of the offering data and courses already in the plan.
export function optionsFor(need: Need, needs: Need[], tl: Timeline, catalog: Catalog, project: (c: string) => Projection, limit = 6): Option[] {
  if (!need.match) return [];
  const inPlan = (c: string) => tl.idxOf(c) !== undefined;
  const out: Option[] = [];
  for (const c of catalog.values()) {
    if (!isCurrent(c.c, catalog) || inPlan(c.c) || c.cr === 0) continue;
    const ctx = { term: "", transfer: false, ap: false };
    if (!need.match(c.c, ctx)) continue;
    const pj = project(c.c);
    if (pj.idx === Infinity) continue;
    const term = tl.slots[pj.idx].term;
    if (!need.match(c.c, { ...ctx, term })) continue;
    out.push({
      code: c.c,
      title: c.n,
      credits: c.cr,
      idx: pj.idx,
      chain: pj.chain,
      needs: needs.filter((n) => n.match?.(c.c, { ...ctx, term })).map((n) => n.key),
    });
  }
  const grad = (code: string) => (Number(code.slice(4, 7)) >= 500 ? 1 : 0);
  // Prefer: undergraduate courses, fewer extra prerequisite courses, sooner, fills more requirements, offered regularly.
  const regular = (code: string) => {
    const o = offeringOf(code, catalog).seasons;
    return o.Fall.level === "yes" || o.Spring.level === "yes" ? 0 : 1;
  };
  return out
    .sort(
      (a, b) =>
        grad(a.code) - grad(b.code) ||
        a.chain.length - b.chain.length ||
        a.idx - b.idx ||
        b.needs.length - a.needs.length ||
        regular(a.code) - regular(b.code) ||
        a.code.localeCompare(b.code),
    )
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Solver-backed what-if

export type Change =
  | { kind: "add"; code: string; term: string }
  | { kind: "replace"; id: string; code: string; term: string }
  | { kind: "remove"; id: string }
  | { kind: "move"; id: string; term: string };

export const WHATIF_ID = "__whatif__";

export function applyChange(plan: Plan, ch: Change, catalog: Catalog, newId = WHATIF_ID): Plan {
  if (ch.kind === "replace")
    return applyChange(applyChange(plan, { kind: "remove", id: ch.id }, catalog), { kind: "add", code: ch.code, term: ch.term }, catalog, newId);
  if (ch.kind === "add") {
    const cat = catalogEntry(ch.code, catalog);
    const course: PlanCourse = { id: newId, code: ch.code, credits: cat?.cr ?? 3, geneds: cat?.g ?? [], notes: "", status: "planned", title: cat?.n };
    const has = plan.semesters.some((s) => s.term === ch.term);
    const semesters = has
      ? plan.semesters.map((s) => (s.term === ch.term ? { ...s, courses: [...s.courses, course] } : s))
      : sortSemesters([...plan.semesters, { id: `new-${ch.term}`, term: ch.term, courses: [course] }]);
    return { ...plan, semesters };
  }
  const course = plan.semesters.flatMap((s) => s.courses).find((c) => c.id === ch.id);
  let semesters = plan.semesters.map((s) => ({ ...s, courses: s.courses.filter((c) => c.id !== ch.id) }));
  if (ch.kind === "move" && course) {
    if (!semesters.some((s) => s.term === ch.term)) semesters = sortSemesters([...semesters, { id: `new-${ch.term}`, term: ch.term, courses: [] }]);
    semesters = semesters.map((s) => (s.term === ch.term ? { ...s, courses: [...s.courses, course] } : s));
  }
  return { ...plan, semesters };
}

export function solverCourses(plan: Plan): SolverCourse[] {
  return plan.semesters.flatMap((s) => s.courses.filter((c) => c.code || c.geneds.length).map((c) => ({ ...c, term: s.term })));
}

export function auditPlan(highs: Highs, plan: Plan, programs: Program[]): AuditResult {
  return solve(highs, solverCourses(plan), programs, SHARING_RULES, { genedExemptions: plan.genedExemptions, waived: plan.waived });
}

export interface Delta {
  before: number;
  after: number;
  fixed: Need[];
  broken: Need[];
  counts: string[]; // where the changed course would count
  brokenPrereqs: string[]; // planned courses whose prerequisites stop being met
  blocked: string[]; // unmet requirements the added course matches but couldn't be used for
  error?: string;
}

export function compareAudits(before: AuditResult, after: AuditResult, courseId?: string): Omit<Delta, "brokenPrereqs" | "blocked"> {
  const b = unmetNeeds(before);
  const a = unmetNeeds(after);
  const bk = new Set(b.map((n) => n.key));
  const ak = new Set(a.map((n) => n.key));
  return {
    before: b.length,
    after: a.length,
    fixed: b.filter((n) => !ak.has(n.key)),
    broken: a.filter((n) => !bk.has(n.key)),
    counts: courseId ? after.usage[courseId] ?? [] : [],
    error: after.error,
  };
}

export function prereqProblems(plan: Plan, programs: Program[], catalog: Catalog): { course: PlanCourse; term: string; missing: Req }[] {
  const tl = buildTimeline(plan, programs, catalog, 0);
  const out: { course: PlanCourse; term: string; missing: Req }[] = [];
  for (const p of tl.placed) {
    if (p.course.status !== "planned") continue;
    const st = prereqAt(p.course.code, p.idx, tl, catalog);
    if (!st.ok && st.missing) out.push({ course: p.course, term: p.term, missing: st.missing });
  }
  return out;
}

export function whatIf(highs: Highs, plan: Plan, programs: Program[], catalog: Catalog, base: AuditResult, ch: Change): Delta {
  const next = applyChange(plan, ch, catalog);
  const after = auditPlan(highs, next, programs);
  const id = ch.kind === "add" || ch.kind === "replace" ? WHATIF_ID : ch.kind === "move" ? ch.id : undefined;
  const beforeBad = new Set(prereqProblems(plan, programs, catalog).map((p) => p.course.id));
  const brokenPrereqs = prereqProblems(next, programs, catalog)
    .filter((p) => !beforeBad.has(p.course.id) && p.course.id !== id)
    .map((p) => `${p.course.code} (${p.term})`);
  // Requirements the new course fits but the solver couldn't use it for: say why when we can tell.
  const blocked: string[] = [];
  if (ch.kind === "add" || ch.kind === "replace") {
    const ctx = { term: ch.term, transfer: false, ap: false };
    const atLimit = after.sharing.filter((s) => /^(\d+) \/ max \1\b/.test(s.detail));
    for (const n of unmetNeeds(after)) {
      if (!n.match?.(ch.code, ctx)) continue;
      const lim = atLimit.find((s) => s.id.startsWith(`${n.programId}-`));
      blocked.push(`${n.program}: ${n.label}${lim ? ` (blocked by "${lim.label}", already ${lim.detail.split(" (")[0]})` : ""}`);
    }
  }
  return { ...compareAudits(base, after, id), brokenPrereqs, blocked };
}

// ---------------------------------------------------------------------------
// Suggestions

export interface Suggestion {
  level: "warn" | "info" | "tip";
  text: string;
  codes: string[]; // courses mentioned (clickable)
}

const SEASON_SHORT: Record<Season, string> = { Fall: "Fall", Spring: "Spring", Summer: "Summer", Winter: "Winter" };
export function offeringText(code: string, catalog: Catalog): string {
  const o = offeringOf(code, catalog);
  if (!o.known) return "no offering history";
  const parts = (["Fall", "Spring", "Summer", "Winter"] as Season[])
    .filter((s) => o.seasons[s].hit > 0)
    .map((s) => `${SEASON_SHORT[s]} ${o.seasons[s].hit}/${o.seasons[s].of}`);
  return parts.length ? parts.join(", ") : "not offered recently";
}

export function suggestions(plan: Plan, programs: Program[], catalog: Catalog, audit: AuditResult, fmt: (r: Req) => string): Suggestion[] {
  const tl = buildTimeline(plan, programs, catalog);
  const project = projector(tl, catalog);
  const out: Suggestion[] = [];

  // Prerequisites not met by the time a planned course is scheduled.
  for (const p of prereqProblems(plan, programs, catalog))
    out.push({ level: "warn", text: `${p.course.code} (${p.term}) needs ${fmt(p.missing)} first.`, codes: [p.course.code, ...reqCodes(p.missing)] });

  // Planned in a season it isn't normally offered.
  for (const p of tl.placed) {
    if (p.course.status !== "planned") continue;
    const lvl = offeredIn(p.course.code, p.term, catalog);
    if (lvl === "no")
      out.push({ level: "warn", text: `${p.course.code} hasn't been offered in a ${seasonOf(p.term)} recently (${offeringText(p.course.code, catalog)}).`, codes: [p.course.code] });
    else if (lvl === "sometimes")
      out.push({ level: "info", text: `${p.course.code} is only sometimes offered in ${seasonOf(p.term)} (${offeringText(p.course.code, catalog)}).`, codes: [p.course.code] });
  }

  // Bottlenecks: a planned course that a later planned course depends on, with no room to slip.
  const mainSlots = tl.slots.filter((s) => !s.virtual && /^(Fall|Spring)/.test(s.term)).map((s) => s.idx);
  for (const p of tl.placed) {
    if (p.course.status !== "planned") continue;
    for (const d of tl.placed) {
      if (d.course.status !== "planned" || d.idx <= p.idx) continue;
      const req = prereqOf(d.course.code, catalog);
      if (!req || !reqCodes(req).some((c) => variants(p.course.code).includes(c))) continue;
      const without = (c: string) => !variants(p.course.code).includes(c) && tl.hasBefore(c, d.idx);
      if (isSatisfied(req, without)) continue; // other courses already cover it
      const between = mainSlots.filter((i) => i > p.idx && i < d.idx).length;
      if (between === 0)
        out.push({ level: "info", text: `Keep ${p.course.code} in ${p.term}: ${d.course.code} (${d.term}) depends on it, so it can't slip.`, codes: [p.course.code, d.course.code] });
    }
  }

  // Unmet requirements with no courses planned: say what the soonest options are.
  const needs = unmetNeeds(audit);
  for (const n of needs) {
    if (n.programId === "sharing") {
      out.push({ level: "warn", text: `${n.label}: ${n.detail}.`, codes: [] });
      continue;
    }
    const opts = optionsFor(n, needs, tl, catalog, project, 3);
    if (!opts.length) {
      if (!n.gened) out.push({ level: "tip", text: `${n.program}: ${n.label} — ${n.detail}`, codes: [] });
      continue;
    }
    const late = opts.every((o) => o.idx > tl.lastReal);
    out.push({
      level: late ? "warn" : "tip",
      text:
        `${n.program}: ${n.label}${n.detail ? ` (${n.detail})` : ""}. Soonest: ` +
        opts.map((o) => `${o.code} ${tl.slots[o.idx].term}${o.chain.length ? ` after ${o.chain.join(" → ")}` : ""}`).join("; ") +
        (late ? ". None fit before your last planned term." : ""),
      codes: opts.map((o) => o.code),
    });
  }
  return out;
}

// Remaining-requirement summary per program, for comparing scenarios.
export function remainingByProgram(audit: AuditResult): { id: string; name: string; satisfied: boolean; left: string[] }[] {
  const needs = unmetNeeds(audit);
  return audit.programs.map((p) => ({
    id: p.program.id,
    name: shortName(p.program),
    satisfied: p.satisfied,
    left: needs.filter((n) => n.programId === p.program.id).map((n) => n.label),
  }));
}
