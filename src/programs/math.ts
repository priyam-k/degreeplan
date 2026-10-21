// UMD Mathematics B.S. — 2025-26 catalog (upper-level rules identical in 2026-27). See docs/research/math-major.md.
import type { Bucket, Program, ProgramConstraint, SetOption } from "../types";
import { anyOf, atUMD, codes, except, range } from "../engine/match";

const M = (...ns: number[]) => ns.map((n) => `MATH${n}`);

// 400+ MATH/AMSC/STAT (grad courses count), minus courses that never count toward the major.
// CMSC456/460/466/475 are the same courses as MATH456/AMSC460/AMSC466/MATH475 (cross-listed).
const BLACKLIST = codes(...M(461, 470, 478, 480, 481, 482, 483, 484, 487), "STAT464");
const UPPER = anyOf(
  except(anyOf(range("MATH", 400, 899), range("AMSC", 400, 899), range("STAT", 400, 899)), BLACKLIST),
  codes("CMSC456", "CMSC460", "CMSC466", "CMSC475"),
);
const NUMERICAL = codes("AMSC460", "AMSC466", "CMSC460", "CMSC466");

const lower: Bucket[] = [
  { id: "math140", label: "MATH140 Calculus I", match: codes("MATH140"), courses: 1 },
  { id: "math141", label: "MATH141 Calculus II", match: codes("MATH141"), courses: 1 },
  { id: "math240", label: "MATH240 Linear Algebra (or 341/461)", match: codes("MATH240", "MATH341", "MATH461"), courses: 1 },
  { id: "math241", label: "MATH241 Calculus III (or 340)", match: codes("MATH241", "MATH340"), courses: 1 },
  {
    id: "math310",
    label: "MATH310 Intro to Proof",
    match: codes("MATH310"),
    courses: 1,
    note: "Dept exemption (A in 240 & 241, B in 340 & 341, or B in CMSC250): waive",
  },
  {
    // own use-group: MATH341 also covers 240; MATH462 may also count upper-level
    id: "math246",
    label: "One of MATH246/436/462 (or 341)",
    match: codes("MATH246", "MATH436", "MATH462", "MATH341"),
    courses: 1,
    useGroup: "l6",
  },
  {
    id: "programming",
    label: "Programming (CMSC106/131/132, ENAE202, ENEE150, PHYS265)",
    match: codes("CMSC106", "CMSC131", "CMSC132", "ENAE202", "ENEE150", "PHYS265"),
    courses: 1,
  },
];

const seq = (label: string, ...slots: (string[] | [string[], number])[]): SetOption => ({
  label,
  slots: slots.map((s) =>
    Array.isArray(s[0]) ? { label: (s[0] as string[]).join("/"), match: codes(...(s[0] as string[])), count: s[1] as number } : { label: (s as string[]).join("/"), match: codes(...(s as string[])) },
  ),
});

// Supporting three-course sequences (2025-26 and 2026-27 variants both accepted).
const SEQUENCES: SetOption[] = [
  seq("1: PHYS161, 260/261, 270/271", ["PHYS161"], ["PHYS260"], ["PHYS261"], ["PHYS270"], ["PHYS271"]),
  seq("2: PHYS171, 272, 273", ["PHYS171"], ["PHYS272"], ["PHYS273"]),
  seq("3: ENES102, PHYS161, ENES220", ["ENES102"], ["PHYS161"], ["ENES220"]),
  seq("4: CMSC131, 132, 216", ["CMSC131"], ["CMSC132"], ["CMSC216"]),
  seq("5: CHEM146/177, 237, 247", ["CHEM146"], ["CHEM177"], ["CHEM237"], ["CHEM247"]),
  seq("6: CHEM131/132, 231/232, 241/242", ["CHEM131"], ["CHEM132"], ["CHEM231"], ["CHEM232"], ["CHEM241"], ["CHEM242"]),
  seq("7: ECON200, 201, 305/306/325/326", ["ECON200"], ["ECON201"], ["ECON305", "ECON306", "ECON325", "ECON326"]),
  seq("8: BMGT220, 221, 340", ["BMGT220"], ["BMGT221"], ["BMGT340"]),
  seq("9: BSCI170, 160, 180 + CHEM131/132", ["BSCI170"], ["BSCI160"], ["BSCI180", "BSCI171"], ["CHEM131"], ["CHEM132"]),
  seq("9: BSCI170, 160, 180 + CHEM146/177", ["BSCI170"], ["BSCI160"], ["BSCI180", "BSCI171"], ["CHEM146"], ["CHEM177"]),
  seq("10: ASTR130, 131, 232", ["ASTR130"], ["ASTR131"], ["ASTR232"]),
  seq("10 (2025-26): ASTR120, 121, PHYS161/171", ["ASTR120"], ["ASTR121"], ["PHYS161", "PHYS171"]),
  seq("11: GEOL100 (+110), two of 322/340/341/375", ["GEOL100"], [["GEOL322", "GEOL340", "GEOL341", "GEOL375"], 2]),
  seq("12: AOSC200/201 + two 400-level AOSC", ["AOSC200"], ["AOSC201"]),
];
// Sequence 12 needs two 400-level AOSC courses; add them as a slot.
SEQUENCES[SEQUENCES.length - 1].slots.push({ label: "two 400-level AOSC", match: range("AOSC", 400, 499), count: 2 });

const supportBucket = (options: SetOption[]): Bucket => ({
  id: "support",
  label: "Supporting sequence",
  match: anyOf(...options.flatMap((o) => o.slots.map((s) => s.match))),
  useGroup: "support", // may reuse the programming course (unconfirmed; see notes)
});
const supportConstraint = (options: SetOption[]): ProgramConstraint => ({
  kind: "anySet",
  id: "support-seq",
  label: "Complete one supporting sequence",
  buckets: ["support"],
  options,
});

const pair = (a: string, b: string): SetOption => ({ label: `${a} + ${b}`, slots: [{ label: a, match: codes(a) }, { label: b, match: codes(b) }] });

const one = (id: string, label: string, match: Bucket["match"]): Bucket => ({ id, label, match, courses: 1, maxCourses: 1 });

const SOURCES = [
  "https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/mathematics/mathematics-major/",
  "https://www-math.umd.edu/course-requirements.html",
];
const NOTES = [
  "C- or better in every major course; 2.0 major GPA.",
  "MATH461, 478, 480-484, 487 and STAT464 never count as upper-level courses.",
  "Whether CMSC131/132 may count for both programming and Sequence 4 is unconfirmed — this planner allows it.",
  "AMSC/CMSC460/466 are cross-listed; credit is granted for only one of the four.",
];

function upperConstraints(buckets: string[], pairs: SetOption[]): ProgramConstraint[] {
  return [
    { kind: "anySet", id: "depth", label: "Depth: a one-year sequence", buckets, options: pairs },
    { kind: "minFrom", id: "umd4", label: "≥ 4 upper-level courses taken at UMD", buckets, match: atUMD, courses: 4 },
  ];
}

const APPLIED_UPPER = ["a1", "a2", "a3", "a4", "a5", "a6", "electives"];
export const mathApplied: Program = {
  id: "math-applied",
  name: "Mathematics Major (Applied Track)",
  kind: "major",
  family: "math",
  buckets: [
    ...lower,
    one("a1", "MATH410 Advanced Calculus I", codes("MATH410")),
    one("a2", "STAT410", codes("STAT410", "SURV410")),
    one("a3", "Another STAT ≥ 400 (not 400/410/464)", except(range("STAT", 400, 899), codes("STAT400", "STAT410", "STAT464"))),
    one("a4", "One of MATH401/405/423", codes("MATH401", "MATH405", "MATH423")),
    one("a5", "AMSC460 or AMSC466 (CMSC cross-list ok)", NUMERICAL),
    one(
      "a6",
      "One of MATH416/420/424/431/452/456/462/463/464/475",
      codes(...M(416, 420, 424, 431, 452, 456, 462, 463, 464, 475), "AMSC420", "AMSC452", "CMSC456", "CMSC475"),
    ),
    { id: "electives", label: "Upper-level electives (to reach 8 courses)", match: UPPER, courses: 2 },
    supportBucket(SEQUENCES),
  ],
  constraints: [
    ...upperConstraints(APPLIED_UPPER, [
      pair("MATH410", "MATH411"),
      pair("MATH410", "MATH463"),
      pair("MATH416", "MATH464"),
      pair("MATH462", "MATH463"),
      pair("STAT410", "STAT420"),
    ]),
    supportConstraint(SEQUENCES),
  ],
  notes: [...NOTES, "MATH462 may fill both the 246-slot and an upper-level slot (dept rule)."],
  sources: SOURCES,
};

const TRAD_UPPER = ["t1", "t2", "t3", "t4", "electives"];
export const mathTraditional: Program = {
  id: "math-traditional",
  name: "Mathematics Major (Traditional Track)",
  kind: "major",
  family: "math",
  buckets: [
    ...lower,
    one("t1", "MATH410", codes("MATH410")),
    one("t2", "One of MATH401/403/405/423", codes("MATH401", "MATH403", "MATH405", "MATH423")),
    one("t3", "AMSC460 or AMSC466", NUMERICAL),
    one("t4", "STAT ≥ 400 (not 464)", except(range("STAT", 400, 899), codes("STAT464"))),
    { id: "electives", label: "Upper-level electives (to reach 8 courses)", match: UPPER, courses: 4 },
    supportBucket(SEQUENCES.slice(0, 8)),
  ],
  constraints: [
    ...upperConstraints(TRAD_UPPER, [
      pair("MATH410", "MATH411"),
      pair("MATH410", "MATH463"),
      pair("MATH403", "MATH404"),
      pair("MATH403", "MATH405"),
      pair("STAT410", "STAT420"),
    ]),
    supportConstraint(SEQUENCES.slice(0, 8)),
  ],
  notes: [...NOTES, "Two approved outside 400-level courses may replace one elective (Undergraduate Office approval)."],
  sources: SOURCES,
};

const STATS_UPPER = ["s1", "s2", "s3", "s4", "s5", "s6", "s78"];
export const mathStatistics: Program = {
  id: "math-stats",
  name: "Mathematics Major (Statistics Track)",
  kind: "major",
  family: "math",
  buckets: [
    ...lower,
    one("s1", "MATH410", codes("MATH410")),
    one("s2", "STAT410", codes("STAT410", "SURV410")),
    one("s3", "STAT430", codes("STAT430")),
    one("s4", "AMSC460 or AMSC466", NUMERICAL),
    one("s5", "MATH401/405/423", codes("MATH401", "MATH405", "MATH423")),
    one("s6", "STAT401 or STAT420", codes("STAT401", "STAT420")),
    {
      id: "s78",
      label: "Two of: STAT ≥ 400 (not 464), MATH411/420/424/464, BIOM402",
      match: anyOf(except(range("STAT", 400, 899), codes("STAT464")), codes("MATH411", "MATH420", "MATH424", "MATH464", "BIOM402")),
      courses: 2,
      maxCourses: 2,
    },
    supportBucket(SEQUENCES.slice(0, 8)),
  ],
  constraints: [
    { kind: "minFrom", id: "umd4", label: "≥ 4 upper-level courses taken at UMD", buckets: STATS_UPPER, match: atUMD, courses: 4 },
    supportConstraint(SEQUENCES.slice(0, 8)),
  ],
  notes: NOTES,
  sources: SOURCES,
};

export const MATH_PROGRAMS = [mathApplied, mathTraditional, mathStatistics];
