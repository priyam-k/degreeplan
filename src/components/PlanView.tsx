import { useMemo, useState } from "react";
import type { AuditResult, Plan, PlanCourse, Program, Semester } from "../types";
import type { Catalog } from "../catalog";
import type { SetPlan } from "../App";
import { academicYear, addTerm, sortSemesters, termKey } from "../plan";
import { TRANSFER_TERM } from "../transcript";
import { courseWarnings } from "../flow/analysis";
import { SemesterTable, DEFAULT_COLS, type ColKey, type ColWidths } from "./SemesterTable";
import { AuditPanel } from "./AuditPanel";
import { Icon } from "../ui/icons";
import { startDrag } from "../ui/drag";

const COLS_KEY = "degreeplan.cols";
const TRANSFER_KEY = "degreeplan.transferOpen";
const AUDIT_KEY = "degreeplan.auditOpen";
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? { ...d, ...JSON.parse(v) } : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

interface Props {
  plan: Plan;
  catalog: Catalog;
  audit: AuditResult | null;
  programs: Program[];
  setPlan: SetPlan;
  onImport: () => void;
}

export function PlanView({ plan, catalog, audit, programs, setPlan, onImport }: Props) {
  const [cols, setCols] = useState<ColWidths>(() => read(COLS_KEY, DEFAULT_COLS));
  const [transferOpen, setTransferOpen] = useState<boolean>(() => read(TRANSFER_KEY, { v: false }).v);
  const [drag, setDrag] = useState<{ id: string; term?: string; before?: string | null } | null>(null);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [auditOpen, setAuditOpen] = useState<boolean>(() => read(AUDIT_KEY, { v: true }).v);
  const showAudit = (v: boolean) => {
    setAuditOpen(v);
    write(AUDIT_KEY, { v });
  };

  const resize = (k: ColKey, w: number) =>
    setCols((c) => {
      const next = { ...c, [k]: w };
      write(COLS_KEY, next);
      return next;
    });
  const warnings = useMemo(() => courseWarnings(plan, programs, catalog), [plan, programs, catalog]);
  const allCodes = useMemo(() => new Map(plan.semesters.flatMap((s) => s.courses.filter((c) => c.code).map((c) => [c.code, s.term] as const))), [plan.semesters]);
  const courseById = useMemo(() => new Map<string, PlanCourse>(plan.semesters.flatMap((s) => s.courses.map((c) => [c.id, c]))), [plan.semesters]);
  const terms = sortSemesters(plan.semesters).map((s) => s.term);

  const setSemester = (s: Semester, opts?: { coalesce?: string; toast?: string }) =>
    setPlan((p) => ({ ...p, semesters: p.semesters.map((x) => (x.id === s.id ? s : x)) }), opts);
  const removeSemester = (s: Semester) =>
    setPlan((p) => ({ ...p, semesters: p.semesters.filter((x) => x.id !== s.id) }), { toast: `Removed ${s.term}` });
  const move = (id: string, toTerm: string, beforeId: string | null) => {
    const c = courseById.get(id);
    if (!c || beforeId === id) return;
    const from = plan.semesters.find((s) => s.courses.some((x) => x.id === id))?.term;
    setPlan(
      (p) => {
        const without = p.semesters.map((s) => ({ ...s, courses: s.courses.filter((x) => x.id !== id) }));
        return {
          ...p,
          semesters: without.map((s) => {
            if (s.term !== toTerm) return s;
            const i = beforeId ? s.courses.findIndex((x) => x.id === beforeId) : -1;
            const courses = [...s.courses];
            courses.splice(i < 0 ? courses.length : i, 0, c);
            return { ...s, courses };
          }),
        };
      },
      from !== toTerm ? { toast: `Moved ${c.code} to ${toTerm}` } : undefined,
    );
  };

  const transfer = plan.semesters.find((s) => s.term === TRANSFER_TERM);
  const years = new Map<number, Semester[]>();
  for (const s of plan.semesters) {
    if (s.term === TRANSFER_TERM) continue;
    const y = academicYear(s.term);
    years.set(y, [...(years.get(y) ?? []), s].sort((a, b) => termKey(a.term) - termKey(b.term)));
  }
  const yearList = [...years.keys()].sort((a, b) => a - b);
  const lastYear = yearList[yearList.length - 1] ?? new Date().getFullYear() - 1;

  const courses = plan.semesters.flatMap((s) => s.courses);
  const credits = (f: (c: PlanCourse) => boolean) => courses.filter(f).reduce((n, c) => n + c.credits, 0);
  const done = credits((c) => c.status === "completed" || c.status === "transfer");
  const inprog = credits((c) => c.status === "inprogress");
  const planned = credits((c) => c.status === "planned");
  const total = audit?.totalCredits ?? done + inprog + planned;
  const pct = (n: number) => `${Math.min(100, (n / Math.max(120, total)) * 100)}%`;
  const hl = useMemo(() => new Set(highlight), [highlight]);
  // Drag a row by its handle onto any term (or between rows) to move it.
  const onDragStart = (e: React.PointerEvent, c: PlanCourse) => {
    let target: { term?: string; before?: string | null } = {};
    startDrag(e, {
      label: c.code || "GenEd credit",
      sub: c.title,
      onStart: () => setDrag({ id: c.id }),
      onMove: (_x, _y, el) => {
        const sem = el?.closest(".semester[data-term]") as HTMLElement | null;
        const row = el?.closest("tr[data-id]") as HTMLElement | null;
        target = sem ? { term: sem.dataset.term, before: row?.dataset.id ?? null } : {};
        setDrag({ id: c.id, ...target });
      },
      onDrop: () => {
        if (target.term) move(c.id, target.term, target.before ?? null);
      },
      onEnd: () => setDrag(null),
    });
  };
  const tableProps = { catalog, usage: audit?.usage ?? {}, warnings, allCodes, cols, onResize: resize, terms, onMove: move, drag, onDragStart, highlight: hl };

  return (
    <main className={`plan-main ${auditOpen ? "" : "wide"}`}>
      <section className="plan">
        <div className="summary card">
          <div className="sum-total">
            <b>{total}</b>
            <span>/ 120 credits</span>
          </div>
          <div className="sum-bar" aria-label="Credits">
            <span className="seg done" style={{ width: pct(done) }} />
            <span className="seg inprogress" style={{ width: pct(inprog) }} />
            <span className="seg planned" style={{ width: pct(planned) }} />
            <span className="sum-goal" style={{ left: `${Math.min(100, (120 / Math.max(120, total)) * 100)}%` }} />
          </div>
          <div className="sum-legend">
            <span>
              <span className="status-dot st-completed" /> {done} done
            </span>
            <span>
              <span className="status-dot st-inprogress" /> {inprog} in progress
            </span>
            <span>
              <span className="status-dot st-planned" /> {planned} planned
            </span>
          </div>
        </div>

        {courses.length === 0 && (
          <div className="empty card">
            <h3>Start with your transcript</h3>
            <p>Import your Testudo unofficial transcript to fill in completed, in-progress and AP courses, or add classes to each term below.</p>
            <button className="btn primary" onClick={onImport}>
              Import transcript
            </button>
          </div>
        )}

        {transfer && (
          <div className="year card">
            <button
              className="year-head toggle"
              onClick={() => {
                setTransferOpen(!transferOpen);
                write(TRANSFER_KEY, { v: !transferOpen });
              }}
            >
              <span className={`caret ${transferOpen ? "open" : ""}`}>
                <Icon.arrowRight />
              </span>
              <h2>Transfer &amp; AP credit</h2>
              <span className="muted">
                {transfer.courses.length} courses · {transfer.courses.reduce((n, c) => n + c.credits, 0)} credits
              </span>
            </button>
            {transferOpen && (
              <div className="terms one">
                <SemesterTable semester={transfer} {...tableProps} onChange={setSemester} />
              </div>
            )}
          </div>
        )}
        {yearList.map((y, i) => {
          const sems = years.get(y)!;
          return (
            <div className="year card" key={y}>
              <div className="year-head">
                <h2>
                  Year {i + 1}{" "}
                  <span className="muted">
                    {y}–{String(y + 1).slice(2)}
                  </span>
                </h2>
                <span className="year-actions">
                  {!sems.some((s) => s.term.startsWith("Winter")) && (
                    <button className="btn-link" onClick={() => setPlan((p) => addTerm(p, `Winter ${y + 1}`))}>
                      <Icon.plus /> Winter
                    </button>
                  )}
                  {!sems.some((s) => s.term.startsWith("Summer")) && (
                    <button className="btn-link" onClick={() => setPlan((p) => addTerm(p, `Summer ${y + 1}`))}>
                      <Icon.plus /> Summer
                    </button>
                  )}
                </span>
              </div>
              <div className="terms">
                {sems.map((s) => (
                  <SemesterTable key={s.id} semester={s} {...tableProps} onChange={setSemester} onRemove={() => removeSemester(s)} />
                ))}
              </div>
            </div>
          );
        })}
        <button className="add-year" onClick={() => setPlan((p) => addTerm(addTerm(p, `Fall ${lastYear + 1}`), `Spring ${lastYear + 2}`))}>
          <Icon.plus /> Add a year
        </button>
      </section>
      {!auditOpen && (
        <button className="audit-toggle" onClick={() => showAudit(true)}>
          Requirements
        </button>
      )}
      {auditOpen && <AuditPanel
        onCollapse={() => showAudit(false)}
        audit={audit}
        courses={courseById}
        waived={plan.waived}
        exemptions={plan.genedExemptions}
        highlight={highlight}
        onHighlight={(ids) => {
          setHighlight(ids);
          if (ids.some((id) => plan.semesters.find((s) => s.term === TRANSFER_TERM)?.courses.some((c) => c.id === id)) && !transferOpen) {
            setTransferOpen(true);
            write(TRANSFER_KEY, { v: true });
          }
          setTimeout(() => document.querySelector(`tr[data-id="${ids[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        }}
        onToggleWaive={(k) => setPlan((p) => ({ ...p, waived: p.waived.includes(k) ? p.waived.filter((x) => x !== k) : [...p.waived, k] }))}
        onExemptions={(e) => setPlan((p) => ({ ...p, genedExemptions: e }))}
      />}
    </main>
  );
}
