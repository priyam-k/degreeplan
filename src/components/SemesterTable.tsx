import { useState } from "react";
import type { CourseStatus, PlanCourse, Semester } from "../types";
import type { Catalog } from "../catalog";
import { exclusiveWith } from "../catalog";
import { formatGeneds, parseGenedString } from "../geneds";
import { courseFromCatalog, uid } from "../plan";
import { normalizeCode } from "../engine/match";

const STATUS_ORDER: CourseStatus[] = ["planned", "inprogress", "completed", "transfer"];
const STATUS_LABEL: Record<CourseStatus, string> = {
  planned: "Planned",
  inprogress: "In progress",
  completed: "Completed",
  transfer: "Transfer / AP",
};

export function creditCap(term: string): number {
  if (term.startsWith("Winter")) return 4;
  if (term.startsWith("Summer")) return 16;
  return 17;
}

interface Props {
  semester: Semester;
  catalog: Catalog;
  usage: Record<string, string[]>;
  allCodes: Map<string, string>; // code -> term, for cross-plan warnings
  onChange: (s: Semester) => void;
  onRemove?: () => void;
}

export function SemesterTable({ semester, catalog, usage, allCodes, onChange, onRemove }: Props) {
  const total = semester.courses.reduce((n, c) => n + c.credits, 0);
  const isTransfer = semester.term.startsWith("Transfer");
  const cap = creditCap(semester.term);

  const update = (id: string, patch: Partial<PlanCourse>) =>
    onChange({ ...semester, courses: semester.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const remove = (id: string) => onChange({ ...semester, courses: semester.courses.filter((c) => c.id !== id) });
  const add = () =>
    onChange({
      ...semester,
      courses: [
        ...semester.courses,
        { id: uid(), code: "", credits: 3, geneds: [], notes: "", status: isTransfer ? "transfer" : "planned" },
      ],
    });

  return (
    <div className="semester">
      <div className="semester-head">
        <span>{semester.term}</span>
        {onRemove && !semester.courses.length && (
          <button className="link" onClick={onRemove} title="Remove this term">
            remove
          </button>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th className="col-status" />
            <th className="col-class">Class</th>
            <th className="col-cr">Cr</th>
            <th className="col-gened">GenEds</th>
            <th className="col-counts">Counts toward</th>
            <th className="col-notes">Notes</th>
            <th className="col-x" />
          </tr>
        </thead>
        <tbody>
          {semester.courses.map((c) => (
            <CourseRow
              key={c.id}
              course={c}
              catalog={catalog}
              usage={usage[c.id] ?? []}
              allCodes={allCodes}
              onPatch={(p) => update(c.id, p)}
              onRemove={() => remove(c.id)}
            />
          ))}
          <tr className="add-row">
            <td colSpan={7}>
              <button className="link" onClick={add}>
                + add class
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td>Total:</td>
            <td className={`num ${!isTransfer && total > cap ? "over" : ""}`} title={!isTransfer && total > cap ? `Over the ${cap}-credit CMNS cap` : ""}>
              {total}
            </td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CourseRow({
  course: c,
  catalog,
  usage,
  allCodes,
  onPatch,
  onRemove,
}: {
  course: PlanCourse;
  catalog: Catalog;
  usage: string[];
  allCodes: Map<string, string>;
  onPatch: (p: Partial<PlanCourse>) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState(c.code);
  const [gen, setGen] = useState(formatGeneds(c.geneds));
  const [prevGeneds, setPrevGeneds] = useState(c.geneds);
  if (prevGeneds !== c.geneds) {
    setPrevGeneds(c.geneds);
    setGen(formatGeneds(c.geneds));
  }

  const cat = c.code ? catalog.get(c.code) : undefined;
  const commitCode = () => {
    const norm = normalizeCode(code);
    setCode(norm);
    if (norm === c.code) return;
    if (catalog.has(norm)) {
      const fresh = courseFromCatalog(norm, catalog);
      onPatch({ code: norm, credits: fresh.credits, geneds: fresh.geneds, title: fresh.title });
    } else onPatch({ code: norm, title: undefined });
  };

  const warnings: string[] = [];
  if (c.code && catalog.size && !cat) warnings.push("Not in the course catalog (check the code; credits/GenEds must be entered by hand)");
  for (const x of exclusiveWith(cat)) if (allCodes.has(x)) warnings.push(`Credit only granted for one of ${c.code} / ${x} (${x} in ${allCodes.get(x)})`);
  if (usage.some((u) => u.startsWith("Duplicate"))) warnings.push("Duplicate of another entry — counted once");

  const tip = [cat ? `${cat.c}: ${cat.n}` : c.title, cat?.p ? `Prereq: ${cat.p}` : "", cat?.x ? `Credit only granted for: ${cat.x}` : "", c.grade ? `Grade: ${c.grade}` : ""]
    .filter(Boolean)
    .join("\n");

  const next = STATUS_ORDER[(STATUS_ORDER.indexOf(c.status) + 1) % STATUS_ORDER.length];
  return (
    <tr className={`st-${c.status}`}>
      <td className="col-status">
        <button className={`status-dot st-${c.status}`} title={`${STATUS_LABEL[c.status]} — click for ${STATUS_LABEL[next]}`} onClick={() => onPatch({ status: next })} />
      </td>
      <td className="col-class" title={tip}>
        <input
          className="code"
          list="course-codes"
          value={code}
          placeholder={c.code === "" && c.geneds.length ? "(GenEd credit)" : "CMSC4xx"}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onBlur={commitCode}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
        {warnings.length > 0 && (
          <span className="warn" title={warnings.join("\n")}>
            ⚠
          </span>
        )}
      </td>
      <td className="col-cr">
        <input
          className="num"
          type="number"
          min={0}
          max={20}
          value={c.credits}
          onChange={(e) => onPatch({ credits: Math.max(0, Number(e.target.value) || 0) })}
        />
      </td>
      <td className="col-gened">
        <input
          value={gen}
          title='GenEds: commas = all apply, "or" = pick one. e.g. "DSHS or DSHU, DVUP"'
          onChange={(e) => setGen(e.target.value)}
          onBlur={() => onPatch({ geneds: parseGenedString(gen) ?? [] })}
        />
      </td>
      <td className="col-counts">
        {usage
          .filter((u) => !u.startsWith("Duplicate") && chipKind(u) !== "univ")
          .map((u) => (
            <span key={u} className={`chip chip-${chipKind(u)}`} title={u}>
              {shortUsage(u)}
            </span>
          ))}
      </td>
      <td className="col-notes">
        <input value={c.notes} onChange={(e) => onPatch({ notes: e.target.value })} />
      </td>
      <td className="col-x">
        <button className="link x" onClick={onRemove} title="Remove">
          ×
        </button>
      </td>
    </tr>
  );
}

function chipKind(u: string): string {
  if (u.startsWith("Computer Science")) return "cs";
  if (u.startsWith("Mathematics")) return "math";
  if (u.startsWith("GenEd")) return "gened";
  if (u.startsWith("University")) return "univ";
  return "minor";
}

function shortUsage(u: string): string {
  const [prog, label] = u.split(": ");
  const p = prog.startsWith("Computer Science") ? "CS" : prog.startsWith("Mathematics") ? "Math" : prog.startsWith("Robotics") ? "RAS" : prog;
  if (p === "GenEd") return label.split(" ")[0];
  return `${p}: ${label.length > 22 ? label.slice(0, 21) + "…" : label}`;
}
