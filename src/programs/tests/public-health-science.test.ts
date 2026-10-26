import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile, type Sample } from "../testkit";

const [phsc] = loadFile("public-health-science.yaml");
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// The SPH sample eight-semester plan (2026), minus the four PHSC Options.
const FOUNDATIONS: Sample[] = [
  // Year 1
  "ENGL101", "MATH120", "BSCI170", "SPHL100", "UNIV100", "CHEM131", "CHEM132", "BSCI180", "PSYC100",
  // Year 2
  "CHEM231", "CHEM232", "COMM107", "BSCI223", "HLTH366", "EPIB301",
  // Year 3
  "BSCI201", "EPIB315", "MIEH300", "BSCI202", "PHSC450", "ENGL393",
  // Year 4
  "PHSC415", "HLSA300", "BSCI222", "PHSC497", "KNES320",
];
const OPTIONS = ["MIEH321", "PHSC420", "HLTH434", "PSYC344"];

describe("Public Health Science major", () => {
  test("program fields", () => {
    expect(phsc.id).toBe("phsc");
    expect(phsc.kind).toBe("major");
    expect(phsc.college).toBe("Public Health");
  });

  test("the sample four-year plan with four options satisfies everything", async () => {
    const { unmet } = await audit([phsc], [...FOUNDATIONS, ...OPTIONS]);
    expect(unmet).toEqual([]);
  });

  test("credit-equivalent chemistry and the older BSCI171 lab are accepted", async () => {
    const swapped = FOUNDATIONS.filter((c) => !["CHEM131", "CHEM132", "CHEM231", "CHEM232", "BSCI180"].includes(c as string));
    const { unmet } = await audit([phsc], [...swapped, "CHEM146", "CHEM177", "CHEM237", "BSCI171", ...OPTIONS]);
    expect(unmet).toEqual([]);
  });

  test("missing foundation courses are reported", async () => {
    const plan = FOUNDATIONS.filter((c) => c !== "KNES320" && c !== "CHEM232");
    const { unmet } = await audit([phsc], [...plan, ...OPTIONS]);
    expect(ids(unmet)).toEqual(["phsc/chem232", "phsc/knes320"]);
  });

  test("options must include 3 credits from the School of Public Health", async () => {
    const { unmet } = await audit([phsc], [...FOUNDATIONS, "BSCI422", "BSCI437", "PSYC344", "SOCY335"]);
    expect(ids(unmet)).toEqual(["phsc/options-sph"]);
  });

  test("at most 6 option credits of internship or research", async () => {
    const plan: Sample[] = [...FOUNDATIONS, { code: "PHSC399", credits: 6 }, { code: "PHSC389", credits: 3 }, "EPIB330"];
    const { unmet } = await audit([phsc], plan);
    expect(ids(unmet)).toEqual(["phsc/options"]);
  });

  test("HLTH431 and GBHL310 can't both count", async () => {
    const { unmet } = await audit([phsc], [...FOUNDATIONS, "HLTH431", "GBHL310", "EPIB330"]);
    expect(ids(unmet)).toEqual(["phsc/options"]);
  });

  test("courses off the options list and core courses don't count as options", async () => {
    const { unmet } = await audit([phsc], [...FOUNDATIONS, "MIEH321", "PHSC420", "HLTH434", "CMSC131"]);
    expect(ids(unmet)).toEqual(["phsc/options"]);
  });

  test("required courses exist in the catalog", () => {
    const required = [
      "MATH120", "BSCI170", "BSCI171", "BSCI180", "BSCI201", "BSCI202", "CHEM131", "CHEM132", "CHEM231", "CHEM232",
      "BSCI222", "BSCI223", "SPHL100", "HLTH366", "EPIB301", "EPIB315", "HLSA300", "MIEH300", "PHSC450", "KNES320",
      "PHSC415", "PHSC497",
    ];
    expect(required.filter((c) => !inCatalog(c))).toEqual([]);
  });

  test("options list codes exist in the catalog, except PHSC426 (now ENVH426, still in the catalog)", () => {
    const options = [
      "AMST320", "ANTH323", "AREC365", "BCHM462", "BCHM463", "BSCI331", "BSCI348E", "BSCI348M", "BSCI353", "BSCI410",
      "BSCI417", "BSCI422", "BSCI424", "BSCI437", "BSCI483", "BSST334", "ENSP360", "ENVH381", "ENVH414", "ENVH426",
      "PHSC426", "EPIB330", "EPIB445", "EPIB463", "FMSC310", "FMSC330", "GBHL310", "HLSA320", "HLTH431", "HLTH434",
      "MIEH321", "PHSC389", "PHSC399", "PHSC412", "PHSC420", "PSYC344", "SOCY335", "SPAN371", "WGSS315",
    ];
    expect(options.filter((c) => !inCatalog(c))).toEqual(["PHSC426"]);
  });
});
