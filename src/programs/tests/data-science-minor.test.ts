import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [ds] = loadFile("data-science-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

const CORE = ["DATA110", "DATA120", "DATA200", "DATA250", "DATA320", "DATA350"];

describe("Data Science minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    expect((await audit([ds], ["DATA100", ...CORE, "DATA400"])).unmet).toEqual([]);
  });

  test("CS-style substitutes count: CMSC250 + MATH240, CMSC320, STAT400 prerequisite + STAT401", async () => {
    const plan = ["STAT400", "DATA110", "DATA120", "DATA200", "CMSC250", "MATH240", "CMSC320", "DATA350", "STAT401"];
    expect((await audit([ds], plan)).unmet).toEqual([]);
  });

  test("CMSC250 alone doesn't replace DATA250, and the prerequisite is required", async () => {
    const plan = ["DATA110", "DATA120", "DATA200", "CMSC250", "DATA320", "DATA350", "DATA400"];
    expect(ids((await audit([ds], plan)).unmet)).toEqual(["data-science-minor/prereq", "data-science-minor/discrete-set"]);
  });

  test("a non-probability STAT course can't replace DATA400", async () => {
    const plan = ["DATA100", ...CORE, "STAT430"];
    expect(ids((await audit([ds], plan)).unmet)).toEqual(["data-science-minor/prob-course"]);
  });

  test("required courses exist in the catalog", () => {
    expect(["DATA100", ...CORE, "DATA400", "CMSC250", "CMSC320", "STAT400", "STAT410", "ENEE324"].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
