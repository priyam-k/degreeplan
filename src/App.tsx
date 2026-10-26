import { useCallback, useEffect, useMemo, useState } from "react";
import highsLoader from "highs";
import wasmUrl from "highs/runtime?url";
import type { Plan } from "./types";
import { loadCatalog, type Catalog } from "./catalog";
import { solve, type Highs } from "./engine/solver";
import { SHARING_RULES } from "./programs";
import { emptyPlan, planFromTranscript, uid } from "./plan";
import { loadWorkspace, nextScenarioName, parseImport, saveWorkspace, type Workspace } from "./workspace";
import { applyChange, solverCourses as toSolverCourses, type Change } from "./flow/analysis";
import { FlowView } from "./flow/FlowView";
import { CompareView, programsOf } from "./flow/CompareView";
import { PlanView } from "./components/PlanView";
import { DegreeView } from "./components/DegreeView";
import { TopBar, type View } from "./components/TopBar";
import { ImportDialog } from "./components/ImportDialog";
import { useHistory } from "./ui/useHistory";
import { Toast, type ToastMsg } from "./ui/Toast";

const loadHighs = () => highsLoader({ locateFile: () => wasmUrl }) as unknown as Promise<Highs>;

const VIEW_KEY = "degreeplan.view";
function initialView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "table") return "plan";
    if (v === "degree" || v === "plan" || v === "flow" || v === "compare") return v;
  } catch {
    /* ignore */
  }
  return "plan";
}

export type SetPlan = (f: (p: Plan) => Plan, opts?: { coalesce?: string; toast?: string }) => void;

export default function App() {
  const history = useHistory<Workspace>(loadWorkspace);
  const ws = history.state;
  const [view, setViewState] = useState<View>(initialView);
  const [catalog, setCatalog] = useState<Catalog>(new Map());
  const [catalogErr, setCatalogErr] = useState("");
  const [highs, setHighs] = useState<Highs | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [banner, setBanner] = useState("");
  const scenario = ws.scenarios.find((s) => s.id === ws.active) ?? ws.scenarios[0];
  const plan = scenario.plan;

  const notify = useCallback((text: string, undo = true) => setToast({ id: Date.now(), text, undo }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const setWs = history.set;
  const setPlan: SetPlan = useCallback(
    (f, opts) => {
      setWs((w) => ({ ...w, scenarios: w.scenarios.map((s) => (s.id === w.active ? { ...s, plan: f(s.plan) } : s)) }), opts);
      if (opts?.toast) notify(opts.toast);
    },
    [setWs, notify],
  );
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => saveWorkspace(ws), [ws]);
  useEffect(() => {
    loadCatalog().then(setCatalog, (e) => setCatalogErr(String(e)));
    loadHighs().then(setHighs);
  }, []);

  // ⌘Z / ⌘⇧Z outside text fields (inside them the browser's own undo applies)
  const { undo, redo } = history;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const programs = useMemo(() => programsOf(plan), [plan.programIds]);
  const solverCourses = useMemo(() => toSolverCourses(plan), [plan.semesters]);
  const audit = useMemo(() => {
    if (!highs) return null;
    const r = solve(highs, solverCourses, programs, SHARING_RULES, { genedExemptions: plan.genedExemptions, waived: plan.waived });
    if (r.error) loadHighs().then(setHighs); // wasm instance can get wedged; retry with a fresh one
    return r;
  }, [highs, solverCourses, programs, plan.genedExemptions, plan.waived]);

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "degree-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // A workspace export replaces all plans; a single-plan file (older export) replaces the current plan.
  const importPlan = async (f: File) => {
    try {
      const r = parseImport(await f.text());
      if (r.workspace) setWs(() => r.workspace!);
      else if (r.plan) setPlan(() => r.plan!);
      setBanner("");
      notify(`Loaded ${f.name}`);
    } catch (e) {
      setBanner(`Couldn't load ${f.name}: ${e instanceof Error ? e.message : e}`);
    }
  };

  const scenarioOps = {
    switchTo: (id: string) => setWs((w) => ({ ...w, active: id })),
    duplicate: () =>
      setWs((w) => {
        const id = uid();
        return { active: id, scenarios: [...w.scenarios, { id, name: nextScenarioName(w), plan: structuredClone(plan) }] };
      }),
    rename: (id: string, name: string) => setWs((w) => ({ ...w, scenarios: w.scenarios.map((s) => (s.id === id ? { ...s, name } : s)) })),
    remove: (id: string) => {
      const name = ws.scenarios.find((s) => s.id === id)?.name;
      setWs((w) => {
        const scenarios = w.scenarios.filter((s) => s.id !== id);
        return scenarios.length ? { active: w.active === id ? scenarios[0].id : w.active, scenarios } : w;
      });
      notify(`Deleted ${name}`);
    },
  };

  const applyFlowChange = (ch: Change, toast?: string) => setPlan((p) => applyChange(p, ch, catalog, uid()), { toast });

  return (
    <div className="app">
      <TopBar
        view={view}
        onView={setView}
        ws={ws}
        plan={plan}
        audit={audit}
        history={history}
        scenarioOps={scenarioOps}
        setPlan={setPlan}
        onImport={() => setImporting(true)}
        onExport={exportPlan}
        onLoad={importPlan}
        onReset={() => setPlan((p) => ({ ...emptyPlan(new Date().getFullYear()), programIds: p.programIds }), { toast: `Cleared ${scenario.name}` })}
      />
      {catalogErr && <div className="banner error">Course catalog failed to load ({catalogErr}). Run `npm run fetch-courses`.</div>}
      {banner && (
        <div className="banner error">
          {banner}{" "}
          <button className="btn-link" onClick={() => setBanner("")}>
            Dismiss
          </button>
        </div>
      )}

      {view === "degree" && <DegreeView plan={plan} programs={programs} catalog={catalog} audit={audit} setPlan={setPlan} onFlow={() => setView("flow")} />}
      {view === "plan" && <PlanView plan={plan} catalog={catalog} audit={audit} programs={programs} setPlan={setPlan} onImport={() => setImporting(true)} />}
      {view === "flow" && <FlowView plan={plan} programs={programs} catalog={catalog} audit={audit} highs={highs} onChange={applyFlowChange} />}
      {view === "compare" && (
        <CompareView
          scenarios={ws.scenarios}
          active={ws.active}
          catalog={catalog}
          highs={highs}
          onDuplicate={scenarioOps.duplicate}
          onOpen={(id) => {
            scenarioOps.switchTo(id);
            setView("flow");
          }}
        />
      )}

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onApply={(t) => {
            setPlan((p) => planFromTranscript(t, catalog, p), { toast: `Imported ${t.courses.length} courses from your transcript` });
            setImporting(false);
          }}
        />
      )}
      <Toast toast={toast} onUndo={undo} onClose={closeToast} />
    </div>
  );
}
