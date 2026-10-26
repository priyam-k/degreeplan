import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile, type Sample } from "../testkit";

const programs = loadFile("information-science.yaml");
const byId = (id: string) => programs.find((p) => p.id === id)!;
const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

// Benchmarks, core and GenEd/general electives from the college's four-year graduation plan.
const BASE: Sample[] = [
  "MATH115", "STAT100", "ENGL101", "PSYC100", "INST126", "COMM107",
  "INST201", "INST326", "INST311", "INST327", "INST335",
  "INST314", "INST352", "ENGL393", "INST346", "INST362", "INST490",
];

describe("Information Science major", () => {
  test("the file defines the general program and the four cognate areas", () => {
    expect(programs.map((p) => p.id)).toEqual([
      "infosci",
      "infosci-data-science",
      "infosci-cybersecurity",
      "infosci-digital-curation",
      "infosci-health-info",
    ]);
    expect(programs.every((p) => p.kind === "major" && p.college === "Information" && p.short === "InfoSci")).toBe(true);
  });

  test("the four-year plan with five INST electives completes the general program", async () => {
    const { unmet } = await audit([byId("infosci")], [...BASE, "INST377", "INST414", "INST462", "INST364", "INST408C"]);
    expect(unmet).toEqual([]);
  });

  test("each cognate area is satisfied by its own courses", async () => {
    const plans: Record<string, string[]> = {
      "infosci-data-science": ["INST354", "INST377", "INST414", "INST447", "INST462"],
      "infosci-cybersecurity": ["INST364", "INST366", "INST464", "INST466", "INST467"],
      "infosci-digital-curation": ["INST341", "INST441", "INST442", "INST443", "INST462"],
      "infosci-health-info": ["INST402", "INST451", "INST452", "INST414", "INST462"],
    };
    for (const [id, electives] of Object.entries(plans)) {
      const { unmet } = await audit([byId(id)], [...BASE, ...electives]);
      expect(unmet, id).toEqual([]);
    }
  });

  test("a missing capstone and too few elective credits are reported", async () => {
    const plan = BASE.filter((c) => c !== "INST490");
    const { unmet } = await audit([byId("infosci")], [...plan, "INST377", "INST414", "INST462", "INST364"]);
    expect(ids(unmet)).toEqual(["infosci/inst490", "infosci/electives"]);
  });

  test("core courses do not double as electives, and INST301/491 are not electives", async () => {
    const { unmet } = await audit([byId("infosci")], [...BASE, "INST377", "INST414", "INST301", "INST491"]);
    expect(ids(unmet)).toEqual(["infosci/electives"]);
  });

  test("benchmarks are required", async () => {
    const plan = BASE.filter((c) => c !== "PSYC100" && c !== "STAT100");
    const { unmet } = await audit([byId("infosci")], [...plan, "INST377", "INST414", "INST462", "INST364", "INST366"]);
    expect(ids(unmet)).toEqual(["infosci/psyc100", "infosci/stat100"]);
  });

  // core-umd caps transfer credit in the core at 0, so a transferred core course is left unassigned.
  test("a core course transferred in does not fill its requirement", async () => {
    const plan: Sample[] = [...BASE.filter((c) => c !== "INST327"), { code: "INST327", transfer: true }];
    const { unmet } = await audit([byId("infosci")], [...plan, "INST377", "INST414", "INST462", "INST364", "INST366"]);
    expect(ids(unmet)).toEqual(["infosci/inst327"]);
  });

  test("four Data Science courses plus an outside elective don't complete that cognate", async () => {
    const { unmet } = await audit([byId("infosci-data-science")], [...BASE, "INST354", "INST377", "INST414", "INST447", "INST364"]);
    expect(ids(unmet)).toEqual(["infosci-data-science/cognate"]);
  });

  test("the Health Information cognate needs all three listed courses and two more electives", async () => {
    const { unmet } = await audit([byId("infosci-health-info")], [...BASE, "INST402", "INST452", "INST414"]);
    expect(ids(unmet)).toEqual(["infosci-health-info/cognate", "infosci-health-info/electives"]);
  });

  test("the Digital Curation cognate needs all four curation courses", async () => {
    const { unmet } = await audit([byId("infosci-digital-curation")], [...BASE, "INST341", "INST441", "INST442", "INST462", "INST414"]);
    expect(ids(unmet)).toEqual(["infosci-digital-curation/cognate"]);
  });

  test("required and cognate courses exist in the catalog (INST365 is listed by the department but not yet in the catalog)", () => {
    const required = [
      "MATH115", "PSYC100", "STAT100", "INST126",
      "INST201", "INST311", "INST314", "INST326", "INST327", "INST335", "INST346", "INST352", "INST362", "INST490",
      "INST354", "INST377", "INST410", "INST414", "INST447", "INST462",
      "INST364", "INST365", "INST366", "INST464", "INST466", "INST467",
      "INST341", "INST441", "INST442", "INST443",
      "INST402", "INST451", "INST452",
    ];
    expect(required.filter((c) => !inCatalog(c))).toEqual(["INST365"]);
  });
});
