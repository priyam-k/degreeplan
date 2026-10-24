import { beforeAll, describe, expect, test } from "vitest";
import highsLoader from "highs";
import type { Highs } from "../engine/solver";
import type { CatalogCourse, Plan, PlanCourse, Semester } from "../types";
import type { Catalog } from "../catalog";
import { TRANSFER_TERM } from "../transcript";
import { csGeneral } from "../programs/cs";
import { rasMinor } from "../programs/ras";
import { applyChange, auditPlan, buildTimeline, offeredIn, prereqAt, projector, suggestions, whatIf } from "./analysis";
import { nextScenarioName, newWorkspace, parseImport } from "../workspace";
import { formatReq } from "../prereqs";

let highs: Highs;
beforeAll(async () => {
  highs = (await highsLoader()) as unknown as Highs;
});

const FALL = [2308, 2408, 2508];
const SPRING = [2401, 2501, 2601];
const BOTH = [...FALL, ...SPRING];
function cat(list: [string, string | null, number[]?][]): Catalog {
  return new Map(list.map(([c, p, t]): [string, CatalogCourse] => [c, { c, n: c, cr: 3, mx: null, g: [], p, x: null, t: t ?? BOTH }]));
}
const CATALOG = cat([
  ["MATH140", null],
  ["MATH141", "Minimum grade of C- in MATH140."],
  ["MATH410", "Minimum grade of C- in MATH141."],
  ["MATH411", "Minimum grade of C- in MATH410."],
  ["MATH412", "Minimum grade of C- in MATH411.", FALL], // fall only
  ["PHYS161", "Must have completed or be concurrently enrolled in MATH141."],
  ["CMSC131", null],
  ["CMSC132", "Minimum grade of C- in CMSC131."],
  ["CMSC216", "Minimum grade of C- in CMSC132; and minimum grade of C- in MATH141."],
  ["OLD101", null, []],
]);

let n = 0;
const course = (code: string, status: PlanCourse["status"] = "planned"): PlanCourse => ({ id: `id${n++}`, code, credits: 3, geneds: [], notes: "", status });
const sem = (term: string, courses: PlanCourse[]): Semester => ({ id: term, term, courses });
function plan(sems: Semester[], waived: string[] = []): Plan {
  return { semesters: sems, programIds: [], genedExemptions: [], waived };
}

describe("timeline and prerequisites", () => {
  const p = plan([
    sem(TRANSFER_TERM, [course("MATH140", "transfer"), course("MATH141", "transfer")]),
    sem("Fall 2025", [course("MATH410", "completed")]),
    sem("Spring 2026", [course("CMSC216", "inprogress")]),
    sem("Fall 2026", [course("MATH411"), course("PHYS161")]),
    sem("Spring 2027", []),
  ]);
  const tl = buildTimeline(p, [csGeneral], CATALOG);

  test("first open term is after the last completed/in-progress term", () => {
    expect(tl.slots[tl.firstOpen].term).toBe("Fall 2026");
    expect(tl.slots.filter((s) => s.virtual).length).toBe(4);
  });

  test("prerequisites must be in an earlier term; AP credit counts", () => {
    expect(prereqAt("MATH411", 3, tl, CATALOG).ok).toBe(true);
    expect(prereqAt("MATH412", 3, tl, CATALOG).ok).toBe(false); // MATH411 is the same term
    expect(prereqAt("MATH412", 4, tl, CATALOG).ok).toBe(true);
    expect(prereqAt("MATH410", 1, tl, CATALOG).ok).toBe(true); // MATH141 via AP
  });

  test("CMSC216 without CMSC132 is flagged unless CMSC132 is waived", () => {
    expect(prereqAt("CMSC216", 2, tl, CATALOG).ok).toBe(false);
    const waived = buildTimeline({ ...p, waived: ["cs-general/cmsc132"] }, [csGeneral], CATALOG);
    expect(waived.exempt.has("CMSC132")).toBe(true);
    expect(prereqAt("CMSC216", 2, waived, CATALOG).ok).toBe(true);
  });

  test("'concurrently enrolled' prerequisites may share the term", () => {
    const q = plan([sem(TRANSFER_TERM, [course("MATH140", "transfer")]), sem("Fall 2026", [course("MATH141"), course("PHYS161")])]);
    const t = buildTimeline(q, [], CATALOG);
    expect(prereqAt("PHYS161", 1, t, CATALOG).ok).toBe(true);
    expect(prereqAt("MATH410", 1, t, CATALOG).ok).toBe(false);
  });

  test("projection follows unplanned chains and offering seasons", () => {
    const project = projector(tl, CATALOG);
    // MATH411 planned Fall 2026 -> MATH412 (fall only) can't be Spring 2027 -> Fall 2027
    expect(tl.slots[project("MATH412").idx].term).toBe("Fall 2027");
    const q = plan([sem(TRANSFER_TERM, [course("MATH140", "transfer")]), sem("Fall 2026", [])]);
    const t2 = buildTimeline(q, [], CATALOG);
    const pj = projector(t2, CATALOG)("MATH411");
    expect(pj.chain).toEqual(["MATH141", "MATH410"]);
    expect(t2.slots[pj.idx].term).toBe("Fall 2027");
  });

  test("offering levels", () => {
    expect(offeredIn("MATH412", "Spring 2027", CATALOG)).toBe("no");
    expect(offeredIn("MATH412", "Fall 2027", CATALOG)).toBe("yes");
    expect(offeredIn("MATH412", "Summer 2027", CATALOG)).toBe("unknown"); // no summers in this window
  });

  test("suggestions flag prerequisite problems and season mismatches", () => {
    const q = plan([sem(TRANSFER_TERM, [course("MATH140", "transfer"), course("MATH141", "transfer")]), sem("Fall 2026", [course("MATH410"), course("MATH411")]), sem("Spring 2027", [course("MATH412")])]);
    const audit = { programs: [], sharing: [], usage: {}, totalCredits: 0 };
    const tips = suggestions(q, [], CATALOG, audit, formatReq).map((t) => t.text);
    expect(tips.some((t) => t.startsWith("MATH411 (Fall 2026) needs MATH410"))).toBe(true);
    expect(tips.some((t) => t.startsWith("MATH412 hasn't been offered in a Spring"))).toBe(true);
  });
});

describe("changes and what-if", () => {
  const base = () =>
    plan([
      sem(TRANSFER_TERM, [course("MATH140", "transfer")]),
      sem("Fall 2026", [course("MATH141")]),
      sem("Spring 2027", [course("MATH410")]),
    ]);

  test("applyChange add / move / remove / replace", () => {
    const p = base();
    const id = p.semesters[2].courses[0].id;
    const added = applyChange(p, { kind: "add", code: "MATH411", term: "Fall 2027" }, CATALOG, "new1");
    expect(added.semesters.map((s) => s.term)).toEqual([TRANSFER_TERM, "Fall 2026", "Spring 2027", "Fall 2027"]);
    expect(added.semesters[3].courses[0]).toMatchObject({ id: "new1", code: "MATH411", status: "planned" });
    const moved = applyChange(p, { kind: "move", id, term: "Fall 2026" }, CATALOG);
    expect(moved.semesters[1].courses.map((c) => c.code)).toEqual(["MATH141", "MATH410"]);
    expect(moved.semesters[2].courses).toEqual([]);
    expect(applyChange(p, { kind: "remove", id }, CATALOG).semesters[2].courses).toEqual([]);
    const swapped = applyChange(p, { kind: "replace", id, code: "MATH411", term: "Spring 2027" }, CATALOG, "s");
    expect(swapped.semesters[2].courses.map((c) => c.code)).toEqual(["MATH411"]);
  });

  test("dropping a required RAS course reports the broken requirement and prerequisite", () => {
    const ras = cat([
      ["ENME480", null],
      ["ENAE450", "ENME480 or ENAE380."],
      ["ENEE467", "Minimum grade of C- in ENAE450."],
      ["CMSC477", "ENEE467 or CMSC420."],
      ["MATH240", null],
    ]);
    const p = plan([
      sem(TRANSFER_TERM, [course("MATH240", "transfer")]),
      sem("Fall 2026", [course("ENME480")]),
      sem("Spring 2027", [course("ENAE450")]),
      sem("Fall 2027", [course("ENEE467")]),
      sem("Spring 2028", [course("CMSC477")]),
    ]);
    const programs = [rasMinor];
    const audit = auditPlan(highs, p, programs);
    const d = whatIf(highs, p, programs, ras, audit, { kind: "remove", id: p.semesters[2].courses[0].id });
    expect(d.after).toBeGreaterThan(d.before);
    expect(d.broken.map((b) => b.label).join()).toMatch(/ENAE450/);
    expect(d.brokenPrereqs).toEqual(["ENEE467 (Fall 2027)"]);
  });
});

describe("workspace", () => {
  test("imports a single plan or a whole workspace", () => {
    const p = base();
    function base() {
      return plan([sem("Fall 2026", [course("MATH141")])]);
    }
    expect(parseImport(JSON.stringify(p)).plan?.semesters.length).toBe(1);
    const w = newWorkspace(p);
    expect(parseImport(JSON.stringify(w)).workspace?.scenarios[0].name).toBe("Plan A");
    expect(() => parseImport("{}")).toThrow();
    expect(nextScenarioName(w)).toBe("Plan B");
  });
});
