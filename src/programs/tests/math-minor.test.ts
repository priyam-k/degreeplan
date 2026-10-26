import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [math] = loadFile("math-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

const PLAN = ["MATH241", "MATH240", "MATH310", "MATH410", "MATH403", "MATH463", "STAT400"];

describe("Mathematics minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    expect((await audit([math], PLAN)).unmet).toEqual([]);
  });

  test("a MATH310 exemption is a waiver; 19 credits remain", async () => {
    const plan = PLAN.filter((c) => c !== "MATH310");
    expect(ids((await audit([math], plan)).unmet)).toEqual(["math-minor/math310"]);
    expect((await audit([math], plan, { waived: ["math-minor/math310"] })).unmet).toEqual([]);
  });

  test("a missing area and the credit shortfall are reported", async () => {
    const { unmet } = await audit([math], ["MATH241", "MATH240", "MATH310", "MATH405", "MATH401", "STAT400"]);
    expect(ids(unmet)).toEqual(["math-minor/analysis", "math-minor/credits"]);
  });

  test("one course can't fill two areas", async () => {
    // MATH410 is both theory and analysis, but only counts once.
    const { unmet } = await audit([math], ["MATH241", "MATH240", "MATH310", "MATH410", "MATH401", "STAT400"]);
    expect(ids(unmet)).toHaveLength(2);
    expect(ids(unmet)).toContain("math-minor/credits");
    expect(ids(unmet)[0]).toMatch(/^math-minor\/(theory|analysis)$/);
  });

  test("excluded 400-level courses don't count as electives", async () => {
    const { result } = await audit([math], [...PLAN, "MATH461", "MATH478", "STAT464", "MATH420"]);
    const extra = result.programs[0].buckets.find((b) => b.bucket.id === "extra");
    // c10 is MATH420; MATH478 and STAT464 are excluded (MATH461 fills nothing: linear algebra is taken).
    expect(extra?.assigned.every((id) => id === "c10")).toBe(true);
  });

  test("at most one 400-level course may be transferred", async () => {
    const t = (code: string) => ({ code, transfer: true });
    // The cap is a hard limit: one transferred course is left out, leaving an area and the credits short.
    const plan = ["MATH241", "MATH240", "MATH310", "MATH410", "MATH463", "STAT400"];
    expect((await audit([math], [...plan, t("MATH401")])).unmet).toEqual([]);
    const { unmet } = await audit([math], ["MATH241", "MATH240", "MATH310", "MATH410", t("MATH401"), t("MATH463"), "STAT400"]);
    expect(ids(unmet)).toHaveLength(2);
    expect(ids(unmet)[0]).toMatch(/^math-minor\/(algebra|analysis)$/);
    expect(ids(unmet)[1]).toBe("math-minor/credits");
  });

  test("required courses exist in the catalog", () => {
    const codes = ["MATH241", "MATH340", "MATH240", "MATH461", "MATH341", "MATH310", "MATH401", "MATH402", "MATH403", "MATH405"];
    const more = ["MATH406", "MATH410", "MATH416", "MATH423", "MATH462", "MATH463", "MATH464", "STAT400", "STAT410"];
    expect([...codes, ...more].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
