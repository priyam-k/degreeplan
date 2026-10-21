import { beforeAll, describe, expect, test } from "vitest";
import highsLoader from "highs";
import { solve, type Highs } from "./solver";
import { csGeneral } from "../programs/cs";
import { mathApplied } from "../programs/math";
import { rasMinor } from "../programs/ras";
import { gened, university } from "../programs/gened";
import { SHARING_RULES } from "../programs";
import type { AuditResult, Program, SolverCourse } from "../types";
import { TRANSFER_TERM } from "../transcript";

let highs: Highs;
beforeAll(async () => {
  highs = (await highsLoader()) as unknown as Highs;
});

let n = 0;
function c(code: string, opts: Partial<SolverCourse> = {}): SolverCourse {
  return { id: `c${n++}`, code, credits: 3, geneds: [], notes: "", status: "completed", term: "Fall 2025", ...opts };
}
const many = (codes: string[], opts: Partial<SolverCourse> = {}) => codes.map((x) => c(x, opts));

const bucket = (r: AuditResult, pid: string, bid: string) => r.programs.find((p) => p.program.id === pid)!.buckets.find((b) => b.bucket.id === bid)!;
const constraint = (r: AuditResult, pid: string, cid: string) => r.programs.find((p) => p.program.id === pid)!.constraints.find((x) => x.id === cid)!;
const run = (courses: SolverCourse[], programs: Program[], waived: string[] = []) => solve(highs, courses, programs, SHARING_RULES, { waived });

const CS_LOWER = many(["MATH140", "MATH141", "CMSC131", "CMSC132", "CMSC216", "CMSC250", "CMSC330", "CMSC351", "STAT400", "MATH240"]);

describe("CS general track", () => {
  test("5 area courses from 3 areas + electives + ULC satisfies the major", () => {
    const r = run(
      [
        ...CS_LOWER,
        ...many(["CMSC411", "CMSC421", "CMSC422", "CMSC451", "CMSC433", "CMSC420", "CMSC320"]),
        ...many(["MATH410", "MATH411", "STAT410", "MATH401"]),
      ],
      [csGeneral],
    );
    expect(r.error).toBeUndefined();
    expect(r.programs[0].satisfied).toBe(true);
  });

  test("all area courses from one area fails the 3-area rule and the ≤3 cap", () => {
    const r = run([...CS_LOWER, ...many(["CMSC420", "CMSC421", "CMSC422", "CMSC423", "CMSC424", "CMSC426", "CMSC427"])], [csGeneral]);
    expect(constraint(r, "cs-general", "areas3").satisfied).toBe(false);
    // the cap is hard: at most 3 Area 2 courses are placed in the area bucket
    expect(bucket(r, "cs-general", "areas").courseCount).toBe(3);
  });

  test("CMSC471 counts for Area 2 or 3 but only one of them", () => {
    const r = run([...CS_LOWER, ...many(["CMSC471", "CMSC422", "CMSC451", "CMSC420", "CMSC421"])], [csGeneral]);
    // A2: 422,420,421 + 471 -> 471 must be A3 to get 3 areas (A2, A3, A4)
    expect(constraint(r, "cs-general", "areas3").satisfied).toBe(true);
    const r2 = run([...CS_LOWER, ...many(["CMSC471", "CMSC422", "CMSC420", "CMSC421", "CMSC423"])], [csGeneral]);
    expect(constraint(r2, "cs-general", "areas3").satisfied).toBe(false);
  });

  test("498 topics only count for an area in listed terms", () => {
    const ok = run([...CS_LOWER, c("CMSC498E", { term: "Spring 2026" })], [csGeneral]);
    expect(bucket(ok, "cs-general", "areas").courseCount).toBe(1);
    const no = run([...CS_LOWER, c("CMSC498E", { term: "Fall 2024" })], [csGeneral]);
    expect(bucket(no, "cs-general", "areas").courseCount).toBe(0);
    expect(bucket(no, "cs-general", "electives").courseCount).toBe(1);
  });

  test("ULC needs one discipline and cannot reuse a course used for CS", () => {
    // STAT400 used for CS STAT slot; MATH240 used for CS math slot -> ULC only has PHIL370 + MATH410 + ECON300
    const r = run([...CS_LOWER, ...many(["MATH410", "PHIL370", "ECON300", "PHIL371"])], [csGeneral]);
    const ulc = bucket(r, "cs-general", "ulc");
    expect(ulc.satisfied).toBe(false);
    expect(ulc.creditCount).toBe(6); // two PHIL courses, single discipline
  });

  test("STIC credits capped at 3", () => {
    const r = run([...CS_LOWER, ...many(["CMSC389A", "CMSC389B", "CMSC398L", "CMSC388J", "CMSC389Z"], { credits: 1 })], [csGeneral]);
    expect(bucket(r, "cs-general", "electives").creditCount).toBe(3);
  });

  test("waiving CMSC132 (exemption exam)", () => {
    const lower = CS_LOWER.filter((x) => x.code !== "CMSC132");
    const r = run(lower, [csGeneral], ["cs-general/cmsc132"]);
    expect(bucket(r, "cs-general", "cmsc132").satisfied).toBe(true);
  });
});

describe("Math applied", () => {
  const LOWER = many(["MATH140", "MATH141", "MATH240", "MATH241", "MATH310", "MATH246", "CMSC131", "CMSC132", "CMSC216"]);
  test("minimal plan passes", () => {
    const r = run([...LOWER, ...many(["MATH410", "STAT410", "STAT420", "MATH401", "AMSC460", "MATH420", "MATH411", "MATH405"])], [mathApplied]);
    expect(r.programs[0].satisfied).toBe(true);
  });
  test("depth pair required", () => {
    const r = run([...LOWER, ...many(["MATH410", "STAT410", "STAT401", "MATH401", "AMSC460", "MATH420", "MATH430", "MATH405"])], [mathApplied]);
    expect(constraint(r, "math-applied", "depth").satisfied).toBe(false);
  });
  test("STAT400 does not fill the extra STAT slot; blacklisted MATH461 never counts", () => {
    const r = run([...LOWER, ...many(["MATH410", "STAT410", "STAT400", "MATH401", "AMSC460", "MATH420", "MATH411", "MATH461"])], [mathApplied]);
    expect(bucket(r, "math-applied", "a3").satisfied).toBe(false);
    expect(bucket(r, "math-applied", "electives").courseCount).toBe(2); // STAT400 + MATH411, not 461
  });
  test("≥ 4 upper-level at UMD", () => {
    const tr = { term: TRANSFER_TERM, status: "transfer" as const };
    const r = run(
      [...LOWER, ...many(["MATH410", "STAT410", "STAT420", "MATH401", "AMSC460"], tr), ...many(["MATH420", "MATH411", "MATH405"])],
      [mathApplied],
    );
    expect(constraint(r, "math-applied", "umd4").satisfied).toBe(false);
  });
});

describe("RAS minor sharing", () => {
  test("at most 2 courses shared with majors; supporting math doesn't count", () => {
    const plan = [
      ...CS_LOWER,
      ...many(["ENME480", "ENAE450", "ENEE467", "CMSC477", "CMSC421", "CMSC422", "CMSC426"]),
      ...many(["CMSC411", "CMSC451", "CMSC433", "CMSC420"]),
    ];
    const r = run(plan, [csGeneral, rasMinor]);
    const share = r.sharing.find((s) => s.id === "sharing/ras-minor-major-overlap")!;
    expect(share.satisfied).toBe(true);
    // RAS still completes (CS can use 411/451/433/420/+1 for areas; minor keeps its CMSC electives)
    expect(r.programs.find((p) => p.program.id === "ras-minor")!.satisfied).toBe(true);
    // only the ULC (no non-CS upper-level courses in this plan) is missing for CS
    const unmet = r.programs.find((p) => p.program.id === "cs-general")!.buckets.filter((b) => !b.satisfied);
    expect(unmet.map((b) => b.bucket.id)).toEqual(["ulc"]);
    expect(r.programs.find((p) => p.program.id === "cs-general")!.constraints.every((x) => x.satisfied)).toBe(true);
  });

  test("forced overlap beyond 2 leaves a requirement unmet instead of breaking the cap", () => {
    // CS needs CMSC421/422/477 for areas+electives; RAS needs 477 + 421 + 422 => 3 shared would be needed
    const plan = [...CS_LOWER, ...many(["ENME480", "ENAE450", "ENEE467", "CMSC477", "CMSC421", "CMSC422", "CMSC451", "CMSC433"])];
    const r = run(plan, [csGeneral, rasMinor]);
    const share = r.sharing.find((s) => s.id === "sharing/ras-minor-major-overlap")!;
    expect(share.satisfied).toBe(true);
    const shared = Number(share.detail.split(" ")[0]);
    expect(shared).toBeLessThanOrEqual(2);
    const ok = r.programs.filter((p) => p.satisfied).length;
    expect(ok).toBeLessThan(2);
  });
});

describe("GenEd", () => {
  test("multi-DS course fills one slot; SCIS needs a DS slot; FSMA+FSAR from one course", () => {
    const r = run(
      [
        c("MATH140", { geneds: [["FSAR", "FSMA"]] }),
        c("HIST200", { geneds: [["DSHS"], ["DSHU"]] }),
        c("LING260", { geneds: [["DSHU", "SCIS"]] }),
      ],
      [gened],
    );
    expect(bucket(r, "gened", "fsma").satisfied).toBe(true);
    expect(bucket(r, "gened", "fsar").satisfied).toBe(true);
    const hs = bucket(r, "gened", "dshs").courseCount;
    const hu = bucket(r, "gened", "dshu").courseCount;
    expect(hs + hu).toBe(2); // HIST200 takes one slot only
    expect(bucket(r, "gened", "scis").courseCount).toBe(1);
  });

  test("SCIS from AP doesn't count", () => {
    const r = run([c("HIST289A", { geneds: [["DSHS", "SCIS"]], term: TRANSFER_TERM, status: "transfer", ap: true })], [gened]);
    expect(bucket(r, "gened", "scis").courseCount).toBe(0);
  });

  test("diversity: two DVCC is not enough", () => {
    const r = run(many(["CPSP110", "EDDI110"], { geneds: [["DVCC"]], credits: 1 }), [gened]);
    expect(bucket(r, "gened", "dvup").satisfied).toBe(false);
  });

  test("university: AP credit capped at 60", () => {
    const r = run(many(Array.from({ length: 25 }, (_, i) => `XXXX1${String(i).padStart(2, "0")}`), { ap: true, term: TRANSFER_TERM }), [university]);
    expect(bucket(r, "university", "total").creditCount).toBe(60);
  });
});
