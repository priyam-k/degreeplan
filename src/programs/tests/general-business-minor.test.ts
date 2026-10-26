import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [gb] = loadFile("general-business-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

describe("General Business minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    expect((await audit([gb], ["BMIN210", "BMIN345", "BMIN355", "BMIN395", "BMIN375"])).unmet).toEqual([]);
  });

  test("BMGT220 + 221 and the BMGT substitutes count", async () => {
    const plan = ["BMGT220", "BMGT221", "BMGT340", "BMGT350", "BMGT364", "BMGT301"];
    expect((await audit([gb], plan)).unmet).toEqual([]);
  });

  test("BMGT220 alone isn't accounting, and an elective is required", async () => {
    const plan = ["BMGT220", "BMIN345", "BMIN355", "BMIN395"];
    expect(ids((await audit([gb], plan)).unmet)).toEqual(["general-business-minor/elective", "general-business-minor/accounting-set"]);
  });

  test("at most 6 transfer credits", async () => {
    const t = (code: string) => ({ code, transfer: true });
    // The cap is a hard limit: the third 3-credit transfer course is left out.
    const plan = ["BMIN210", t("BMGT340"), t("BMGT350"), "BMIN395", "BMIN305"];
    expect((await audit([gb], plan)).unmet).toEqual([]);
    const { unmet } = await audit([gb], ["BMIN210", t("BMGT340"), t("BMGT350"), t("BMGT364"), "BMIN305"]);
    expect(ids(unmet)).toHaveLength(1);
    expect(ids(unmet)[0]).toMatch(/^general-business-minor\/(finance|marketing|management)$/);
  });

  test("required courses exist in the catalog", () => {
    const codes = ["BMIN210", "BMIN345", "BMIN355", "BMIN395", "BMIN375", "BMIN305", "BMGT220", "BMGT221", "BMGT340", "BMGT350", "BMGT364", "BMGT372", "BMGT301"];
    expect(codes.filter((c) => !inCatalog(c))).toEqual([]);
  });
});
