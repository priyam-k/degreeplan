import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [stat] = loadFile("stat-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

describe("Statistics minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    const { unmet } = await audit([stat], ["MATH241", "STAT400", "STAT401", "STAT430", "STAT426"]);
    expect(unmet).toEqual([]);
  });

  test("the theory pair works, and a third pair course can be the elective", async () => {
    const { unmet } = await audit([stat], ["MATH340", "STAT410", "STAT420", "STAT430", "STAT401"]);
    expect(unmet).toEqual([]);
  });

  test("STAT400 + STAT420 is not an allowed pair, and STAT430 is required", async () => {
    const { unmet } = await audit([stat], ["MATH241", "STAT400", "STAT420", "STAT426"]);
    expect(ids(unmet)).toEqual(["stat-minor/stat430", "stat-minor/pair-seq"]);
  });

  test("at most one upper-level course may be transferred", async () => {
    // The cap is a hard limit: the second transferred course is left out, so the pair is incomplete.
    const t = (code: string) => ({ code, transfer: true });
    const { unmet } = await audit([stat], ["MATH241", t("STAT400"), t("STAT401"), "STAT430", "STAT426"]);
    expect(ids(unmet)).toEqual(["stat-minor/pair", "stat-minor/pair-seq"]);
    expect((await audit([stat], ["MATH241", t("STAT400"), "STAT401", "STAT430", "STAT426"])).unmet).toEqual([]);
  });

  test("required courses exist in the catalog", () => {
    expect(["MATH241", "MATH340", "STAT400", "STAT401", "STAT410", "STAT420", "STAT430", "STAT422", "STAT426", "STAT440", "STAT470", "MATH424"].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
