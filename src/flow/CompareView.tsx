import { useMemo } from "react";
import type { Plan } from "../types";
import type { Catalog } from "../catalog";
import type { Highs } from "../engine/solver";
import type { Scenario } from "../workspace";
import { ALWAYS, programById } from "../programs";
import { TRANSFER_TERM } from "../transcript";
import { sortSemesters } from "../plan";
import { auditPlan, prereqProblems, remainingByProgram } from "./analysis";

interface Props {
  scenarios: Scenario[];
  active: string;
  catalog: Catalog;
  highs: Highs | null;
  onOpen: (id: string) => void;
  onDuplicate: () => void;
}

export const programsOf = (plan: Plan) => [...plan.programIds.map(programById).filter((p): p is NonNullable<typeof p> => !!p), ...ALWAYS];

export function CompareView({ scenarios, active, catalog, highs, onOpen, onDuplicate }: Props) {
  const rows = useMemo(() => {
    if (!highs) return null;
    const codeSets = scenarios.map((s) => new Set(s.plan.semesters.flatMap((x) => x.courses.map((c) => c.code)).filter(Boolean)));
    return scenarios.map((s, i) => {
      const programs = programsOf(s.plan);
      const audit = auditPlan(highs, s.plan, programs);
      const sems = sortSemesters(s.plan.semesters).filter((x) => x.term !== TRANSFER_TERM && x.courses.length);
      const credits = (x: (typeof sems)[number]) => x.courses.reduce((n, c) => n + c.credits, 0);
      const heavy = sems.reduce((m, x) => (credits(x) > credits(m) ? x : m), sems[0]);
      const only = [...codeSets[i]].filter((c) => codeSets.some((o, j) => j !== i && !o.has(c))).sort();
      return {
        s,
        audit,
        remaining: audit.error ? [] : remainingByProgram(audit),
        last: sems[sems.length - 1]?.term ?? "—",
        heavy: heavy ? `${credits(heavy)} cr (${heavy.term})` : "—",
        prereq: prereqProblems(s.plan, programs, catalog),
        only,
      };
    });
  }, [scenarios, catalog, highs]);

  if (scenarios.length < 2)
    return (
      <main className="compare-main">
        <div className="compare-empty card">
          <h3>Compare alternative plans</h3>
          <p>Duplicate your plan, try a different set of courses or a different order in the copy, then compare requirements, credits and prerequisite problems side by side.</p>
          <button className="btn primary" onClick={onDuplicate}>
            Duplicate current plan
          </button>
        </div>
      </main>
    );
  if (!rows) return <main className="compare-main">Loading solver…</main>;
  const programNames = [...new Set(rows.flatMap((r) => r.remaining.map((p) => p.name)))];

  return (
    <main className="compare-main">
      <table className="compare">
        <thead>
          <tr>
            <th />
            {rows.map((r) => (
              <th key={r.s.id} className={r.s.id === active ? "active" : ""}>
                <div className="cmp-head">
                  {r.s.name}
                  <button className="btn sm" onClick={() => onOpen(r.s.id)}>
                    Open in flowchart
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Total credits</th>
            {rows.map((r) => <td key={r.s.id}>{r.audit.totalCredits}</td>)}
          </tr>
          <tr>
            <th>Last term</th>
            {rows.map((r) => <td key={r.s.id}>{r.last}</td>)}
          </tr>
          <tr>
            <th>Heaviest term</th>
            {rows.map((r) => <td key={r.s.id}>{r.heavy}</td>)}
          </tr>
          {programNames.map((name) => (
            <tr key={name}>
              <th>{name}</th>
              {rows.map((r) => {
                const p = r.remaining.find((x) => x.name === name);
                return (
                  <td key={r.s.id} className={p ? (p.satisfied ? "ok" : "todo") : "muted"}>
                    {!p ? "not in this plan" : p.satisfied ? "✓ complete" : `${p.left.length} left: ${p.left.join(" · ")}`}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th>Prerequisite problems</th>
            {rows.map((r) => (
              <td key={r.s.id} className={r.prereq.length ? "error" : "ok"}>
                {r.prereq.length ? r.prereq.map((p) => `${p.course.code} (${p.term})`).join(", ") : "none"}
              </td>
            ))}
          </tr>
          <tr>
            <th>Courses only in this plan</th>
            {rows.map((r) => <td key={r.s.id}>{r.only.join(", ") || "—"}</td>)}
          </tr>
        </tbody>
      </table>
    </main>
  );
}
