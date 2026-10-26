import { describe, expect, test } from "vitest";
import { audit, inCatalog, loadFile } from "../testkit";

const [me] = loadFile("mechanical-engineering.yaml");

// Department sample four-year plan (Fall 2025 graduation plan), GenEds left out.
const LOWER = [
  "ENES100", "CHEM135", "MATH140", "ENES102", "MATH141", "PHYS161", "ENME272",
  "ENES221", "ENME202", "MATH241", "PHYS260", "PHYS261", "ENES200",
  "ENES220", "ENES232", "MATH246", "PHYS270", "PHYS271",
];
const UPPER = [
  "ENME331", "ENME350", "ENME382", "ENME392",
  "ENME332", "ENME351", "ENME361", "ENME371",
  "ENME400", "ENME472", "ENME462",
];
const PLAN = [...LOWER, ...UPPER, "ENME416", "ENME470", "ENME480", "ENRE447", "MATH462"];

const ids = (unmet: string[]) => unmet.map((u) => u.split(":")[0]);

describe("Mechanical Engineering major", () => {
  test("the sample four-year plan satisfies everything", async () => {
    const { unmet } = await audit([me], PLAN);
    expect(unmet).toEqual([]);
  });

  test("CHEM131 + CHEM134, ENEE200 and ENAE202 are accepted alternatives", async () => {
    const plan = PLAN.map((c) => ({ CHEM135: "CHEM131", ENES200: "ENEE200", ENME202: "ENAE202" })[c] ?? c);
    const { unmet } = await audit([me], [...plan, "CHEM134"]);
    expect(unmet).toEqual([]);
  });

  test("a missing core course and too few technical-elective credits are reported", async () => {
    const plan = PLAN.filter((c) => c !== "ENME462" && c !== "ENME480");
    const { unmet } = await audit([me], plan);
    expect(ids(unmet)).toEqual(["me/enme462", "me/tech-electives"]);
  });

  test("at most two technical electives may come from outside the major", async () => {
    const plan = [...LOWER, ...UPPER, "ENME416", "ENME470", "MATH462", "PHYS420", "CMSC330"];
    const { unmet } = await audit([me], plan);
    expect(ids(unmet)).toEqual(["me/tech-electives"]);
  });

  test("courses that duplicate a required ME course don't count as electives", async () => {
    const plan = [...LOWER, ...UPPER, "ENME416", "ENME470", "ENME480", "ENMA300", "ENFP312"];
    const { unmet } = await audit([me], plan);
    expect(ids(unmet)).toEqual(["me/tech-electives"]);
  });

  test("CHEM131 without CHEM134 does not meet the chemistry requirement", async () => {
    const plan = PLAN.map((c) => (c === "CHEM135" ? "CHEM131" : c));
    const { unmet } = await audit([me], plan);
    expect(ids(unmet)).toEqual(["me/chem-option"]);
  });

  test("required courses exist in the catalog", () => {
    expect([...PLAN, "ENEE200", "ENAE202", "CHEM131", "CHEM134"].filter((c) => !inCatalog(c))).toEqual([]);
  });
});
