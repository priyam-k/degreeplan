import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { readFileSync } from "node:fs";
import { audit, inCatalog, loadFile } from "../testkit";

const programs = loadFile("government-politics.yaml");
const ba = programs.find((p) => p.id === "gvpt-ba")!;
const bs = programs.find((p) => p.id === "gvpt-bs")!;
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// Shaped after the department's sample graduation plans (Feller Center), major courses only.
const BA_PLAN = [
  "GVPT170", "STAT100", "GVPT241", "GVPT201",
  "GVPT200", "GVPT280", "GVPT221", // courses of choice, any level
  "GVPT306", "GVPT331", "GVPT354", "GVPT406", "GVPT431", "GVPT473", // courses of choice, 300-400
  "ECON200", "SPAN103", // skills: economics, elementary language
  "SOCY201", // quantitative skills
  "SPAN203", // additional skills: intermediate language
];
const BS_PLAN = [
  "GVPT170", "MATH140", "GVPT201", "GVPT320",
  "GVPT390", // methods
  "GVPT399F", "GVPT479M", // quantitative methods
  "GVPT200", // foundational
  "GVPT241", "GVPT280", // courses of choice, any level
  "GVPT306", "GVPT354", "GVPT431", // courses of choice, 300-400
  "ECON200", "FREN103", "STAT400", "SOCY201", // skills
];

describe("Government and Politics B.A.", () => {
  test("loads two programs in one family", () => {
    expect(programs.map((p) => p.id)).toEqual(["gvpt-ba", "gvpt-bs"]);
    expect(programs.map((p) => p.family)).toEqual(["government-politics", "government-politics"]);
  });

  test("a typical completed B.A. satisfies everything", async () => {
    const { unmet } = await audit([ba], BA_PLAN);
    expect(unmet).toEqual([]);
  });

  test("an intermediate course waives elementary language and fills additional skills", async () => {
    const { unmet } = await audit([ba], BA_PLAN.filter((c) => c !== "SPAN103"));
    expect(unmet).toEqual([]);
  });

  test("a second quantitative course can replace the intermediate language course", async () => {
    const plan = BA_PLAN.filter((c) => c !== "SPAN203");
    const { unmet } = await audit([ba], [...plan, "GEOG170"]);
    expect(unmet).toEqual([]);
  });

  test("missing language and additional skills are reported", async () => {
    const { unmet } = await audit([ba], BA_PLAN.filter((c) => c !== "SPAN103" && c !== "SPAN203"));
    // SOCY201 can fill either skills slot, so the solver reports one of them.
    expect(ids(unmet)).toEqual(["gvpt-ba/language", "gvpt-ba/quant", "gvpt-ba/language-level"]);
  });

  test("half of a two-course elementary sequence isn't enough", async () => {
    const plan = BA_PLAN.filter((c) => c !== "SPAN103" && c !== "SPAN203");
    const { unmet } = await audit([ba], [...plan, "ARAB101", "GEOG170"]);
    expect(ids(unmet)).toEqual(["gvpt-ba/language-level"]);
  });

  test("too few upper-level GVPT courses are reported", async () => {
    const { unmet } = await audit([ba], BA_PLAN.filter((c) => c !== "GVPT473"));
    expect(ids(unmet)).toEqual(["gvpt-ba/choice-upper", "gvpt-ba/gvpt36", "gvpt-ba/upper18"]);
  });

  test("fewer than 12 upper-level GVPT credits at UMD is reported", async () => {
    const transferred = ["GVPT306", "GVPT331", "GVPT354"];
    const plan = BA_PLAN.map((c) => (transferred.includes(c) ? { code: c, transfer: true } : c));
    const { unmet } = await audit([ba], plan);
    expect(ids(unmet)).toEqual(["gvpt-ba/umd12"]);
  });
});

describe("Government and Politics B.S.", () => {
  test("a typical completed B.S. satisfies everything", async () => {
    const { unmet } = await audit([bs], BS_PLAN);
    expect(unmet).toEqual([]);
  });

  test("missing GVPT320 and a quantitative methods course are reported", async () => {
    const { unmet } = await audit([bs], BS_PLAN.filter((c) => c !== "GVPT320" && c !== "GVPT479M"));
    expect(ids(unmet)).toEqual(["gvpt-bs/gvpt320", "gvpt-bs/quant-methods", "gvpt-bs/gvpt36", "gvpt-bs/upper18"]);
  });

  test("an unlisted GVPT course doesn't fill the methods requirement", async () => {
    const plan = BS_PLAN.filter((c) => c !== "GVPT390");
    const { unmet } = await audit([bs], [...plan, "GVPT406"]);
    expect(ids(unmet)).toEqual(["gvpt-bs/methods"]);
  });

  test("a missing elementary language is reported", async () => {
    const { unmet } = await audit([bs], BS_PLAN.filter((c) => c !== "FREN103"));
    expect(ids(unmet)).toEqual(["gvpt-bs/language", "gvpt-bs/language-level"]);
  });

  test("B.A.-only quantitative skills courses don't count for the B.S.", async () => {
    const plan = BS_PLAN.filter((c) => c !== "SOCY201");
    const { unmet } = await audit([bs], [...plan, "PHIL170"]);
    expect(ids(unmet)).toEqual(["gvpt-bs/quant"]);
  });

  test("the math benchmark course can't also be a quantitative skills course", async () => {
    // MATH140 is both the benchmark and on the B.S. skills list; with only STAT400 besides it, one is short.
    const { unmet } = await audit([bs], BS_PLAN.filter((c) => c !== "SOCY201"));
    expect(ids(unmet)).toEqual(["gvpt-bs/quant"]);
  });
});

test("required and listed courses exist in the catalog", () => {
  const required = ["GVPT170", "GVPT201", "GVPT241", "GVPT320", "GVPT200", "GVPT280", "GVPT282", "ECON200", "STAT100", "MATH107", "MATH113", "MATH115", "MATH120", "MATH135", "MATH136", "MATH140"];
  expect(required.filter((c) => !inCatalog(c))).toEqual([]);

  // Every exact code named in the file's lists. Department-listed courses not offered in the last ~4 years:
  // GEOG372 and GVPT393 aren't in the 2026-27 catalog; the GVPT topics and PHIL171 are newer than the local data.
  const text = readFileSync("src/programs/government-politics.yaml", "utf8");
  const codes = [...new Set(JSON.stringify(parse(text)).match(/\b[A-Z]{4}\d{3}[A-Z]*\b(?!-\d)/g))];
  const exceptions = ["GEOG372", "GVPT393", "GVPT309C", "GVPT373", "GVPT392", "GVPT429A", "GVPT429C", "GVPT429D", "GVPT429W", "PHIL171"];
  expect(codes.filter((c) => !inCatalog(c)).sort()).toEqual([...exceptions].sort());
});
