import { describe, expect, test } from "vitest";
import { ENTRIES, matchTranscriptName } from ".";

describe("program catalogue", () => {
  test("one picker entry per major, holding its tracks", () => {
    const cs = ENTRIES.find((e) => e.key === "cs")!;
    expect(cs.name).toBe("Computer Science");
    expect(cs.programs.map((p) => p.id)).toContain("cs-ds");
    expect(ENTRIES.filter((e) => e.key === "cs")).toHaveLength(1);
  });

  test("every major and minor names its college", () => {
    expect(ENTRIES.filter((e) => !e.college).map((e) => e.key)).toEqual([]);
  });

  test.each([
    ["Computer Science", "major", "cs-general"],
    ["COMPUTER SCIENCE", "major", "cs-general"],
    ["Mathematics", "major", "math-applied"],
    ["ROBOTICS AND AUTONOMOUS", "minor", "ras-minor"],
    ["Basket Weaving", "major", undefined],
    ["Computer Engineering", "major", "compe"],
    ["BIOLOGICAL SCIENCES: PHYSIOLOGY & NEUROBIOLOGY", "major", "bio-pn"],
    ["COMPUTER SCIENCE", "minor", "cs-minor"],
    ["ENGINEERING", "major", undefined],
    ["COMPUTER", "major", undefined],
  ] as const)("transcript %s (%s) -> %s", (name, kind, id) => {
    expect(matchTranscriptName(name, kind)?.id).toBe(id);
  });
});
