import type { AuditResult, ConstraintResult, PlanCourse, ProgramResult } from "../types";
import { Popover } from "../ui/Popover";
import { Icon } from "../ui/icons";

interface Props {
  audit: AuditResult | null;
  courses: Map<string, PlanCourse>;
  waived: string[];
  exemptions: string[];
  highlight: string[];
  onHighlight: (ids: string[]) => void;
  onToggleWaive: (key: string) => void;
  onExemptions: (e: string[]) => void;
  onCollapse?: () => void;
}

const GENED_CODES = ["FSAW", "FSPW", "FSOC", "FSMA", "FSAR", "DSNL", "DSNS", "DSHS", "DSHU", "DSSP", "SCIS", "DVUP", "DVCC"];

export function progressOf(p: ProgramResult): { done: number; total: number } {
  const items = [...p.buckets.map((b) => b.satisfied), ...p.constraints.map((c) => c.satisfied)];
  return { done: items.filter(Boolean).length, total: items.length };
}

export function AuditPanel({ audit, courses, waived, exemptions, highlight, onHighlight, onToggleWaive, onExemptions, onCollapse }: Props) {
  if (!audit) return <aside className="audit card">Loading the requirement solver…</aside>;
  if (audit.error) return <aside className="audit card error">Audit failed: {audit.error}</aside>;
  const label = (id: string) => {
    const c = courses.get(id);
    return c ? c.code || `${c.geneds.flat().join("/")} credit` : "?";
  };
  const hlKey = highlight.join(",");
  const toggleHl = (ids: string[]) => onHighlight(ids.join(",") === hlKey ? [] : ids);

  return (
    <aside className="audit card">
      <div className="audit-head">
        <h3>Requirements</h3>
        {onCollapse && (
          <button className="btn-link" onClick={onCollapse} title="Hide the requirements panel to give the semesters more room">
            Hide <Icon.arrowRight />
          </button>
        )}
      </div>
      <div className="audit-summary">
        {audit.programs.map((p) => {
          const { done, total } = progressOf(p);
          return (
            <a key={p.program.id} href={`#prog-${p.program.id}`} className="as-row">
              <span className={`status-pip ${p.satisfied ? "ok" : "todo"}`} />
              <span className="as-name">{p.program.name.replace(/ Major| Minor/, "")}</span>
              <span className="as-bar">
                <span style={{ width: `${(done / total) * 100}%` }} className={p.satisfied ? "ok" : ""} />
              </span>
              <span className="as-count">
                {done}/{total}
              </span>
            </a>
          );
        })}
      </div>

      {audit.sharing.length > 0 && (
        <section className="prog">
          <h3>Double-counting limits</h3>
          <ul className="buckets">
            {audit.sharing.map((s) => (
              <Rule key={s.id} r={s} waiveKey={`sharing/${s.id}`} waived={waived} onToggleWaive={onToggleWaive} />
            ))}
          </ul>
        </section>
      )}

      {audit.programs.map((p) => (
        <details className="prog" id={`prog-${p.program.id}`} key={p.program.id} open={p.program.kind !== "university"}>
          <summary>
            <span className={`status-pip ${p.satisfied ? "ok" : "todo"}`} /> {p.program.name}
          </summary>
          {p.program.kind === "gened" && (
            <div className="exemptions">
              <span className="muted">Satisfied by exemption:</span>
              {exemptions.map((e, i) => (
                <span key={i} className="chip chip-gened">
                  {e}
                  <button className="chip-x" aria-label={`Remove ${e}`} onClick={() => onExemptions(exemptions.filter((_, j) => j !== i))}>
                    <Icon.x />
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
          <ul className="buckets">
            {p.buckets.map((b) => {
              const need = [b.bucket.courses ? `${b.courseCount}/${b.bucket.courses}` : "", b.bucket.credits ? `${b.creditCount}/${b.bucket.credits} cr` : ""]
                .filter(Boolean)
                .join(" · ");
              const key = `${p.program.id}/${b.bucket.id}`;
              const on = b.assigned.length > 0 && b.assigned.join(",") === hlKey;
              return (
                <li key={b.bucket.id} className={`${b.satisfied ? "ok" : "todo"} ${on ? "hl" : ""}`}>
                  <div className="row">
                    <span className="icon">{b.waived ? "↷" : b.satisfied ? <Icon.check /> : "○"}</span>
                    <button className="lbl" disabled={!b.assigned.length} onClick={() => toggleHl(b.assigned)} title={b.assigned.length ? "Highlight these courses in the plan" : undefined}>
                      {b.bucket.label}
                    </button>
                    {b.bucket.note && <Note text={b.bucket.note} />}
                    {!b.waived && <span className="need">{need}</span>}
                    <WaiveBtn k={key} waived={waived} onToggleWaive={onToggleWaive} show={!b.satisfied || b.waived} />
                  </div>
                  {b.assigned.length > 0 && <div className="assigned">{b.assigned.map(label).join(", ")}</div>}
                </li>
              );
            })}
            {p.constraints.map((c) => (
              <Rule key={c.id} r={c} waiveKey={`${p.program.id}/${c.id}`} waived={waived} onToggleWaive={onToggleWaive} />
            ))}
          </ul>
          {(p.program.notes?.length || p.program.sources?.length) && (
            <details className="notes">
              <summary>Notes &amp; sources</summary>
              <ul>
                {p.program.notes?.map((n) => <li key={n}>{n}</li>)}
                {p.program.sources?.map((s) => (
                  <li key={s}>
                    <a href={s} target="_blank" rel="noreferrer">
                      {s.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </details>
      ))}
    </aside>
  );
}

function Note({ text }: { text: string }) {
  return (
    <Popover button={<Icon.info />} buttonClassName="info-btn" buttonTitle="Details" width={280}>
      <div className="note-pop">{text}</div>
    </Popover>
  );
}

function Rule({ r, waiveKey, waived, onToggleWaive }: { r: ConstraintResult; waiveKey: string; waived: string[]; onToggleWaive: (k: string) => void }) {
  return (
    <li className={`rule ${r.satisfied ? "ok" : "todo"}`}>
      <div className="row">
        <span className="icon">{r.waived ? "↷" : r.satisfied ? <Icon.check /> : <Icon.x />}</span>
        <span className="lbl static">{r.label}</span>
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
    <Popover button={on ? "waived" : "waive"} buttonClassName={`waive ${on ? "on" : ""}`} align="end" width={250}>
      {(close) => (
        <div className="confirm">
          <div>
            {on
              ? "Count this requirement as not satisfied again?"
              : "Mark this requirement satisfied, for an exemption exam, an advisor substitution or an approved elective."}
          </div>
          <div className="confirm-actions">
            <button className="btn" onClick={close}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                close();
                onToggleWaive(k);
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
