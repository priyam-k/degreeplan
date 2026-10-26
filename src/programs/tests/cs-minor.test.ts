import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [cs] = loadFile("cs-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

const PLAN = ["CMSC131", "MATH140", "CMSC132", "MATH141", "CMSC216", "CMSC250", "CMSC330", "CMSC351", "CMSC420", "CMSC424"];

describe("Computer Science minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    expect((await audit([cs], PLAN)).unmet).toEqual([]);
  });

  test("a missing core course and a 300-level 'elective' are reported", async () => {
    const plan = PLAN.filter((c) => c !== "CMSC330" && c !== "CMSC424").concat("CMSC320");
    expect(ids((await audit([cs], plan)).unmet)).toEqual(["cs-minor/cmsc330", "cs-minor/electives"]);
  });

  test("only one of CMSC460/466 counts", async () => {
    const plan = PLAN.filter((c) => c !== "CMSC420" && c !== "CMSC424").concat("CMSC460", "CMSC466");
    expect(ids((await audit([cs], plan)).unmet)).toEqual(["cs-minor/electives"]);
  });

  test("six upper-level credits must be taken at UMD", async () => {
    const t = (code: string) => ({ code, transfer: true });
    const plan = ["CMSC132", "MATH141", "CMSC216", "CMSC250", t("CMSC330"), t("CMSC351"), t("CMSC420"), "CMSC424"];
    expect(ids((await audit([cs], plan)).unmet)).toEqual(["cs-minor/umd-upper"]);
  });

  test("required courses exist in the catalog", () => {
    expect(["CMSC132", "MATH141", "CMSC216", "CMSC250", "CMSC330", "CMSC351"].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
