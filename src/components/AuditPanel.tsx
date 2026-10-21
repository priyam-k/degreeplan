import type { AuditResult, ConstraintResult, PlanCourse, ProgramResult } from "../types";

interface Props {
  audit: AuditResult | null;
  courses: Map<string, PlanCourse>;
  waived: string[];
  exemptions: string[];
  onToggleWaive: (key: string) => void;
  onExemptions: (e: string[]) => void;
}

const GENED_CODES = ["FSAW", "FSPW", "FSOC", "FSMA", "FSAR", "DSNL", "DSNS", "DSHS", "DSHU", "DSSP", "SCIS", "DVUP", "DVCC"];

export function AuditPanel({ audit, courses, waived, exemptions, onToggleWaive, onExemptions }: Props) {
  if (!audit) return <aside className="audit">Loading solver…</aside>;
  if (audit.error) return <aside className="audit error">Audit failed: {audit.error}</aside>;
  const label = (id: string) => {
    const c = courses.get(id);
    return c ? c.code || `(${c.geneds.flat().join("/")} credit)` : "?";
  };

  return (
    <aside className="audit">
      <div className="audit-summary">
        {audit.programs.map((p) => (
          <a key={p.program.id} href={`#prog-${p.program.id}`} className={p.satisfied ? "ok" : "todo"}>
            {p.satisfied ? "✓" : "○"} {p.program.name.replace(/ Major| Minor/, "")}
          </a>
        ))}
      </div>

      {audit.sharing.length > 0 && (
        <section className="prog">
          <h3>Double-counting limits</h3>
          {audit.sharing.map((s) => (
            <Rule key={s.id} r={s} waiveKey={s.id} waived={waived} onToggleWaive={onToggleWaive} />
          ))}
        </section>
      )}

      {audit.programs.map((p) => (
        <ProgramView key={p.program.id} p={p} label={label} waived={waived} onToggleWaive={onToggleWaive}>
          {p.program.kind === "gened" && (
            <div className="exemptions">
              Satisfied by exemption:{" "}
              {exemptions.map((e, i) => (
                <span key={i} className="chip chip-gened">
                  {e}{" "}
                  <button className="link x" onClick={() => onExemptions(exemptions.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </span>
              ))}
              <select value="" onChange={(e) => e.target.value && onExemptions([...exemptions, e.target.value])}>
                <option value="">+ add</option>
                {GENED_CODES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
        </ProgramView>
      ))}
    </aside>
  );
}

function ProgramView({
  p,
  label,
  waived,
  onToggleWaive,
  children,
}: {
  p: ProgramResult;
  label: (id: string) => string;
  waived: string[];
  onToggleWaive: (k: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <details className="prog" id={`prog-${p.program.id}`} open={p.program.kind !== "university"}>
      <summary>
        <span className={p.satisfied ? "ok" : "todo"}>{p.satisfied ? "✓" : "○"}</span> {p.program.name}
      </summary>
      {children}
      <ul className="buckets">
        {p.buckets.map((b) => {
          const need = [b.bucket.courses ? `${b.courseCount}/${b.bucket.courses}` : "", b.bucket.credits ? `${b.creditCount}/${b.bucket.credits} cr` : ""]
            .filter(Boolean)
            .join(" · ");
          const key = `${p.program.id}/${b.bucket.id}`;
          return (
            <li key={b.bucket.id} className={b.satisfied ? "ok" : "todo"}>
              <div className="row">
                <span className="icon">{b.waived ? "↷" : b.satisfied ? "✓" : "○"}</span>
                <span className="lbl" title={b.bucket.note}>
                  {b.bucket.label}
                  {b.bucket.note && <span className="info"> ⓘ</span>}
                </span>
                <span className="need">{b.waived ? "waived" : need}</span>
                <WaiveBtn k={key} waived={waived} onToggleWaive={onToggleWaive} show={!b.satisfied || b.waived} />
              </div>
              {b.assigned.length > 0 && <div className="assigned">{b.assigned.map(label).join(", ")}</div>}
            </li>
          );
        })}
      </ul>
      {p.constraints.length > 0 && (
        <ul className="buckets">
          {p.constraints.map((c) => (
            <Rule key={c.id} r={c} waiveKey={`${p.program.id}/${c.id}`} waived={waived} onToggleWaive={onToggleWaive} />
          ))}
        </ul>
      )}
      {(p.program.notes?.length || p.program.sources?.length) && (
        <details className="notes">
          <summary>Notes &amp; sources</summary>
          <ul>
            {p.program.notes?.map((n) => <li key={n}>{n}</li>)}
            {p.program.sources?.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noreferrer">
                  {s.replace(/^https?:\/\//, "").slice(0, 70)}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </details>
  );
}

function Rule({ r, waiveKey, waived, onToggleWaive }: { r: ConstraintResult; waiveKey: string; waived: string[]; onToggleWaive: (k: string) => void }) {
  return (
    <li className={`rule ${r.satisfied ? "ok" : "todo"}`}>
      <div className="row">
        <span className="icon">{r.waived ? "↷" : r.satisfied ? "✓" : "✗"}</span>
        <span className="lbl">{r.label}</span>
        <WaiveBtn k={waiveKey} waived={waived} onToggleWaive={onToggleWaive} show={!r.satisfied || !!r.waived} />
      </div>
      <div className="assigned">{r.detail}</div>
    </li>
  );
}

function WaiveBtn({ k, waived, onToggleWaive, show }: { k: string; waived: string[]; onToggleWaive: (k: string) => void; show: boolean }) {
  if (!show) return null;
  const on = waived.includes(k);
  return (
    <button className="link waive" onClick={() => onToggleWaive(k)} title={on ? "Un-waive" : "Mark satisfied (exemption exam, advisor approval, ...)"}>
      {on ? "unwaive" : "waive"}
    </button>
  );
}
