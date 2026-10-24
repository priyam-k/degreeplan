// Program-centric view: pick a major, minor, GenEd or university requirements and see each
// requirement as slots filled by your courses (colored by status), what's still open, the
// soonest courses that would fill it, and the rules that span requirements.
import { useMemo, useState } from "react";
import type { AuditResult, BucketResult, Plan, PlanCourse, Program, ProgramResult, ConstraintResult } from "../types";
import type { Catalog } from "../catalog";
import type { SetPlan } from "../App";
import { MAJORS, programById } from "../programs";
import { shortName } from "../engine/solver";
import { termKey, uid } from "../plan";
import {
  applyChange,
  buildTimeline,
  checkPlacement,
  optionsFor,
  projector,
  unmetNeeds,
  type Change,
  type Need,
  type Option,
  type Timeline,
} from "../flow/analysis";
import { shortTerm } from "../flow/FlowView";
import { CourseSearch } from "../ui/CourseSearch";
import { Popover } from "../ui/Popover";
import { Icon } from "../ui/icons";
import { CourseInfo } from "./CourseInfo";
import { STATUS_LABEL } from "./SemesterTable";

interface Props {
  plan: Plan;
  programs: Program[];
  catalog: Catalog;
  audit: AuditResult | null;
  setPlan: SetPlan;
  onFlow: () => void;
}

const SEL_KEY = "degreeplan.degreeProgram";
type Seg = "done" | "inprogress" | "planned" | "open";
const segOf = (c?: PlanCourse): Seg =>
  !c ? "open" : c.status === "completed" || c.status === "transfer" ? "done" : c.status === "inprogress" ? "inprogress" : "planned";

// Progress of one requirement in "units" (courses, or 3-credit chunks for credit requirements).
function bucketUnits(b: BucketResult, courseById: Map<string, PlanCourse>): Record<Seg, number> {
  const out: Record<Seg, number> = { done: 0, inprogress: 0, planned: 0, open: 0 };
  if (b.waived) {
    out.done = b.bucket.courses ?? Math.ceil((b.bucket.credits ?? 3) / 3);
    return out;
  }
  const byCredits = !!b.bucket.credits && !b.bucket.courses;
  const need = byCredits ? b.bucket.credits! / 3 : b.bucket.courses ?? 0;
  let have = 0;
  for (const id of b.assigned) {
    const c = courseById.get(id);
    const u = byCredits ? (c?.credits ?? 3) / 3 : 1;
    const take = Math.min(u, need - have);
    if (take <= 0) break;
    out[segOf(c)] += take;
    have += take;
  }
  out.open = Math.max(0, need - have);
  return out;
}

export function programUnits(p: ProgramResult, courseById: Map<string, PlanCourse>): Record<Seg, number> {
  const t: Record<Seg, number> = { done: 0, inprogress: 0, planned: 0, open: 0 };
  for (const b of p.buckets) {
    const u = bucketUnits(b, courseById);
    (Object.keys(t) as Seg[]).forEach((k) => (t[k] += u[k]));
  }
  for (const c of p.constraints) if (!c.satisfied) t.open += 1;
  return t;
}

export function DegreeView({ plan, programs, catalog, audit, setPlan, onFlow }: Props) {
  const [selId, setSelId] = useState<string>(() => {
    try {
      return localStorage.getItem(SEL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const select = (id: string) => {
    setSelId(id);
    try {
      localStorage.setItem(SEL_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const courseById = useMemo(() => new Map(plan.semesters.flatMap((s) => s.courses.map((c) => [c.id, c] as const))), [plan.semesters]);
  const termOfCourse = useMemo(() => new Map(plan.semesters.flatMap((s) => s.courses.map((c) => [c.id, s.term] as const))), [plan.semesters]);
  const tl = useMemo(() => buildTimeline(plan, programs, catalog), [plan, programs, catalog]);
  const project = useMemo(() => projector(tl, catalog), [tl, catalog]);
  const needs = useMemo(() => (audit && !audit.error ? unmetNeeds(audit) : []), [audit]);

  if (!audit) return <main className="degree-main muted">Loading the requirement solver…</main>;
  if (audit.error) return <main className="degree-main error">Audit failed: {audit.error}</main>;

  const results = audit.programs;
  const sel = results.find((r) => r.program.id === selId) ?? results[0];
  const addCourse = (code: string, term: string) =>
    setPlan((p) => applyChange(p, { kind: "add", code, term }, catalog, uid()), { toast: `Added ${code} to ${term}` });
  const ctx = { tl, project, needs, catalog, plan, programs, courseById, termOfCourse, addCourse };

  return (
    <main className="degree-main">
      <nav className="program-list">
        {results.map((r) => {
          const u = programUnits(r, courseById);
          const total = u.done + u.inprogress + u.planned + u.open;
          return (
            <button key={r.program.id} className={`program-card ${r.program.id === sel.program.id ? "on" : ""}`} onClick={() => select(r.program.id)}>
              <Ring u={u} />
              <span className="pc-text">
                <span className="pc-name">{shortName(r.program)}</span>
                <span className="pc-sub">{r.program.name.match(/\((.*)\)/)?.[1] ?? (r.program.kind === "minor" ? "Minor" : r.program.kind === "gened" ? "General Education" : "Graduation rules")}</span>
                <span className={`pc-status ${r.satisfied ? "ok" : "todo"}`}>
                  {u.open === 0 ? (r.satisfied ? (u.planned + u.inprogress ? "Complete with your plan" : "Complete") : "Check the rules") : `${Math.round(u.open)} of ${Math.round(total)} still open`}
                </span>
              </span>
            </button>
          );
        })}
        <p className="pl-hint">Change programs from the menu at the top right.</p>
      </nav>
      <ProgramDetail key={sel.program.id} r={sel} audit={audit} setPlan={setPlan} onFlow={onFlow} {...ctx} />
    </main>
  );
}

function Ring({ u, size = 44 }: { u: Record<Seg, number>; size?: number }) {
  const total = u.done + u.inprogress + u.planned + u.open || 1;
  const r = size / 2 - 4;
  const C = 2 * Math.PI * r;
  let off = 0;
  const segs = (["done", "inprogress", "planned"] as Seg[]).map((k) => {
    const len = (u[k] / total) * C;
    const el = <circle key={k} className={`ring-${k}`} r={r} cx={size / 2} cy={size / 2} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />;
    off += len;
    return el;
  });
  const pct = Math.round(((u.done + u.inprogress + u.planned) / total) * 100);
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="ring-bg" r={r} cx={size / 2} cy={size / 2} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>{segs}</g>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
        {pct}%
      </text>
    </svg>
  );
}

interface Ctx {
  tl: Timeline;
  project: ReturnType<typeof projector>;
  needs: Need[];
  catalog: Catalog;
  plan: Plan;
  programs: Program[];
  courseById: Map<string, PlanCourse>;
  termOfCourse: Map<string, string>;
  addCourse: (code: string, term: string) => void;
}

function ProgramDetail({ r, audit, setPlan, onFlow, ...ctx }: Ctx & { r: ProgramResult; audit: AuditResult; setPlan: SetPlan; onFlow: () => void }) {
  const { courseById, termOfCourse } = ctx;
  const p = r.program;
  const u = programUnits(r, courseById);
  const total = u.done + u.inprogress + u.planned + u.open || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const assignedTerms = r.buckets.flatMap((b) => b.assigned.map((id) => termOfCourse.get(id)!)).filter(Boolean);
  const finish = assignedTerms.sort((a, b) => termKey(b) - termKey(a))[0];
  const toggleWaive = (k: string) =>
    setPlan((pl) => ({ ...pl, waived: pl.waived.includes(k) ? pl.waived.filter((x) => x !== k) : [...pl.waived, k] }), {
      toast: `${ctx.plan.waived.includes(k) ? "Un-waived" : "Waived"} a requirement`,
    });
  const tracks = p.family ? MAJORS.filter((m) => m.family === p.family) : [];
  const setTrack = (id: string) =>
    setPlan((pl) => ({ ...pl, programIds: [...pl.programIds.filter((x) => programById(x)?.family !== p.family), id] }), { toast: `Switched to ${programById(id)?.name}` });

  const core = r.buckets.filter((b) => b.bucket.courses === 1 && !b.bucket.credits && !b.bucket.gened);
  const big = r.buckets.filter((b) => !core.includes(b));
  const sharing = audit.sharing.filter((s) => s.id.startsWith(`${p.id}-`));

  return (
    <section className="program-detail">
      <div className="pd-head card">
        <div className="pd-title">
          <h2>{p.name.replace(/\s*\(.*\)/, "")}</h2>
          {tracks.length > 1 && (
            <select value={p.id} onChange={(e) => setTrack(e.target.value)} aria-label="Track">
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name.match(/\((.*)\)/)?.[1] ?? t.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="pd-bar">
          <span className="seg done" style={{ width: pct(u.done) }} />
          <span className="seg inprogress" style={{ width: pct(u.inprogress) }} />
          <span className="seg planned" style={{ width: pct(u.planned) }} />
        </div>
        <div className="pd-stats">
          <span>
            <span className="status-dot st-completed" /> {fmt(u.done)} done
          </span>
          <span>
            <span className="status-dot st-inprogress" /> {fmt(u.inprogress)} in progress
          </span>
          <span>
            <span className="status-dot st-planned" /> {fmt(u.planned)} planned
          </span>
          <span className={u.open ? "todo" : "ok"}>
            <span className="status-dot open" /> {fmt(u.open)} open
          </span>
          <span className="pd-finish">
            {r.satisfied ? (
              <>
                <Icon.check /> {finish && u.planned + u.inprogress ? `Complete by ${finish} with your plan` : "Complete"}
              </>
            ) : (
              <>Not complete with your current plan</>
            )}
          </span>
          <button className="btn sm" onClick={onFlow}>
            Open flowchart
          </button>
        </div>
      </div>

      {core.length > 0 && (
        <div className="card req-card core">
          <h3>Required courses</h3>
          <div className="core-grid">
            {core.map((b) => (
              <CoreRow key={b.bucket.id} b={b} programId={p.id} onWaive={toggleWaive} {...ctx} />
            ))}
          </div>
        </div>
      )}

      <div className="req-grid">
        {big.map((b) => (
          <BucketCard key={b.bucket.id} b={b} programId={p.id} onWaive={toggleWaive} {...ctx} />
        ))}
      </div>

      {(r.constraints.length > 0 || sharing.length > 0) && (
        <div className="card req-card">
          <h3>Rules across requirements</h3>
          <div className="rules">
            {r.constraints.map((c) => (
              <RuleView key={c.id} c={c} r={r} programId={p.id} onWaive={toggleWaive} {...ctx} />
            ))}
            {sharing.map((s) => (
              <div key={s.id} className={`rule-row ${s.satisfied ? "ok" : "bad"}`}>
                <span className="rr-icon">{s.satisfied ? <Icon.check /> : <Icon.x />}</span>
                <span className="rr-label">{s.label}</span>
                <span className="rr-detail">{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(p.notes?.length || p.sources?.length) && (
        <details className="card req-card notes-card">
          <summary>Notes and sources</summary>
          <ul>
            {p.notes?.map((n) => <li key={n}>{n}</li>)}
            {p.sources?.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noreferrer">
                  {s.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function CourseTile({ id, ...ctx }: Ctx & { id: string }) {
  const c = ctx.courseById.get(id);
  if (!c) return null;
  const term = ctx.termOfCourse.get(id) ?? "";
  return (
    <Popover
      button={
        <>
          <span className="ct-code">{c.code || "GenEd credit"}</span>
          <span className="ct-term">{term === "Transfer / AP" ? "AP / transfer" : shortTerm(term)}</span>
        </>
      }
      buttonClassName={`course-tile seg-${segOf(c)}`}
      width={330}
    >
      <CourseInfo code={c.code} catalog={ctx.catalog} title={c.title} credits={c.credits} grade={c.grade}>
        <div className="ci-actions muted small">
          {STATUS_LABEL[c.status]} · {term}
        </div>
      </CourseInfo>
    </Popover>
  );
}

function OpenSlot({ need, label, ...ctx }: Ctx & { need?: Need; label?: string }) {
  return (
    <Popover
      button={
        <>
          <Icon.plus /> {label ?? "Choose a course"}
        </>
      }
      buttonClassName="course-tile open-slot"
      width={400}
    >
      {(close) => <Options need={need} close={close} {...ctx} />}
    </Popover>
  );
}

// Soonest options for an open requirement, each addable at its earliest term or another one.
function Options({ need, close, ...ctx }: Ctx & { need?: Need; close: () => void }) {
  const { tl, catalog, project, needs } = ctx;
  const opts: Option[] = useMemo(() => {
    if (!need) return [];
    if (need.gened) return genedOptions(need, needs, ctx);
    return optionsFor(need, needs, tl, catalog, project, 8);
  }, [need, needs, tl, catalog, project]);
  const gened = need?.gened;
  const [picked, setPicked] = useState<string | null>(null);
  const filter = useMemo(() => (gened ? (c: { g: string[][] }) => c.g.some((alt) => alt.some((g) => gened.includes(g))) : need?.match ? (c: { c: string }) => need.match!(c.c, { term: "", transfer: false, ap: false }) : undefined), [gened, need]);
  return (
    <div className="options-pop">
      <div className="op-title">{need ? `${need.label}` : "Add a course"}</div>
      {need?.detail && <div className="op-sub">{need.detail}</div>}
      {opts.length > 0 && (
        <>
          <div className="menu-label">{gened ? "Open to you now, most useful first" : "Soonest options"}</div>
          <ul className="op-list">
            {opts.map((o) => (
              <li key={o.code}>
                <div className="op-main">
                  <span className="op-code">{o.code}</span>
                  <span className="op-name">{o.title}</span>
                </div>
                <div className="op-meta">
                  Earliest {tl.slots[o.idx].term}
                  {o.chain.length ? ` · after ${o.chain.join(" → ")}` : ""}
                  {alsoFits(o, need, needs) && <span className="op-also"> · also fits {alsoFits(o, need, needs)}</span>}
                </div>
                <AddTo code={o.code} earliest={o.idx} onDone={close} {...ctx} />
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="menu-label">{opts.length ? "Or search" : "Search"}{gened ? ` courses with ${gened.join("/")}` : ""}</div>
      {picked ? (
        <div className="op-picked">
          <span className="op-code">{picked}</span>
          <AddTo code={picked} earliest={project(picked).idx} onDone={close} {...ctx} />
          <button className="btn-link" onClick={() => setPicked(null)}>
            change
          </button>
        </div>
      ) : (
        <CourseSearch catalog={catalog} onPick={setPicked} filter={filter} placeholder="Code or title" className="op-search" autoFocus={!opts.length} />
      )}
    </div>
  );
}

// GenEd options: courses carrying this GenEd that are open to you now, preferring ones that also
// cover other open GenEds (e.g. a DSHS course that is also SCIS).
function genedOptions(need: Need, needs: Need[], ctx: Ctx): Option[] {
  const { tl, catalog, project } = ctx;
  const codes = new Set(need.gened);
  const otherOpen = needs.filter((n) => n.gened && n.key !== need.key);
  const out: (Option & { score: number })[] = [];
  for (const c of catalog.values()) {
    if (!c.t?.length || tl.idxOf(c.c) !== undefined || Number(c.c.slice(4, 7)) >= 500) continue;
    const alt = c.g.find((a) => a.some((g) => codes.has(g)));
    if (!alt) continue;
    const pj = project(c.c);
    if (pj.idx === Infinity || pj.chain.length) continue;
    const also = otherOpen.filter((n) => alt.some((g) => n.gened!.includes(g)) && !n.gened!.some((g) => codes.has(g)));
    const recent = c.t.length;
    out.push({ code: c.c, title: c.n, credits: c.cr, idx: pj.idx, chain: [], needs: [need.key, ...also.map((n) => n.key)], score: also.length * 10 + recent });
  }
  return out.sort((a, b) => b.score - a.score || a.idx - b.idx || a.code.localeCompare(b.code)).slice(0, 8);
}

// Other programs' open requirements this option would also fit (e.g. a RAS elective).
function alsoFits(o: Option, need: Need | undefined, needs: Need[]): string {
  const others = needs.filter((n) => o.needs.includes(n.key) && (n.programId !== need?.programId || (need?.gened && n.key !== need.key)));
  const name = (n: Need) =>
    n.gened ? n.gened.join("/") : `${n.program === "Robotics and Autonomous Systems" ? "RAS" : n.program} ${n.label.replace(/\s*\(.*?\)/g, "")}`;
  return [...new Set(others.map(name))].join(", ");
}

function AddTo({ code, earliest, onDone, ...ctx }: Ctx & { code: string; earliest: number; onDone: () => void }) {
  const { tl, plan, programs, catalog, addCourse } = ctx;
  const slots = tl.slots.filter((s) => s.idx >= tl.firstOpen);
  const first = slots.find((s) => s.idx >= earliest) ?? slots[0];
  if (!first) return null;
  const check = (term: string) => checkPlacement(plan, programs, catalog, { kind: "add", code, term } as Change);
  return (
    <span className="add-to">
      <button
        className="btn sm add-main"
        onClick={() => {
          addCourse(code, first.term);
          onDone();
        }}
      >
        Add to {shortTerm(first.term)}
      </button>
      <Popover button={<Icon.chevron />} buttonClassName="btn sm" align="end" width={300}>
        {(close) => (
          <div className="menu term-menu">
            {slots.map((s) => {
              const c = check(s.term);
              return (
                <button
                  key={s.idx}
                  onClick={() => {
                    close();
                    addCourse(code, s.term);
                    onDone();
                  }}
                >
                  <span className={`tm-dot ${c.level}`} />
                  <span className="tm-term">
                    {s.term}
                    {s.virtual ? <span className="muted"> · new term</span> : null}
                  </span>
                  <span className="tm-why">{c.level === "good" ? "" : c.lines[0]}</span>
                </button>
              );
            })}
          </div>
        )}
      </Popover>
    </span>
  );
}

function needFor(ctx: Ctx, programId: string, id: string) {
  return ctx.needs.find((n) => n.key === `${programId}/${id}`);
}

function WaiveLink({ k, on, onWaive }: { k: string; on: boolean; onWaive: (k: string) => void }) {
  return (
    <Popover button={on ? "Waived" : "Waive"} buttonClassName={`waive ${on ? "on" : ""}`} align="end" width={250}>
      {(close) => (
        <div className="confirm">
          <div>{on ? "Count this requirement as not satisfied again?" : "Mark this requirement satisfied, for an exemption exam, an advisor substitution or an approved elective."}</div>
          <div className="confirm-actions">
            <button className="btn" onClick={close}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                close();
                onWaive(k);
              }}
            >
              {on ? "Un-waive" : "Waive"}
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function CoreRow({ b, programId, onWaive, ...ctx }: Ctx & { b: BucketResult; programId: string; onWaive: (k: string) => void }) {
  const key = `${programId}/${b.bucket.id}`;
  return (
    <div className={`core-row ${b.satisfied ? "ok" : "todo"}`}>
      <span className="cr-label">{b.bucket.label}</span>
      <span className="cr-slot">
        {b.waived ? null : b.assigned.length ? (
          b.assigned.map((id) => <CourseTile key={id} id={id} {...ctx} />)
        ) : (
          <OpenSlot need={needFor(ctx, programId, b.bucket.id)} label="Add" {...ctx} />
        )}
      </span>
      {(!b.satisfied || b.waived) && <WaiveLink k={key} on={b.waived} onWaive={onWaive} />}
    </div>
  );
}

function BucketCard({ b, programId, onWaive, ...ctx }: Ctx & { b: BucketResult; programId: string; onWaive: (k: string) => void }) {
  const u = bucketUnits(b, ctx.courseById);
  const byCredits = !!b.bucket.credits && !b.bucket.courses;
  const need = needFor(ctx, programId, b.bucket.id);
  const openSlots = Math.ceil(u.open - 1e-9);
  const key = `${programId}/${b.bucket.id}`;
  const count = byCredits
    ? `${b.creditCount} / ${b.bucket.credits} cr`
    : b.bucket.courses
      ? `${Math.min(b.courseCount, b.bucket.courses)} / ${b.bucket.courses}`
      : `${b.courseCount} course${b.courseCount === 1 ? "" : "s"}`; // pool checked by a rule below
  return (
    <div className={`card req-card bucket ${b.satisfied ? "ok" : "todo"}`}>
      <div className="rc-head">
        <span className={`rc-icon ${b.satisfied ? "ok" : "todo"}`}>{b.satisfied ? <Icon.check /> : <span className="rc-open" />}</span>
        <h3>{b.bucket.label}</h3>
        <span className="rc-count">{b.waived ? "waived" : count}</span>
      </div>
      {b.bucket.note && <p className="rc-note">{b.bucket.note}</p>}
      {byCredits && !b.waived && (
        <div className="rc-meter">
          <span style={{ width: `${Math.min(100, (b.creditCount / b.bucket.credits!) * 100)}%` }} />
        </div>
      )}
      <div className="tiles">
        {b.assigned.map((id) => (
          <CourseTile key={id} id={id} {...ctx} />
        ))}
        {!b.waived && openSlots > 0 && programId !== "university" && (
          <>
            {Array.from({ length: Math.min(openSlots, 6) }, (_, i) => (
              <OpenSlot key={i} need={need} {...ctx} />
            ))}
          </>
        )}
        {!b.waived && openSlots > 0 && programId === "university" && <span className="muted small">{need?.detail}</span>}
      </div>
      {(!b.satisfied || b.waived) && (
        <div className="rc-foot">
          <WaiveLink k={key} on={b.waived} onWaive={onWaive} />
        </div>
      )}
    </div>
  );
}

function RuleView({ c, r, programId, onWaive, ...ctx }: Ctx & { c: ConstraintResult; r: ProgramResult; programId: string; onWaive: (k: string) => void }) {
  const con = r.program.constraints?.find((x) => x.id === c.id);
  const key = `${programId}/${c.id}`;
  // Distribution across groups (e.g. CS areas): show each group's courses.
  if (con?.kind === "distinct") {
    const ids = [...new Set(r.buckets.filter((b) => con.buckets.includes(b.bucket.id)).flatMap((b) => b.assigned))];
    const caps = r.program.constraints?.filter((x) => x.kind === "maxFrom" && con.groups.some((g) => x.id === `max-${g.id}`)) ?? [];
    return (
      <div className={`rule-block ${c.satisfied ? "ok" : "bad"}`}>
        <div className="rule-row">
          <span className="rr-icon">{c.satisfied ? <Icon.check /> : <Icon.x />}</span>
          <span className="rr-label">{c.label}</span>
          <span className="rr-detail">{c.detail.split(" (")[0]}</span>
        </div>
        <div className="group-grid" style={{ gridTemplateColumns: `repeat(${con.groups.length}, minmax(0, 1fr))` }}>
          {con.groups.map((g) => {
            const inG = ids.filter((id) => {
              const pc = ctx.courseById.get(id);
              return pc && g.match(pc.code, { term: ctx.termOfCourse.get(id) ?? "", transfer: false, ap: false });
            });
            return (
              <div key={g.id} className={`group-col ${inG.length ? "has" : ""}`}>
                <div className="gc-head">
                  {g.label}
                  <span className="gc-n">{inG.length}</span>
                </div>
                <div className="gc-tiles">
                  {inG.map((id) => (
                    <CourseTile key={id} id={id} {...ctx} />
                  ))}
                  {!inG.length && <span className="muted small">none</span>}
                </div>
              </div>
            );
          })}
        </div>
        {caps.length > 0 && <div className="rule-foot muted small">At most 3 courses count from any one area. {caps.some((x) => !r.constraints.find((y) => y.id === x.id)?.satisfied) ? "An area is over the cap." : ""}</div>}
      </div>
    );
  }
  // One of several sets (sequences, depth pairs): show which one is complete.
  if (con?.kind === "anySet") {
    return (
      <div className={`rule-block ${c.satisfied ? "ok" : "bad"}`}>
        <div className="rule-row">
          <span className="rr-icon">{c.satisfied ? <Icon.check /> : <Icon.x />}</span>
          <span className="rr-label">{c.label}</span>
          <span className="rr-detail">{c.satisfied ? `via ${c.detail}` : "none complete yet"}</span>
          {(!c.satisfied || c.waived) && <WaiveLink k={key} on={!!c.waived} onWaive={onWaive} />}
        </div>
        <details className="set-options">
          <summary>{con.options.length} ways to satisfy this</summary>
          <ul>
            {con.options.map((o) => (
              <li key={o.label} className={o.label === c.detail ? "ok" : ""}>
                {o.label === c.detail && <Icon.check />} <b>{o.label}</b>: {o.slots.map((s) => `${s.count && s.count > 1 ? `${s.count}× ` : ""}${s.label}`).join(" + ")}
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  }
  if (con?.kind === "maxFrom" && r.program.constraints?.some((x) => x.kind === "distinct")) return null; // shown with the area grid
  // "at least N from bucket X" where X already requires N courses repeats the requirement card
  if (con?.kind === "minFrom" && con.buckets.length === 1 && r.buckets.find((b) => b.bucket.id === con.buckets[0])?.bucket.courses === con.courses && c.satisfied === r.buckets.find((b) => b.bucket.id === con.buckets[0])?.satisfied)
    return null;
  return (
    <div className={`rule-row ${c.satisfied ? "ok" : "bad"}`}>
      <span className="rr-icon">{c.waived ? "↷" : c.satisfied ? <Icon.check /> : <Icon.x />}</span>
      <span className="rr-label">{c.label}</span>
      <span className="rr-detail">{c.detail}</span>
      {(!c.satisfied || c.waived) && <WaiveLink k={key} on={!!c.waived} onWaive={onWaive} />}
    </div>
  );
}
