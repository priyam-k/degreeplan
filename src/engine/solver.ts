// Assigns plan courses to requirement buckets by solving a small integer program.
//
// Every (course, bucket) pair the course is eligible for gets a binary variable x.
// Hard constraints: a course is used at most once per (program, useGroup); bucket caps;
// "at most N from ..." rules; major/minor sharing limits. Soft constraints (minimums)
// get shortfall variables that are heavily penalized, so the solver finds the
// assignment that satisfies as much as possible without ever breaking a hard rule.
// The result is then re-checked directly from the chosen assignment.
import type {
  AuditResult,
  Bucket,
  BucketResult,
  ConstraintResult,
  MatchCtx,
  Program,
  ProgramResult,
  SetOption,
  SharingRule,
  SolverCourse,
} from "../types";
import { TRANSFER_TERM } from "../transcript";
import { anything } from "./match";

export interface Highs {
  solve(lp: string, options?: Record<string, unknown>): {
    Status: string;
    Columns: Record<string, { Primal: number }>;
  };
}

const W = 10000; // penalty per missing course (per 3 missing credits)

interface Term {
  v: string;
  c: number;
}

class LpBuilder {
  private obj: Term[] = [{ v: "dummy", c: 0 }];
  private rows: string[] = [];
  private ints: string[] = [];
  private bounds: string[] = [" 0 <= dummy <= 0"];
  private n = 0;

  newVar(prefix: string, lo = 0, hi: number | null = 1, integer = true): string {
    const name = `${prefix}${this.n++}`;
    this.bounds.push(hi === null ? ` ${name} >= ${lo}` : ` ${lo} <= ${name} <= ${hi}`);
    if (integer) this.ints.push(name);
    return name;
  }

  cost(v: string, c: number) {
    this.obj.push({ v, c });
  }

  row(terms: Term[], op: ">=" | "<=" | "=", rhs: number) {
    const t = terms.filter((x) => x.c !== 0);
    if (t.length === 0) return;
    this.rows.push(` r${this.rows.length}: ${fmt(t)} ${op} ${rhs}`);
  }

  toString(): string {
    const ints = [];
    for (let i = 0; i < this.ints.length; i += 20) ints.push(" " + this.ints.slice(i, i + 20).join(" "));
    return [
      "Minimize",
      ` obj: ${fmt(this.obj)}`,
      "Subject To",
      " r_dummy: dummy >= 0",
      ...this.rows,
      "Bounds",
      ...this.bounds,
      ...(ints.length ? ["General", ...ints] : []),
      "End",
    ].join("\n");
  }
}

function fmt(terms: Term[]): string {
  return terms.map((t, i) => `${t.c < 0 ? "-" : i === 0 ? "" : "+"} ${Math.abs(t.c)} ${t.v}`).join(" ");
}

const ctxOf = (c: SolverCourse): MatchCtx => ({
  term: c.term,
  transfer: c.term === TRANSFER_TERM || c.status === "transfer",
  ap: !!c.ap,
});

const altFits = (alt: string[], b: Bucket) => alt.some((g) => b.gened!.includes(g));

function eligible(course: SolverCourse, bucket: Bucket): boolean {
  if (bucket.gened) {
    if (!course.geneds.some((alt) => altFits(alt, bucket))) return false;
    return bucket.match(course.code, ctxOf(course));
  }
  // GenEd-only credit (no course code, e.g. AP English -> FSAW) only counts toward catch-all buckets
  return (course.code !== "" || bucket.match === anything) && bucket.match(course.code, ctxOf(course));
}

const exemptCount = (b: Bucket, exemptions: string[]) => (b.gened ? exemptions.filter((g) => b.gened!.includes(g)).length : 0);

const groupOf = (b: Bucket) => b.useGroup ?? "main";
const counts = (b: Bucket) => !b.gened && !b.noShare; // participates in sharing rules

export function solve(
  highs: Highs,
  allCourses: SolverCourse[],
  programs: Program[],
  sharing: SharingRule[],
  opts: { genedExemptions?: string[]; waived?: string[] } = {},
): AuditResult {
  const genedExemptions = opts.genedExemptions ?? [];
  const waived = new Set(opts.waived ?? []);

  // A course code counts once even if it appears twice (e.g. a retake).
  const seen = new Set<string>();
  const courses: SolverCourse[] = [];
  const usage: Record<string, string[]> = {};
  for (const c of allCourses) {
    usage[c.id] = [];
    if (c.code && seen.has(c.code)) {
      usage[c.id].push("Duplicate — only counted once");
      continue;
    }
    if (c.code) seen.add(c.code);
    courses.push(c);
  }

  const lp = new LpBuilder();
  const x = new Map<string, { i: number; v: string }[]>(); // "prog/bucket" -> vars
  const key = (p: Program, b: Bucket) => `${p.id}/${b.id}`;

  // GenEd alternatives: a course whose GenEds are "A or B" picks one alternative.
  const altVars = new Map<number, string[]>();
  courses.forEach((c, i) => {
    if (c.geneds.length > 1) {
      const vars = c.geneds.map(() => lp.newVar("a"));
      lp.row(vars.map((v) => ({ v, c: 1 })), "<=", 1);
      altVars.set(i, vars);
    }
  });

  const deferred: (() => void)[] = []; // rows that need every program's variables
  // u[program][course] = 1 iff the course is used by a sharing-relevant bucket of the program
  const u = new Map<string, Map<number, string>>();

  for (const p of programs) {
    const use = new Map<string, string[]>(); // "course|useGroup" -> vars
    const share = new Map<number, string[]>(); // course -> vars in sharing-relevant buckets
    for (const b of p.buckets) {
      const isWaived = waived.has(key(p, b));
      const list: { i: number; v: string }[] = [];
      courses.forEach((c, i) => {
        if (isWaived || !eligible(c, b)) return;
        const v = lp.newVar("x");
        lp.cost(v, 1);
        list.push({ i, v });
        const k = `${i}|${groupOf(b)}`;
        use.set(k, [...(use.get(k) ?? []), v]);
        if (counts(b)) share.set(i, [...(share.get(i) ?? []), v]);
        const alts = altVars.get(i);
        if (b.gened && alts) {
          const ok = alts.filter((_, k2) => altFits(c.geneds[k2], b));
          lp.row([{ v, c: 1 }, ...ok.map((a) => ({ v: a, c: -1 }))], "<=", 0);
        }
      });
      x.set(key(p, b), list);
      if (isWaived) continue;

      const exempt = exemptCount(b, genedExemptions);
      const needCourses = Math.max(0, (b.courses ?? 0) - exempt);
      // Tie-break: when the total shortfall is equal, fill narrow slots (few eligible courses)
      // before broad pools, so e.g. STAT410 lands in "STAT410" rather than "electives".
      const narrow = 1 + 0.1 / Math.max(1, list.length);
      if (needCourses > 0) {
        const s = lp.newVar("s", 0, null, false);
        lp.cost(s, W * narrow);
        lp.row([...list.map((t) => ({ v: t.v, c: 1 })), { v: s, c: 1 }], ">=", needCourses);
      }
      if (b.credits && !exempt) {
        const s = lp.newVar("s", 0, null, false);
        lp.cost(s, (W / 3) * narrow);
        lp.row([...list.map((t) => ({ v: t.v, c: courses[t.i].credits })), { v: s, c: 1 }], ">=", b.credits);
      }
      if (b.maxCourses !== undefined) lp.row(list.map((t) => ({ v: t.v, c: 1 })), "<=", b.maxCourses);
      if (b.discipline) {
        // pick one discipline z_d; each assigned course must belong to the chosen one
        const zs = new Map<string, string>();
        for (const t of list) {
          const d = b.discipline(courses[t.i].code);
          if (d === null) {
            lp.row([{ v: t.v, c: 1 }], "<=", 0);
            continue;
          }
          if (!zs.has(d)) zs.set(d, lp.newVar("z"));
          lp.row([{ v: t.v, c: 1 }, { v: zs.get(d)!, c: -1 }], "<=", 0);
        }
        lp.row([...zs.values()].map((v) => ({ v, c: 1 })), "<=", 1);
      }
    }
    for (const vars of use.values()) if (vars.length > 1) lp.row(vars.map((v) => ({ v, c: 1 })), "<=", 1);

    const um = new Map<number, string>();
    for (const [i, vars] of share) {
      const uv = lp.newVar("u");
      for (const v of vars) lp.row([{ v: uv, c: 1 }, { v, c: -1 }], ">=", 0);
      lp.row([{ v: uv, c: 1 }, ...vars.map((v) => ({ v, c: -1 }))], "<=", 0);
      um.set(i, uv);
    }
    u.set(p.id, um);

    for (const con of p.constraints ?? []) {
      if (waived.has(`${p.id}/${con.id}`)) continue;
      const bids = con.kind === "within" ? [con.bucket] : con.buckets;
      const pool = bids.flatMap((bid) => x.get(`${p.id}/${bid}`) ?? []);
      const hit = (t: { i: number }, m: (code: string, ctx: MatchCtx) => boolean) => m(courses[t.i].code, ctxOf(courses[t.i]));
      if (con.kind === "minFrom") {
        const s = lp.newVar("s", 0, null, false);
        lp.cost(s, W);
        lp.row([...pool.filter((t) => hit(t, con.match)).map((t) => ({ v: t.v, c: 1 })), { v: s, c: 1 }], ">=", con.courses);
      } else if (con.kind === "maxFrom") {
        const hits = pool.filter((t) => hit(t, con.match));
        if (con.courses !== undefined) lp.row(hits.map((t) => ({ v: t.v, c: 1 })), "<=", con.courses);
        if (con.credits !== undefined) lp.row(hits.map((t) => ({ v: t.v, c: courses[t.i].credits })), "<=", con.credits);
      } else if (con.kind === "distinct") {
        const byCourse = new Map<number, string[]>();
        for (const t of pool) byCourse.set(t.i, [...(byCourse.get(t.i) ?? []), t.v]);
        const ys: string[] = [];
        const wByCourse = new Map<number, string[]>();
        for (const g of con.groups) {
          const ws: string[] = [];
          for (const [i, xs] of byCourse) {
            if (!g.match(courses[i].code, ctxOf(courses[i]))) continue;
            const w = lp.newVar("w");
            lp.row([{ v: w, c: 1 }, ...xs.map((v) => ({ v, c: -1 }))], "<=", 0);
            ws.push(w);
            wByCourse.set(i, [...(wByCourse.get(i) ?? []), w]);
          }
          const y = lp.newVar("y");
          lp.row([{ v: y, c: 1 }, ...ws.map((w) => ({ v: w, c: -1 }))], "<=", 0);
          ys.push(y);
        }
        for (const ws of wByCourse.values()) if (ws.length > 1) lp.row(ws.map((v) => ({ v, c: 1 })), "<=", 1);
        const s = lp.newVar("s", 0, null, false);
        lp.cost(s, W);
        lp.row([...ys.map((v) => ({ v, c: 1 })), { v: s, c: 1 }], ">=", con.min);
      } else if (con.kind === "anySet") {
        const qs = con.options.map((opt) => {
          const q = lp.newVar("q");
          for (const slot of opt.slots) {
            const hits = pool.filter((t) => hit(t, slot.match)).map((t) => ({ v: t.v, c: 1 }));
            lp.row([...hits, { v: q, c: -(slot.count ?? 1) }], ">=", 0);
          }
          return q;
        });
        const s = lp.newVar("s", 0, null, false);
        lp.cost(s, W);
        lp.row([...qs.map((v) => ({ v, c: 1 })), { v: s, c: 1 }], ">=", 1);
      } else if (con.kind === "within") {
        const host = con.of.flatMap((bid) => x.get(`${p.id}/${bid}`) ?? []);
        for (const t of x.get(`${p.id}/${con.bucket}`) ?? [])
          lp.row([{ v: t.v, c: 1 }, ...host.filter((h) => h.i === t.i).map((h) => ({ v: h.v, c: -1 }))], "<=", 0);
      } else if (con.kind === "outsideMajors") {
        deferred.push(() => {
          const majorVars = (i: number) =>
            programs
              .filter((q) => q.kind === "major")
              .flatMap((q) => q.buckets.flatMap((b) => (x.get(key(q, b)) ?? []).filter((t) => t.i === i).map((t) => t.v)));
          const vs = pool.map((t) => {
            const v = lp.newVar("v");
            lp.row([{ v, c: 1 }, { v: t.v, c: -1 }], "<=", 0);
            for (const m of majorVars(t.i)) lp.row([{ v, c: 1 }, { v: m, c: 1 }], "<=", 1);
            return v;
          });
          const s = lp.newVar("s", 0, null, false);
          lp.cost(s, W);
          lp.row([...vs.map((v) => ({ v, c: 1 })), { v: s, c: 1 }], ">=", con.min);
        });
      }
    }
  }

  deferred.forEach((f) => f());

  // overlap var o >= u_a + u_b - 1, created lazily per (a, b, course)
  const overlapVars = new Map<string, string>();
  const overlap = (a: string, b: string, i: number): string | null => {
    const k = `${[a, b].sort().join("|")}|${i}`;
    if (overlapVars.has(k)) return overlapVars.get(k)!;
    const ua = u.get(a)?.get(i);
    const ub = u.get(b)?.get(i);
    if (!ua || !ub) return null;
    const o = lp.newVar("o", 0, 1, false);
    lp.cost(o, 0.5);
    lp.row([{ v: o, c: 1 }, { v: ua, c: -1 }, { v: ub, c: -1 }], ">=", -1);
    overlapVars.set(k, o);
    return o;
  };
  // shared_i >= o_(a,b,i) for each b: a course shared with several programs still counts once
  const sharedVar = (a: string, others: string[], i: number): string | null => {
    const os = others.map((b) => overlap(a, b, i)).filter((o): o is string => !!o);
    if (!os.length) return null;
    const sh = lp.newVar("h", 0, 1, false);
    for (const o of os) lp.row([{ v: sh, c: 1 }, { v: o, c: -1 }], ">=", 0);
    return sh;
  };

  const active = new Set(programs.map((p) => p.id));
  const activeSharing = sharing.filter((r) => active.has(r.a) && r.b.some((b) => active.has(b) && b !== r.a));
  for (const r of activeSharing) {
    if (waived.has(`sharing/${r.id}`)) continue;
    const others = r.b.filter((b) => active.has(b) && b !== r.a);
    const terms: Term[] = [];
    courses.forEach((c, i) => {
      const w = r.kind === "maxShared" && r.unit === "courses" ? 1 : c.credits;
      if (r.kind === "minUnique") {
        const ua = u.get(r.a)?.get(i);
        if (ua) terms.push({ v: ua, c: c.credits });
      }
      const sh = sharedVar(r.a, others, i);
      if (sh) terms.push({ v: sh, c: r.kind === "minUnique" ? -w : w });
    });
    if (r.kind === "maxShared") {
      lp.row(terms, "<=", r.max);
    } else {
      const s = lp.newVar("s", 0, null, false);
      lp.cost(s, W / 3);
      lp.row([...terms, { v: s, c: 1 }], ">=", r.credits);
    }
  }

  const totalCredits = allCourses.reduce((n, c) => n + c.credits, 0);
  let cols: Record<string, { Primal: number }> = {};
  try {
    const res = highs.solve(lp.toString(), { time_limit: 10 });
    if (res.Status !== "Optimal" && res.Status !== "Time limit reached") throw new Error(`solver status: ${res.Status}`);
    cols = res.Columns;
  } catch (e) {
    return { programs: [], sharing: [], usage, totalCredits, error: String(e) };
  }
  const on = (v: string) => (cols[v]?.Primal ?? 0) > 0.5;

  // ---- Read back the assignment and re-check every rule directly from it.
  // majors first so "outsideMajors" can see their assignments
  const programResultsSoFar: { program: Program; buckets: BucketResult[] }[] = [];
  const programResults: ProgramResult[] = [...programs]
    .sort((a, b) => Number(a.kind !== "major") - Number(b.kind !== "major"))
    .map((p) => {
    const buckets: BucketResult[] = p.buckets.map((b) => {
      const isWaived = waived.has(key(p, b));
      const assigned = (x.get(key(p, b)) ?? []).filter((t) => on(t.v)).map((t) => courses[t.i]);
      const exempt = exemptCount(b, genedExemptions);
      const courseCount = assigned.length + exempt;
      const creditCount = assigned.reduce((n, c) => n + c.credits, 0);
      for (const c of assigned) usage[c.id].push(`${shortName(p)}: ${b.label}`);
      const satisfied =
        isWaived || (courseCount >= (b.courses ?? 0) && (exempt > 0 || creditCount >= (b.credits ?? 0)));
      return { bucket: b, waived: isWaived, assigned: assigned.map((c) => c.id), courseCount, creditCount, satisfied };
    });
    programResultsSoFar.push({ program: p, buckets });
    const assignedIn = (bids: string[]) =>
      bids.flatMap((bid) => buckets.find((r) => r.bucket.id === bid)?.assigned ?? []).map((id) => courses.find((c) => c.id === id)!);
    const constraints: ConstraintResult[] = (p.constraints ?? []).map((con) => {
      const base = { id: con.id, label: con.label };
      if (waived.has(`${p.id}/${con.id}`)) return { ...base, satisfied: true, waived: true, detail: "waived" };
      const pool = assignedIn(con.kind === "within" ? [con.bucket] : con.buckets);
      const m = (c: SolverCourse, f: (code: string, ctx: MatchCtx) => boolean) => f(c.code, ctxOf(c));
      if (con.kind === "minFrom") {
        const n = pool.filter((c) => m(c, con.match)).length;
        return { ...base, satisfied: n >= con.courses, detail: `${n} / ${con.courses}` };
      }
      if (con.kind === "maxFrom") {
        const hits = pool.filter((c) => m(c, con.match));
        const cr = hits.reduce((n, c) => n + c.credits, 0);
        const ok = (con.courses === undefined || hits.length <= con.courses) && (con.credits === undefined || cr <= con.credits);
        const detail = con.credits !== undefined ? `${cr} / max ${con.credits} cr` : `${hits.length} / max ${con.courses}`;
        return { ...base, satisfied: ok, detail };
      }
      if (con.kind === "within") {
        const inner = assignedIn([con.bucket]);
        const host = new Set(assignedIn(con.of).map((c) => c.id));
        const bad = inner.filter((c) => !host.has(c.id));
        return { ...base, satisfied: !bad.length, detail: bad.length ? `not on a DS slot: ${bad.map((c) => c.code).join(", ")}` : "ok" };
      }
      if (con.kind === "outsideMajors") {
        const majorIds = new Set(
          programResultsSoFar.filter((r) => r.program.kind === "major").flatMap((r) => r.buckets.flatMap((b) => b.assigned)),
        );
        const n = pool.filter((c) => !majorIds.has(c.id)).length;
        return { ...base, satisfied: n >= con.min, detail: `${n} / ${con.min}` };
      }
      if (con.kind === "anySet") {
        const done = con.options.find((o) => setSatisfied(o, pool));
        return { ...base, satisfied: !!done, detail: done ? done.label : "none complete" };
      }
      const covered = maxDistinct(pool.map((c) => con.groups.filter((g) => m(c, g.match)).map((g) => g.id)));
      const names = [...covered].map((g) => con.groups.find((q) => q.id === g)?.label ?? g);
      return { ...base, satisfied: covered.size >= con.min, detail: `${covered.size} / ${con.min}${names.length ? ` (${names.join(", ")})` : ""}` };
    });
    const satisfied = buckets.every((b) => b.satisfied) && constraints.every((c) => c.satisfied);
    return { program: p, buckets, constraints, satisfied };
  })
    .sort((a, b) => programs.indexOf(a.program) - programs.indexOf(b.program));

  const usedBy = (pid: string, c: SolverCourse) =>
    programResults.find((r) => r.program.id === pid)?.buckets.some((b) => counts(b.bucket) && b.assigned.includes(c.id)) ?? false;
  const sharingResults: ConstraintResult[] = activeSharing.map((r) => {
    const base = { id: `sharing/${r.id}`, label: r.label };
    const others = r.b.filter((b) => active.has(b) && b !== r.a);
    const shared = courses.filter((c) => usedBy(r.a, c) && others.some((b) => usedBy(b, c)));
    const sharedTxt = shared.length ? ` — shared: ${shared.map((c) => c.code).join(", ")}` : "";
    if (waived.has(`sharing/${r.id}`)) return { ...base, satisfied: true, waived: true, detail: `waived${sharedTxt}` };
    if (r.kind === "maxShared") {
      const n = r.unit === "credits" ? shared.reduce((s, c) => s + c.credits, 0) : shared.length;
      return { ...base, satisfied: n <= r.max, detail: `${n} / max ${r.max} ${r.unit}${sharedTxt}` };
    }
    const unique = courses.filter((c) => usedBy(r.a, c) && !shared.includes(c)).reduce((s, c) => s + c.credits, 0);
    return { ...base, satisfied: unique >= r.credits, detail: `${unique} / ${r.credits} unique credits${sharedTxt}` };
  });

  for (const pr of programResults) {
    if (activeSharing.some((r, k) => r.a === pr.program.id && !sharingResults[k].satisfied)) pr.satisfied = false;
  }

  return { programs: programResults, sharing: sharingResults, usage, totalCredits };
}

function setSatisfied(opt: SetOption, pool: SolverCourse[]): boolean {
  // slots are (nearly always) disjoint; assign greedily, each course to one slot
  const used = new Set<string>();
  return opt.slots.every((slot) => {
    const hits = pool.filter((c) => !used.has(c.id) && slot.match(c.code, ctxOf(c))).slice(0, slot.count ?? 1);
    hits.forEach((c) => used.add(c.id));
    return hits.length >= (slot.count ?? 1);
  });
}

export function shortName(p: Program): string {
  return p.kind === "gened" ? "GenEd" : p.name.split(" (")[0].split(" — ")[0].replace(/ Major| Minor/, "");
}

// Max number of distinct groups coverable when each course picks one of its groups (bipartite matching).
function maxDistinct(options: string[][]): Set<string> {
  const matchOf = new Map<string, number>();
  const tryAssign = (i: number, seen: Set<string>): boolean => {
    for (const g of options[i]) {
      if (seen.has(g)) continue;
      seen.add(g);
      const j = matchOf.get(g);
      if (j === undefined || tryAssign(j, seen)) {
        matchOf.set(g, i);
        return true;
      }
    }
    return false;
  };
  options.forEach((_, i) => tryAssign(i, new Set()));
  return new Set(matchOf.keys());
}
