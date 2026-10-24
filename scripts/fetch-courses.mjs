// Builds public/courses.json: Jupiterp (primary) merged with umd.io (past semesters,
// structured "X or Y" GenEds). Run: node scripts/fetch-courses.mjs
//   UMDIO=0           skip umd.io (no offering history)
//   UMDIO_YEARS=4     how many years of schedules to read
//   FULL=1            re-fetch every semester instead of reusing older ones from the current courses.json
//   FORCE=1           write even if the catalog shrank by more than 5%
// umd.io is slow (minutes per semester), so by default only the newest few terms, and any
// semester missing from the current file, are downloaded; past schedules don't change.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

async function getJson(url, tries = 8) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
    }
  }
}

const YEARS = Number(process.env.UMDIO_YEARS ?? 4);
const FRESH = 3; // the newest terms still change (new sections, edited prereqs), so they're always re-fetched
const OUT = new URL("../public/courses.json", import.meta.url);

// Every term (YYYYMM) from the last YEARS years, through the newest published schedule.
async function semesters() {
  let all;
  try {
    all = (await getJson("https://api.umd.io/v1/courses/semesters", 3)).map(Number);
  } catch (e) {
    console.error("umd.io semester list failed; using the calendar", e.message);
    // schedules are published ahead: winter and spring in October, summer and fall in March
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const horizon = m >= 10 ? (y + 1) * 100 + 1 : m >= 3 ? y * 100 + 8 : y * 100 + 1;
    all = [];
    for (let yr = y - YEARS; yr <= y + 1; yr++) all.push(yr * 100 + 1, yr * 100 + 5, yr * 100 + 8, yr * 100 + 12);
    all = all.filter((t) => t <= horizon);
  }
  const terms = all.sort((a, b) => a - b);
  const latest = terms[terms.length - 1];
  return terms.filter((t) => t > latest - YEARS * 100).map(String);
}

async function fetchSemester(sem) {
  const pages = new Map();
  let failed = 0;
  let next = 1;
  let done = false;
  const worker = async () => {
    while (!done) {
      const page = next++;
      let d;
      try {
        d = await getJson(`https://api.umd.io/v1/courses?per_page=100&semester=${sem}&page=${page}`);
      } catch (e) {
        console.error("umd.io failed", sem, page, e.message);
        failed++;
        continue;
      }
      if (!Array.isArray(d) || d.length === 0) {
        done = true;
        return;
      }
      pages.set(page, d);
      if (d.length < 100) done = true;
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  if (failed) throw new Error(`umd.io ${sem}: ${failed} page(s) failed`);
  return [...pages.keys()].sort((a, b) => a - b).flatMap((p) => pages.get(p));
}

const courses = new Map(); // code -> {c,n,cr,mx,g,p,x,t}
const offered = new Map(); // code -> semesters it appeared in the schedule of classes, as YYMM numbers
const source = new Map(); // code -> the semester its details came from, so older data never overwrites newer

// umd.io first (oldest -> newest so newer semesters overwrite), then Jupiterp on top
const toEntry = (c) => {
  const [lo, hi] = String(c.credits).split("-").map(Number);
  const rel = c.relationships || {};
  return {
    c: c.course_id,
    n: c.name,
    cr: lo || 0,
    mx: hi && hi !== lo ? hi : null,
    g: (c.gen_ed || []).filter((a) => a.length),
    p: rel.prereqs || null,
    x: rel.credit_granted_for || null,
  };
};
const yymm = (sem) => Number(sem.slice(2));
const UMDIO_SEMESTERS = process.env.UMDIO === "0" ? [] : await semesters();
const fresh = new Set(UMDIO_SEMESTERS.slice(-FRESH));
console.log("umd.io semesters", UMDIO_SEMESTERS.join(" "));

// Reuse what the current file already knows about older semesters.
const previous = existsSync(OUT) && process.env.FULL !== "1" ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const known = new Set(previous.flatMap((c) => c.t ?? []));
const reuse = new Set(UMDIO_SEMESTERS.filter((s) => !fresh.has(s) && known.has(yymm(s))).map(yymm));
for (const { t, ...c } of previous) {
  courses.set(c.c, c);
  source.set(c.c, Math.max(0, ...(t ?? [])));
  const kept = (t ?? []).filter((x) => reuse.has(x));
  if (kept.length) offered.set(c.c, kept);
}

for (const sem of UMDIO_SEMESTERS) {
  if (reuse.has(yymm(sem))) continue;
  const list = await fetchSemester(sem);
  for (const c of list) {
    if (yymm(sem) >= (source.get(c.course_id) ?? 0)) {
      courses.set(c.course_id, toEntry(c));
      source.set(c.course_id, yymm(sem));
    }
    offered.set(c.course_id, [...(offered.get(c.course_id) ?? []), yymm(sem)]);
  }
  console.log("umd.io", sem, list.length);
}
console.log("umd.io reused", [...reuse].sort().join(" ") || "none");

// Jupiterp (current data) — keep umd.io's OR-structured geneds when present
let off = 0;
for (;;) {
  const d = await getJson(`https://api.jupiterp.com/v1/courses?limit=500&offset=${off}&sortBy=course_code.asc`);
  for (const c of d) {
    const prev = courses.get(c.course_code);
    const conds = c.conditions || [];
    const pre = conds.find((s) => s.startsWith("Prerequisite"));
    const cgf = conds.find((s) => s.startsWith("Credit only granted for"));
    courses.set(c.course_code, {
      c: c.course_code,
      n: c.name,
      cr: c.min_credits,
      mx: c.max_credits,
      g: prev?.g?.length ? prev.g : c.gen_eds?.length ? [c.gen_eds] : [],
      p: pre ? pre.replace(/^Prerequisite:\s*/, "").trim() : prev?.p ?? null,
      x: cgf ? cgf.replace(/^Credit only granted for:\s*/, "").replace(/\.\s*$/, "").trim() : prev?.x ?? null,
    });
  }
  off += 500;
  if (d.length < 500) break;
}

const out = [...courses.values()]
  .map((c) => (offered.has(c.c) ? { ...c, t: [...new Set(offered.get(c.c))].sort((a, b) => a - b) } : c))
  .sort((a, b) => a.c.localeCompare(b.c));
// A partial upstream outage shouldn't silently shrink the catalog.
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).length : 0;
if (out.length < before * 0.95 && process.env.FORCE !== "1") {
  console.error(`refusing to write: ${out.length} courses vs ${before} before (FORCE=1 to override)`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(out));
console.log("total", out.length);
