import { useEffect, useMemo, useState } from "react";
import highsLoader from "highs";
import wasmUrl from "highs/runtime?url";
import type { Plan, PlanCourse, Semester, SolverCourse } from "./types";
import { loadCatalog, type Catalog } from "./catalog";
import { solve, type Highs } from "./engine/solver";
import { MAJORS, MINORS, SHARING_RULES, programById } from "./programs";
import { academicYear, addTerm, emptyPlan, planFromTranscript, termKey, uid } from "./plan";
import { loadWorkspace, nextScenarioName, parseImport, saveWorkspace, type Workspace } from "./workspace";
import { applyChange, type Change } from "./flow/analysis";
import { FlowView } from "./flow/FlowView";
import { CompareView, programsOf } from "./flow/CompareView";
import { TRANSFER_TERM } from "./transcript";
import { SemesterTable } from "./components/SemesterTable";
import { AuditPanel } from "./components/AuditPanel";
import { ImportDialog } from "./components/ImportDialog";

const loadHighs = () => highsLoader({ locateFile: () => wasmUrl }) as unknown as Promise<Highs>;

type View = "table" | "flow" | "compare";

export default function App() {
  const [ws, setWs] = useState<Workspace>(loadWorkspace);
  const [view, setViewState] = useState<View>(() => {
    try {
      return (localStorage.getItem("degreeplan.view") as View) || "table";
    } catch {
      return "table";
    }
  });
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem("degreeplan.view", v);
    } catch {
      /* ignore */
    }
  };
  const [loadErr, setLoadErr] = useState("");
  const scenario = ws.scenarios.find((s) => s.id === ws.active) ?? ws.scenarios[0];
  const plan = scenario.plan;
  const setPlan = (f: (p: Plan) => Plan) =>
    setWs((w) => ({ ...w, scenarios: w.scenarios.map((s) => (s.id === w.active ? { ...s, plan: f(s.plan) } : s)) }));
  const [catalog, setCatalog] = useState<Catalog>(new Map());
  const [catalogErr, setCatalogErr] = useState("");
  const [highs, setHighs] = useState<Highs | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => saveWorkspace(ws), [ws]);
  useEffect(() => {
    loadCatalog().then(setCatalog, (e) => setCatalogErr(String(e)));
    loadHighs().then(setHighs);
  }, []);

  const programs = useMemo(() => programsOf(plan), [plan.programIds]);
  const solverCourses: SolverCourse[] = useMemo(
    () => plan.semesters.flatMap((s) => s.courses.filter((c) => c.code || c.geneds.length).map((c) => ({ ...c, term: s.term }))),
    [plan.semesters],
  );
  const audit = useMemo(() => {
    if (!highs) return null;
    const r = solve(highs, solverCourses, programs, SHARING_RULES, { genedExemptions: plan.genedExemptions, waived: plan.waived });
    if (r.error) loadHighs().then(setHighs); // wasm instance can get wedged; retry with a fresh one
    return r;
  }, [highs, solverCourses, programs, plan.genedExemptions, plan.waived]);

  const courseById = useMemo(() => new Map<string, PlanCourse>(plan.semesters.flatMap((s) => s.courses.map((c) => [c.id, c]))), [plan.semesters]);
  const allCodes = useMemo(() => new Map(plan.semesters.flatMap((s) => s.courses.filter((c) => c.code).map((c) => [c.code, s.term] as const))), [plan.semesters]);

  const setSemester = (s: Semester) => setPlan((p) => ({ ...p, semesters: p.semesters.map((x) => (x.id === s.id ? s : x)) }));
  const removeSemester = (id: string) => setPlan((p) => ({ ...p, semesters: p.semesters.filter((x) => x.id !== id) }));

  const setFamily = (family: string, id: string) =>
    setPlan((p) => ({
      ...p,
      programIds: [...p.programIds.filter((x) => programById(x)?.family !== family), ...(id ? [id] : [])],
    }));
  const toggleMinor = (id: string) =>
    setPlan((p) => ({ ...p, programIds: p.programIds.includes(id) ? p.programIds.filter((x) => x !== id) : [...p.programIds, id] }));
  const toggleWaive = (k: string) =>
    setPlan((p) => ({ ...p, waived: p.waived.includes(k) ? p.waived.filter((x) => x !== k) : [...p.waived, k] }));

  // Group terms into academic years (Fall Y .. Summer Y+1)
  const transfer = plan.semesters.find((s) => s.term === TRANSFER_TERM);
  const years = new Map<number, Semester[]>();
  for (const s of plan.semesters) {
    if (s.term === TRANSFER_TERM) continue;
    const y = academicYear(s.term);
    years.set(y, [...(years.get(y) ?? []), s].sort((a, b) => termKey(a.term) - termKey(b.term)));
  }
  const yearList = [...years.keys()].sort((a, b) => a - b);
  const lastYear = yearList[yearList.length - 1] ?? new Date().getFullYear() - 1;

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "degree-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // A workspace export replaces all plans; a single-plan file (older export) replaces the current plan.
  const importPlan = async (input: HTMLInputElement) => {
    const f = input.files?.[0];
    input.value = "";
    if (!f) return;
    try {
      const r = parseImport(await f.text());
      if (r.workspace) setWs(r.workspace);
      else if (r.plan) setPlan(() => r.plan!);
      setLoadErr("");
    } catch (e) {
      setLoadErr(`Couldn't load ${f.name}: ${e instanceof Error ? e.message : e}`);
    }
  };

  const newScenario = () =>
    setWs((w) => {
      const id = uid();
      return { active: id, scenarios: [...w.scenarios, { id, name: nextScenarioName(w), plan: structuredClone(plan) }] };
    });
  const renameScenario = (id: string) => {
    const name = prompt("Rename plan", ws.scenarios.find((s) => s.id === id)?.name)?.trim();
    if (name) setWs((w) => ({ ...w, scenarios: w.scenarios.map((s) => (s.id === id ? { ...s, name } : s)) }));
  };
  const deleteScenario = (id: string) => {
    if (ws.scenarios.length < 2 || !confirm(`Delete "${ws.scenarios.find((s) => s.id === id)?.name}"?`)) return;
    setWs((w) => {
      const scenarios = w.scenarios.filter((s) => s.id !== id);
      return { active: w.active === id ? scenarios[0].id : w.active, scenarios };
    });
  };
  const applyFlowChange = (ch: Change) => setPlan((p) => applyChange(p, ch, catalog, uid()));

  const familyValue = (family: string) => plan.programIds.find((x) => programById(x)?.family === family) ?? "";

  return (
    <div className="app">
      <header>
        <h1>UMD Degree Planner</h1>
        <div className="programs">
          <label>
            CS
            <select value={familyValue("cs")} onChange={(e) => setFamily("cs", e.target.value)}>
              <option value="">—</option>
              {MAJORS.filter((m) => m.family === "cs").map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.match(/\((.*)\)/)?.[1]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Math
            <select value={familyValue("math")} onChange={(e) => setFamily("math", e.target.value)}>
              <option value="">—</option>
              {MAJORS.filter((m) => m.family === "math").map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.match(/\((.*)\)/)?.[1]}
                </option>
              ))}
            </select>
          </label>
          {MINORS.map((m) => (
            <label key={m.id}>
              <input type="checkbox" checked={plan.programIds.includes(m.id)} onChange={() => toggleMinor(m.id)} />
              {m.name.replace(" Minor", "")} minor
            </label>
          ))}
        </div>
        <div className="actions">
          <button className="primary" onClick={() => setImporting(true)}>
            Import transcript
          </button>
          <button onClick={exportPlan}>Export</button>
          <label className="button">
            Load
            <input type="file" accept=".json" hidden onChange={(e) => importPlan(e.target)} />
          </label>
          <button
            onClick={() => {
              if (confirm(`Clear "${scenario.name}"?`)) setPlan(() => emptyPlan(new Date().getFullYear()));
            }}
          >
            Reset
          </button>
        </div>
      </header>
      <nav className="tabs">
        <div className="view-switch">
          {(["table", "flow", "compare"] as View[]).map((v) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
              {v === "table" ? "Table" : v === "flow" ? "Flowchart" : "Compare plans"}
            </button>
          ))}
        </div>
        <div className="scenarios">
          {ws.scenarios.map((s) => (
            <span key={s.id} className={`scenario ${s.id === ws.active ? "on" : ""}`}>
              <button onClick={() => setWs((w) => ({ ...w, active: s.id }))} onDoubleClick={() => renameScenario(s.id)} title="Double-click to rename">
                {s.name}
              </button>
              {ws.scenarios.length > 1 && s.id === ws.active && (
                <button className="link x" onClick={() => deleteScenario(s.id)} title="Delete this plan">
                  ×
                </button>
              )}
            </span>
          ))}
          <button className="link" onClick={newScenario} title="Copy the current plan into a new one to try alternatives">
            + new plan
          </button>
        </div>
      </nav>
      {catalogErr && <div className="banner error">Course catalog failed to load ({catalogErr}). Run `npm run fetch-courses`.</div>}
      {loadErr && (
        <div className="banner error">
          {loadErr}{" "}
          <button className="link" onClick={() => setLoadErr("")}>
            dismiss
          </button>
        </div>
      )}

      {view === "flow" && <FlowView plan={plan} programs={programs} catalog={catalog} audit={audit} highs={highs} onChange={applyFlowChange} />}
      {view === "compare" && (
        <CompareView
          scenarios={ws.scenarios}
          active={ws.active}
          catalog={catalog}
          highs={highs}
          onOpen={(id) => {
            setWs((w) => ({ ...w, active: id }));
            setView("flow");
          }}
        />
      )}
      {view === "table" && (
      <main>
        <section className="plan">
          <div className="credit-bar">
            <b>{audit?.totalCredits ?? 0}</b> / 120 credits ·{" "}
            {solverCourses.filter((c) => c.status !== "planned").reduce((n, c) => n + c.credits, 0)} earned or in progress
            <span className="legend">
              <span className="status-dot st-completed" /> completed <span className="status-dot st-inprogress" /> in progress{" "}
              <span className="status-dot st-planned" /> planned <span className="status-dot st-transfer" /> transfer/AP
            </span>
          </div>
          {transfer && (
            <div className="year">
              <h2>Transfer &amp; AP credit</h2>
              <div className="terms one">
                <SemesterTable semester={transfer} catalog={catalog} usage={audit?.usage ?? {}} allCodes={allCodes} onChange={setSemester} />
              </div>
            </div>
          )}
          {yearList.map((y, i) => {
            const sems = years.get(y)!;
            return (
              <div className="year" key={y}>
                <h2>
                  Year {i + 1}{" "}
                  <span className="muted">
                    ({y}–{String(y + 1).slice(2)})
                  </span>
                  <span className="year-actions">
                    {!sems.some((s) => s.term.startsWith("Winter")) && (
                      <button className="link" onClick={() => setPlan((p) => addTerm(p, `Winter ${y + 1}`))}>
                        + winter
                      </button>
                    )}
                    {!sems.some((s) => s.term.startsWith("Summer")) && (
                      <button className="link" onClick={() => setPlan((p) => addTerm(p, `Summer ${y + 1}`))}>
                        + summer
                      </button>
                    )}
                  </span>
                </h2>
                <div className="terms">
                  {sems.map((s) => (
                    <SemesterTable
                      key={s.id}
                      semester={s}
                      catalog={catalog}
                      usage={audit?.usage ?? {}}
                      allCodes={allCodes}
                      onChange={setSemester}
                      onRemove={() => removeSemester(s.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <button className="add-year" onClick={() => setPlan((p) => addTerm(addTerm(p, `Fall ${lastYear + 1}`), `Spring ${lastYear + 2}`))}>
            + add year
          </button>
        </section>
        <AuditPanel
          audit={audit}
          courses={courseById}
          waived={plan.waived}
          exemptions={plan.genedExemptions}
          onToggleWaive={toggleWaive}
          onExemptions={(e) => setPlan((p) => ({ ...p, genedExemptions: e }))}
        />
      </main>
      )}

      <datalist id="course-codes">
        {[...catalog.values()].map((c) => (
          <option key={c.c} value={c.c}>
            {c.n}
          </option>
        ))}
      </datalist>

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onApply={(t) => {
            setPlan((p) => planFromTranscript(t, catalog, p));
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
