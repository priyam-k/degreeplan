import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const programs = loadFile("economics.yaml");
const ba = programs.find((p) => p.id === "econ-ba")!;
const bs = programs.find((p) => p.id === "econ-bs")!;
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// Department sample graduation plans (econ.umd.edu checklists), major courses only.
const BA_PLAN = [
  "ECON200", "ECON201", "MATH120", "ECON230", "ECON305", "ECON306",
  "ECON424", // quantitative methods
  "ECON330", "ECON375", // 300/400-level B.A. courses
  "ECON443", "ECON454", "ECON465", // 400-level B.A. courses
  "ECON386", // experiential learning
];
const BS_PLAN = [
  "ECON200", "ECON201", "MATH140", "MATH141", "ECON300", "ECON321", "ECON325", "ECON326", "ECON422",
  "ECON423", "ECON406", "ECON460", // 400-level B.S.
  "ECON465", // 400-level B.S. or B.A.
  "ECON330", // 300/400-level B.S. or B.A.
];

describe("Economics B.A.", () => {
  test("loads with the file name as family", () => {
    expect(programs.map((p) => p.id)).toEqual(["econ-ba", "econ-bs"]);
    expect(programs.map((p) => p.family)).toEqual(["economics", "economics"]);
  });

  test("a typical completed B.A. satisfies everything", async () => {
    const { unmet } = await audit([ba], BA_PLAN);
    expect(unmet).toEqual([]);
  });

  test("MATH140 and BMGT230 alternatives, and small experiential courses adding to 3 credits", async () => {
    const plan = BA_PLAN.map((c) => ({ MATH120: "MATH140", ECON230: "BMGT230" })[c] ?? c).filter((c) => c !== "ECON386");
    const { unmet } = await audit([ba], [...plan, "ECON387", "PSYC123"]);
    expect(unmet).toEqual([]);
  });

  test("no quantitative-methods course is reported", async () => {
    const plan = BA_PLAN.filter((c) => c !== "ECON424");
    const { unmet } = await audit([ba], [...plan, "ECON310"]);
    expect(ids(unmet)).toEqual(["econ-ba/quant"]);
  });

  test("B.S.-only courses don't count as B.A. 400-level electives", async () => {
    // ECON406/407/410 are B.S.-only. ECON424 can fill only one slot; the solver puts it with the 400-level electives.
    const plan = BA_PLAN.filter((c) => !["ECON443", "ECON454", "ECON465"].includes(c));
    const { unmet } = await audit([ba], [...plan, "ECON406", "ECON407", "ECON410"]);
    expect(ids(unmet)).toEqual(["econ-ba/quant", "econ-ba/ba-400", "econ-ba/credits"]);
  });

  test("missing intermediate macro and statistics are reported", async () => {
    const plan = BA_PLAN.filter((c) => c !== "ECON305" && c !== "ECON230");
    const { unmet } = await audit([ba], [...plan, "STAT400"]);
    expect(ids(unmet)).toEqual(["econ-ba/stats", "econ-ba/econ305", "econ-ba/credits"]);
  });
});

describe("Economics B.S.", () => {
  test("a typical completed B.S. satisfies everything", async () => {
    const { unmet } = await audit([bs], BS_PLAN);
    expect(unmet).toEqual([]);
  });

  test("MATH241 plus a statistics course replaces ECON300; STAT401 replaces ECON321", async () => {
    const plan = BS_PLAN.filter((c) => c !== "ECON300" && c !== "ECON321");
    const { unmet } = await audit([bs], [...plan, "MATH241", "STAT400", "STAT401"]);
    expect(unmet).toEqual([]);
  });

  test("MATH241 without another statistics course is reported", async () => {
    const plan = BS_PLAN.filter((c) => c !== "ECON300");
    const { unmet } = await audit([bs], [...plan, "MATH241"]);
    expect(ids(unmet)).toEqual(["econ-bs/methods-path"]);
  });

  test("B.A. theory courses and B.A.-only electives don't satisfy the B.S.", async () => {
    const plan = BS_PLAN.filter((c) => !["ECON325", "ECON326", "ECON406", "ECON460"].includes(c));
    const { unmet } = await audit([bs], [...plan, "ECON305", "ECON306", "ECON443", "ECON453"]);
    expect(ids(unmet)).toEqual(["econ-bs/econ325", "econ-bs/econ326", "econ-bs/bs-400", "econ-bs/credits"]);
  });

  test("missing econometrics is reported", async () => {
    const { unmet } = await audit([bs], BS_PLAN.filter((c) => c !== "ECON422"));
    expect(ids(unmet)).toEqual(["econ-bs/econ422", "econ-bs/credits"]);
  });
});

test("required and listed courses exist in the catalog", () => {
  const required = ["ECON200", "ECON201", "MATH120", "MATH140", "ECON230", "BMGT230", "ECON305", "ECON306", "ECON300", "MATH241", "ECON321", "STAT401", "ECON325", "ECON326", "ECON422", "ECON386"];
  expect(required.filter((c) => !inCatalog(c))).toEqual([]);
  const listed = [
    "ECON402", "ECON414", "ECON424", "ECON425", "ECON426",
    "ECON310", "ECON311", "ECON312", "ECON314", "ECON315", "ECON317", "ECON327", "ECON330", "ECON340", "ECON354", "ECON371", "ECON375",
    "ECON443", "ECON451", "ECON453", "ECON455", "ECON456", "ECON461", "ECON472", "ECON481", "ECON484", "ECON485", "ECON486", "ECON490",
    "ECON401", "ECON417", "ECON432", "ECON433", "ECON434", "ECON435", "ECON454", "ECON465", "ECON470",
    "ECON406", "ECON407", "ECON410", "ECON412", "ECON415", "ECON416", "ECON423", "ECON427", "ECON442", "ECON460",
  ];
  // Not offered in the last ~4 years of the schedule (still in the 2026-27 catalog, except ECON425,
  // which the 2025-26 catalog lists but 2026-27 dropped). See docs/research/economics.md.
  const notRecentlyOffered = ["ECON425", "ECON314", "ECON340", "ECON472", "ECON490", "ECON434", "ECON435", "ECON412", "ECON415", "ECON460"];
  expect(listed.filter((c) => !inCatalog(c)).sort()).toEqual([...notRecentlyOffered].sort());
  // Topics courses are matched by number range; at least ECON418 has topics in the local catalog.
  expect(inCatalog("ECON418A")).toBe(true);
});
