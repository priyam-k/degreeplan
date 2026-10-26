import { describe, expect, it } from "vitest";
import courses from "../public/courses.json";
import {
  concurrentCodes,
  permissionNotes,
  formatReq,
  isSatisfied,
  missingReq,
  parsePrereq,
  reqCodes,
  type Req,
} from "./prereqs";

const c = (code: string): Req => ({ kind: "course", code });
const all = (...of: Req[]): Req => ({ kind: "all", of });
const any = (...of: Req[]): Req => ({ kind: "any", of });
const anyK = (k: number, ...of: Req[]): Req => ({ kind: "any", of, k });
const cs = (...codes: string[]) => codes.map(c);
const haveOf = (...codes: string[]) => (x: string) => codes.includes(x);

describe("parsePrereq", () => {
  const cases: [string, string | null, Req | null][] = [
    ["CMSC330", "Minimum grade of C- in CMSC250 and CMSC216.", all(c("CMSC250"), c("CMSC216"))],
    [
      "CMSC477",
      "1 course from (MATH240, MATH243, MATH341, MATH461, ENEE290); and (ENEE467 or CMSC420).",
      all(any(...cs("MATH240", "MATH243", "MATH341", "MATH461", "ENEE290")), any(c("ENEE467"), c("CMSC420"))),
    ],
    [
      "MATH410",
      "1 course with a minimum grade of C- from (MATH240, MATH461, MATH341); and 1 course with a minimum grade of C- from (MATH340, MATH241); and minimum grade of C- in MATH310; and permission of CMNS-Mathematics department.",
      all(any(...cs("MATH240", "MATH461", "MATH341")), any(c("MATH340"), c("MATH241")), c("MATH310")),
    ],
    [
      "ENME480",
      "MATH246 or ENES221; and (CMSC131, ENME202, ENAE202 or ENEE150).",
      all(any(c("MATH246"), c("ENES221")), any(...cs("CMSC131", "ENME202", "ENAE202", "ENEE150"))),
    ],
    [
      "CMSC417",
      "Minimum grade of C- in CMSC351 and CMSC330; and permission of CMNS-Computer Science department. Or must be in the (Computer Science (Doctoral), Computer Science (Master's)) program.",
      all(c("CMSC351"), c("CMSC330")),
    ],
    [
      "STAT400",
      "1 course with a minimum grade of C- from MATH141; or students who have taken courses with comparable content may contact the department.",
      c("MATH141"),
    ],
    ["CMSC216", "Minimum grade of C- in CMSC132; and minimum grade of C- in MATH141.", all(c("CMSC132"), c("MATH141"))],
    ["ENAE450", "ENME480 or ENAE380.", any(c("ENME480"), c("ENAE380"))],
    ["spaced code", "Minimum grade of C- in CMSC 216 and MATH 141H.", all(c("CMSC216"), c("MATH141H"))],
    ["no courses", "Must have math eligibility for MATH140 or higher.", null],
    ["null", null, null],
    // "; or" binds tighter than "; and"; AP/placement alternatives dropped.
    [
      "CMSC132",
      "Minimum grade of C- in CMSC131 or CMSC133; or must have earned a score of 5 on the A Java AP exam; or must have earned a satisfactory score on the departmental placement exam; and minimum grade of C- in MATH140.",
      all(any(c("CMSC131"), c("CMSC133")), c("MATH140")),
    ],
    // Sentence-level "And" / "Or".
    [
      "ENEE245",
      "Minimum grade of C- in ENEE244. And minimum grade of C- in ENEE150; or minimum grade of C- in CMSC132. And permission of ENGR-Electrical & Computer Engineering department.",
      all(c("ENEE244"), any(c("ENEE150"), c("CMSC132"))),
    ],
    [
      "MATH115",
      "Must have math eligibility of MATH115 or higher; and math eligibility is based on the Math Placement Exam or the successful completion of MATH003 with appropriate eligibility. Or MATH113.",
      c("MATH113"),
    ],
    // k-of-n
    [
      "ENEE408V",
      "Minimum grade of C- in two of the following courses: ENEE303, ENEE304, ENEE305, or ENEE473; and must have senior standing.",
      anyK(2, ...cs("ENEE303", "ENEE304", "ENEE305", "ENEE473")),
    ],
    [
      "MATH456",
      "(CMSC106, CMSC131, or ENEE150; or equivalent programming experience); and (2 courses from (CMSC330, CMSC351, ENEE324, or ENEE382); or any one of these courses and a 400-level MATH course, or two 400-level MATH courses); and Permission of CMNS-Mathematics department or permission of instructor.",
      all(any(...cs("CMSC106", "CMSC131", "ENEE150")), anyK(2, ...cs("CMSC330", "CMSC351", "ENEE324", "ENEE382"))),
    ],
    // Oxford comma lists with mixed and/or: "or" binds tighter.
    [
      "PHYS400",
      "Grades of A- or higher in PHYS272, PHYS273, MATH241, and MATH243 or MATH246, and permission of CMNS-Physics Department.",
      all(c("PHYS272"), c("PHYS273"), c("MATH241"), any(c("MATH243"), c("MATH246"))),
    ],
    [
      "PHYS474",
      "Minimum grade of C- in PHYS313 and minimum grade of C- in PHYS265, CMSC106, or CMSC131; or permission of instructor. Must have completed with a minimum grade of C- or be concurrently enrolled in PHYS401.",
      all(c("PHYS313"), any(...cs("PHYS265", "CMSC106", "CMSC131")), c("PHYS401")),
    ],
    [
      "ENAE311 (nested parens, Restriction tail)",
      "PHYS271, (MATH240 or MATH461), PHYS270, and ENES232. Restriction: Must be in Engineering: Aerospace program; or permission of ENGR-Aerospace Engineering department; and junior standing or higher. Credit only granted for: ENAE410 or ENAE311.",
      all(c("PHYS271"), any(c("MATH240"), c("MATH461")), c("PHYS270"), c("ENES232")),
    ],
    [
      "ENME741",
      "(ENCE302; or (ENME271 and ENME392)); and (MATH140 and MATH240).",
      all(any(c("ENCE302"), all(c("ENME271"), c("ENME392"))), c("MATH140"), c("MATH240")),
    ],
    [
      "PHYS488P",
      "Must have taken one of the following two-course physics sequences: PHYS131 and 132; PHYS141 and PHYS142; PHYS161 and PHYS260; or PHYS171 and PHYS272.",
      any(
        all(c("PHYS131"), c("PHYS132")),
        all(c("PHYS141"), c("PHYS142")),
        all(c("PHYS161"), c("PHYS260")),
        all(c("PHYS171"), c("PHYS272")),
      ),
    ],
    [
      "MATH470 (exclusion parenthetical)",
      "MATH141 and MATH140; and must have completed one 400-level MATH course (not to include MATH461, 478, and 480's).",
      all(c("MATH141"), c("MATH140")),
    ],
    [
      "MATH452",
      "MATH341; or MATH246 and one of (MATH240 or MATH461).",
      any(c("MATH341"), all(c("MATH246"), any(c("MATH240"), c("MATH461")))),
    ],
    ["Recommended/Corequisite tail", "CMSC131. Corequisite: MATH141. Recommended: CMSC250.", c("CMSC131")],
    [
      "slashes and brackets",
      "Minimum grade of C- in [BSCI330 or (BSCI 331 and 332)]; and JOUR320/JOUR360; and CHEM271/272.",
      all(
        any(c("BSCI330"), all(c("BSCI331"), c("BSCI332"))),
        any(c("JOUR320"), c("JOUR360")),
        any(c("CHEM271"), c("CHEM272")),
      ),
    ],
    [
      "comparable-content alternative inside parens",
      "MATH241; and (STAT400; or students who have taken courses with comparable content may contact the department).",
      all(c("MATH241"), c("STAT400")),
    ],
    ["dedupe and flatten", "CMSC131 or (CMSC131 or CMSC133); and CMSC131.", c("CMSC131")],
  ];
  for (const [name, text, want] of cases) {
    it(name, () => expect(parsePrereq(text)).toEqual(want));
  }
});

describe("queries", () => {
  const req = parsePrereq(
    "1 course from (MATH240, MATH243, MATH341, MATH461, ENEE290); and (ENEE467 or CMSC420).",
  );

  it("isSatisfied", () => {
    expect(isSatisfied(null, () => false)).toBe(true);
    expect(isSatisfied(req, haveOf("MATH461", "CMSC420"))).toBe(true);
    expect(isSatisfied(req, haveOf("MATH461"))).toBe(false);
    const k2 = anyK(2, ...cs("A100", "B100", "C100"));
    expect(isSatisfied(k2, haveOf("A100"))).toBe(false);
    expect(isSatisfied(k2, haveOf("A100", "C100"))).toBe(true);
  });

  it("missingReq", () => {
    expect(missingReq(req, haveOf("MATH461", "CMSC420"))).toBeNull();
    expect(missingReq(req, haveOf("MATH461"))).toEqual(any(c("ENEE467"), c("CMSC420")));
    expect(missingReq(null, () => false)).toBeNull();
    const k2 = anyK(2, ...cs("A100", "B100", "C100"));
    expect(missingReq(k2, haveOf("A100"))).toEqual(any(c("B100"), c("C100")));
    expect(missingReq(k2, haveOf())).toEqual(k2);
    expect(missingReq(anyK(2, c("A100"), c("B100")), haveOf("A100"))).toEqual(c("B100"));
  });

  it("reqCodes", () => {
    expect(reqCodes(req)).toEqual(["MATH240", "MATH243", "MATH341", "MATH461", "ENEE290", "ENEE467", "CMSC420"]);
    expect(reqCodes(null)).toEqual([]);
  });

  it("formatReq", () => {
    expect(formatReq(all(c("CMSC250"), c("CMSC216")))).toBe("CMSC250 and CMSC216");
    expect(formatReq(all(any(c("MATH240"), c("MATH461")), c("MATH141")))).toBe("(MATH240 or MATH461) and MATH141");
    expect(formatReq(all(c("X100"), anyK(2, c("A100"), c("B100"), c("C100"))))).toBe("X100 and 2 of (A100, B100, C100)");
    expect(formatReq(null)).toBe("");
  });

  it("concurrentCodes", () => {
    expect(
      concurrentCodes(
        "Minimum grade of C- in MATH141; and must have completed or be concurrently enrolled in MATH240, MATH341, or MATH461.",
      ),
    ).toEqual(["MATH240", "MATH341", "MATH461"]);
    expect(concurrentCodes("Minimum grade of C- in MATH140.")).toEqual([]);
  });
});

// Independent check: every code in the text should be in the parsed tree,
// except in clauses the parser intentionally ignores.
function expectedCodes(p: string): string[] {
  const t = p
    .split(/Restrictions?:|Credit only granted for|Additional information:|Jointly offered with|Shared with|Recommended:|Co-?requisites?:|Formerly:|Also offered as|Cross-listed with/i)[0]
    .replace(/\((?:not|excluding|except)\b[^)]*\)/gi, " ");
  const out = new Set<string>();
  for (const clause of t.split(/;|\.\s/)) {
    if (/eligib|students who|comparable content/i.test(clause)) continue;
    for (const m of clause.matchAll(/([A-Z]{4})\s?(\d{3}[A-Z]?)(?![A-Za-z0-9])/g)) out.add(m[1] + m[2]);
  }
  return [...out];
}

describe("real catalog data", () => {
  type Entry = { c: string; p?: string | null };
  const entries = courses as unknown as Entry[];
  const DEPTS = /^(CMSC|MATH|STAT|AMSC|ENME|ENAE|ENEE|ENES|PHYS|DATA)/;

  it("covers course codes in prerequisite text for core departments", () => {
    const withP = entries.filter((e) => DEPTS.test(e.c) && e.p);
    const failures: string[] = [];
    for (const e of withP) {
      const got = new Set(reqCodes(parsePrereq(e.p)));
      const missing = expectedCodes(e.p!).filter((x) => !got.has(x));
      if (missing.length) failures.push(`${e.c}: missing ${missing.join(",")} in "${e.p}"`);
    }
    const pct = (100 * (withP.length - failures.length)) / withP.length;
    console.log(`prereq coverage: ${pct.toFixed(1)}% of ${withP.length} courses`);
    if (failures.length) console.log(failures.join("\n"));
    expect(withP.length).toBeGreaterThan(100);
    expect(pct).toBeGreaterThanOrEqual(97);
  });

  it("parses every catalog entry without throwing", () => {
    for (const e of entries) {
      const r = parsePrereq(e.p);
      expect(typeof formatReq(r)).toBe("string");
    }
  });
});

describe("permissionNotes", () => {
  it.each([
    [
      "Minimum grade of C- in CMSC216 and CMSC250; and permission of CMNS-Computer Science department.",
      null,
      { required: ["Permission of CMNS-Computer Science department"], alternatives: [] },
    ],
    ["ARTT320 or permission of department.", null, { required: [], alternatives: ["Permission of department"] }],
    [
      "AAAS202 or AAAS100; or permission of BSOS-African American and Africana Studies department.",
      null,
      { required: [], alternatives: ["Permission of BSOS-African American and Africana Studies department"] },
    ],
    [
      "ECON326 or AREC326; or students who have taken courses with comparable content may contact the department.",
      null,
      { required: [], alternatives: ["Comparable coursework elsewhere (ask the department)"] },
    ],
    ["BIOE437, BIOE457", "Permission of the Fischell Department of Bioengineering", { required: ["Permission of the Fischell Department of Bioengineering"], alternatives: [] }],
    ["MATH140", "Must be in a major within the CMNS college", { required: [], alternatives: [] }],
    [null, null, { required: [], alternatives: [] }],
  ] as const)("%s / %s", (p, r, expected) => {
    expect(permissionNotes(p, r)).toEqual(expected);
  });
});
