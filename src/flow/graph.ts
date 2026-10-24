// Graph model for the flowchart: which courses to show in which term column, prerequisite edges,
// and a row order that keeps edges from crossing too much.
import type { AuditResult, PlanCourse } from "../types";
import type { Catalog } from "../catalog";
import { concurrentCodes, formatReq, reqCodes, type Req } from "../prereqs";
import { catalogEntry, offeredIn, optionsFor, prereqAt, prereqOf, type projector, type Timeline, type unmetNeeds } from "./analysis";

export const COLW = 172;
export const NODEW = 144;
export const NODEH = 48;
export const GAP = 10;

export interface FNode {
  key: string;
  code: string;
  title: string;
  idx: number;
  kind: "placed" | "ghost" | "exempt";
  course?: PlanCourse;
  credits: number;
  forNeeds: string[]; // requirement labels a ghost option would fill
  chainFor?: string; // ghost prerequisite needed on the way to another course
  chain?: string[]; // ghost: unplanned prerequisites it would need first (deepest first)
  problem?: string;
}

export interface FEdge {
  from: string;
  to: string;
  alt: boolean; // one of several alternatives
  bad: boolean; // prerequisite scheduled at/after the course
}

export const variants = (code: string) => (code.endsWith("H") ? [code, code.slice(0, -1)] : [code, `${code}H`]);

// Which prerequisite arrows to draw into a course at slot `at`. For "one of" groups, only the
// alternative(s) actually used (the most recent ones satisfied in time) get an arrow, so the
// chart doesn't fill with lines from every course that could have counted.
function drawCodes(req: Req | null, at: number, idxOf: (c: string) => number | undefined, inAny = false): { code: string; alt: boolean }[] {
  if (!req) return [];
  if (req.kind === "course") return idxOf(req.code) === undefined ? [] : [{ code: req.code, alt: inAny }];
  if (req.kind === "all") return req.of.flatMap((r) => drawCodes(r, at, idxOf, inAny));
  const alt = inAny || req.of.length > 1;
  const scored = req.of.map((r) => {
    const cs = reqCodes(r);
    const idxs = cs.map(idxOf);
    const ok = idxs.every((i) => i !== undefined && (i < at || i === 0));
    return { r, ok, shown: idxs.some((i) => i !== undefined), latest: Math.max(-1, ...idxs.map((i) => i ?? -1)) };
  });
  const k = req.k ?? 1;
  const pick = [
    ...scored.filter((s) => s.ok).sort((a, b) => b.latest - a.latest),
    ...scored.filter((s) => !s.ok && s.shown).sort((a, b) => a.latest - b.latest),
  ].slice(0, k);
  return pick.flatMap((s) => drawCodes(s.r, at, idxOf, alt));
}

export function buildGraph(o: {
  tl: Timeline;
  catalog: Catalog;
  audit: AuditResult | null;
  needs: ReturnType<typeof unmetNeeds>;
  project: ReturnType<typeof projector>;
  showOptions: boolean;
  showAll: boolean;
  explore: string[];
}) {
  const { tl, catalog, audit, needs, project } = o;
  const nodes: FNode[] = [];
  const byCode = new Map<string, FNode>();
  const add = (n: FNode) => {
    nodes.push(n);
    for (const v of variants(n.code)) if (!byCode.has(v) || byCode.get(v)!.kind === "ghost") byCode.set(v, n);
  };

  // Courses used by a major or minor (plus everything when showAll), then their placed prerequisites.
  const majorUse = new Set<string>();
  for (const pr of audit?.programs ?? [])
    if (pr.program.kind === "major" || pr.program.kind === "minor") pr.buckets.forEach((b) => b.assigned.forEach((id) => majorUse.add(id)));
  const DEPTS = /^(CMSC|MATH|STAT|AMSC|ENME|ENAE|ENEE|ENES|DATA)/;
  const include = new Set(
    tl.placed.filter((p) => o.showAll || majorUse.has(p.course.id) || (DEPTS.test(p.course.code) && p.idx > 0)).map((p) => p.course.id),
  );
  for (let changed = true; changed; ) {
    changed = false;
    for (const p of tl.placed) {
      if (!include.has(p.course.id)) continue;
      for (const c of reqCodes(prereqOf(p.course.code, catalog)))
        for (const q of tl.placed)
          if (!include.has(q.course.id) && variants(c).includes(q.course.code) && q.idx <= p.idx) {
            include.add(q.course.id);
            changed = true;
          }
    }
  }
  for (const p of tl.placed) {
    if (!include.has(p.course.id)) continue;
    let problem: string | undefined;
    if (p.course.status === "planned") {
      const st = prereqAt(p.course.code, p.idx, tl, catalog);
      if (!st.ok && st.missing) problem = `needs ${formatReq(st.missing)} first`;
      else if (offeredIn(p.course.code, p.term, catalog) === "no") problem = `not usually offered in ${p.term.split(" ")[0]}`;
    }
    add({ key: p.course.id, code: p.course.code, title: p.course.title || catalogEntry(p.course.code, catalog)?.n || "", idx: p.idx, kind: "placed", course: p.course, credits: p.course.credits, forNeeds: [], problem });
  }

  // Waived prerequisite courses that something displayed depends on.
  for (const n of [...nodes])
    for (const c of reqCodes(prereqOf(n.code, catalog)))
      if (tl.exempt.has(c) && !byCode.has(c)) add({ key: `exempt:${c}`, code: c, title: "Satisfied by waiver", idx: 0, kind: "exempt", credits: 0, forNeeds: [] });

  // Ghost options and explored courses, with the unplaced prerequisites they'd need.
  const addGhost = (code: string, need?: string, chainFor?: string) => {
    const existing = byCode.get(code);
    if (existing) {
      if (need && existing.kind === "ghost" && !existing.forNeeds.includes(need)) existing.forNeeds.push(need);
      return;
    }
    const pj = project(code);
    if (pj.idx === Infinity) return;
    const cat = catalogEntry(code, catalog);
    add({ key: `ghost:${code}`, code, title: cat?.n ?? "", idx: pj.idx, kind: "ghost", credits: cat?.cr ?? 3, forNeeds: need ? [need] : [], chainFor, chain: pj.chain });
    for (const c of pj.chain) addGhost(c, undefined, code);
  };
  if (o.showOptions)
    for (const n of needs)
      if (n.match && !n.broad && n.programId !== "gened" && n.programId !== "university")
        for (const opt of optionsFor(n, needs, tl, catalog, project, 2)) addGhost(opt.code, `${n.program}: ${n.label}`);
  for (const c of o.explore) addGhost(c);

  // Edges from each prerequisite to the course.
  const edges: FEdge[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    if (n.kind === "exempt") continue;
    const conc = concurrentCodes(catalogEntry(n.code, catalog)?.p);
    for (const { code: c, alt } of drawCodes(prereqOf(n.code, catalog), n.idx, (c) => byCode.get(c)?.idx)) {
      const from = byCode.get(c);
      if (!from || from === n || (from.idx === 0 && n.idx === 0)) continue;
      const k = `${from.key}>${n.key}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const late = from.kind !== "exempt" && (from.idx > n.idx || (from.idx === n.idx && !conc.includes(c)));
      edges.push({ from: from.key, to: n.key, alt, bad: late });
    }
  }

  // Columns: every real term, plus projected terms that hold options.
  const used = new Set(nodes.map((n) => n.idx));
  const cols = tl.slots.filter((s) => !s.virtual || used.has(s.idx) || [...used].some((u) => u > s.idx)).map((s) => s.idx);

  // Order rows inside each column so edges cross less (a few barycenter sweeps).
  const kindRank = { exempt: 0, placed: 1, ghost: 2 };
  const colNodes = new Map<number, FNode[]>();
  for (const n of nodes) colNodes.set(n.idx, [...(colNodes.get(n.idx) ?? []), n]);
  for (const list of colNodes.values()) list.sort((a, b) => kindRank[a.kind] - kindRank[b.kind] || a.code.localeCompare(b.code));
  const row = new Map<string, number>();
  const assignRows = () => colNodes.forEach((list) => list.forEach((n, i) => row.set(n.key, i)));
  assignRows();
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const e of edges) {
    parents.set(e.to, [...(parents.get(e.to) ?? []), e.from]);
    children.set(e.from, [...(children.get(e.from) ?? []), e.to]);
  }
  const bary = (key: string, nbrs: Map<string, string[]>) => {
    const ns = nbrs.get(key);
    return ns?.length ? ns.reduce((s, k) => s + row.get(k)!, 0) / ns.length : row.get(key)!;
  };
  for (let pass = 0; pass < 4; pass++) {
    const nb = pass % 2 === 0 ? parents : children;
    const order = pass % 2 === 0 ? cols : [...cols].reverse();
    for (const c of order) {
      const list = colNodes.get(c);
      if (!list) continue;
      const score = new Map(list.map((n) => [n.key, bary(n.key, nb)]));
      list.sort((a, b) => score.get(a.key)! - score.get(b.key)!);
      list.forEach((n, i) => row.set(n.key, i));
    }
  }
  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) pos.set(n.key, { x: cols.indexOf(n.idx) * COLW + 16, y: 12 + row.get(n.key)! * (NODEH + GAP) });
  const maxRows = Math.max(1, ...[...colNodes.values()].map((l) => l.length));
  return { nodes, edges, cols, pos, maxRows };
}

// All prerequisites (transitively) and everything that builds on the node.
export function relatives(key: string, edges: FEdge[]): Set<string> {
  const out = new Set([key]);
  const walk = (k: string, dir: "up" | "down") => {
    for (const e of edges) {
      const [a, b] = dir === "up" ? [e.to, e.from] : [e.from, e.to];
      if (a === k && !out.has(b)) {
        out.add(b);
        walk(b, dir);
      }
    }
  };
  walk(key, "up");
  walk(key, "down");
  return out;
}

