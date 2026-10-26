import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { audit, inCatalog, loadFile, type Sample } from "../testkit";

const programs = loadFile("business.yaml");
const byId = (id: string) => {
  const p = programs.find((x) => x.id === id);
  if (!p) throw new Error(`no program ${id}`);
  return p;
};
const finance = byId("finance");
const acctPublic = byId("accounting-public");
const acctAdvisory = byId("accounting-advisory");
const marketing = byId("marketing");
const omba = byId("omba");

const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// Smith four-year plan, years 1-2 (Fall 2024/2025 plans): gateway courses, lower core, BMGT367.
const LOWER = ["ENGL101", "MATH120", "ECON200", "BMGT110", "ECON201", "BMGT230", "COMM107", "BMGT220", "BMGT221", "BMGT367"];
// Junior-senior school core (BMGT367 is above).
const UPPER_CORE = ["BMGT301", "BMGT340", "BMGT350", "BMGT364", "BMGT380", "BMGT495"];
// Professional writing + upper-level electives, as in the plans (non-major upper-level courses).
const ELECTIVES = ["ENGL394", "GVPT306", "PSYC334", "ECON317", "SPAN301", "ECON311", "BMGT463"];
const upper = (n: number) => ELECTIVES.slice(0, n + 1); // ENGL394 + n electives

const FIN_MAJOR = ["ECON330", "BMGT343", "BMGT440", "BMGT441", "BMGT443", "BMGT444", "ECON306", "BMGT313"];
const FIN_PLAN = [...LOWER, ...UPPER_CORE, ...FIN_MAJOR, ...upper(4)];

describe("Finance", () => {
  test("the four-year plan satisfies everything", async () => {
    expect((await audit([finance], FIN_PLAN)).unmet).toEqual([]);
  });

  test("approved substitutes count, but non-BMGT substitutes can leave the plan short of 45 BMGT credits", async () => {
    const plan = FIN_PLAN.map((c) => ({ BMGT230: "PSYC200", COMM107: "JOUR130", BMGT313: "ECON423" })[c] ?? c);
    expect(ids((await audit([finance], plan)).unmet)).toEqual(["finance/bmgt-credits"]);
    expect((await audit([finance], [...plan, "BMGT392"])).unmet).toEqual([]);
  });

  test("missing BMGT440, and a second intermediate ECON does not fill an elective", async () => {
    const plan = [...LOWER, ...UPPER_CORE, "ECON330", "BMGT343", "BMGT441", "BMGT443", "ECON305", "ECON306", "BMGT313", ...upper(6)];
    expect(ids((await audit([finance], plan)).unmet)).toEqual(["finance/bmgt440", "finance/fin-electives"]);
  });

  test("only one of BMGT349/448/449 counts", async () => {
    const plan = FIN_PLAN.map((c) => ({ BMGT444: "BMGT448L", ECON306: "BMGT448Y" })[c] ?? c);
    expect(ids((await audit([finance], [...plan, "BMGT392"])).unmet)).toEqual(["finance/fin-electives"]);
  });

  test("the upper-level economics course is required", async () => {
    const plan = FIN_PLAN.filter((c) => c !== "ECON330");
    expect(ids((await audit([finance], [...plan, "BMGT392"])).unmet)).toEqual(["finance/fin-econ"]);
  });

  test("BMGT110 is required unless waived (transfer students)", async () => {
    const plan = FIN_PLAN.filter((c) => c !== "BMGT110");
    expect(ids((await audit([finance], plan)).unmet)).toEqual(["finance/bmgt110"]);
    expect((await audit([finance], plan, { waived: ["finance/bmgt110"] })).unmet).toEqual([]);
  });

  test("too few upper-level credits", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...FIN_MAJOR, ...upper(2)];
    expect(ids((await audit([finance], plan)).unmet)).toEqual(["finance/upper58"]);
  });
});

describe("Accounting", () => {
  const ACCT_CORE = ["BMGT310", "BMGT321", "BMGT326"];

  test("Public Accounting track plan satisfies everything", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...ACCT_CORE, "BMGT311", "BMGT323", "BMGT411", "BMGT422", "BMGT428L", ...upper(4)];
    expect((await audit([acctPublic], plan)).unmet).toEqual([]);
  });

  test("Business and Accounting Advisory track plan satisfies everything", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...ACCT_CORE, "BMGT313", "BMGT417", "BMGT440", ...upper(6)];
    expect((await audit([acctAdvisory], plan)).unmet).toEqual([]);
  });

  test("Advisory: a third accounting elective may fill the broad slot", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...ACCT_CORE, "BMGT311", "BMGT323", "BMGT424", ...upper(6)];
    expect((await audit([acctAdvisory], plan)).unmet).toEqual([]);
  });

  test("Public: missing auditing and the elective", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...ACCT_CORE, "BMGT311", "BMGT323", "BMGT411", ...upper(6)];
    expect(ids((await audit([acctPublic], plan)).unmet)).toEqual(["accounting-public/bmgt422", "accounting-public/acct-elective"]);
  });

  test("Advisory: two accounting electives and nothing else leave the broad slot empty", async () => {
    const plan = [...LOWER, ...UPPER_CORE, ...ACCT_CORE, "BMGT311", "BMGT313", ...upper(6), "ECON315"];
    expect(ids((await audit([acctAdvisory], plan)).unmet)).toEqual(["accounting-advisory/acct-broad"]);
  });
});

describe("Marketing", () => {
  const MKT_PLAN = [...LOWER, ...UPPER_CORE, "BMGT351", "BMGT354", "BMGT457", "BMGT450", "BMGT484", "BMGT458U", ...upper(6)];

  test("the four-year plan satisfies everything", async () => {
    expect((await audit([marketing], MKT_PLAN)).unmet).toEqual([]);
  });

  test("at most 6 credits of BMGT458 topics", async () => {
    const plan = MKT_PLAN.map((c) => ({ BMGT450: "BMGT458A", BMGT484: "BMGT458T" })[c] ?? c);
    // The solver leaves the third topic out of the bucket rather than break the cap.
    expect(ids((await audit([marketing], plan)).unmet)).toEqual(["marketing/mkt-electives"]);
  });

  test("BMGT credits mostly transferred in: fewer than 23 at UMD", async () => {
    const transferred = new Set(["BMGT110", "BMGT220", "BMGT221", "BMGT230", "BMGT301", "BMGT340", "BMGT350", "BMGT364", "BMGT380"]);
    const plan: Sample[] = MKT_PLAN.filter((c) => c !== "BMGT463").map((c) => (transferred.has(c) ? { code: c, transfer: true } : c));
    expect(ids((await audit([marketing], [...plan, "ECON315"])).unmet)).toEqual(["marketing/bmgt-umd"]);
  });
});

describe("Operations Management & Business Analytics", () => {
  const OMBA_PLAN = [...LOWER, ...UPPER_CORE, "BMGT332", "BMGT385", "BMGT430", "BMGT431", "BMGT434", "BMGT404", ...upper(6)];

  test("the four-year plan satisfies everything", async () => {
    expect((await audit([omba], OMBA_PLAN)).unmet).toEqual([]);
  });

  test("CMSC320 substitutes for BMGT404", async () => {
    const plan = OMBA_PLAN.map((c) => (c === "BMGT404" ? "CMSC320" : c));
    expect((await audit([omba], plan)).unmet).toEqual([]);
  });

  test("two List B electives need a List A course", async () => {
    const plan = OMBA_PLAN.map((c) => (c === "BMGT434" ? "BMGT485" : c));
    expect(ids((await audit([omba], plan)).unmet)).toEqual(["omba/omba-list-a"]);
  });

  test("missing the business core and lower-level supporting courses", async () => {
    const plan = OMBA_PLAN.filter((c) => !["BMGT495", "ECON201", "BMGT230"].includes(c));
    expect(ids((await audit([omba], [...plan, "ECON315"])).unmet)).toEqual(["omba/econ201", "omba/stats", "omba/bmgt495"]);
  });
});

describe("business.yaml", () => {
  test("program ids, families and short names", () => {
    expect(programs.map((p) => [p.id, p.family])).toEqual([
      ["finance", "finance"],
      ["accounting-public", "accounting"],
      ["accounting-advisory", "accounting"],
      ["marketing", "marketing"],
      ["omba", "omba"],
    ]);
    for (const p of programs) expect((p.short ?? "").length).toBeLessThanOrEqual(12);
  });

  test("course codes exist in the catalog, apart from documented exceptions", () => {
    // Listed by the catalog/Smith but absent from public/courses.json (not offered recently, or only the
    // honors-suffixed section exists: BMGT490H, ENED490H).
    const exceptions = ["BMGT231", "BMGT342", "BMGT349", "BMGT447", "BMGT449", "BMGT490", "ENED490", "MATH130", "MATH220", "HLTH300"];
    // Every code the file can match: drop prose fields, then collect codes that aren't range bounds.
    const strip = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(strip) : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).filter(([k]) => !["notes", "note", "label", "sources", "NOTES", "SOURCES"].includes(k)).map(([k, x]) => [k, strip(x)]))
        : v;
    const text = JSON.stringify(strip(parse(readFileSync("src/programs/business.yaml", "utf8"))));
    const codes = [...new Set(text.match(/\b[A-Z]{4}\d{3}[A-Z]?\b(?!-)/g))];
    expect(codes.length).toBeGreaterThan(80);
    // Ranges like BMGT428-428 are topic courses; check at least one topic exists.
    for (const r of ["BMGT428", "BMGT448", "BMGT458"]) expect([...Array(26)].some((_, i) => inCatalog(r + String.fromCharCode(65 + i)))).toBe(true);
    expect(codes.filter((c) => !inCatalog(c) && !exceptions.includes(c))).toEqual([]);
    expect(exceptions.filter((c) => inCatalog(c))).toEqual([]);
  });
});
