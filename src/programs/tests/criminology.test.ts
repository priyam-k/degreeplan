import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [ccjs] = loadFile("criminology.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

const REQUIRED = ["CCJS100", "CCJS105", "CCJS200", "CCJS230", "CCJS300", "STAT100"];
const PLAN = [...REQUIRED, "CCJS340", "CCJS345", "CCJS454", "CCJS360", "CCJS370", "CCJS418G", "CCJS451"];
const without = (plan: string[], ...drop: string[]) => plan.filter((c) => !drop.includes(c));

describe("Criminology and Criminal Justice", () => {
  test("a typical completed major satisfies everything", async () => {
    const { unmet } = await audit([ccjs], PLAN);
    expect(unmet).toEqual([]);
  });

  test("approved substitutes: PSYC200 for CCJS200, calculus for the math course, internship and independent study", async () => {
    const plan = [
      ...without(PLAN, "CCJS200", "STAT100", "CCJS360", "CCJS370"),
      "PSYC200",
      "MATH140",
      { code: "CCJS359", credits: 3 },
      { code: "CCJS399", credits: 3 },
    ];
    const { unmet } = await audit([ccjs], plan);
    expect(unmet).toEqual([]);
  });

  test("only one 400-level Course of Choice", async () => {
    const { unmet } = await audit([ccjs], [...without(PLAN, "CCJS451"), "CCJS352"]);
    expect(ids(unmet)).toEqual(["ccjs/choice-400"]);
  });

  test("the theory course can't double as a 400-level Course of Choice", async () => {
    // CCJS451 is the only theory course, so it can't also be one of the two 400-level choices.
    const { unmet } = await audit([ccjs], [...without(PLAN, "CCJS454", "CCJS418G"), "CCJS352", "CCJS325"]);
    expect(ids(unmet)).toEqual(["ccjs/choice-400"]);
  });

  // In the next two plans the CCJS courses are one short. The solver may borrow a required course for the
  // Courses of Choice, so the shortfall can show up on that requirement instead; exactly one is unmet.
  const SHORT_BY_ONE = ["ccjs/choice", "ccjs/cj", "ccjs/theory"];

  test("CCJS386 and CCJS332 don't count as Courses of Choice", async () => {
    const plan = [...without(PLAN, "CCJS370"), "CCJS386", "CCJS332"];
    const { unmet } = await audit([ccjs], plan);
    expect(unmet).toHaveLength(1);
    expect(SHORT_BY_ONE).toContain(ids(unmet)[0]);
    expect((await audit([ccjs], [...plan, "CCJS370"])).unmet).toEqual([]);
  });

  test("only one internship counts", async () => {
    const plan = [...without(PLAN, "CCJS360", "CCJS370"), { code: "CCJS359", credits: 3 }, { code: "CCJS398", credits: 3 }];
    const { unmet } = await audit([ccjs], plan);
    expect(unmet).toHaveLength(1);
    expect(SHORT_BY_ONE).toContain(ids(unmet)[0]);
    expect((await audit([ccjs], [...plan, "CCJS360"])).unmet).toEqual([]);
  });

  test("missing a criminal justice course, the theory course and the math course", async () => {
    const { unmet } = await audit([ccjs], without(PLAN, "CCJS345", "CCJS454", "STAT100"));
    expect(ids(unmet)).toEqual(["ccjs/cj", "ccjs/theory", "ccjs/math"]);
  });
});

test("required course codes exist in the catalog", () => {
  const codes = [...REQUIRED, "MATH107", "CCJS340", "CCJS342", "CCJS345", "CCJS450", "CCJS451", "CCJS454", "CCJS359", "CCJS398", "CCJS399"];
  expect(codes.filter((c) => !inCatalog(c))).toEqual([]);
  // GVPT422 (an approved CCJS200 substitute) hasn't been offered in the last four years.
  expect(["GVPT422"].filter((c) => !inCatalog(c))).toEqual(["GVPT422"]);
});
