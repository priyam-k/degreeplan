import { useMemo, useState } from "react";
import type { AuditResult, Plan, PlanCourse, Program } from "../types";
import type { Catalog } from "../catalog";
import { shortName, type Highs } from "../engine/solver";
import { normalizeCode } from "../engine/match";
import { concurrentCodes, formatReq, isSatisfied, reqCodes, type Req } from "../prereqs";
import { TRANSFER_TERM } from "../transcript";
import { creditCap } from "../components/SemesterTable";
import {
  buildTimeline,
  catalogEntry,
  isCurrent,
  offeredIn,
  offeringText,
  optionsFor,
  prereqAt,
  prereqOf,
  projector,
  remainingByProgram,
  suggestions,
  unlocksOf,
  unmetNeeds,
  whatIf,
  type Change,
  type Delta,
  type Timeline,
} from "./analysis";

const COLW = 164;
const NODEW = 136;
const NODEH = 46;
const GAP = 10;
const HEAD = 44;

interface FNode {
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

interface FEdge {
  from: string;
  to: string;
  alt: boolean; // one of several alternatives
  bad: boolean; // prerequisite scheduled at/after the course
}

interface Props {
  plan: Plan;
  programs: Program[];
  catalog: Catalog;
  audit: AuditResult | null;
  highs: Highs | null;
  onChange: (ch: Change) => void;
}

const variants = (code: string) => (code.endsWith("H") ? [code, code.slice(0, -1)] : [code, `${code}H`]);
const shortTerm = (t: string) => (t === TRANSFER_TERM ? "AP / transfer" : t.replace(/(\w+) 20(\d\d)/, (_, s, y) => `${s} '${y}`));

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

export function FlowView({ plan, programs, catalog, audit, highs, onChange }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [explore, setExplore] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [searchErr, setSearchErr] = useState("");

  const tl = useMemo(() => buildTimeline(plan, programs, catalog), [plan, programs, catalog]);
  const project = useMemo(() => projector(tl, catalog), [tl, catalog]);
  const needs = useMemo(() => (audit && !audit.error ? unmetNeeds(audit) : []), [audit]);

  const graph = useMemo(
    () => buildGraph({ tl, catalog, audit, needs, project, showOptions, showAll, explore }),
    [tl, catalog, audit, needs, project, showOptions, showAll, explore],
  );
  const tips = useMemo(
    () => (audit && !audit.error && catalog.size ? suggestions(plan, programs, catalog, audit, formatReq) : []),
    [plan, programs, catalog, audit],
  );

  const sel = graph.nodes.find((n) => n.key === selected) ?? null;
  const related = useMemo(() => (sel ? relatives(sel.key, graph.edges) : null), [sel, graph.edges]);

  const focus = (code: string) => {
    const c = normalizeCode(code);
    setSearchErr("");
    if (!c) return;
    const existing = graph.nodes.find((n) => variants(n.code).includes(c));
    if (existing) return setSelected(existing.key);
    if (!catalogEntry(c, catalog)) return setSearchErr(`${c} isn't in the course catalog`);
    if (project(c).idx === Infinity) return setSearchErr(`${c} can't be fit into your timeline (prerequisite chain too long or not offered)`);
    setExplore((e) => [...e.filter((x) => x !== c), c]);
    setSelected(`ghost:${c}`);
  };

  const pos = graph.pos;
  const width = graph.cols.length * COLW + 20;
  const height = HEAD + graph.maxRows * (NODEH + GAP) + 20;
  const colX = (idx: number) => graph.cols.indexOf(idx) * COLW + 10;

  return (
    <main className="flow-main">
      <section className="flow">
        <div className="flow-toolbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              focus(search);
              setSearch("");
            }}
          >
            <input list="course-codes" placeholder="Explore a course… e.g. CMSC421" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button>Show path</button>
          </form>
          {searchErr && <span className="error small">{searchErr}</span>}
          <label>
            <input type="checkbox" checked={showOptions} onChange={(e) => setShowOptions(e.target.checked)} /> options for unmet requirements
          </label>
          <label>
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> GenEd-only courses
          </label>
          {explore.length > 0 && (
            <button className="link" onClick={() => setExplore([])}>
              clear explored
            </button>
          )}
          <span className="flow-legend">
            <span className="fn-swatch st-completed" /> done <span className="fn-swatch st-inprogress" /> in progress <span className="fn-swatch st-planned" /> planned{" "}
            <span className="fn-swatch ghost" /> option <span className="edge-key solid" /> prereq <span className="edge-key dashed" /> one-of
          </span>
        </div>

        <div className="flow-scroll" onClick={() => setSelected(null)}>
          <div className="flow-canvas" style={{ width, height }}>
            {graph.cols.map((idx) => {
              const s = tl.slots[idx];
              const credits = tl.placed.filter((p) => p.idx === idx).reduce((n, p) => n + p.course.credits, 0);
              const past = idx < tl.firstOpen;
              return (
                <div key={idx} className={`flow-col ${past ? "past" : ""} ${s.virtual ? "virtual" : ""}`} style={{ left: colX(idx), width: COLW - 8, height: height - 10 }}>
                  <div className="flow-col-head">
                    {shortTerm(s.term)}
                    <span className={!past && credits > creditCap(s.term) ? "error" : "muted"}>{s.virtual ? " not in plan" : credits ? ` · ${credits} cr` : ""}</span>
                  </div>
                </div>
              );
            })}
            <svg className="flow-edges" width={width} height={height}>
              <defs>
                {["n", "hi", "bad"].map((k) => (
                  <marker key={k} id={`arr-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" className={`arrow-${k}`} />
                  </marker>
                ))}
              </defs>
              {graph.edges.map((e) => {
                const a = pos.get(e.from);
                const b = pos.get(e.to);
                if (!a || !b) return null;
                const x1 = a.x + NODEW;
                const y1 = a.y + NODEH / 2;
                const x2 = b.x - 2;
                const y2 = b.y + NODEH / 2;
                const dx = Math.max(30, (x2 - x1) / 2);
                const hi = related && related.has(e.from) && related.has(e.to);
                // Arrows out of AP credit or spanning several terms are faded until something is selected.
                const far = !related && (a.x < COLW || b.x - a.x > 2 * COLW);
                const cls = `edge ${e.alt ? "alt" : ""} ${e.bad ? "bad" : ""} ${hi ? "hi" : ""} ${related && !hi ? "dim" : ""} ${far && !e.bad ? "far" : ""}`;
                return (
                  <path
                    key={`${e.from}>${e.to}`}
                    d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
                    className={cls}
                    markerEnd={`url(#arr-${e.bad ? "bad" : hi ? "hi" : "n"})`}
                  />
                );
              })}
            </svg>
            {graph.nodes.map((n) => {
              const p = pos.get(n.key)!;
              const st = n.kind === "placed" ? `st-${n.course!.status}` : n.kind;
              const dim = related && !related.has(n.key);
              return (
                <button
                  key={n.key}
                  className={`fnode ${st} ${n.key === selected ? "sel" : ""} ${dim ? "dim" : ""} ${n.problem ? "problem" : ""}`}
                  style={{ left: p.x, top: p.y, width: NODEW, height: NODEH }}
                  title={`${n.code} ${n.title}${n.problem ? `\n⚠ ${n.problem}` : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(n.key === selected ? null : n.key);
                  }}
                >
                  <span className="fn-code">
                    {n.code}
                    {n.problem && <span className="fn-warn"> ⚠</span>}
                  </span>
                  <span className="fn-sub">{n.kind === "ghost" ? (n.forNeeds[0] ?? (n.chainFor ? `needed for ${n.chainFor}` : n.title)) : n.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="audit flow-side">
        {sel ? (
          <Details
            key={sel.key}
            node={sel}
            tl={tl}
            plan={plan}
            programs={programs}
            catalog={catalog}
            audit={audit}
            highs={highs}
            usage={audit?.usage ?? {}}
            onFocus={focus}
            onChange={(...chs) => {
              chs.forEach((c) => onChange(c));
              const ch = chs[chs.length - 1];
              if (ch.kind === "add" || ch.kind === "replace") setExplore((e) => e.filter((x) => x !== ch.code));
              setSelected(null);
            }}
          />
        ) : (
          <Overview audit={audit} tips={tips} onFocus={focus} />
        )}
      </aside>
    </main>
  );
}

// ---------------------------------------------------------------------------

function buildGraph(o: {
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
      if (n.match && n.programId !== "gened" && n.programId !== "university")
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
  for (const n of nodes) pos.set(n.key, { x: cols.indexOf(n.idx) * COLW + 16, y: HEAD + row.get(n.key)! * (NODEH + GAP) });
  const maxRows = Math.max(1, ...[...colNodes.values()].map((l) => l.length));
  return { nodes, edges, cols, pos, maxRows };
}

// All prerequisites (transitively) and everything that builds on the node.
function relatives(key: string, edges: FEdge[]): Set<string> {
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

// ---------------------------------------------------------------------------

function Overview({ audit, tips, onFocus }: { audit: AuditResult | null; tips: ReturnType<typeof suggestions>; onFocus: (c: string) => void }) {
  if (!audit) return <div>Loading solver…</div>;
  if (audit.error) return <div className="error">Audit failed: {audit.error}</div>;
  return (
    <div className="flow-overview">
      <h3>Where you stand</h3>
      <ul className="remaining">
        {remainingByProgram(audit).map((p) => (
          <li key={p.id} className={p.satisfied ? "ok" : "todo"}>
            <b>
              {p.satisfied ? "✓" : "○"} {p.name}
            </b>
            {!p.satisfied && <span className="muted"> {p.left.length} left: {p.left.join(" · ")}</span>}
          </li>
        ))}
      </ul>
      <h3>Suggestions</h3>
      {tips.length === 0 && <p className="muted">Nothing to flag. Prerequisites, offerings and requirements all line up.</p>}
      <ul className="tips">
        {tips.map((t, i) => (
          <li key={i} className={`tip-${t.level}`}>
            <span className="tip-icon">{t.level === "warn" ? "⚠" : t.level === "info" ? "ⓘ" : "→"}</span>
            <span>
              <Linkify text={t.text} codes={t.codes} onFocus={onFocus} />
            </span>
          </li>
        ))}
      </ul>
      <p className="muted small">Click a course to see what it needs, what it unlocks, and what happens if you add, move or drop it. Dashed boxes are options the planner found for requirements you haven't planned yet.</p>
    </div>
  );
}

function Linkify({ text, codes, onFocus }: { text: string; codes: string[]; onFocus: (c: string) => void }) {
  if (!codes.length) return <>{text}</>;
  const re = new RegExp(`\\b(${[...new Set(codes)].map((c) => c.replace(/[^A-Z0-9]/g, "")).join("|")})\\b`, "g");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <button key={i} className="link code-link" onClick={() => onFocus(p)}>
            {p}
          </button>
        ) : (
          p
        ),
      )}
    </>
  );
}

function Details(props: {
  node: FNode;
  tl: Timeline;
  plan: Plan;
  programs: Program[];
  catalog: Catalog;
  audit: AuditResult | null;
  highs: Highs | null;
  usage: Record<string, string[]>;
  onFocus: (c: string) => void;
  onChange: (...ch: Change[]) => void;
}) {
  const { node, tl, plan, programs, catalog, audit, highs, usage, onFocus, onChange } = props;
  const openSlots = tl.slots.filter((s) => s.idx >= tl.firstOpen && s.term !== TRANSFER_TERM);
  const defaultTerm = tl.slots[Math.max(node.idx, tl.firstOpen)]?.term ?? openSlots[0]?.term;
  const [term, setTerm] = useState(defaultTerm);
  const [swap, setSwap] = useState<string | null>(null);
  const cat = catalogEntry(node.code, catalog);
  const req = prereqOf(node.code, catalog);
  const editable = node.kind === "ghost" || (node.kind === "placed" && node.course!.status === "planned");
  const termIdx = tl.slots.find((s) => s.term === term)?.idx ?? node.idx;

  // Other courses that would fill the same major/minor requirements as this planned course.
  const swapOptions = useMemo(() => {
    if (node.kind !== "placed" || !editable || !audit || audit.error) return [];
    const uses = audit.programs
      .filter((p) => p.program.kind === "major" || p.program.kind === "minor")
      .flatMap((p) => p.buckets.filter((b) => b.assigned.includes(node.course!.id)).map((b) => ({ label: `${shortName(p.program)}: ${b.bucket.label}`, match: b.bucket.match })));
    if (!uses.length) return [];
    const project = projector(tl, catalog);
    const out: { code: string; title: string; idx: number; chain: string[]; fills: string[] }[] = [];
    for (const c of catalog.values()) {
      if (!isCurrent(c.c, catalog) || !c.cr || tl.idxOf(c.c) !== undefined) continue;
      const ctx = { term: "", transfer: false, ap: false };
      if (!uses.some((u) => u.match(c.c, ctx))) continue;
      const pj = project(c.c);
      if (pj.idx === Infinity) continue;
      const fills = uses.filter((u) => u.match(c.c, { ...ctx, term: tl.slots[pj.idx].term })).map((u) => u.label);
      if (fills.length) out.push({ code: c.c, title: c.n, idx: pj.idx, chain: pj.chain, fills });
    }
    return out.sort((a, b) => a.chain.length - b.chain.length || b.fills.length - a.fills.length || a.idx - b.idx || a.code.localeCompare(b.code)).slice(0, 10);
  }, [node, editable, audit, tl, catalog]);

  // What-if for the chosen action
  const change: Change | null = swap
    ? { kind: "replace", id: node.course!.id, code: swap, term }
    : node.kind === "ghost"
      ? { kind: "add", code: node.code, term }
      : node.kind === "placed" && editable && term !== tl.slots[node.idx].term
        ? { kind: "move", id: node.course!.id, term }
        : null;
  const delta = useMemo(() => (highs && audit && change ? whatIf(highs, plan, programs, catalog, audit, change) : null), [highs, audit, plan, programs, catalog, JSON.stringify(change)]);
  const dropDelta = useMemo(
    () => (highs && audit && node.kind === "placed" && editable ? whatIf(highs, plan, programs, catalog, audit, { kind: "remove", id: node.course!.id }) : null),
    [highs, audit, plan, programs, catalog, node, editable],
  );

  const target = swap ?? node.code;
  const at = prereqAt(target, node.kind === "placed" && !change ? node.idx : termIdx, tl, catalog);
  const offerLvl = offeredIn(target, term ?? "", catalog);

  // Courses this one leads to: ones in the plan first, then ones relevant to remaining requirements.
  const needs = audit && !audit.error ? unmetNeeds(audit) : [];
  const relevant = (c: string) =>
    needs.some((n) => n.match?.(c, { term: "", transfer: false, ap: false })) ||
    programs.some((p) => (p.kind === "major" || p.kind === "minor") && p.buckets.some((b) => !b.discipline && b.match(c, { term: "", transfer: false, ap: false })));
  const unlocks = unlocksOf(node.code, catalog)
    .filter((c) => isCurrent(c, catalog) || tl.idxOf(c) !== undefined)
    .map((c) => {
      const placedIdx = tl.idxOf(c);
      const r = prereqOf(c, catalog);
      const after = node.kind === "placed" ? node.idx + 1 : termIdx + 1;
      const have = (x: string) => variants(node.code).includes(x) || tl.hasBefore(x, Math.max(after, placedIdx ?? 0));
      return { c, placedIdx, ready: isSatisfied(r, have), rel: placedIdx !== undefined ? 2 : relevant(c) ? 1 : 0, req: r };
    })
    .filter((u) => u.rel > 0)
    .sort((a, b) => b.rel - a.rel || Number(b.ready) - Number(a.ready) || a.c.localeCompare(b.c));

  return (
    <div className="flow-details">
      <h3>
        {node.code} <span className="muted">{cat?.n ?? node.title}</span>
      </h3>
      <div className="facts">
        {node.kind === "placed" && (
          <div>
            {node.course!.status === "planned" ? "Planned" : node.course!.status === "inprogress" ? "In progress" : node.course!.status === "transfer" ? "Transfer / AP" : "Completed"} ·{" "}
            {tl.slots[node.idx].term} · {node.credits} cr
          </div>
        )}
        {node.kind === "exempt" && <div>Not on your transcript; treated as satisfied because you waived it.</div>}
        {node.kind === "ghost" && (
          <div>
            Not in your plan. Earliest: <b>{tl.slots[node.idx].term}</b>
            {node.chain?.length ? <span>, after {node.chain.join(" → ")}</span> : null}
            {node.forNeeds.length > 0 && <div>Could fill: {node.forNeeds.join("; ")}</div>}
          </div>
        )}
        <div>
          <span className="muted">Offered:</span> {offeringText(node.code, catalog)}
        </div>
        <div>
          <span className="muted">Prerequisites:</span> {req ? <Linkify text={formatReq(req)} codes={reqCodes(req)} onFocus={onFocus} /> : "none"}
          {req && node.kind !== "exempt" && (node.kind === "ghost" || node.course!.status === "planned") && (
            <span className={at.ok ? "ok" : "error"}>{at.ok ? " ✓ met" : ` ✗ still needs ${formatReq(at.missing)}`}</span>
          )}
        </div>
        {cat?.p && formatReq(req) !== cat.p && <div className="muted small">Catalog: {cat.p}</div>}
        {node.kind === "placed" && (usage[node.course!.id]?.length ?? 0) > 0 && (
          <div>
            <span className="muted">Counts toward:</span> {usage[node.course!.id].join(" · ")}
          </div>
        )}
      </div>

      {editable && (
        <div className="whatif">
          <h4>
            {swap ? (
              <>
                What if I take {swap} instead?{" "}
                <button className="link" onClick={() => setSwap(null)}>
                  cancel
                </button>
              </>
            ) : node.kind === "ghost" ? (
              "What if I take it?"
            ) : (
              "What if I move it?"
            )}
          </h4>
          <label>
            {node.kind === "ghost" ? "Add to " : swap ? `Take ${swap} in ` : "Move to "}
            <select value={term} onChange={(e) => setTerm(e.target.value)}>
              {openSlots.map((s) => (
                <option key={s.term} value={s.term}>
                  {s.term}
                  {s.virtual ? " (new term)" : ""}
                  {s.idx === node.idx && node.kind === "placed" ? " (current)" : ""}
                </option>
              ))}
            </select>
          </label>
          {change && (
            <>
              {!at.ok && <div className="error small">⚠ Prerequisites not met by then: needs {formatReq(at.missing)}</div>}
              {offerLvl === "no" && <div className="error small">⚠ Not offered in {term?.split(" ")[0]} recently.</div>}
              {offerLvl === "sometimes" && <div className="warn-text">Only sometimes offered in {term?.split(" ")[0]}.</div>}
              <DeltaView d={delta} />
              <button className="primary" onClick={() => onChange(change)}>
                {swap ? `Swap ${node.code} → ${swap}` : node.kind === "ghost" ? `Add to ${term}` : `Move to ${term}`}
              </button>
              {node.kind === "ghost" && !swap && !!node.chain?.length && (
                <button
                  className="chain-add"
                  title="Adds each prerequisite at its earliest term, then this course"
                  onClick={() => {
                    const project = projector(tl, catalog);
                    const steps = node.chain!.map((c): Change => ({ kind: "add", code: c, term: tl.slots[project(c).idx].term }));
                    onChange(...steps, { kind: "add", code: node.code, term: tl.slots[Math.max(node.idx, termIdx)].term });
                  }}
                >
                  Add with prerequisites ({node.chain.join(" → ")} → {node.code})
                </button>
              )}
            </>
          )}
          {swapOptions.length > 0 && !swap && (
            <div className="swaps">
              <h4>Could take instead</h4>
              <ul>
                {swapOptions.map((o) => (
                  <li key={o.code}>
                    <button
                      className="link code-link"
                      onClick={() => {
                        setSwap(o.code);
                        setTerm(tl.slots[Math.max(o.idx, node.idx)]?.term ?? term);
                      }}
                      title="See what changes if you swap"
                    >
                      {o.code}
                    </button>{" "}
                    <span className="muted">{o.title}</span>{" "}
                    <span className="small">
                      · {o.idx > node.idx ? `not before ${tl.slots[o.idx].term}` : `fits ${tl.slots[node.idx].term}`}
                      {o.chain.length ? ` · needs ${o.chain.join(", ")} first` : ""}
                    </span>
                    <div className="small muted">{o.fills.join(" · ")}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {node.kind === "placed" && dropDelta && !swap && (
            <div className="drop">
              <h4>If you drop it</h4>
              <DeltaView d={dropDelta} />
              <button onClick={() => onChange({ kind: "remove", id: node.course!.id })}>Remove from plan</button>
            </div>
          )}
        </div>
      )}

      {unlocks.length > 0 && (
        <div className="unlocks">
          <h4>Leads to</h4>
          <ul>
            {unlocks.slice(0, 14).map((u) => (
              <li key={u.c}>
                <button className="link code-link" onClick={() => onFocus(u.c)}>
                  {u.c}
                </button>{" "}
                <span className="muted">{catalogEntry(u.c, catalog)?.n}</span>{" "}
                {u.placedIdx !== undefined ? (
                  <span className="chip chip-gened">{tl.slots[u.placedIdx].term}</span>
                ) : u.ready ? (
                  <span className="ok small">opens up</span>
                ) : (
                  <span className="muted small">also needs more</span>
                )}
              </li>
            ))}
          </ul>
          {unlocks.length > 14 && <div className="muted small">+ {unlocks.length - 14} more</div>}
        </div>
      )}
    </div>
  );
}

function DeltaView({ d }: { d: Delta | null }) {
  if (!d) return <div className="muted small">Computing…</div>;
  if (d.error) return <div className="error small">Solver error: {d.error}</div>;
  const diff = d.after - d.before;
  return (
    <div className="delta">
      <div>
        Unmet requirements: {d.before} → <b className={diff < 0 ? "ok" : diff > 0 ? "error" : ""}>{d.after}</b>
      </div>
      {d.counts.length > 0 && <div className="small">Would count toward: {d.counts.join(" · ")}</div>}
      {d.fixed.map((n) => (
        <div key={n.key} className="ok small">
          ✓ {n.program}: {n.label}
        </div>
      ))}
      {d.broken.map((n) => (
        <div key={n.key} className="error small">
          ✗ {n.program}: {n.label}
          {n.detail ? ` (${n.detail})` : ""}
        </div>
      ))}
      {d.brokenPrereqs.length > 0 && <div className="error small">✗ Breaks prerequisites for {d.brokenPrereqs.join(", ")}</div>}
      {d.blocked.map((b) => (
        <div key={b} className="warn-text">
          ⊘ Fits but can't count: {b}
        </div>
      ))}
      {d.counts.length === 0 && d.fixed.length === 0 && d.broken.length === 0 && d.brokenPrereqs.length === 0 && (
        <div className="muted small">No change to your requirements.</div>
      )}
    </div>
  );
}
