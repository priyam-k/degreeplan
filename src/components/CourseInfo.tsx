// Everything we know about a course, shown on click (course popovers, flowchart and degree panels).
import type { Catalog } from "../catalog";
import { exclusiveWith } from "../catalog";
import { formatGeneds } from "../geneds";
import { formatReq, reqCodes } from "../prereqs";
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
              {req ? (
                <>
                  <div className="ci-req">{formatReq(req)}</div>
                  <div className="ci-codes">{reqCodes(req).map(codeBtn)}</div>
                </>
              ) : (
                "None"
              )}
            </dd>
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
