import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [ba, bs] = loadFile("psychology.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// A B.A. plan in the shape of the department checklist: foundation courses, gateways, two courses
// from each theme (PSYC354 is the multicultural course), two 400-level non-labs and one 4-credit lab.
const GATEWAYS = ["PSYC100", "MATH140", "BSCI170"];
const FOUNDATION = ["PSYC200", "PSYC300"];
const ELECTIVES = [
  "PSYC202", "PSYC341", // Theme I
  "PSYC353", "PSYC436", // Theme II (436 is 400-level)
  "PSYC221", "PSYC354", // Theme III (354 multicultural)
  "PSYC425", // Theme II, 400-level
  "PSYC420", // Theme III, 4-credit lab
];
const BA_PLAN = [...GATEWAYS, ...FOUNDATION, ...ELECTIVES];
const swap = (plan: string[], from: string, to: string) => plan.map((c) => (c === from ? to : c));

describe("Psychology B.A.", () => {
  test("a typical completed major satisfies everything", async () => {
    const { unmet } = await audit([ba], BA_PLAN);
    expect(unmet).toEqual([]);
  });

  test("only one theme missing is reported", async () => {
    const plan = swap(swap(BA_PLAN, "PSYC202", "PSYC330"), "PSYC341", "PSYC332");
    const { unmet } = await audit([ba], plan);
    expect(ids(unmet)).toEqual(["psyc-ba/theme1"]);
  });

  test("no multicultural course", async () => {
    const { unmet } = await audit([ba], swap(BA_PLAN, "PSYC354", "PSYC334"));
    expect(ids(unmet)).toEqual(["psyc-ba/multicultural"]);
  });

  test("no lab and too few 400-level courses or credits", async () => {
    const plan = swap(swap(BA_PLAN, "PSYC420", "PSYC362"), "PSYC425", "PSYC344");
    const { unmet } = await audit([ba], plan);
    expect(ids(unmet)).toEqual(["psyc-ba/electives", "psyc-ba/upper400", "psyc-ba/lab"]);
  });

  test("independent study (PSYC478) doesn't count toward the major", async () => {
    const plan = swap(BA_PLAN, "PSYC425", "PSYC478");
    const { unmet } = await audit([ba], plan);
    expect(ids(unmet)).toEqual(["psyc-ba/electives", "psyc-ba/upper400"]);
  });

  test("missing gateway courses", async () => {
    const plan = BA_PLAN.filter((c) => c !== "BSCI170" && c !== "MATH140").concat("STAT100");
    const { unmet } = await audit([ba], plan);
    expect(ids(unmet)).toEqual(["psyc-ba/gateway-math", "psyc-ba/gateway-bsci"]);
  });

  test("a reused PSYC489Q letter counts as multicultural only in the listed terms", async () => {
    const base = swap(BA_PLAN, "PSYC354", "PSYC334");
    const now = await audit([ba], [...base.filter((c) => c !== "PSYC353"), { code: "PSYC489Q", term: "Spring 2026" }]);
    expect(now.unmet).toEqual([]);
    const before = await audit([ba], [...base.filter((c) => c !== "PSYC353"), { code: "PSYC489Q", term: "Spring 2025" }]);
    expect(ids(before.unmet)).toEqual(["psyc-ba/multicultural"]);
  });
});

describe("Psychology B.S.", () => {
  // BSCI171 + three advanced courses (BSCI330 is a lab): 4 + 3 + 1 + 11 = 19 credits, two labs.
  const BS_PLAN = [...BA_PLAN, "BSCI171", "BSCI330", "STAT400", "MATH141"];

  test("a typical completed B.S. satisfies everything", async () => {
    const { unmet } = await audit([bs], BS_PLAN);
    expect(unmet).toEqual([]);
  });

  test("the B.A. plan alone misses the B.S. math and science", async () => {
    const { unmet } = await audit([bs], BA_PLAN);
    // The solver may also move PSYC courses into the B.S. bucket, leaving a theme or lab short instead.
    expect(ids(unmet)).toEqual(expect.arrayContaining(["psyc-bs/bs-advanced", "psyc-bs/bs-total", "psyc-bs/bs-labs"]));
  });

  test("advanced courses without a lab", async () => {
    const { unmet } = await audit([bs], [...BA_PLAN, "BSCI171", "NEUR305", "STAT400", "MATH141"]);
    expect(ids(unmet)).toEqual(["psyc-bs/bs-lab", "psyc-bs/bs-labs"]);
  });

  test("MATH120 and no BSCI171 falls short of 17 credits and two labs", async () => {
    const plan = swap(BA_PLAN, "MATH140", "MATH120").concat("BSCI330", "STAT400", "NEUR305");
    const { unmet } = await audit([bs], plan);
    expect(ids(unmet)).toEqual(["psyc-bs/bs-total", "psyc-bs/bs-labs"]);
  });

  test("a PSYC course can't count for both a theme and the B.S.", async () => {
    // PSYC341 is needed for Theme I, so it can't also be the third advanced course.
    const { unmet } = await audit([bs], [...BA_PLAN, "BSCI171", "BSCI330", "STAT400"]);
    // Either Theme I comes up short, or the B.S. is one course (and its credits) short.
    expect([["psyc-bs/theme1"], ["psyc-bs/bs-advanced", "psyc-bs/bs-total"]]).toContainEqual(ids(unmet));
    expect((await audit([bs], [...BA_PLAN, "BSCI171", "BSCI330", "STAT400", "MATH141"])).unmet).toEqual([]);
  });
});

test("required and listed course codes exist in the catalog", () => {
  const required = ["PSYC100", "PSYC200", "PSYC300", "MATH120", "MATH140", "MATH136", "BSCI170", "BSCI171"];
  expect(required.filter((c) => !inCatalog(c))).toEqual([]);
  // Lab courses on the department list; PSYC401 and 410/456/457 haven't run in the last four years.
  const labs = ["PSYC401", "PSYC407", "PSYC410", "PSYC417", "PSYC420", "PSYC433", "PSYC440", "PSYC450", "PSYC456", "PSYC457", "PSYC459A"];
  expect(labs.filter((c) => !inCatalog(c))).toEqual(["PSYC401", "PSYC410", "PSYC456", "PSYC457"]);
});
