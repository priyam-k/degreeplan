// UMD Computer Science B.S. — 2025-26 catalog (2026-27 identical). See docs/research/cs-major.md.
import type { Bucket, Group, Program, ProgramConstraint } from "../types";
import { anyOf, codes, except, range, topic } from "../engine/match";

const FA = (y: number) => `Fall ${y}`;
const SP = (y: number) => `Spring ${y}`;

// Distributive areas (department list; CMSC498x topics count only in the listed terms).
export const AREAS: Group[] = [
  {
    id: "A1",
    label: "Area 1 Systems",
    match: anyOf(
      codes("CMSC411", "CMSC412", "CMSC414", "CMSC416", "CMSC417"),
      topic("CMSC498B", [FA(2024), FA(2025)]),
      topic("CMSC498C", [SP(2024), SP(2025), SP(2026), FA(2026)]),
      topic("CMSC498I", [FA(2022)]),
      topic("CMSC498N", [SP(2027)]),
      topic("CMSC498X", [FA(2020)]),
    ),
  },
  {
    id: "A2",
    label: "Area 2 Info Processing",
    match: anyOf(
      codes("CMSC420", "CMSC421", "CMSC422", "CMSC423", "CMSC424", "CMSC426", "CMSC427", "CMSC470", "CMSC471", "CMSC472"),
      topic("CMSC498D", [SP(2025), SP(2026)]),
      topic("CMSC498E", [FA(2023), SP(2026), SP(2027)]),
      topic("CMSC498F", [SP(2022), SP(2023), SP(2024), SP(2026)]),
      topic("CMSC498K", [FA(2025)]),
      topic("CMSC498P", [SP(2027)]),
      topic("CMSC498Y", [SP(2024), SP(2025), SP(2026), SP(2027)]),
      topic("CMSC498Z", [FA(2023), FA(2025), FA(2026)]),
    ),
  },
  {
    id: "A3",
    label: "Area 3 SE/PL",
    match: anyOf(
      codes("CMSC430", "CMSC431", "CMSC433", "CMSC434", "CMSC435", "CMSC436", "CMSC471"),
      topic("CMSC498G", [SP(2025), SP(2026)]),
      topic("CMSC498J", [FA(2025)]),
    ),
  },
  {
    id: "A4",
    label: "Area 4 Theory",
    match: anyOf(codes("CMSC451", "CMSC452", "CMSC454", "CMSC456", "CMSC457", "CMSC474"), topic("CMSC498W", [SP(2027)])),
  },
  { id: "A5", label: "Area 5 Numerical", match: codes("CMSC460", "CMSC466") },
];

const AREA_ANY = anyOf(...AREAS.map((a) => a.match));
const UPPER_CMSC_ELECTIVE = except(range("CMSC", 300, 499), codes("CMSC330", "CMSC351"));
const STIC = anyOf(range("CMSC", 388, 389), range("CMSC", 398, 398));

// STAT4xx with prereq >= MATH141, not cross-listed with CMSC (STAT426 ~ CMSC320 and STAT464 excluded).
const STAT4XX = codes("STAT400", "DATA400", "STAT401", "STAT410", "STAT420", "STAT422", "STAT430", "STAT440", "STAT470", "STAT498");
const MATHSTAT = anyOf(
  codes("MATH240", "MATH241", "MATH243", "MATH246", "MATH310", "MATH340", "MATH341"),
  codes(
    ...[401, 402, 403, 404, 405, 406, 410, 411, 416, 420, 423, 424, 430, 431, 432, 436, 437, 440, 445, 446, 452, 461, 462, 463, 464, 470, 484].map(
      (n) => `MATH${n}`,
    ),
  ),
  codes("AMSC420", "AMSC452"),
  STAT4XX,
);
const LINEAR_ALGEBRA = codes("MATH240", "MATH461", "MATH341");

// Upper Level Concentration: 12 credits at 300-400 level in one non-CMSC discipline (MATH+STAT may mix).
const ULC_INELIGIBLE = anyOf(
  codes("AMSC460", "AMSC466", "AOSC445", "AOSC447", "AREC380", "BIOE442", "BSCI411", "DATA320", "DATA400"),
  codes("BMGT300", "BMGT301", "BMGT301F", "BMGT302", "BMGT302F", "BMGT347", "BMGT400", "BMGT401", "BMGT402", "BMGT403", "BMGT404"),
  codes("BMGT408E", "BMGT408C", "BMGT431", "BMGT408V", "ECON414", "ECON432", "ECON433", "ENGL381"),
  codes("ENEE350", "ENEE426", "ENEE436", "ENEE446", "ENEE447", "ENEE456", "ENEE457", "ENEE459L", "ENEE464"),
  codes("GEOG371", "GEOG376", "GEOG377", "GEOG461", "GEOG470", "GEOG476", "GEOG498I", "GEOL377"),
  codes("IMDM327", "IMDM390", "IMDM498I", "IMDM498K", "MATH440", "MATH456", "MATH461", "MATH475"),
  codes("PHIL308F", "PHIL408F", "PHPE408J", "PHYS457", "PHYS474", "PHYS476", "PHYS486", "PSYC417", "STAT426", "STAT464"),
  // Robotics minor courses
  codes("ENAE450", "ENEE467", "ENEE408I", "ENME440"),
);
const ULC_EXCLUDED_DEPTS = /^(CMSC|HONR|HNUH|INST|DATA|CP[A-Z]{2})$/;
function ulcDiscipline(code: string): string | null {
  const dept = code.slice(0, 4);
  if (ULC_EXCLUDED_DEPTS.test(dept)) return null;
  if (dept === "MATH" || dept === "STAT") return "MATH/STAT";
  if (dept === "LGBT" || dept === "WGSS") return "LGBT/WGSS";
  return dept;
}
const ULC_MATCH = (code: string) => {
  const n = Number(code.slice(4, 7));
  return n >= 300 && n <= 499 && ulcDiscipline(code) !== null && !ULC_INELIGIBLE(code, { term: "", transfer: false, ap: false });
};

function lower(opts: { stat?: Bucket["match"]; mathstat?: Bucket["match"]; mathLabel?: string } = {}): Bucket[] {
  return [
    { id: "math140", label: "MATH140 Calculus I", match: codes("MATH140"), courses: 1 },
    { id: "math141", label: "MATH141 Calculus II", match: codes("MATH141"), courses: 1 },
    { id: "cmsc131", label: "CMSC131 (or 133/141)", match: codes("CMSC131", "CMSC133", "CMSC141"), courses: 1, note: "Exemption exam: waive" },
    { id: "cmsc132", label: "CMSC132 (or 142)", match: codes("CMSC132", "CMSC142"), courses: 1, note: "Exemption exam: waive" },
    { id: "cmsc216", label: "CMSC216", match: codes("CMSC216"), courses: 1 },
    { id: "cmsc250", label: "CMSC250", match: codes("CMSC250"), courses: 1 },
    { id: "cmsc330", label: "CMSC330", match: codes("CMSC330"), courses: 1 },
    { id: "cmsc351", label: "CMSC351", match: codes("CMSC351"), courses: 1 },
    { id: "stat", label: "STAT4xx (prereq ≥ MATH141)", match: opts.stat ?? STAT4XX, courses: 1 },
    { id: "mathstat", label: opts.mathLabel ?? "MATH/AMSC/STAT (prereq ≥ MATH141)", match: opts.mathstat ?? MATHSTAT, courses: 1 },
  ];
}

const ULC: Bucket = {
  id: "ulc",
  label: "Upper Level Concentration (12 cr, one non-CS discipline)",
  match: ULC_MATCH,
  credits: 12,
  discipline: ulcDiscipline,
  noShare: true, // ULC doesn't count toward the major/minor overlap cap
  note: "300-400 level, one discipline (MATH+STAT may mix), not used for any other CS requirement. Each course ≥ 3 credits.",
};

const SOURCES = [
  "https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/computer-science-major/",
  "https://undergrad.cs.umd.edu/general-track-degree-requirements",
  "https://undergrad.cs.umd.edu/upper-level-concentration",
];
const COMMON_NOTES = [
  "C- or better required in every major course.",
  "CMSC498x topics count toward an area only in the terms the department lists; other topics count as general electives.",
  "Overflow area courses (beyond the 5) count as electives.",
];

function distribution(buckets: string[], maxPerArea: boolean): ProgramConstraint[] {
  const out: ProgramConstraint[] = [
    { kind: "minFrom", id: "area5", label: "5 distributive-area courses", buckets, match: AREA_ANY, courses: 5 },
    { kind: "distinct", id: "areas3", label: "Areas covered (≥ 3)", buckets, groups: AREAS, min: 3 },
  ];
  if (maxPerArea)
    for (const a of AREAS)
      out.push({ kind: "maxFrom", id: `max-${a.id}`, label: `≤ 3 from ${a.label}`, buckets, match: a.match, courses: 3 });
  return out;
}

export const csGeneral: Program = {
  id: "cs-general",
  name: "Computer Science Major (General Track)",
  kind: "major",
  family: "cs",
  buckets: [
    ...lower(),
    { id: "areas", label: "5 CMSC 400-level area courses", match: AREA_ANY, courses: 5, maxCourses: 5 },
    { id: "electives", label: "Upper-level CMSC electives (6 cr)", match: UPPER_CMSC_ELECTIVE, credits: 6 },
    ULC,
  ],
  constraints: [
    ...distribution(["areas"], true),
    { kind: "maxFrom", id: "stic", label: "≤ 3 credits of 1-credit STICs (388/389/398)", buckets: ["electives"], match: STIC, credits: 3 },
  ],
  notes: COMMON_NOTES,
  sources: SOURCES,
};

const choose = (id: string, label: string, list: string[], n = 1): Bucket => ({
  id,
  label,
  match: codes(...list),
  courses: n,
  maxCourses: n,
});
const req = (code: string): Bucket => ({ id: code.toLowerCase(), label: code, match: codes(code), courses: 1 });

export const csCyber: Program = {
  id: "cs-cyber",
  name: "Computer Science Major (Cybersecurity)",
  kind: "major",
  family: "cs",
  buckets: [
    ...lower(),
    req("CMSC414"),
    req("CMSC456"),
    choose("cyber4", "4 of CMSC411/412/417/430/431/433/451", ["CMSC411", "CMSC412", "CMSC417", "CMSC430", "CMSC431", "CMSC433", "CMSC451"], 4),
    { id: "electives", label: "Upper-level CMSC electives (3 cr)", match: UPPER_CMSC_ELECTIVE, credits: 3 },
    ULC,
  ],
  constraints: [
    ...distribution(["cmsc414", "cmsc456", "cyber4", "electives"], false),
    { kind: "maxFrom", id: "stic", label: "≤ 3 credits of STICs", buckets: ["electives"], match: STIC, credits: 3 },
  ],
  notes: [...COMMON_NOTES, "Whether the ≤3-per-area cap applies in this track is unconfirmed."],
  sources: [...SOURCES, "https://undergrad.cs.umd.edu/cybersecurity-degree-requirements"],
};

export const csDataScience: Program = {
  id: "cs-ds",
  name: "Computer Science Major (Data Science)",
  kind: "major",
  family: "cs",
  buckets: [
    ...lower({ stat: codes("STAT400", "DATA400"), mathstat: LINEAR_ALGEBRA, mathLabel: "Linear algebra (MATH240/461/341)" }),
    req("CMSC320"),
    req("CMSC422"),
    req("CMSC424"),
    choose("ds-a", "1 of CMSC420/421/423/425/426/427/470", ["CMSC420", "CMSC421", "CMSC423", "CMSC425", "CMSC426", "CMSC427", "CMSC470"]),
    choose("ds-b", "1 of CMSC451/454/460", ["CMSC451", "CMSC454", "CMSC460"]),
    choose(
      "ds-c",
      "2 of CMSC411/412/414/417/430/431/433/434/435/471",
      ["CMSC411", "CMSC412", "CMSC414", "CMSC417", "CMSC430", "CMSC431", "CMSC433", "CMSC434", "CMSC435", "CMSC471"],
      2,
    ),
    ULC,
  ],
  constraints: distribution(["cmsc422", "cmsc424", "ds-a", "ds-b", "ds-c"], false),
  notes: COMMON_NOTES,
  sources: [...SOURCES, "https://undergrad.cs.umd.edu/data-science-degree-requirements"],
};

export const csML: Program = {
  id: "cs-ml",
  name: "Computer Science Major (Machine Learning)",
  kind: "major",
  family: "cs",
  buckets: [
    ...lower({ mathstat: LINEAR_ALGEBRA, mathLabel: "Linear algebra (MATH240/461/341)" }),
    req("CMSC320"),
    req("CMSC421"),
    req("CMSC422"),
    {
      id: "ml2",
      label: "2 of CMSC426, 460/466/MATH401, 470, 472, 473, 474, 476",
      match: codes("CMSC426", "CMSC460", "CMSC466", "AMSC460", "AMSC466", "MATH401", "CMSC470", "CMSC472", "CMSC473", "CMSC474", "CMSC476"),
      courses: 2,
      maxCourses: 2,
    },
    { id: "electives", label: "Upper-level CMSC electives (6 cr)", match: UPPER_CMSC_ELECTIVE, credits: 6 },
    ULC,
  ],
  constraints: [
    ...distribution(["cmsc421", "cmsc422", "ml2", "electives"], false),
    { kind: "maxFrom", id: "stic", label: "≤ 3 credits of STICs", buckets: ["electives"], match: STIC, credits: 3 },
  ],
  notes: COMMON_NOTES,
  sources: [...SOURCES, "https://undergrad.cs.umd.edu/machine-learning-degree-requirements"],
};

export const csQuantum: Program = {
  id: "cs-qi",
  name: "Computer Science Major (Quantum Information)",
  kind: "major",
  family: "cs",
  buckets: [
    ...lower({ mathstat: LINEAR_ALGEBRA, mathLabel: "Linear algebra (MATH240/461/341)" }),
    req("CMSC457"),
    req("PHYS467"),
    { id: "qi4", label: "4 area courses", match: AREA_ANY, courses: 4, maxCourses: 4 },
    { id: "electives", label: "Upper-level CMSC electives (3 cr)", match: UPPER_CMSC_ELECTIVE, credits: 3 },
    ULC,
  ],
  constraints: [
    ...distribution(["cmsc457", "qi4"], true),
    {
      kind: "distinct",
      id: "qi-non4",
      label: "The 4 cover ≥ 2 areas other than Theory",
      buckets: ["qi4"],
      groups: AREAS.filter((a) => a.id !== "A4"),
      min: 2,
    },
  ],
  notes: COMMON_NOTES,
  sources: [...SOURCES, "https://undergrad.cs.umd.edu/quantum-information-degree-requirements"],
};

export const CS_PROGRAMS = [csGeneral, csCyber, csDataScience, csML, csQuantum];
