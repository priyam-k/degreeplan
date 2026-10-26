import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [ras] = loadFile("ras.yaml");

describe("RAS minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    const { unmet } = await audit([ras], ["ENME480", "ENAE450", "ENEE467", "CMSC477", "MATH240", "CMSC421", "CMSC426"]);
    expect(unmet).toEqual([]);
  });

  test("a missing core course and too few electives are reported", async () => {
    const { unmet } = await audit([ras], ["ENME480", "ENAE450", "ENEE467", "MATH240", "CMSC421"]);
    expect(unmet.map((u) => u.split(":")[0])).toEqual(["ras-minor/cmsc477", "ras-minor/electives"]);
  });

  test("core courses exist in the catalog", () => {
    expect(["ENME480", "ENAE450", "ENEE467", "CMSC477"].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
