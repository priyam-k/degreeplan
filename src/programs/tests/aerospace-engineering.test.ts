import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const programs = loadFile("aerospace-engineering.yaml");
const aeronautical = programs.find((p) => p.id === "aero-aeronautical")!;
const astronautical = programs.find((p) => p.id === "aero-astronautical")!;

// Department graduation plan for students starting Fall 2025 (GenEds left out).
const CORE = [
  "ENAE100", "ENES100", "MATH140", "CHEM135",
  "ENAE202", "ENES200", "MATH141", "PHYS161",
  "ENAE203", "ENAE222", "ENAE283", "MATH241", "PHYS260", "PHYS261",
  "ENAE284", "ENES232", "MATH243", "PHYS270", "PHYS271",
  "ENAE301", "ENAE310", "ENAE362", "ENAE380",
  "ENAE325", "ENAE364", "ENAE410", "ENAE432",
  "ENAE423", "ENAE480",
];
const AIR = ["ENAE403", "ENAE455", "ENAE491", "ENAE492"];
const SPACE = ["ENAE404", "ENAE457", "ENAE493", "ENAE494"];
const AIR_PLAN = [...CORE, ...AIR, "ENAE425", "ENAE471", "MATH462"];
const SPACE_PLAN = [...CORE, ...SPACE, "ENAE441", "ENAE467", "ENME470"];

// The renumbered Fall 2025 curriculum courses haven't been offered yet, so public/courses.json lacks them.
// All are in the 2026-27 catalog's ENAE course list.
const NOT_YET_OFFERED = ["ENAE310", "ENAE325", "ENAE364", "ENAE410", "ENAE480", "ENAE491", "ENAE492", "ENAE493", "ENAE494"];

const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);
const without = (plan: string[], ...drop: string[]) => plan.filter((c) => !drop.includes(c));

describe("Aerospace Engineering major", () => {
  test("two tracks are defined", () => {
    expect(programs.map((p) => p.id)).toEqual(["aero-aeronautical", "aero-astronautical"]);
  });

  test("the aeronautical-track graduation plan satisfies everything", async () => {
    const { unmet } = await audit([aeronautical], AIR_PLAN);
    expect(unmet).toEqual([]);
  });

  test("the astronautical-track graduation plan satisfies everything", async () => {
    const { unmet } = await audit([astronautical], SPACE_PLAN);
    expect(unmet).toEqual([]);
  });

  test("ENES102 + ENES220 and MATH246 + MATH240 replace ENAE222 and MATH243; honors research is an ENAE elective", async () => {
    const plan = [
      ...without(AIR_PLAN, "ENAE222", "MATH243", "ENAE471"),
      "ENES102", "ENES220", "MATH246", "MATH240",
      // Repeated codes count once in the solver, so three 1-credit terms are entered as one 3-credit course.
      { code: "ENAE398H", credits: 3 },
    ];
    const { unmet } = await audit([aeronautical], plan);
    expect(unmet).toEqual([]);
  });

  test("courses required in the other track count as ENAE electives", async () => {
    const plan = [...without(AIR_PLAN, "ENAE425", "ENAE471"), "ENAE404", "ENAE457"];
    const { unmet } = await audit([aeronautical], plan);
    expect(unmet).toEqual([]);
  });

  test("the aeronautical plan doesn't satisfy the astronautical track", async () => {
    const { unmet } = await audit([astronautical], AIR_PLAN);
    expect(ids(unmet)).toEqual(["aero-astronautical/enae404", "aero-astronautical/enae457", "aero-astronautical/enae493", "aero-astronautical/enae494"]);
  });

  test("ENES102 alone doesn't replace ENAE222, and MATH246 alone doesn't replace MATH243", async () => {
    const plan = [...without(SPACE_PLAN, "ENAE222", "MATH243"), "ENES102", "MATH246"];
    const { unmet } = await audit([astronautical], plan);
    expect(ids(unmet)).toEqual(["aero-astronautical/mechanics-option", "aero-astronautical/linalg-de-option"]);
  });

  test("too few ENAE elective credits and an unapproved technical elective are reported", async () => {
    const plan = [...without(AIR_PLAN, "ENAE471", "MATH462"), "BMGT350", "ENAE488D"];
    const { unmet } = await audit([aeronautical], plan);
    expect(ids(unmet)).toEqual(["aero-aeronautical/enae-electives", "aero-aeronautical/tech-elective"]);
  });

  test("ENAE398H can replace only one ENAE elective (3 cr)", async () => {
    const plan = [...without(SPACE_PLAN, "ENAE441", "ENAE467"), { code: "ENAE398H", credits: 6 }];
    const { unmet } = await audit([astronautical], plan);
    // The solver drops the 6-credit ENAE398H rather than break the cap, so the elective credits fall short.
    expect(ids(unmet)).toEqual(["aero-astronautical/enae-electives"]);
  });

  test("ASTR450 is a technical elective only on the aeronautical track", async () => {
    const air = await audit([aeronautical], [...without(AIR_PLAN, "MATH462"), "ASTR450"]);
    expect(air.unmet).toEqual([]);
    const space = await audit([astronautical], [...without(SPACE_PLAN, "ENME470"), "ASTR450"]);
    expect(ids(space.unmet)).toEqual(["aero-astronautical/tech-elective"]);
  });

  test("required courses exist in the catalog, except the not-yet-offered new ENAE courses", () => {
    const required = [...CORE, ...AIR, ...SPACE, "ENES102", "ENES220", "MATH246", "MATH240", "MATH461", "ENEE200", "CHEM131", "CHEM134"];
    expect(required.filter((c) => !inCatalog(c))).toEqual(NOT_YET_OFFERED);
  });
});
