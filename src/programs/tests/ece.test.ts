import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile, type Sample } from "../testkit";

const programs = loadFile("ece.yaml");
const compe = programs.find((p) => p.id === "compe")!;
const ee = programs.find((p) => p.id === "ee")!;

const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);
const without = (plan: Sample[], ...drop: string[]) => plan.filter((s) => !drop.includes(typeof s === "string" ? s : s.code));

// Catalog sample program (2025-26), with the elective slots filled in.
const COMPE_PLAN: Sample[] = [
  // Freshman
  "CHEM135", "CMSC131", "ENEE101", "MATH140",
  "ENES100", "CMSC132", "PHYS161", "MATH141",
  // Sophomore
  "ENEE244", "PHYS260", "PHYS261", "ENEE290", "CMSC250",
  "ENEE222", "ENEE205", "CMSC216", "ENEE245",
  // Junior
  "ENEE200", "ENEE350", "ENEE304", "CMSC330", "MATH241", // Cat. A
  "ENEE324", "ENEE446", "CMSC351", "MATH410", // Cat. A (400-level)
  // Senior
  "CMSC421", // Cat. B
  "ENEE322", "ENEE425", // Cat. C
  "ENMA300", // Cat. F
  "ENEE445", // Cat. D
  "ENEE408A", // Cat. E
  "CMSC412",
  "CMSC417", // additional technical elective
];

// Catalog sample program (2025-26), with the 22 EE elective credits and the general technical elective filled in.
const EE_PLAN: Sample[] = [
  "CHEM135", "ENEE101", "ENEE140", "ENGL101", "MATH140",
  "ENES100", "ENEE150", "MATH141", "PHYS161",
  "ENEE290", "ENEE244", "MATH241", "PHYS260", "PHYS261",
  "ENEE205", "ENEE222", "ENEE245", "PHYS270", "PHYS271",
  "ENEE304", "ENEE323", "ENEE350", "ENME331", // general technical elective
  "ENEE200", "ENEE305", "ENEE324", "ENEE382",
  // EE electives: A, B, C, then 14+ more credits
  "ENEE425", "ENEE445", "ENEE408I", "ENEE460", "ENEE461", "ENEE440", "ENEE420", "MATH464",
];

describe("Computer Engineering major", () => {
  test("the sample four-year plan satisfies everything", async () => {
    const { unmet } = await audit([compe], COMPE_PLAN);
    expect(unmet).toEqual([]);
  });

  test("missing ENEE446 and a capstone leaves the core, Cat. E and the 26-credit total unmet", async () => {
    const { unmet } = await audit([compe], without(COMPE_PLAN, "ENEE446", "ENEE408A"));
    expect(ids(unmet)).toEqual(["compe/enee446", "compe/cat-e", "compe/te-26"]);
  });

  test("Cat. A needs 3 credits at the 400 level", async () => {
    const { unmet } = await audit([compe], [...without(COMPE_PLAN, "MATH410"), "PHYS270", "PHYS271"]);
    expect(ids(unmet)).toEqual(["compe/cat-a-400"]);
  });

  test("CHEM131 alone doesn't meet the chemistry requirement", async () => {
    const { unmet } = await audit([compe], [...without(COMPE_PLAN, "CHEM135"), "CHEM131"]);
    expect(ids(unmet)).toEqual(["compe/chem-set"]);
  });

  test("at most 5 credits of ENEE499 count toward Cat. C", async () => {
    const plan = [...without(COMPE_PLAN, "ENEE322", "ENEE425"), { code: "ENEE499", credits: 6 }];
    const { unmet } = await audit([compe], plan);
    expect(ids(unmet)).toEqual(["compe/cat-c"]);
  });

  test("STAT400 may replace ENEE324, and ENEE322 may replace ENEE304", async () => {
    const plan = [...without(COMPE_PLAN, "ENEE324", "ENEE304", "ENEE322"), "STAT400", "ENEE322", "ENEE323"];
    const { unmet } = await audit([compe], plan);
    expect(unmet).toEqual([]);
  });
});

describe("Electrical Engineering major", () => {
  test("the sample four-year plan satisfies everything", async () => {
    const { unmet } = await audit([ee], EE_PLAN);
    expect(unmet).toEqual([]);
  });

  test("STAT400 doesn't replace ENEE324", async () => {
    const { unmet } = await audit([ee], [...without(EE_PLAN, "ENEE324"), "STAT400"]);
    expect(ids(unmet)).toEqual(["ee/enee324"]);
  });

  test("only 7 credits of non-ENEE electives count", async () => {
    const { unmet } = await audit([ee], [...without(EE_PLAN, "ENEE440", "ENEE420"), "MATH462", "PHYS401"]);
    expect(ids(unmet)).toEqual(["ee/te-22"]);
  });

  test("no advanced lab leaves Cat. B and the 22-credit total unmet", async () => {
    const { unmet } = await audit([ee], without(EE_PLAN, "ENEE445", "ENEE461"));
    expect(ids(unmet)).toEqual(["ee/ee-b", "ee/te-22"]);
  });

  test("a second capstone may replace the Cat. A course", async () => {
    const { unmet } = await audit([ee], [...without(EE_PLAN, "ENEE425"), "ENEE408M"]);
    expect(unmet).toEqual([]);
  });

  test("an ENEE elective moved to the general technical elective no longer counts toward the 22 credits", async () => {
    // Without ENME331 one 3-credit ENEE elective fills the gentech slot, leaving 20 of 22 EE elective credits.
    const { unmet } = await audit([ee], without(EE_PLAN, "PHYS270", "PHYS271", "ENME331"));
    expect(ids(unmet)).toEqual(["ee/phys270", "ee/te-22"]);
  });
});

describe("course codes", () => {
  // ENEE499L is the department's name for lab credits of ENEE499; Testudo has no separate code.
  const EXCEPTIONS = ["ENEE499L"];
  const required = [
    "MATH140", "MATH141", "MATH241", "ENEE290", "PHYS161", "PHYS260", "PHYS261", "PHYS270", "PHYS271",
    "CHEM135", "CHEM271", "CHEM131", "CHEM134", "ENES100", "ENEE101", "ENEE301", "ENES489P", "ENEE200",
    "ENEE150", "ENEE205", "ENEE222", "ENEE244", "ENEE245", "ENEE304", "ENEE305", "ENEE322", "ENEE323",
    "ENEE324", "STAT400", "ENEE350", "ENEE382", "ENEE446", "CMSC132", "CMSC216", "CMSC250", "CMSC330",
    "CMSC351", "CMSC412", "ENEE447",
  ];
  const electives = [
    "ENEE408A", "ENEE408C", "ENEE408D", "ENEE408I", "ENEE408J", "ENEE408M", "ENEE408N", "ENEE408V", "ENEE408W",
    "ENEE415", "ENEE416", "ENEE427", "ENEE445", "ENEE459B", "ENEE459L", "ENEE461", "ENEE473", "ENEE486",
    "ENEE493", "ENEE499L", "CMSC435", "ENEE452", "ENEE464", "ENEE484", "ENEE491", "ENEE492",
  ];

  test("required courses exist in the catalog", () => {
    expect(required.filter((c) => !inCatalog(c))).toEqual([]);
  });

  test("elective lists exist in the catalog, apart from documented exceptions", () => {
    expect(electives.filter((c) => !inCatalog(c))).toEqual(EXCEPTIONS);
  });
});
