import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { loadProgramFile } from "./load";
import { ALL_PROGRAMS, MAJORS, MINORS, abbrev } from ".";
import type { MatchCtx, Program } from "../types";

const load = (src: string, file = "test.yaml") => loadProgramFile(file, parse(src));
const one = (src: string) => load(src)[0];
const ctx = (over: Partial<MatchCtx> = {}): MatchCtx => ({ term: "Fall 2025", transfer: false, ap: false, ...over });
const bucket = (p: Program, id: string) => p.buckets.find((b) => b.id === id)!;

describe("shipped program files", () => {
  test("load, with ids, families and short names the UI relies on", () => {
    expect(ALL_PROGRAMS.map((p) => p.id)).toContain("cs-general");
    expect(MAJORS.every((p) => p.family)).toBe(true);
    expect(MAJORS.filter((p) => p.family === "cs")).toHaveLength(5);
    expect(MINORS.map(abbrev)).toContain("RAS minor");
  });
});

describe("loadProgramFile", () => {
  test("a file without `programs` is one program; a major's family defaults to the file name", () => {
    const p = one(`
id: x
name: X Major
kind: major
buckets: [CMSC131]
`);
    expect(p.family).toBe("test");
    expect(bucket(p, "cmsc131")).toMatchObject({ label: "CMSC131", courses: 1 });
    expect(bucket(p, "cmsc131").match("CMSC131H", ctx())).toBe(true);
  });

  test("top-level fields are defaults for each listed program; $refs, ...spreads and patch", () => {
    const [a, b] = load(`
kind: major
short: X
defs:
  BASE:
    - { id: calc, label: Calc, match: [MATH140, MATH141], choose: 1 }
  EXTRA: [CMSC216]
programs:
  - { id: a, name: A, buckets: ["...$BASE", "...$EXTRA"] }
  - id: b
    name: B
    short: B!
    buckets: ["...$BASE"]
    patch: { calc: { match: MATH141 } }
`);
    expect(a.buckets.map((x) => x.id)).toEqual(["calc", "cmsc216"]);
    expect(bucket(a, "calc")).toMatchObject({ courses: 1, maxCourses: 1 });
    expect(bucket(a, "calc").match("MATH140", ctx())).toBe(true);
    expect(bucket(b, "calc").match("MATH140", ctx())).toBe(false);
    expect([a.short, b.short]).toEqual(["X", "B!"]);
  });

  test("matcher forms", () => {
    const p = one(`
id: m
name: M
kind: minor
buckets:
  - { id: r, label: r, match: CMSC300-499, courses: 1 }
  - { id: lvl, label: lvl, match: { all: ["@umd", "*300-999"] }, courses: 1 }
  - { id: ex, label: ex, match: { any: [STAT400-899], except: [STAT464] }, courses: 1 }
  - { id: t, label: t, match: { topic: CMSC498B, terms: [Fall 2025] }, courses: 1 }
  - { id: ap, label: ap, match: "@ap", courses: 1 }
  - { id: any, label: any, match: "*", courses: 1 }
`);
    const m = (id: string, code: string, c = ctx()) => bucket(p, id).match(code, c);
    expect([m("r", "CMSC498B"), m("r", "CMSC250")]).toEqual([true, false]);
    expect([m("lvl", "ENGL393"), m("lvl", "ENGL393", ctx({ transfer: true })), m("lvl", "ENGL101")]).toEqual([true, false, false]);
    expect([m("ex", "STAT410"), m("ex", "STAT464")]).toEqual([true, false]);
    expect([m("t", "CMSC498B"), m("t", "CMSC498B", ctx({ term: "Spring 2026" }))]).toEqual([true, false]);
    expect([m("ap", "MATH140", ctx({ ap: true })), m("ap", "MATH140")]).toEqual([true, false]);
    expect(m("any", "")).toBe(true);
  });

  test("discipline excludes and merges departments, and narrows the match", () => {
    const p = one(`
id: d
name: D
kind: major
buckets:
  - id: ulc
    label: ULC
    match: "*300-499"
    credits: 12
    discipline: { exclude: [CMSC, CP*], merge: { MATH/STAT: [MATH, STAT] } }
`);
    const b = bucket(p, "ulc");
    expect(["STAT400", "MATH410", "PHIL320", "CPSP300", "CMSC420"].map((c) => b.discipline!(c))).toEqual(["MATH/STAT", "MATH/STAT", "PHIL", null, null]);
    expect([b.match("PHIL320", ctx()), b.match("CMSC420", ctx())]).toEqual([true, false]);
  });

  test("anySet options, slot labels and slotOf", () => {
    const p = one(`
id: s
name: S
kind: major
defs:
  SEQ:
    - { label: "1", slots: [PHYS161, [PHYS260, PHYS261], { match: AOSC400-499, count: 2, label: two AOSC }] }
    - slots: [MATH410, MATH411]
buckets:
  - { id: support, label: Support, match: { slotOf: $SEQ }, useGroup: support }
constraints:
  - { kind: anySet, id: seq, label: Seq, buckets: [support], options: $SEQ }
`);
    const con = p.constraints![0] as ProgramConstraintOf<"anySet">;
    expect(con.options.map((o) => o.label)).toEqual(["1", "MATH410 + MATH411"]);
    expect(con.options[0].slots.map((s) => [s.label, s.count])).toEqual([["PHYS161", undefined], ["PHYS260/PHYS261", undefined], ["two AOSC", 2]]);
    expect([bucket(p, "support").match("AOSC431", ctx()), bucket(p, "support").match("MATH410", ctx()), bucket(p, "support").match("MATH140", ctx())]).toEqual([true, true, false]);
  });

  test("maxEach expands to one maxFrom per group", () => {
    const p = one(`
id: g
name: G
kind: major
defs:
  AREAS: [{ id: A1, label: Systems, match: CMSC412 }, { id: A2, label: AI, match: CMSC421 }]
buckets:
  - { id: areas, label: Areas, match: [CMSC412, CMSC421], courses: 2 }
constraints:
  - { kind: maxEach, id: "max-{id}", label: "≤ 1 from {label}", buckets: [areas], groups: $AREAS, courses: 1 }
  - { kind: distinct, id: spread, label: Spread, buckets: [areas], groups: $AREAS, omit: [A2], min: 1 }
`);
    expect(p.constraints!.map((c) => [c.kind, c.id, c.label])).toEqual([
      ["maxFrom", "max-A1", "≤ 1 from Systems"],
      ["maxFrom", "max-A2", "≤ 1 from AI"],
      ["distinct", "spread", "Spread"],
    ]);
    expect((p.constraints![2] as ProgramConstraintOf<"distinct">).groups.map((g) => g.id)).toEqual(["A1"]);
  });

  test.each([
    ["an unknown field", "buckets: [{ id: a, label: A, match: MATH140, cours: 1 }]", "at buckets[0].cours: unknown field"],
    ["an unknown reference", "buckets: [{ id: a, label: A, match: $NOPE, courses: 1 }]", "at buckets[0].match: unknown reference $NOPE"],
    ["a bad course code", "buckets: [{ id: a, label: A, match: [MATH 140], courses: 1 }]", '"MATH 140" is not a course code'],
    ["a missing bucket", "buckets: [MATH140]\nconstraints: [{ kind: minFrom, id: c, label: C, buckets: [math141], match: '*', courses: 1 }]", 'no bucket "math141"'],
    ["a duplicate id", "buckets: [MATH140, MATH140]", 'two requirements share the id "math140"'],
    ["an unknown constraint kind", "buckets: [MATH140]\nconstraints: [{ kind: atLeast }]", "at constraints[0].kind: expected one of"],
    ["a circular reference", "defs: { A: $B, B: $A }\nbuckets: [{ id: a, label: A, match: $A, courses: 1 }]", "circular reference $A → $B → $A"],
  ])("rejects %s with its location", (_name, body, message) => {
    expect(() => load(`id: e\nname: E\nkind: minor\n${body}`, "bad.yaml")).toThrow(message);
  });
});

type ProgramConstraintOf<K extends string> = Extract<NonNullable<Program["constraints"]>[number], { kind: K }>;
