import { useEffect, useMemo, useRef, useState } from "react";
import type { AuditResult, Plan, Program } from "../types";
import type { Catalog } from "../catalog";
import { shortName, type Highs } from "../engine/solver";
import { normalizeCode } from "../engine/match";
import { formatReq, reqCodes } from "../prereqs";
import { TRANSFER_TERM } from "../transcript";
import { creditCap } from "../plan";
import {
  buildTimeline,
  catalogEntry,
  checkPlacement,
  isCurrent,
  prereqAt,
  prereqOf,
  projector,
  suggestions,
  unlocksOf,
  unmetNeeds,
  whatIf,
  type Change,
  type Delta,
  type PlaceCheck,
  type Timeline,
} from "./analysis";
import { buildGraph, relatives, variants, COLW, NODEW, NODEH, GAP, type FNode } from "./graph";
import { CourseSearch } from "../ui/CourseSearch";
import { Popover } from "../ui/Popover";
import { Icon } from "../ui/icons";
import { startDrag } from "../ui/drag";
import { OfferedBadges } from "../components/CourseInfo";
import { progressOf } from "../components/AuditPanel";
import { STATUS_LABEL } from "../components/SemesterTable";

const HEADH = 40;
const ZOOM_KEY = "degreeplan.flowZoom";
export const shortTerm = (t: string) => (t === TRANSFER_TERM ? "AP / transfer" : t.replace(/(\w+) 20(\d\d)/, (_, s, y) => `${s} ’${y}`));

interface Props {
  plan: Plan;
  programs: Program[];
  catalog: Catalog;
  audit: AuditResult | null;
  highs: Highs | null;
  onChange: (ch: Change, toast?: string) => void;
}

interface DragState {
  key: string;
  idx?: number;
  trash?: boolean;
  x?: number;
  y?: number;
}

export function FlowView({ plan, programs, catalog, audit, highs, onChange }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [explore, setExplore] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [zoom, setZoomState] = useState(() => {
    try {
      return Number(localStorage.getItem(ZOOM_KEY)) || 1;
    } catch {
      return 1;
    }
  });
  const [drag, setDrag] = useState<DragState | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const justDragged = useRef(false);

  const setZoom = (z: number) => {
    const v = Math.round(Math.max(0.5, Math.min(1.3, z)) * 10) / 10;
    setZoomState(v);
    try {
      localStorage.setItem(ZOOM_KEY, String(v));
    } catch {
      /* ignore */
    }
  };

  const tl = useMemo(() => buildTimeline(plan, programs, catalog), [plan, programs, catalog]);
  const project = useMemo(() => projector(tl, catalog), [tl, catalog]);
  const needs = useMemo(() => (audit && !audit.error ? unmetNeeds(audit) : []), [audit]);
  const graph = useMemo(
    () => buildGraph({ tl, catalog, audit, needs, project, showOptions, showAll, explore }),
    [tl, catalog, audit, needs, project, showOptions, showAll, explore],
  );
  // open major/minor requirements the chart can suggest courses for
  const optionNeeds = needs.filter((n) => n.match && !n.broad && n.programId !== "gened" && n.programId !== "university").length;
  const tips = useMemo(
    () => (audit && !audit.error && catalog.size ? suggestions(plan, programs, catalog, audit, formatReq) : []),
    [plan, programs, catalog, audit],
  );

  const sel = graph.nodes.find((n) => n.key === selected) ?? null;
  // the explored course a ghost belongs to (itself, or the course it's a prerequisite step for)
  const exploredRoot = (n: FNode): string | undefined => {
    for (let cur: FNode | undefined = n; cur; cur = graph.nodes.find((m) => m.kind === "ghost" && m.code === cur!.chainFor))
      if (explore.includes(cur.code)) return cur.code;
    return undefined;
  };
  const focusKey = drag?.key ?? selected ?? hover;
  const related = useMemo(() => (focusKey ? relatives(focusKey, graph.edges) : null), [focusKey, graph.edges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".popover")) setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focus = (code: string) => {
    const c = normalizeCode(code);
    setSearchErr("");
    if (!c) return;
    const existing = graph.nodes.find((n) => variants(n.code).includes(c));
    if (existing) {
      setSelected(existing.key);
      setTimeout(() => document.querySelector(`[data-key="${existing.key}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }), 30);
      return;
    }
    if (!catalogEntry(c, catalog)) return setSearchErr(`${c} isn't in the course catalog`);
    if (project(c).idx === Infinity) return setSearchErr(`${c} can't fit in your timeline (prerequisite chain too long or not offered)`);
    setExplore((e) => [...e.filter((x) => x !== c), c]);
    setSelected(`ghost:${c}`);
  };

  // The change that dropping node `n` on slot `idx` would make
  const changeFor = (n: FNode, idx: number): Change | null => {
    const term = tl.slots[idx]?.term;
    if (!term || idx < tl.firstOpen) return null;
    if (n.kind === "ghost") return { kind: "add", code: n.code, term };
    if (n.kind === "placed" && n.course!.status === "planned" && idx !== n.idx) return { kind: "move", id: n.course!.id, term };
    return null;
  };
  const dragNode = drag ? graph.nodes.find((n) => n.key === drag.key) : undefined;
  const dragIdx = drag?.idx;
  const dragTrash = drag?.trash;
  const dragCheck = useMemo<PlaceCheck | null>(() => {
    if (!dragNode || dragIdx === undefined || dragTrash) return null;
    if (dragIdx < tl.firstOpen) return { level: "bad", lines: ["That term is already underway or done"] };
    if (dragIdx === dragNode.idx && dragNode.kind === "placed") return { level: "good", lines: ["Current term"] };
    const ch = changeFor(dragNode, dragIdx);
    return ch ? checkPlacement(plan, programs, catalog, ch) : null;
  }, [dragNode, dragIdx, dragTrash, plan, programs, catalog, tl]);

  const pos = graph.pos;
  const width = graph.cols.length * COLW + 20;
  const height = graph.maxRows * (NODEH + GAP) + 40;
  const colX = (idx: number) => graph.cols.indexOf(idx) * COLW + 10;
  const movable = (n: FNode) => n.kind === "ghost" || (n.kind === "placed" && n.course!.status === "planned");
  const colAt = (x: number) => {
    const r = canvas.current?.getBoundingClientRect();
    if (!r) return undefined;
    const col = Math.floor(((x - r.left) / zoom - 10) / COLW);
    return graph.cols[Math.max(0, Math.min(col, graph.cols.length - 1))];
  };

  const onNodePointerDown = (e: React.PointerEvent, n: FNode) => {
    if (!movable(n)) return;
    startDrag(e, {
      label: n.code,
      onStart: () => setDrag({ key: n.key }),
      onMove: (x, _y, el) => {
        const trash = !!el?.closest(".flow-trash");
        const idx = trash ? undefined : colAt(x);
        setDrag((d) => (d ? { ...d, idx, trash, x, y: _y } : d));
      },
      onDrop: (x, _y, el) => {
        if (el?.closest(".flow-trash")) {
          if (n.kind === "placed") onChange({ kind: "remove", id: n.course!.id }, `Removed ${n.code}`);
          else setExplore((ex) => ex.filter((c) => c !== n.code));
          setSelected(null);
          return;
        }
        const idx = colAt(x);
        const ch = idx === undefined ? null : changeFor(n, idx);
        if (!ch || idx === undefined) return;
        onChange(ch, ch.kind === "add" ? `Added ${n.code} to ${tl.slots[idx].term}` : `Moved ${n.code} to ${tl.slots[idx].term}`);
        if (ch.kind === "add") setExplore((ex) => ex.filter((c) => c !== n.code));
        setSelected(null);
      },
      onEnd: () => {
        setDrag(null);
        justDragged.current = true;
        setTimeout(() => (justDragged.current = false), 0);
      },
    });
  };

  return (
    <main className="flow-main">
      <section className="flow card">
        <div className="flow-toolbar">
          <div className="flow-search">
            <CourseSearch catalog={catalog} onPick={focus} placeholder="Explore any course…" />
            {searchErr && <span className="error small">{searchErr}</span>}
          </div>
          <label className={`toggle-chip ${showOptions ? "on" : ""} ${!optionNeeds ? "off" : ""}`} title={optionNeeds ? "Show courses that would fill your open major and minor requirements" : "Every major and minor requirement is covered"}>
            <input type="checkbox" checked={showOptions && !!optionNeeds} disabled={!optionNeeds} onChange={(e) => setShowOptions(e.target.checked)} />
            {optionNeeds ? `Suggest courses for ${optionNeeds} open requirement${optionNeeds > 1 ? "s" : ""}` : "No open requirements"}
          </label>
          <label className={`toggle-chip ${showAll ? "on" : ""}`}>
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> All courses
          </label>
          {explore.length > 0 && (
            <button className="btn sm" onClick={() => setExplore([])}>
              <Icon.x /> Clear explored ({explore.length})
            </button>
          )}
          <div className="flow-tools">
            <Popover button="Legend" buttonClassName="btn sm" align="end" width={260}>
              <Legend />
            </Popover>
            <div className="zoom">
              <button className="icon-btn sm" onClick={() => setZoom(zoom - 0.1)} aria-label="Zoom out" disabled={zoom <= 0.5}>
                <Icon.zoomOut />
              </button>
              <button className="zoom-val" onClick={() => setZoom(1)} title="Reset zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button className="icon-btn sm" onClick={() => setZoom(zoom + 0.1)} aria-label="Zoom in" disabled={zoom >= 1.3}>
                <Icon.zoomIn />
              </button>
            </div>
          </div>
        </div>

        <div className="flow-scroll" onClick={() => !justDragged.current && setSelected(null)}>
          <div className="flow-inner" style={{ width: width * zoom, height: HEADH + height * zoom }}>
            <div className="flow-heads" style={{ width: width * zoom }}>
              {graph.cols.map((idx) => {
                const s = tl.slots[idx];
                const credits = tl.placed.filter((p) => p.idx === idx).reduce((n, p) => n + p.course.credits, 0);
                const past = idx < tl.firstOpen;
                const over = !past && credits > creditCap(s.term);
                const target = dragIdx === idx && !dragTrash;
                return (
                  <div
                    key={idx}
                    className={`flow-head ${past ? "past" : ""} ${s.virtual ? "virtual" : ""} ${target ? `target ${dragCheck?.level ?? ""}` : ""}`}
                    style={{ left: colX(idx) * zoom, width: (COLW - 8) * zoom }}
                    title={`${s.term}${credits ? ` · ${credits} cr` : ""}`}
                  >
                    <span className="fh-term">{shortTerm(s.term)}</span>
                    {/* zoomed out, the column is too narrow for both */}
                    {zoom >= 0.8 && <span className={`fh-cr ${over ? "error" : ""}`}>{s.virtual ? "not planned" : credits ? `${credits} cr` : ""}</span>}
                  </div>
                );
              })}
            </div>
            <div ref={canvas} className="flow-canvas" style={{ width, height, transform: `scale(${zoom})` }}>
              {graph.cols.map((idx) => {
                const s = tl.slots[idx];
                const target = dragIdx === idx && !dragTrash;
                return (
                  <div
                    key={idx}
                    className={`flow-col ${idx < tl.firstOpen ? "past" : ""} ${s.virtual ? "virtual" : ""} ${target ? `target ${dragCheck?.level ?? ""}` : ""}`}
                    style={{ left: colX(idx), width: COLW - 8, height }}
                  >
                  </div>
                );
              })}
              {[...graph.hidden].map(([idx, list]) =>
                graph.cols.includes(idx) ? (
                  <button
                    key={`hidden:${idx}`}
                    className="flow-more"
                    style={{ left: graph.cols.indexOf(idx) * COLW + 16, top: 12 + (graph.rowsIn(idx) - 1) * (NODEH + GAP), width: NODEW }}
                    title={`Not part of a major or minor: ${list.map((c) => c.code).join(", ")}. Click to show all courses.`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAll(true);
                    }}
                  >
                    +{list.length === 1 ? ` ${list[0].code}` : ` ${list.length} more`} · {list.reduce((n, c) => n + c.credits, 0)} cr
                  </button>
                ) : null,
              )}
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
                  // Arrows out of AP credit or spanning several terms stay faint until something is focused.
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
                    data-key={n.key}
                    className={`fnode ${st} ${n.key === selected ? "sel" : ""} ${dim ? "dim" : ""} ${n.problem ? "problem" : ""} ${movable(n) ? "movable" : ""} ${drag?.key === n.key ? "lifted" : ""}`}
                    style={{ left: p.x, top: p.y, width: NODEW, height: NODEH }}
                    onPointerDown={(e) => onNodePointerDown(e, n)}
                    onMouseEnter={() => setHover(n.key)}
                    onMouseLeave={() => setHover((h) => (h === n.key ? null : h))}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (justDragged.current) return;
                      setSelected(n.key === selected ? null : n.key);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const ch = n.kind === "ghost" ? changeFor(n, n.idx) : null;
                      if (ch) onChange(ch, `Added ${n.code} to ${tl.slots[n.idx].term}`);
                    }}
                  >
                    <span className="fn-code">
                      {n.code}
                      {n.problem && (
                        <span className="fn-warn">
                          <Icon.warn />
                        </span>
                      )}
                    </span>
                    <span className="fn-sub">{n.kind === "ghost" ? (n.forNeeds[0]?.replace(/^[^:]+: /, "") ?? (n.chainFor ? `needed for ${n.chainFor}` : n.title)) : n.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {dragNode && drag?.x !== undefined && (dragCheck || drag.trash) && (
          <div className={`drop-verdict ${drag.trash ? "bad" : dragCheck!.level}`} style={{ left: drag.x + 14, top: drag.y! + 40 }}>
            {drag.trash ? (
              <div>{dragNode.kind === "placed" ? "Remove from plan" : "Dismiss"}</div>
            ) : (
              <>
                <div className="dv-term">{tl.slots[dragIdx!]?.term}</div>
                {dragCheck!.lines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </>
            )}
          </div>
        )}
        {dragNode && (
          <div className={`flow-trash ${dragTrash ? "over" : ""}`}>
            <Icon.trash /> {dragNode.kind === "placed" ? "Drop here to remove from plan" : "Drop here to dismiss"}
          </div>
        )}
      </section>

      <aside className="flow-side card">
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
            onFocus={focus}
            onClose={() => setSelected(null)}
            explored={exploredRoot(sel)}
            onDismiss={(code) => {
              setExplore((e) => e.filter((x) => x !== code));
              setSelected(null);
            }}
            onChange={(chs, toast) => {
              chs.forEach((c, i) => onChange(c, i === chs.length - 1 ? toast : undefined));
              const last = chs[chs.length - 1];
              if (last.kind === "add" || last.kind === "replace") setExplore((e) => e.filter((x) => x !== last.code));
              if (last.kind !== "move") setSelected(null);
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

function Legend() {
  return (
    <div className="legend-pop">
      <div>
        <span className="fn-swatch st-completed" /> Completed or transfer
      </div>
      <div>
        <span className="fn-swatch st-inprogress" /> In progress
      </div>
      <div>
        <span className="fn-swatch st-planned" /> Planned
      </div>
      <div>
        <span className="fn-swatch ghost" /> Option, not in your plan yet
      </div>
      <div>
        <span className="fn-swatch exempt" /> Waived (exemption)
      </div>
      <div>
        <span className="edge-key" /> Prerequisite
      </div>
      <div>
        <span className="edge-key dashed" /> One of several allowed prerequisites
      </div>
      <div>
        <span className="edge-key bad" /> Prerequisite scheduled too late
      </div>
      <p className="muted small">Drag planned courses or options onto a term. Double-click an option to add it at its earliest term.</p>
    </div>
  );
}

function Overview({ audit, tips, onFocus }: { audit: AuditResult | null; tips: ReturnType<typeof suggestions>; onFocus: (c: string) => void }) {
  const [allTips, setAllTips] = useState(false);
  if (!audit) return <div className="muted">Loading the requirement solver…</div>;
  if (audit.error) return <div className="error">Audit failed: {audit.error}</div>;
  const needs = unmetNeeds(audit);
  const shown = allTips ? tips : tips.slice(0, 8);
  return (
    <div className="flow-overview">
      <h3>Where you stand</h3>
      <div className="audit-summary">
        {audit.programs.map((p) => {
          const { done, total } = progressOf(p);
          const left = needs.filter((n) => n.programId === p.program.id);
          return (
            <div key={p.program.id}>
              <div className="as-row">
                <span className={`status-pip ${p.satisfied ? "ok" : "todo"}`} />
                <span className="as-name">{shortName(p.program)}</span>
                <span className="as-bar">
                  <span style={{ width: `${(done / total) * 100}%` }} className={p.satisfied ? "ok" : ""} />
                </span>
                <span className="as-count">
                  {done}/{total}
                </span>
              </div>
              {left.length > 0 && (
                <div className="as-left">
                  {left
                    .slice(0, 3)
                    .map((n) => n.label)
                    .join(" · ")}
                  {left.length > 3 && <span className="muted"> and {left.length - 3} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <h3>Suggestions</h3>
      {tips.length === 0 && <p className="muted">Nothing to flag. Prerequisites, offerings and requirements all line up.</p>}
      <ul className="tips">
        {shown.map((t, i) => (
          <li key={i} className={`tip-${t.level}`}>
            <span className="tip-icon">{t.level === "warn" ? <Icon.warn /> : t.level === "info" ? <Icon.info /> : <Icon.arrowRight />}</span>
            <span>
              <Linkify text={t.text} codes={t.codes} onFocus={onFocus} />
            </span>
          </li>
        ))}
      </ul>
      {tips.length > shown.length && (
        <button className="btn-link" onClick={() => setAllTips(true)}>
          Show {tips.length - shown.length} more
        </button>
      )}
      <div className="flow-hint">
        Click a course for details and options. Drag planned courses or dashed options onto a term; the column shows whether it works before you drop. Everything can be undone.
      </div>
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
          <button key={i} className="code-link" onClick={() => onFocus(p)}>
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
  onFocus: (c: string) => void;
  onClose: () => void;
  explored?: string; // the explored course this option belongs to, if any
  onDismiss: (code: string) => void; // take an explored course (and its prerequisite steps) off the chart
  onChange: (ch: Change[], toast?: string) => void;
}) {
  const { node, tl, plan, programs, catalog, audit, highs, explored, onFocus, onClose, onDismiss, onChange } = props;
  const [swap, setSwap] = useState<string | null>(null);
  const cat = catalogEntry(node.code, catalog);
  const req = prereqOf(node.code, catalog);
  const planned = node.kind === "placed" && node.course!.status === "planned";
  const usage = node.kind === "placed" ? audit?.usage[node.course!.id] ?? [] : [];
  const openSlots = tl.slots.filter((s) => s.idx >= tl.firstOpen);
  const termOf = (idx: number) => tl.slots[idx]?.term;
  const check = (ch: Change) => checkPlacement(plan, programs, catalog, ch);
  const project = useMemo(() => projector(tl, catalog), [tl, catalog]);

  // planned: neighbouring open terms; option: its earliest term
  const prevIdx = planned ? [...openSlots].reverse().find((s) => s.idx < node.idx)?.idx : undefined;
  const nextIdx = planned ? openSlots.find((s) => s.idx > node.idx)?.idx : undefined;
  const moveTo = (idx: number): Change => ({ kind: "move", id: node.course!.id, term: termOf(idx) });
  const addAt = (idx: number): Change => ({ kind: "add", code: node.code, term: termOf(idx) });

  const addDelta = useMemo(
    () => (highs && audit && node.kind === "ghost" ? whatIf(highs, plan, programs, catalog, audit, addAt(node.idx)) : null),
    [highs, audit, plan, programs, catalog, node],
  );
  const dropDelta = useMemo(
    () => (highs && audit && planned ? whatIf(highs, plan, programs, catalog, audit, { kind: "remove", id: node.course!.id }) : null),
    [highs, audit, plan, programs, catalog, node, planned],
  );
  const swapChange: Change | null = swap && planned ? { kind: "replace", id: node.course!.id, code: swap, term: termOf(Math.max(node.idx, project(swap).idx)) } : null;
  const swapDelta = useMemo(
    () => (highs && audit && swapChange ? whatIf(highs, plan, programs, catalog, audit, swapChange) : null),
    [highs, audit, plan, programs, catalog, swap],
  );

  // Other courses that would fill the same major/minor requirements as this planned course.
  const swapOptions = useMemo(() => {
    if (!planned || !audit || audit.error) return [];
    const uses = audit.programs
      .filter((p) => p.program.kind === "major" || p.program.kind === "minor")
      .flatMap((p) => p.buckets.filter((b) => b.assigned.includes(node.course!.id)).map((b) => ({ label: `${shortName(p.program)}: ${b.bucket.label}`, match: b.bucket.match })));
    if (!uses.length) return [];
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
    const grad = (c: string) => (Number(c.slice(4, 7)) >= 500 ? 1 : 0);
    return out
      .sort((a, b) => grad(a.code) - grad(b.code) || a.chain.length - b.chain.length || b.fills.length - a.fills.length || a.idx - b.idx || a.code.localeCompare(b.code))
      .slice(0, 12);
  }, [node, planned, audit, tl, catalog, project]);

  // Courses this one leads to: in the plan first, then ones relevant to open requirements or the programs.
  const needs = audit && !audit.error ? unmetNeeds(audit) : [];
  const ctx0 = { term: "", transfer: false, ap: false };
  const relevant = (c: string) =>
    needs.some((n) => n.match?.(c, ctx0)) ||
    programs.some((p) => (p.kind === "major" || p.kind === "minor") && p.buckets.some((b) => !b.discipline && b.match(c, ctx0)));
  const unlocks = unlocksOf(node.code, catalog)
    .filter((c) => isCurrent(c, catalog) || tl.idxOf(c) !== undefined)
    .map((c) => ({ c, placedIdx: tl.idxOf(c), rel: tl.idxOf(c) !== undefined ? 2 : relevant(c) ? 1 : 0 }))
    .filter((u) => u.rel > 0)
    .sort((a, b) => b.rel - a.rel || a.c.localeCompare(b.c));

  const at = node.kind === "exempt" ? null : prereqAt(node.code, node.idx, tl, catalog);
  const have = (c: string) => tl.hasBefore(c, node.idx);
  const status = node.kind === "placed" ? STATUS_LABEL[node.course!.status] : node.kind === "ghost" ? "Option" : "Waived";

  return (
    <div className="flow-details">
      <div className="fd-head">
        <div>
          <div className="fd-code">
            {node.code} <span className={`pill pill-${node.kind === "placed" ? node.course!.status : node.kind}`}>{status}</span>
          </div>
          <div className="fd-title">{cat?.n ?? node.title}</div>
          <div className="fd-meta">
            {node.kind === "placed" ? termOf(node.idx) : node.kind === "ghost" ? `Earliest: ${termOf(node.idx)}` : "Satisfied by waiver"} ·{" "}
            {cat?.mx ? `${cat.cr}–${cat.mx}` : cat?.cr ?? node.credits} cr
          </div>
        </div>
        <button className="icon-btn sm" onClick={onClose} aria-label="Close">
          <Icon.x />
        </button>
      </div>

      {planned && (
        <div className="fd-actions">
          <MoveButton
            dir="earlier"
            idx={prevIdx}
            term={prevIdx !== undefined ? termOf(prevIdx) : ""}
            check={prevIdx !== undefined ? check(moveTo(prevIdx)) : null}
            onClick={() => prevIdx !== undefined && onChange([moveTo(prevIdx)], `Moved ${node.code} to ${termOf(prevIdx)}`)}
          />
          <MoveButton
            dir="later"
            idx={nextIdx}
            term={nextIdx !== undefined ? termOf(nextIdx) : ""}
            check={nextIdx !== undefined ? check(moveTo(nextIdx)) : null}
            onClick={() => nextIdx !== undefined && onChange([moveTo(nextIdx)], `Moved ${node.code} to ${termOf(nextIdx)}`)}
          />
          <TermMenu
            label="Move to…"
            slots={openSlots.filter((s) => s.idx !== node.idx)}
            check={(idx) => check(moveTo(idx))}
            onPick={(idx) => onChange([moveTo(idx)], `Moved ${node.code} to ${termOf(idx)}`)}
          />
        </div>
      )}
      {node.kind === "ghost" && (
        <div className="fd-actions">
          <button className="btn primary" onClick={() => onChange([addAt(node.idx)], `Added ${node.code} to ${termOf(node.idx)}`)}>
            <Icon.plus /> Add to {termOf(node.idx)}
          </button>
          <TermMenu label="Other term…" slots={openSlots} check={(idx) => check(addAt(idx))} onPick={(idx) => onChange([addAt(idx)], `Added ${node.code} to ${termOf(idx)}`)} />
          {!!node.chain?.length && (
            <button
              className="btn fd-wide"
              onClick={() => {
                const steps = node.chain!.map((c): Change => ({ kind: "add", code: c, term: termOf(project(c).idx) }));
                onChange([...steps, addAt(node.idx)], `Added ${[...node.chain!, node.code].join(", ")}`);
              }}
            >
              Add with prerequisites: {[...node.chain, node.code].join(" → ")}
            </button>
          )}
          {explored && (
            <button className="btn fd-wide" onClick={() => onDismiss(explored)}>
              <Icon.x /> Remove {explored === node.code ? "" : `${explored} and its prerequisites `}from the chart
            </button>
          )}
        </div>
      )}

      {node.kind === "ghost" && (
        <Section title={`If you add it in ${termOf(node.idx)}`}>
          {node.forNeeds.length > 0 && <div className="fd-fills">Suggested for {node.forNeeds.join("; ")}</div>}
          <DeltaView d={addDelta} />
        </Section>
      )}
      {node.kind === "placed" && (
        <Section title="Counts toward">
          {usage.length ? (
            <ul className="fd-list">
              {usage.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <span className="muted">Nothing specific yet (counts toward 120 credits)</span>
          )}
        </Section>
      )}

      <Section title="Prerequisites">
        {req ? (
          <>
            <div className="fd-req">{formatReq(req)}</div>
            <div className="ci-codes">
              {reqCodes(req).map((c) => (
                <button key={c} className={`code-chip ${node.kind !== "exempt" ? (have(c) ? "have" : "need") : ""}`} onClick={() => onFocus(c)}>
                  {c}
                </button>
              ))}
            </div>
            {at && !at.ok && node.kind === "ghost" && (
              <div className="fd-note">
                Still needs {formatReq(at.missing)}
                {node.chain?.length ? `: add ${node.chain.join(" → ")} first` : ""}
              </div>
            )}
            {at && !at.ok && planned && (
              <div className="fd-note bad">
                Not met before {termOf(node.idx)}: needs {formatReq(at.missing)}
              </div>
            )}
          </>
        ) : (
          <span className="muted">None</span>
        )}
      </Section>

      <Section title="Offered">
        <OfferedBadges code={node.code} catalog={catalog} />
      </Section>

      {planned && (
        <Section title="If you drop it">
          <DeltaView d={dropDelta} />
          <button className="btn sm danger-outline" onClick={() => onChange([{ kind: "remove", id: node.course!.id }], `Removed ${node.code}`)}>
            <Icon.trash /> Remove from plan
          </button>
        </Section>
      )}

      {swapOptions.length > 0 && (
        <Section title="Could take instead">
          <ul className="swap-list">
            {swapOptions.map((o) => (
              <li key={o.code} className={swap === o.code ? "open" : ""}>
                <button className="swap-row" onClick={() => setSwap(swap === o.code ? null : o.code)}>
                  <span className="sw-code">{o.code}</span>
                  <span className="sw-title">{o.title}</span>
                  <span className="sw-when">{o.idx > node.idx ? `from ${shortTerm(termOf(o.idx))}` : ""}</span>
                </button>
                {swap === o.code && (
                  <div className="swap-detail">
                    <div className="muted small">{o.fills.join(" · ")}</div>
                    {o.chain.length > 0 && <div className="fd-note">Needs {o.chain.join(" → ")} first</div>}
                    <DeltaView d={swapDelta} />
                    <div className="swap-actions">
                      <button className="btn sm" onClick={() => onFocus(o.code)}>
                        Show in chart
                      </button>
                      <button className="btn sm primary" onClick={() => swapChange && onChange([swapChange], `Swapped ${node.code} for ${o.code}`)}>
                        Swap {node.code} → {o.code}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {unlocks.length > 0 && (
        <Section title="Leads to">
          <ul className="leads">
            {unlocks.slice(0, 12).map((u) => (
              <li key={u.c}>
                <button className="code-link" onClick={() => onFocus(u.c)}>
                  {u.c}
                </button>
                <span className="lt-title">{catalogEntry(u.c, catalog)?.n}</span>
                {u.placedIdx !== undefined && <span className="lt-term">{shortTerm(termOf(u.placedIdx))}</span>}
              </li>
            ))}
          </ul>
          {unlocks.length > 12 && <div className="muted small">and {unlocks.length - 12} more</div>}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fd-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function MoveButton({ dir, idx, term, check, onClick }: { dir: "earlier" | "later"; idx?: number; term: string; check: PlaceCheck | null; onClick: () => void }) {
  return (
    <button className={`move-btn ${check?.level ?? ""}`} disabled={idx === undefined} onClick={onClick}>
      <span className="mb-top">
        {dir === "earlier" && <Icon.arrowLeft />}
        {dir === "earlier" ? "Earlier" : "Later"}
        {dir === "later" && <Icon.arrowRight />}
      </span>
      <span className="mb-term">{idx === undefined ? "No open term" : shortTerm(term)}</span>
      {check && <span className="mb-check">{check.level === "good" ? "✓ Works" : check.lines[0]}</span>}
    </button>
  );
}

function TermMenu({ label, slots, check, onPick }: { label: string; slots: Timeline["slots"]; check: (idx: number) => PlaceCheck; onPick: (idx: number) => void }) {
  return (
    <Popover button={label} buttonClassName="btn" width={320}>
      {(close) => (
        <div className="menu term-menu">
          {slots.map((s) => {
            const c = check(s.idx);
            return (
              <button
                key={s.idx}
                onClick={() => {
                  close();
                  onPick(s.idx);
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
  );
}

function DeltaView({ d }: { d: Delta | null }) {
  if (!d) return <div className="muted small">Checking requirements…</div>;
  if (d.error) return <div className="error small">Solver error: {d.error}</div>;
  const diff = d.after - d.before;
  const counts = d.counts.filter((c) => !c.startsWith("University"));
  return (
    <div className="delta">
      <div className="delta-head">
        Open requirements <b>{d.before}</b> → <b className={diff < 0 ? "ok" : diff > 0 ? "error" : ""}>{d.after}</b>
      </div>
      {counts.length > 0 && <div className="small">Counts toward: {counts.join(" · ")}</div>}
      {d.fixed.map((n) => (
        <div key={n.key} className="ok small">
          ✓ Completes {n.program}: {n.label}
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
      {counts.length === 0 && d.fixed.length === 0 && d.broken.length === 0 && d.brokenPrereqs.length === 0 && d.blocked.length === 0 && (
        <div className="muted small">No change to your requirements.</div>
      )}
    </div>
  );
}
