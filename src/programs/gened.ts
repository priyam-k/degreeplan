// UMD General Education (2025-26) and university-wide degree rules. See docs/research/gened-and-university.md.
import type { Bucket, Program } from "../types";
import { anything, atUMD } from "../engine/match";

const fs = (code: string, label: string): Bucket => ({
  id: code.toLowerCase(),
  label: `${code} ${label}`,
  match: anything,
  gened: [code],
  courses: 1,
  useGroup: `fs-${code}`, // a course coded "FSAR, FSMA" satisfies both
});
const ds = (id: string, label: string, codes: string[], n: number): Bucket => ({
  id,
  label,
  match: anything,
  gened: codes,
  courses: n,
  maxCourses: n,
  useGroup: "ds", // one DS slot per course
});
const DS = ["ns-lab", "ns", "dshs", "dshu", "dssp"];

export const gened: Program = {
  id: "gened",
  name: "General Education",
  kind: "gened",
  buckets: [
    fs("FSAW", "Academic Writing"),
    fs("FSPW", "Professional Writing"),
    fs("FSOC", "Oral Communication"),
    fs("FSMA", "Math"),
    fs("FSAR", "Analytic Reasoning"),
    ds("ns-lab", "DSNL Natural Science Lab", ["DSNL"], 1),
    ds("ns", "DSNS/DSNL second Natural Science", ["DSNS", "DSNL"], 1),
    ds("dshs", "DSHS History & Social Sciences (×2)", ["DSHS"], 2),
    ds("dshu", "DSHU Humanities (×2)", ["DSHU"], 2),
    ds("dssp", "DSSP Scholarship in Practice (×2)", ["DSSP"], 2),
    {
      id: "scis",
      label: "SCIS Big Question (×2, at UMD, on a DS course)",
      match: atUMD,
      gened: ["SCIS"],
      courses: 2,
      maxCourses: 2,
      useGroup: "scis",
    },
    { id: "dvup", label: "DVUP Understanding Plural Societies", match: anything, gened: ["DVUP"], courses: 1, maxCourses: 1, useGroup: "dv" },
    {
      id: "dv2",
      label: "Second diversity: DVUP or DVCC",
      match: anything,
      gened: ["DVUP", "DVCC"],
      courses: 1,
      maxCourses: 1,
      useGroup: "dv",
    },
  ],
  constraints: [
    { kind: "within", id: "scis-ds", label: "Big Question courses also fill a DS slot", bucket: "scis", of: DS },
    {
      kind: "maxFrom",
      id: "ap6",
      label: "≤ 6 of 8 DS slots from AP/IB",
      buckets: DS,
      match: (_c, ctx) => ctx.ap,
      courses: 6,
    },
    { kind: "outsideMajors", id: "dssp-outside", label: "≥ 1 DSSP outside all major requirements", buckets: ["dssp"], min: 1 },
  ],
  notes: [
    "A course with several DS codes fills only one DS slot; SCIS and DVUP/DVCC overlay on DS courses.",
    "Lab pairs: a lecture's DSNL may require its lab in the same term (e.g. PHYS161+PHYS275) — check the GenEd column.",
    "FSAW and FSMA must be attempted by 30 credits and completed by 60. FSAW needs C-; GenEd courses can't be P/F.",
  ],
  sources: ["https://gened.umd.edu/students/four-categories-gen-ed", "https://academiccatalog.umd.edu/undergraduate/general-education/"],
};

export const university: Program = {
  id: "university",
  name: "University Requirements",
  kind: "university",
  buckets: [
    { id: "total", label: "120 credits total", match: anything, credits: 120, useGroup: "total", noShare: true },
    { id: "residency", label: "30 credits at UMD", match: atUMD, credits: 30, useGroup: "res", noShare: true },
    {
      id: "upper",
      label: "15 upper-level (300+) credits at UMD",
      match: (code, ctx) => atUMD(code, ctx) && /^[A-Z]{4}[3-9]\d\d/.test(code),
      credits: 15,
      useGroup: "upper",
      noShare: true,
    },
  ],
  constraints: [
    { kind: "maxFrom", id: "plc60", label: "≤ 60 AP/IB credits count toward the degree", buckets: ["total"], match: (_c, ctx) => ctx.ap, credits: 60 },
  ],
  notes: [
    "Normally the final 30 credits must be taken at UMD; 12 of the 15 upper-level credits must be in the major.",
    "GPA ≥ 2.0 overall and in each major and minor.",
    "CMNS caps semester load at 17 credits (fall/spring) without approval.",
  ],
  sources: ["https://academiccatalog.umd.edu/undergraduate/registration-academic-requirements-regulations/degree-information/"],
};
