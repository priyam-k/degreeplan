import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [teci] = loadFile("tech-entrepreneurship-minor.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

describe("Technology Entrepreneurship and Corporate Innovation minor", () => {
  test("a typical completed minor satisfies everything", async () => {
    expect((await audit([teci], ["ENES140", "ENES210", "ENES460", "ENES462", "ENES466"])).unmet).toEqual([]);
  });

  test("the Shady Grove (SMLP) pathway works too", async () => {
    expect((await audit([teci], ["ENES210", "SMLP470", "SMLP471", "SMLP472", "SMLP474"])).unmet).toEqual([]);
  });

  test("too few credits, and too few at the 400 level", async () => {
    expect(ids((await audit([teci], ["ENES140", "ENES210", "ENES460", "ENES462"])).unmet)).toEqual([
      "tech-entrepreneurship-minor/courses",
      "tech-entrepreneurship-minor/upper",
    ]);
  });

  test("lower-level credit beyond 6 doesn't count", async () => {
    // Only 6 of these 7 lower-level credits count: 6 + 9 = 15 is reached only with a fourth 400-level course.
    const plan = ["ENES140", "ENES210", { code: "HEIP143", credits: 1 }, "ENES460", "ENES462", "ENES463"];
    expect((await audit([teci], plan)).unmet).toEqual([]);
    const { unmet } = await audit([teci], ["ENES140", "ENES210", { code: "HEIP143", credits: 1 }, "ENES460", "ENES462"]);
    expect(ids(unmet)).toEqual(["tech-entrepreneurship-minor/courses", "tech-entrepreneurship-minor/upper"]);
  });

  test("courses exist in the catalog, except those no longer offered", () => {
    const codes = ["ENES140", "ENES210", "ENES460", "ENES461", "ENES462", "ENES463", "ENES464", "ENES466", "ENES471"];
    const more = ["HEIP143", "HEIP240", "HEIP241", "SMLP470", "SMLP471", "SMLP472", "SMLP473", "SMLP474"];
    expect([...codes, ...more].filter((c) => !inCatalog(c))).toEqual(["ENES464", "HEIP143", "HEIP240", "HEIP241"]);
  });
});
