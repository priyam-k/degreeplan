// Course as stored in public/courses.json (short keys keep the file small).
export interface CatalogCourse {
  c: string; // code, e.g. "CMSC330"
  n: string; // name
  cr: number; // min credits
  mx: number | null; // max credits (variable-credit courses)
  g: string[][]; // GenEd alternatives: [["DSHS"],["DSHU","DVUP"]] = DSHS OR (DSHU + DVUP)
  p: string | null; // prerequisite text
  r?: string | null; // restriction text ("Must be in ...; and permission of ..."); absent = none
  x: string | null; // "credit only granted for" text
  t?: number[]; // terms it appeared in the schedule of classes, YYMM (2408 = Fall 2024); absent = no history
  // Topics courses reuse a code for different topics; each topic with its terms and prerequisites.
  // Top-level n and p are the most recent offering's.
  v?: { t: number[]; n: string; p: string | null }[];
}

export type CourseStatus = "completed" | "inprogress" | "planned" | "transfer";

export interface SolverCourse extends PlanCourse {
  term: string;
}

export interface PlanCourse {
  id: string;
  code: string; // normalized, e.g. "CMSC330"; "" for GenEd-only credit (e.g. AP English -> FSAW)
  credits: number;
  geneds: string[][]; // same shape as CatalogCourse.g
  notes: string;
  status: CourseStatus;
  grade?: string;
  title?: string;
  ap?: boolean; // prior-learning credit (AP/IB exam), as opposed to transfer coursework
}

export interface Semester {
  id: string;
  term: string; // "Fall 2025", "Spring 2026", "Summer 2026", "Winter 2026", "Transfer / AP"
  courses: PlanCourse[];
}

export interface Plan {
  semesters: Semester[];
  programIds: string[];
  // GenEd categories satisfied outside of courses (e.g. "Fundamental Requirement Satisfied Math: AP").
  genedExemptions: string[];
  // "programId/bucketOrConstraintId" marked satisfied by the user (exemption exam, advisor waiver, ...)
  waived: string[];
}

// ---------------------------------------------------------------------------
// Requirement DSL

export interface MatchCtx {
  term: string; // "Fall 2025"; "Transfer / AP" for transfer credit
  transfer: boolean;
  ap: boolean;
}

export type Matcher = (code: string, ctx: MatchCtx) => boolean;

export interface Bucket {
  id: string;
  label: string;
  match: Matcher;
  courses?: number; // minimum number of courses
  credits?: number; // minimum number of credits
  maxCourses?: number; // hard cap on courses assigned here
  // A course may be used at most once per (program, useGroup). Defaults to "main".
  // Major/minor overlap rules only look at the "main" group.
  useGroup?: string;
  // For GenEd buckets: the GenEd code(s) this bucket accepts from a course's alternatives.
  gened?: string[];
  // Courses used only here don't count as shared for SharingRules (e.g. CS ULC, a waivable minor slot).
  noShare?: boolean;
  // All courses in this bucket must share one discipline key (e.g. CS Upper Level Concentration).
  discipline?: (code: string) => string | null;
  note?: string;
}

export interface SetSlot {
  label: string;
  match: Matcher;
  count?: number; // default 1
}

export interface SetOption {
  label: string;
  slots: SetSlot[];
}

export interface Group {
  id: string;
  label: string;
  match: Matcher;
}

export type ProgramConstraint =
  // At least `courses` (and/or `credits`) of the courses assigned to `buckets` must match.
  | { kind: "minFrom"; id: string; label: string; buckets: string[]; match: Matcher; courses?: number; credits?: number }
  // At most `courses` (or `credits`) of the courses assigned to `buckets` may match.
  | { kind: "maxFrom"; id: string; label: string; buckets: string[]; match: Matcher; courses?: number; credits?: number }
  // Assigned courses must cover at least `min` distinct groups (each course counts toward one group).
  | { kind: "distinct"; id: string; label: string; buckets: string[]; groups: Group[]; min: number }
  // Courses assigned to `buckets` must fully cover at least one option (supporting sequences, depth pairs).
  | { kind: "anySet"; id: string; label: string; buckets: string[]; options: SetOption[] }
  // Every course assigned to `bucket` must also be assigned to one of `of` (e.g. SCIS rides on a DS slot).
  | { kind: "within"; id: string; label: string; bucket: string; of: string[] }
  // At least `min` courses in `buckets` must not be used by any major program (e.g. one DSSP outside the major).
  | { kind: "outsideMajors"; id: string; label: string; buckets: string[]; min: number };

export interface Program {
  id: string;
  name: string;
  short?: string; // compact name for chips and buttons ("CS", "RAS minor")
  kind: "major" | "minor" | "gened" | "university";
  family?: string; // programs in the same family are mutually exclusive tracks (e.g. CS tracks)
  college?: string; // groups programs in the picker, e.g. "Engineering"
  aliases?: string[]; // other names a transcript may use for this program (matched case-insensitively)
  buckets: Bucket[];
  constraints?: ProgramConstraint[];
  notes?: string[]; // rules shown to the user but not machine-checked
  sources?: string[];
}

export type SharingRule =
  // Courses (or credits) used by both program `a` and any of `b` may not exceed `max`.
  | { kind: "maxShared"; id: string; label: string; a: string; b: string[]; unit: "courses" | "credits"; max: number }
  // Program `a` must have at least `credits` credits not used by any of `b`.
  | { kind: "minUnique"; id: string; label: string; a: string; b: string[]; credits: number };

// ---------------------------------------------------------------------------
// Audit result

export interface BucketResult {
  bucket: Bucket;
  waived: boolean;
  assigned: string[]; // PlanCourse ids
  courseCount: number;
  creditCount: number;
  satisfied: boolean;
}

export interface ConstraintResult {
  id: string;
  label: string;
  satisfied: boolean;
  detail: string;
  waived?: boolean;
}

export interface ProgramResult {
  program: Program;
  buckets: BucketResult[];
  constraints: ConstraintResult[];
  satisfied: boolean;
}

export interface AuditResult {
  programs: ProgramResult[];
  sharing: ConstraintResult[];
  // PlanCourse id -> labels of where it counts, e.g. ["CS: Upper-level elective", "GenEd: DSHU"]
  usage: Record<string, string[]>;
  totalCredits: number;
  error?: string;
}
