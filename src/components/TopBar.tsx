import { useRef, useState } from "react";
import type { AuditResult, Plan, Program } from "../types";
import type { Workspace } from "../workspace";
import type { History } from "../ui/useHistory";
import type { SetPlan } from "../App";
import { ENTRIES, abbrev, displayName, familyKey, normalizeName, programById, trackName, type ProgramEntry } from "../programs";
import { ConfirmButton, Popover } from "../ui/Popover";
import { Icon } from "../ui/icons";
import { ACCENTS, GROUNDS, useTheme } from "../ui/theme";

export type View = "degree" | "plan" | "flow" | "compare";
const VIEWS: { id: View; label: string }[] = [
  { id: "degree", label: "Degree" },
  { id: "plan", label: "Semesters" },
  { id: "flow", label: "Flowchart" },
  { id: "compare", label: "Compare" },
];

interface Props {
  view: View;
  onView: (v: View) => void;
  ws: Workspace;
  plan: Plan;
  audit: AuditResult | null;
  history: History<Workspace>;
  scenarioOps: { switchTo: (id: string) => void; duplicate: () => void; rename: (id: string, name: string) => void; remove: (id: string) => void };
  setPlan: SetPlan;
  onImport: () => void;
  onExport: () => void;
  onLoad: (f: File) => void;
  onReset: () => void;
}

export function TopBar(p: Props) {
  const file = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useTheme();
  const active = p.ws.scenarios.find((s) => s.id === p.ws.active) ?? p.ws.scenarios[0];
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">UMD</span> Degree Planner
      </div>
      <nav className="segmented" aria-label="View">
        {VIEWS.map((v) => (
          <button key={v.id} className={p.view === v.id ? "on" : ""} onClick={() => p.onView(v.id)}>
            {v.label}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        <div className="undo-group">
          <button className="icon-btn" onClick={p.history.undo} disabled={!p.history.canUndo} title="Undo (⌘Z)" aria-label="Undo">
            <Icon.undo />
          </button>
          <button className="icon-btn" onClick={p.history.redo} disabled={!p.history.canRedo} title="Redo (⌘⇧Z)" aria-label="Redo">
            <Icon.redo />
          </button>
        </div>
        <ProgramPicker plan={p.plan} audit={p.audit} setPlan={p.setPlan} />
        <PlanSwitcher ws={p.ws} activeName={active.name} ops={p.scenarioOps} />
        <button className="btn primary tb-import" onClick={p.onImport}>
          Import<span className="hide-sm"> transcript</span>
        </button>
        <Popover button={<Icon.more />} buttonClassName="icon-btn tb-more" buttonTitle="More" align="end" width={230}>
          {(close) => (
            <div className="menu">
              <div className="menu-label">Appearance</div>
              <div className="theme-pick">
                <div className="theme-grounds">
                  {GROUNDS.map((g) => (
                    <button key={g.id} className={theme.ground === g.id ? "on" : ""} onClick={() => setTheme({ ...theme, ground: g.id })}>
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="theme-accents">
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      className={`swatch swatch-${a} ${theme.accent === a ? "on" : ""}`}
                      title={`${a[0].toUpperCase()}${a.slice(1)} accent`}
                      aria-label={`${a} accent`}
                      aria-pressed={theme.accent === a}
                      onClick={() => setTheme({ ...theme, accent: a })}
                    />
                  ))}
                </div>
              </div>
              <div className="menu-sep" />
              <button
                onClick={() => {
                  close();
                  p.onExport();
                }}
              >
                Export all plans (.json)
              </button>
              <button
                onClick={() => {
                  close();
                  file.current?.click();
                }}
              >
                Load plans from file…
              </button>
              <div className="menu-sep" />
              <ConfirmButton
                className="menu-danger"
                message={
                  <>
                    Clear every course from <b>{active.name}</b>? You can undo this.
                  </>
                }
                confirmLabel="Clear plan"
                onConfirm={() => {
                  close();
                  p.onReset();
                }}
              >
                Clear this plan…
              </ConfirmButton>
            </div>
          )}
        </Popover>
        <input
          ref={file}
          type="file"
          accept=".json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) p.onLoad(f);
          }}
        />
      </div>
    </header>
  );
}

function ProgramPicker({ plan, audit, setPlan }: { plan: Plan; audit: AuditResult | null; setPlan: SetPlan }) {
  const [query, setQuery] = useState("");
  const chosen = plan.programIds.map(programById).filter((p): p is Program => !!p);
  const done = (id: string) => audit?.programs.find((r) => r.program.id === id)?.satisfied;

  const inPlan = new Set(chosen.map(familyKey));
  const words = normalizeName(query).split(" ").filter(Boolean);
  const results = ENTRIES.filter((e) => !inPlan.has(e.key) && words.every((w) => e.search.includes(w)));

  const add = (e: ProgramEntry) => {
    setPlan((p) => ({ ...p, programIds: [...p.programIds, e.programs[0].id] }), { toast: `Added ${e.name}` });
    setQuery("");
  };
  const remove = (prog: Program) =>
    setPlan((p) => ({ ...p, programIds: p.programIds.filter((x) => x !== prog.id) }), { toast: `Removed ${displayName(prog)}` });
  const setTrack = (prog: Program, id: string) => setPlan((p) => ({ ...p, programIds: p.programIds.map((x) => (x === prog.id ? id : x)) }));

  // Majors first, then minors; each in the order the plan lists them.
  const ordered = [...chosen.filter((p) => p.kind === "major"), ...chosen.filter((p) => p.kind !== "major")];
  const label = ordered.length ? ordered.map(abbrev).join(" · ") : "Choose programs";
  return (
    <Popover
      button={
        <>
          <span className="tb-label">{label}</span> <Icon.chevron />
        </>
      }
      buttonClassName="btn tb-programs"
      align="end"
      width={384}
    >
      <div className="program-picker">
        <div className="pp-title">In this plan</div>
        {ordered.length === 0 && <p className="pp-empty">No majors or minors yet. Add one below.</p>}
        {ordered.map((p) => {
          const tracks = ENTRIES.find((e) => e.key === familyKey(p))?.programs ?? [p];
          return (
            <div key={p.id} className="pp-row">
              <StatusDot ok={done(p.id)} />
              <div className="pp-main">
                <span className="pp-name">{displayName(p)}</span>
                {tracks.length > 1 ? (
                  <select value={p.id} onChange={(e) => setTrack(p, e.target.value)} aria-label={`${displayName(p)} track`}>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {trackName(t)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="pp-sub">{p.kind === "minor" ? "Minor" : "Major"}</span>
                )}
              </div>
              <button className="icon-btn sm" onClick={() => remove(p)} aria-label={`Remove ${displayName(p)}`} title="Remove from this plan">
                <Icon.x />
              </button>
            </div>
          );
        })}
        <input
          className="pp-search"
          type="search"
          placeholder="Add a major or minor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length) add(results[0]);
          }}
          aria-label="Search majors and minors"
        />
        <div className="pp-results">
          {(["major", "minor"] as const).map((kind) => {
            const list = results.filter((e) => e.kind === kind);
            if (!list.length) return null;
            return (
              <div key={kind}>
                <div className="pp-title">{kind === "major" ? "Majors" : "Minors"}</div>
                {list.map((e) => (
                  <button key={e.key} className="pp-result" onClick={() => add(e)}>
                    <span className="pp-result-name">{e.name}</span>
                    <span className="pp-result-sub">
                      {e.college}
                      {e.programs.length > 1 && ` · ${e.programs.length} tracks`}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          {!results.length && <p className="pp-empty">{words.length ? `Nothing matches "${query}".` : "Every program is already in this plan."}</p>}
        </div>
        <p className="pp-note">GenEd and university requirements are always checked.</p>
      </div>
    </Popover>
  );
}

const StatusDot = ({ ok }: { ok?: boolean }) => <span className={`status-pip ${ok ? "ok" : "todo"}`} title={ok ? "Complete" : "In progress"} />;

function PlanSwitcher({ ws, activeName, ops }: { ws: Workspace; activeName: string; ops: Props["scenarioOps"] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const commit = () => {
    if (editing && draft.trim()) ops.rename(editing, draft.trim());
    setEditing(null);
  };
  return (
    <Popover
      button={
        <>
          <span className="muted hide-sm">Plan</span> <span className="tb-label">{activeName}</span> <Icon.chevron />
        </>
      }
      buttonClassName="btn tb-plan"
      align="end"
      width={280}
      onOpenChange={(o) => !o && setEditing(null)}
    >
      {(close) => (
        <div className="plan-switcher">
          {ws.scenarios.map((s) => (
            <div key={s.id} className={`ps-row ${s.id === ws.active ? "on" : ""}`}>
              {editing === s.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <button
                  className="ps-name"
                  onClick={() => {
                    ops.switchTo(s.id);
                    close();
                  }}
                >
                  <span className="ps-check">{s.id === ws.active && <Icon.check />}</span>
                  {s.name}
                </button>
              )}
              <button
                className="icon-btn sm"
                title="Rename"
                onClick={() => {
                  setDraft(s.name);
                  setEditing(s.id);
                }}
              >
                <Icon.pencil />
              </button>
              {ws.scenarios.length > 1 && (
                <ConfirmButton className="icon-btn sm" title="Delete" message={<>Delete <b>{s.name}</b>? You can undo this.</>} confirmLabel="Delete" onConfirm={() => ops.remove(s.id)}>
                  <Icon.trash />
                </ConfirmButton>
              )}
            </div>
          ))}
          <button
            className="ps-new"
            onClick={() => {
              ops.duplicate();
              close();
            }}
          >
            <Icon.copy /> Duplicate “{activeName}” to try an alternative
          </button>
        </div>
      )}
    </Popover>
  );
}
