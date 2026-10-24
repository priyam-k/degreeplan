import { useLayoutEffect, useRef, useState } from "react";
import type { CourseStatus, PlanCourse, Semester } from "../types";
import type { Catalog } from "../catalog";
import { exclusiveWith } from "../catalog";
import { formatGeneds, parseGenedString } from "../geneds";
import { courseFromCatalog, creditCap } from "../plan";
import { normalizeCode } from "../engine/match";
import { CourseSearch } from "../ui/CourseSearch";
import { ConfirmButton, Popover } from "../ui/Popover";
import { Icon } from "../ui/icons";
import { CourseInfo } from "./CourseInfo";

export const STATUS_LABEL: Record<CourseStatus, string> = {
  planned: "Planned",
  inprogress: "In progress",
  completed: "Completed",
  transfer: "Transfer / AP",
};
const STATUSES: CourseStatus[] = ["planned", "inprogress", "completed", "transfer"];

export { creditCap } from "../plan";

export type ColKey = "class" | "cr" | "gened" | "notes";
export type ColWidths = Record<ColKey, number>;
export const DEFAULT_COLS: ColWidths = { class: 160, cr: 44, gened: 96, notes: 150 };

interface Props {
  semester: Semester;
  catalog: Catalog;
  usage: Record<string, string[]>;
  warnings: Map<string, string[]>;
  allCodes: Map<string, string>; // code -> term, for cross-plan warnings
  cols: ColWidths;
  onResize: (k: ColKey, w: number) => void;
  terms: string[]; // for "Move to…"
  onChange: (s: Semester, opts?: { coalesce?: string; toast?: string }) => void;
  onMove: (courseId: string, toTerm: string, beforeId: string | null) => void;
  onRemove?: () => void;
  drag: { id: string; term?: string; before?: string | null } | null;
  onDragStart: (e: React.PointerEvent, c: PlanCourse) => void;
  highlight: Set<string>;
}

export function SemesterTable(props: Props) {
  const { semester, catalog, cols, onChange, drag } = props;
  const total = semester.courses.reduce((n, c) => n + c.credits, 0);
  const isTransfer = semester.term.startsWith("Transfer");
  const cap = creditCap(semester.term);
  const dropBefore = drag && drag.term === semester.term ? drag.before ?? null : undefined; // undefined = not a target

  const update = (id: string, patch: Partial<PlanCourse>, coalesce?: string) =>
    onChange({ ...semester, courses: semester.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) }, coalesce ? { coalesce } : undefined);
  const remove = (c: PlanCourse) =>
    onChange({ ...semester, courses: semester.courses.filter((x) => x.id !== c.id) }, { toast: `Removed ${c.code || "course"} from ${semester.term}` });
  const add = (code: string) => {
    const fresh = courseFromCatalog(code, catalog, { status: isTransfer ? "transfer" : "planned" });
    onChange({ ...semester, courses: [...semester.courses, fresh] });
  };

  return (
    <div className={`semester ${dropBefore !== undefined ? "drop-target" : ""}`} data-term={semester.term}>
      <div className="semester-head">
        <span className="term-name">{semester.term}</span>
        {!isTransfer && <CreditMeter total={total} cap={cap} quiet={semester.courses.every((c) => c.status === "completed")} />}
        {isTransfer && <span className="muted">{total} cr</span>}
        {props.onRemove && (
          <ConfirmButton
            className="icon-btn sm ghost"
            title="Remove this term"
            message={semester.courses.length ? <>Remove {semester.term} and its {semester.courses.length} courses?</> : <>Remove {semester.term}?</>}
            confirmLabel="Remove term"
            onConfirm={props.onRemove}
          >
            <Icon.x />
          </ConfirmButton>
        )}
      </div>
      <table>
        <colgroup>
          <col style={{ width: 30 }} />
          <col style={{ width: cols.class }} />
          <col style={{ width: cols.cr }} />
          <col style={{ width: cols.gened }} />
          <col />
          <col style={{ width: cols.notes }} />
          <col style={{ width: 30 }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            <ResizableTh k="class" {...props}>
              Class
            </ResizableTh>
            <ResizableTh k="cr" {...props}>
              Cr
            </ResizableTh>
            <ResizableTh k="gened" {...props}>
              GenEds
            </ResizableTh>
            <th>Counts toward</th>
            <ResizableTh k="notes" {...props}>
              Notes
            </ResizableTh>
            <th />
          </tr>
        </thead>
        <tbody>
          {semester.courses.map((c) => (
            <CourseRow
              key={c.id}
              course={c}
              term={semester.term}
              {...props}
              dropHere={dropBefore === c.id}
              onPatch={(p, coalesce) => update(c.id, p, coalesce)}
              onRemoveCourse={() => remove(c)}
            />
          ))}
          {dropBefore === null && (
            <tr className="drop-line">
              <td colSpan={7} />
            </tr>
          )}
          <tr className="add-row">
            <td />
            <td colSpan={6}>
              <CourseSearch catalog={catalog} onPick={add} allowUnknown placeholder="+ Add a class (code or title)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function CreditMeter({ total, cap, quiet }: { total: number; cap: number; quiet?: boolean }) {
  const over = total > cap && !quiet;
  return (
    <span className={`credit-meter ${over ? "over" : ""}`}>
      <span className="cm-bar">
        <span style={{ width: `${Math.min(100, (total / cap) * 100)}%` }} />
      </span>
      <span className="cm-text">
        {total} / {cap} cr{over ? " (over the cap)" : ""}
      </span>
    </span>
  );
}

function ResizableTh({ k, cols, onResize, children }: { k: ColKey; cols: ColWidths; onResize: (k: ColKey, w: number) => void; children: React.ReactNode }) {
  const start = (e: React.MouseEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = cols[k];
    const move = (ev: MouseEvent) => onResize(k, Math.max(36, Math.min(600, w0 + ev.clientX - x0)));
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.classList.remove("col-resizing");
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.body.classList.add("col-resizing");
  };
  return (
    <th className="resizable">
      {children}
      <span className="col-resizer" onMouseDown={start} onDoubleClick={() => onResize(k, DEFAULT_COLS[k])} title="Drag to resize · double-click to reset" />
    </th>
  );
}

function CourseRow({
  course: c,
  term,
  catalog,
  usage,
  warnings,
  allCodes,
  terms,
  dropHere,
  drag,
  onDragStart,
  highlight,
  onMove,
  onPatch,
  onRemoveCourse,
}: Props & {
  course: PlanCourse;
  term: string;
  dropHere: boolean;
  onPatch: (p: Partial<PlanCourse>, coalesce?: string) => void;
  onRemoveCourse: () => void;
}) {
  const [editingCode, setEditingCode] = useState(!c.code && !c.geneds.length);
  const [editingGen, setEditingGen] = useState(false);
  const uses = (usage[c.id] ?? []).filter((u) => !u.startsWith("Duplicate"));
  const cat = c.code ? catalog.get(c.code) : undefined;

  const warns = [...(warnings.get(c.id) ?? [])];
  if (c.code && catalog.size && !cat) warns.push("Not in the course catalog. Check the code; credits and GenEds must be entered by hand.");
  for (const x of exclusiveWith(cat)) if (allCodes.has(x)) warns.push(`Credit is only granted for one of ${c.code} / ${x} (${x} is in ${allCodes.get(x)}).`);
  if ((usage[c.id] ?? []).some((u) => u.startsWith("Duplicate"))) warns.push("Duplicate of another entry, so it's only counted once.");

  const setCode = (code: string) => {
    setEditingCode(false);
    const norm = normalizeCode(code);
    if (!norm || norm === c.code) return;
    if (catalog.has(norm)) {
      const fresh = courseFromCatalog(norm, catalog);
      onPatch({ code: norm, credits: fresh.credits, geneds: fresh.geneds, title: fresh.title });
    } else onPatch({ code: norm, title: undefined });
  };

  return (
    <tr
      data-id={c.id}
      className={`st-${c.status} ${drag?.id === c.id ? "dragging" : ""} ${dropHere ? "drop-before" : ""} ${highlight.has(c.id) ? "hl" : ""}`}
    >
      <td className="col-status">
        <div className="status-cell">
        <span className="grip" title="Drag to another term" onPointerDown={(e) => onDragStart(e, c)}>
          <Icon.grip />
        </span>
        <Popover button={<span className={`status-dot st-${c.status}`} />} buttonClassName="status-btn" buttonTitle={STATUS_LABEL[c.status]} width={170}>
          {(close) => (
            <div className="menu">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={s === c.status ? "on" : ""}
                  onClick={() => {
                    onPatch({ status: s });
                    close();
                  }}
                >
                  <span className={`status-dot st-${s}`} /> {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </Popover>
        </div>
      </td>
      <td className="col-class">
        {editingCode ? (
          <CourseSearch catalog={catalog} initial={c.code} autoFocus allowUnknown onPick={setCode} onCancel={() => setEditingCode(false)} placeholder="Code or title" />
        ) : (
          <div className="class-cell">
            <Popover
              button={
                <>
                  <span className="cc-code">{c.code || <i className="muted">GenEd credit</i>}</span>
                  <span className="cc-title">{c.title || cat?.n || ""}</span>
                </>
              }
              buttonClassName="class-btn"
              width={340}
            >
              {(close) => (
                <CourseInfo code={c.code} catalog={catalog} title={c.title} credits={c.credits} grade={c.grade} usage={uses} warnings={warns}>
                  <div className="ci-actions">
                    <button
                      className="btn sm"
                      onClick={() => {
                        close();
                        setEditingCode(true);
                      }}
                    >
                      Change course
                    </button>
                  </div>
                </CourseInfo>
              )}
            </Popover>
            {warns.length > 0 && (
              <Popover button={<Icon.warn />} buttonClassName="warn-btn" buttonTitle="Warnings" width={300}>
                <ul className="warn-list">
                  {warns.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Popover>
            )}
          </div>
        )}
      </td>
      <td className="col-cr">
        <input className="num" type="number" min={0} max={20} value={c.credits} onChange={(e) => onPatch({ credits: Math.max(0, Number(e.target.value) || 0) }, `cr-${c.id}`)} />
      </td>
      <td className="col-gened">
        {editingGen ? (
          <GenedEditor value={c.geneds} onDone={(g) => {
            setEditingGen(false);
            if (g) onPatch({ geneds: g });
          }} />
        ) : (
          <button className="gened-btn" onClick={() => setEditingGen(true)} title="Edit GenEds">
            {c.geneds.length ? formatGeneds(c.geneds) : <span className="muted">—</span>}
          </button>
        )}
      </td>
      <td className="col-counts">
        <div className="chips">
          {uses
            .filter((u) => chipKind(u) !== "univ")
            .map((u) => (
              <span key={u} className={`chip chip-${chipKind(u)}`}>
                {shortUsage(u, c.geneds.flat())}
              </span>
            ))}
        </div>
      </td>
      <td className="col-notes">
        <AutoTextarea value={c.notes} onChange={(v) => onPatch({ notes: v }, `notes-${c.id}`)} />
      </td>
      <td className="col-x">
        <Popover button={<Icon.more />} buttonClassName="icon-btn sm ghost row-menu" buttonTitle="More" align="end" width={200}>
          {(close) => (
            <div className="menu">
              <div className="menu-label">Move to</div>
              <div className="menu-scroll">
                {terms
                  .filter((t) => t !== term)
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        close();
                        onMove(c.id, t, null);
                      }}
                    >
                      {t}
                    </button>
                  ))}
              </div>
              <div className="menu-sep" />
              <button
                className="menu-danger"
                onClick={() => {
                  close();
                  onRemoveCourse();
                }}
              >
                Remove
              </button>
            </div>
          )}
        </Popover>
      </td>
    </tr>
  );
}

function GenedEditor({ value, onDone }: { value: string[][]; onDone: (g: string[][] | null) => void }) {
  const [text, setText] = useState(formatGeneds(value));
  const parsed = parseGenedString(text);
  return (
    <div className="gened-edit">
      <input
        autoFocus
        value={text}
        className={text && !parsed ? "invalid" : ""}
        onChange={(e) => setText(e.target.value.toUpperCase())}
        onBlur={() => onDone(text.trim() ? parsed : [])}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") onDone(null);
        }}
      />
      <div className="gened-help">Comma = all apply, “or” = pick one. e.g. DSHS or DSHU, DVUP</div>
    </div>
  );
}

export function AutoTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function chipKind(u: string): string {
  if (u.startsWith("Computer Science")) return "cs";
  if (u.startsWith("Mathematics")) return "math";
  if (u.startsWith("GenEd")) return "gened";
  if (u.startsWith("University")) return "univ";
  return "minor";
}

const GENED_RE = /\b(FS[A-Z]{2}|DS[A-Z]{2}|SCIS|DVUP|DVCC)\b/g;

// "Mathematics: One of MATH246/436/462 (or 341)" -> "Math · One of MATH246/436/462".
// GenEd labels become the code the course actually uses ("Second diversity (DVUP or DVCC)" -> "DVCC").
export function shortUsage(u: string, courseGeneds: string[] = []): string {
  const [prog, ...rest] = u.split(": ");
  const label = rest.join(": ");
  const p = prog.startsWith("Computer Science") ? "CS" : prog.startsWith("Mathematics") ? "Math" : prog.startsWith("Robotics") ? "RAS" : prog;
  if (p === "GenEd") {
    const codes = label.match(GENED_RE) ?? [];
    return codes.find((c) => courseGeneds.includes(c)) ?? codes[0] ?? label.split(" ")[0];
  }
  return `${p} · ${label.replace(/\s*\(.*?\)\s*/g, " ").trim()}`;
}
