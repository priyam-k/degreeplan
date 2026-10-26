// Everything we know about a course, shown on click (course popovers, flowchart and degree panels).
import type { Catalog } from "../catalog";
import { exclusiveWith } from "../catalog";
import { formatGeneds } from "../geneds";
import { formatReq, permissionNotes, reqCodes } from "../prereqs";
import type { CatalogCourse } from "../types";
import { catalogEntry, offeringOf, prereqOf, type Season } from "../flow/analysis";

const SEASONS: { s: Season; short: string }[] = [
  { s: "Fall", short: "Fall" },
  { s: "Spring", short: "Spring" },
  { s: "Summer", short: "Summer" },
  { s: "Winter", short: "Winter" },
];

export function OfferedBadges({ code, catalog }: { code: string; catalog: Catalog }) {
  const o = offeringOf(code, catalog);
  if (!o.known) return <span className="muted">No recent schedule history</span>;
  return (
    <span className="offered">
      {SEASONS.filter(({ s }) => o.seasons[s].of > 0 && (o.seasons[s].hit > 0 || s === "Fall" || s === "Spring")).map(({ s, short }) => {
        const { hit, of, level } = o.seasons[s];
        return (
          <span key={s} className={`season season-${level}`} title={`${hit} of the last ${of} ${s} terms`}>
            {short} {hit}/{of}
          </span>
        );
      })}
    </span>
  );
}

const SEASON_OF: Record<number, string> = { 1: "Spring", 5: "Summer", 8: "Fall", 12: "Winter" };
// 2608 -> "Fall 2026"
export const yymmTerm = (t: number) => `${SEASON_OF[t % 100] ?? "Term"} 20${String(Math.floor(t / 100)).padStart(2, "0")}`;
const isTopics = (cat: CatalogCourse) => /\b(?:special|selected) topics\b/i.test(cat.n);

// The fine print the course-code checks can't express: permission required on top of the courses,
// ways around them, and, for topics courses with nothing listed, a caution that it varies by topic.
// After a course requirement each line reads as "And …" / "Or …".
export function prereqNotes(cat: CatalogCourse, hasReq: boolean): { text: string; alt: boolean }[] {
  const { required, alternatives } = permissionNotes(cat.p, cat.r);
  const join = (word: string, t: string) => (hasReq ? `${word} ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t);
  const out = [...required.map((t) => ({ text: join("And", t), alt: false })), ...alternatives.map((t) => ({ text: join("Or", t), alt: true }))];
  if (!hasReq && !out.length && !cat.p && isTopics(cat)) out.push({ text: "None listed. Topics courses vary by topic, so check Testudo.", alt: true });
  return out;
}

export function PrereqNotes({ notes }: { notes: { text: string; alt: boolean }[] }) {
  return (
    <>
      {notes.map((n) => (
        <div key={n.text} className={`ci-perm ${n.alt ? "alt" : ""}`}>
          {n.text}
        </div>
      ))}
    </>
  );
}

// Recent topics a reused topics code has had, newest first.
export function TopicHistory({ cat }: { cat: CatalogCourse }) {
  if (!cat.v?.length) return null;
  const rows = [...cat.v].sort((a, b) => Math.max(...b.t) - Math.max(...a.t)).slice(0, 5);
  return (
    <ul className="ci-topics">
      {rows.map((v) => (
        <li key={v.n}>
          <span className="muted">{[...v.t].sort((a, b) => b - a).slice(0, 2).map(yymmTerm).join(", ")}</span> {v.n.split(";").slice(1).join(";").trim()}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  code: string;
  catalog: Catalog;
  title?: string;
  credits?: number;
  grade?: string;
  usage?: string[];
  warnings?: string[];
  have?: (code: string) => boolean; // for ✓/✗ on prerequisites
  onCode?: (code: string) => void; // clickable course codes
  children?: React.ReactNode;
}

export function CourseInfo({ code, catalog, title, credits, grade, usage, warnings, have, onCode, children }: Props) {
  const cat = catalogEntry(code, catalog);
  const req = prereqOf(code, catalog);
  const excl = exclusiveWith(cat);
  const notes = cat ? prereqNotes(cat, !!req) : [];
  const codeBtn = (c: string) =>
    onCode ? (
      <button key={c} className={`code-chip ${have ? (have(c) ? "have" : "need") : ""}`} onClick={() => onCode(c)}>
        {c}
      </button>
    ) : (
      <span key={c} className={`code-chip ${have ? (have(c) ? "have" : "need") : ""}`}>
        {c}
      </span>
    );
  return (
    <div className="course-info">
      <div className="ci-head">
        <span className="ci-code">{code || "GenEd credit"}</span>
        <span className="ci-cr">{cat?.mx ? `${cat.cr}–${cat.mx}` : credits ?? cat?.cr ?? "?"} cr</span>
      </div>
      <div className="ci-title">{cat?.n ?? title ?? (code ? "Not in the course catalog" : "")}</div>
      {warnings?.map((w) => (
        <div key={w} className="ci-warn">
          {w}
        </div>
      ))}
      <dl className="ci-facts">
        {cat?.g?.length ? (
          <>
            <dt>GenEds</dt>
            <dd>{formatGeneds(cat.g)}</dd>
          </>
        ) : null}
        {code && (
          <>
            <dt>Offered</dt>
            <dd>
              <OfferedBadges code={code} catalog={catalog} />
            </dd>
          </>
        )}
        {cat && (
          <>
            <dt>Prereqs</dt>
            <dd>
              {req && (
                <>
                  <div className="ci-req">{formatReq(req)}</div>
                  <div className="ci-codes">{reqCodes(req).map(codeBtn)}</div>
                </>
              )}
              <PrereqNotes notes={notes} />
              {!req && !notes.length && "None"}
            </dd>
            {cat.r && (
              <>
                <dt>Restriction</dt>
                <dd>{cat.r}</dd>
              </>
            )}
            {cat.v && (
              <>
                <dt>Topics</dt>
                <dd>
                  <TopicHistory cat={cat} />
                </dd>
              </>
            )}
          </>
        )}
        {excl.length > 0 && (
          <>
            <dt>Exclusive</dt>
            <dd>Credit only for one of {[code, ...excl].join(", ")}</dd>
          </>
        )}
        {grade && (
          <>
            <dt>Grade</dt>
            <dd>{grade}</dd>
          </>
        )}
        {usage && (
          <>
            <dt>Counts for</dt>
            <dd>{usage.length ? usage.map((u) => <div key={u}>{u}</div>) : <span className="muted">Nothing yet (extra credit toward 120)</span>}</dd>
          </>
        )}
      </dl>
      {cat?.p && req && formatReq(req) !== cat.p && <div className="ci-raw">Catalog text: {cat.p}</div>}
      {children}
    </div>
  );
}
