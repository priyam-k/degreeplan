import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile, type Sample } from "../testkit";

const programs = loadFile("biology.yaml");
const byId = (id: string) => {
  const p = programs.find((x) => x.id === id);
  if (!p) throw new Error(`no program ${id}`);
  return p;
};
const gen = byId("bio-gen");
const cbg = byId("bio-cbg");
const ee = byId("bio-ee");
const micro = byId("bio-micro");
const pn = byId("bio-pn");
const ivs = byId("bio-ivs");

// Basic program and supporting courses, as in the department's four-year plans (2025-26 labs).
const BASIC = [
  "BSCI160", "BSCI161", "BSCI170", "BSCI171", "BSCI207", "BSCI222",
  "MATH135", "MATH136",
  "CHEM131", "CHEM132", "CHEM231", "CHEM232", "CHEM241", "CHEM242", "CHEM271", "CHEM272",
  "PHYS131", "PHYS132",
];
// 2026-27 entrant: BSCI180 replaces 161/171, calculus route.
const BASIC_2026 = [
  ...BASIC.filter((c) => !["BSCI161", "BSCI171", "MATH135", "MATH136"].includes(c)),
  "BSCI180", "MATH140", "MATH141",
];
const without = (list: string[], ...drop: string[]) => list.filter((c) => !drop.includes(c));
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

describe("Biological Sciences major", () => {
  test("six specializations load as one family", () => {
    expect(programs.map((p) => p.id)).toEqual(["bio-gen", "bio-cbg", "bio-ee", "bio-micro", "bio-pn", "bio-ivs"]);
    expect(new Set(programs.map((p) => p.family))).toEqual(new Set(["biology"]));
  });

  describe("complete plans", () => {
    test("General Biology", async () => {
      const plan = [...BASIC, "BCHM461", "STAT464", "BSCI410", "BSCI330", "BSCI360", "BSCI337", "BSCI433", "BSCI416", "BSCI447"];
      const { unmet } = await audit([gen], plan);
      expect(unmet).toEqual([]);
    });

    test("Cell Biology and Genetics (2026-27 courses)", async () => {
      const plan = [...BASIC_2026, "BCHM461", "BCHM462", "BSCI331", "BSCI332", "BSCI410", "BSCI420", "BSCI433", "BSCI415", "BSCI425", "CHEM401"];
      const { unmet } = await audit([cbg], plan);
      expect(unmet).toEqual([]);
    });

    test("Ecology and Evolution", async () => {
      const plan = [...BASIC, "BSCI361", "BSCI370", "BIOM301", "BSCI337", "BSCI462", "BSCI467", "BSCI494", "BSCI433"];
      const { unmet } = await audit([ee], plan);
      expect(unmet).toEqual([]);
    });

    test("Microbiology", async () => {
      const plan = [...BASIC, "BSCI283", "BSCI412", "BSCI443", "BCHM461", "BCHM462", "BSCI424", "BSCI437", "BSCI433"];
      const { unmet } = await audit([micro], plan);
      expect(unmet).toEqual([]);
    });

    test("Physiology and Neurobiology (department four-year plan)", async () => {
      const plan = [...BASIC, "BCHM463", "BSCI330", "BSCI353", "BSCI450", "BSCI451", "BSCI446", "BSCI447", "BSCI433", "BSCI363"];
      const { unmet } = await audit([pn], plan);
      expect(unmet).toEqual([]);
    });

    test("Individualized Studies", async () => {
      const plan: Sample[] = [
        ...BASIC, "BCHM461", "STAT464",
        "BSCI330", "BSCI415", "PSYC341", "BSCI353", "BSCI446", "BSCI452", { code: "BSCI399", credits: 2 },
      ];
      const { unmet } = await audit([ivs], plan);
      expect(unmet).toEqual([]);
    });
  });

  describe("incomplete plans", () => {
    test("basic program: one 2025-26 lab and an invalid math pairing", async () => {
      const plan = [...without(BASIC, "BSCI171", "MATH136"), "MATH141", "BCHM463", "BSCI330", "BSCI353", "BSCI450", "BSCI451", "BSCI446", "BSCI447", "BSCI433", "BSCI363"];
      const { unmet } = await audit([pn], plan);
      expect(ids(unmet)).toEqual(["bio-pn/intro-lab-set", "bio-pn/math-set"]);
    });

    test("PHNB without BSCI450 and with only one lab", async () => {
      const plan = [...BASIC, "BCHM463", "BSCI330", "BSCI353", "BSCI446", "BSCI447", "BSCI433", "BSCI452", "BSCI363"];
      const { unmet } = await audit([pn], plan);
      expect(ids(unmet)).toEqual(["bio-pn/bsci450", "bio-pn/advanced-27", "bio-pn/labs"]);
    });

    test("PHNB counts only one statistics course in the area", async () => {
      const plan = [...BASIC, "BCHM463", "BSCI330", "BSCI353", "BSCI450", "BSCI451", "STAT464", "BIOM301", "BSCI446", "BSCI363"];
      const { unmet } = await audit([pn], plan);
      expect(ids(unmet)).toEqual(["bio-pn/area", "bio-pn/advanced-27"]);
    });

    test("CEBG area with no Genetics-group course", async () => {
      const plan = [...BASIC, "BCHM461", "BCHM462", "BSCI330", "BSCI410", "BSCI420", "BSCI433", "BSCI422", "BSCI423", "CHEM401"];
      const { unmet } = await audit([cbg], plan);
      expect(ids(unmet)).toEqual(["bio-cbg/cebg-groups"]);
    });

    test("ECEV with only one 400-level area course and no enrichment", async () => {
      const plan = [...BASIC, "BSCI361", "BSCI370", "BIOM301", "BSCI337", "BSCI333", "BSCI360", "BSCI467"];
      const { unmet } = await audit([ee], plan);
      // 25 advanced credits: the solver leaves the shortfall in the area bucket.
      expect(ids(unmet)).toEqual(["bio-ee/area", "bio-ee/advanced-27", "bio-ee/ecev-400"]);
    });

    test("Microbiology with a mismatched biochemistry pair and no area lab", async () => {
      const plan = [...BASIC, "BSCI283", "BSCI412", "BSCI443", "BCHM461", "BCHM465", "BSCI417", "BSCI437", "BSCI464", "BSCI433"];
      const { unmet } = await audit([micro], plan);
      expect(ids(unmet)).toEqual(["bio-micro/biochem-pair", "bio-micro/labs", "bio-micro/area-lab"]);
    });

    test("General Biology missing the Ecology, Behavior & Organismal area", async () => {
      const plan = [...BASIC, "BCHM461", "STAT464", "BSCI410", "BSCI330", "BSCI415", "BSCI433", "BSCI416", "BSCI447", "BSCI420"];
      const { unmet } = await audit([gen], plan);
      expect(ids(unmet)).toEqual(["bio-gen/genb-areas", "bio-gen/genb-ebo-3"]);
    });

    test("Individualized Studies without outside or research credit", async () => {
      const plan = [...BASIC, "BCHM461", "STAT464", "BSCI330", "BSCI415", "BSCI353", "BSCI446", "BSCI452", "BSCI433", "BSCI447"];
      const { unmet } = await audit([ivs], plan);
      expect(ids(unmet)).toEqual(["bio-ivs/outside-min", "bio-ivs/research-paper"]);
    });
  });

  test("required and listed course codes exist in the catalog", () => {
    const required = [
      "BSCI160", "BSCI161", "BSCI170", "BSCI171", "BSCI180", "BSCI207", "BSCI222", "HLSC322",
      "MATH135", "MATH136", "MATH140", "MATH141", "CHEM131", "CHEM132", "CHEM231", "CHEM232", "CHEM241", "CHEM242",
      "CHEM271", "CHEM272", "PHYS131", "PHYS132", "PHYS141", "PHYS142",
      "BCHM461", "BCHM462", "BCHM463", "BCHM465", "BSCI330", "BSCI331", "BSCI332", "BSCI353", "BSCI361", "BSCI370",
      "BSCI410", "BSCI412", "BSCI420", "BSCI443", "BSCI450", "BSCI283", "BSCI223", "BIOM301", "STAT400", "STAT464",
      "BSCI374", "HLSC374", "MATH240", "BSCI378H", "BSCI398H",
    ];
    expect(required.filter((c) => !inCatalog(c))).toEqual([]);

    // Area-list courses the catalog still names but that are absent from the last four years of classes.
    const documentedMissing = [
      "BSCI402", "BSCI427", "BSCI364", "BSCI373", "BSCI413", "BSCI460", "BSCI461", "BSCI465", "BSCI471", "BSCI475",
      "BSCI348C", "BSCI440", "BSCI441", "BSCI338L",
    ];
    const listed = [
      "BSCI343", "BSCI404", "BSCI406", "BSCI417", "BSCI422", "BSCI423", "BSCI430", "BSCI432", "BSCI433", "BSCI436",
      "BSCI442", "BSCI454", "BSCI455", "BSCI381", "BSCI405", "BSCI407", "BSCI411", "BSCI414", "BSCI415", "BSCI416",
      "BSCI425", "BSCI437", "BCHM464", "BSCI333", "BSCI334", "BSCI335", "BSCI337", "BSCI360", "BSCI363", "BSCI366",
      "BSCI392", "BSCI393", "BSCI400", "BSCI401", "BSCI403", "BSCI426", "BSCI431", "BSCI462", "BSCI464", "BSCI467",
      "BSCI473", "BSCI476", "BSCI477", "BSCI480", "BSCI481", "BSCI483", "BSCI487", "BSCI494", "BSCI497", "BSCI342",
      "BSCI424", "BSCI446", "BSCI447", "BSCI451", "BSCI452", "BSCI453", "BSCI456", "BSCI355", "BSCI357", "BSCI348J",
      "BSCI348M", "BSCI338B",
      ...documentedMissing,
    ];
    expect(listed.filter((c) => !inCatalog(c))).toEqual(documentedMissing);
  });
});
