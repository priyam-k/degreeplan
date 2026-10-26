// Builds public/courses.json: Jupiterp (primary) merged with umd.io (past semesters,
// structured "X or Y" GenEds). Run: node scripts/fetch-courses.mjs
//   UMDIO=0           skip umd.io (no offering history)
//   UMDIO_YEARS=4     how many years of schedules to read
//   FULL=1            re-fetch every semester instead of reusing older ones from the current courses.json
//   FORCE=1           write even if the catalog shrank by more than 5%
//   UMDIO_CACHE=dir   keep each semester's raw umd.io response there and reuse it, so changes to the
//                     parsing below can be re-run without another hours-long download
// umd.io is slow (minutes per semester), so by default only the newest few terms, and any
// semester missing from the current file, are downloaded; past schedules don't change.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

const CACHE = process.env.UMDIO_CACHE;
async function fetchSemester(sem) {
  const file = CACHE && `${CACHE}/umdio-${sem}.json`;
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const list = await downloadSemester(sem);
  if (file) {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, JSON.stringify(list));
  }
  return list;
}

async function downloadSemester(sem) {
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
  await Promise.all(Array.from({ length: 5 }, worker));
  if (failed) throw new Error(`umd.io ${sem}: ${failed} page(s) failed`);
  return [...pages.keys()].sort((a, b) => a - b).flatMap((p) => pages.get(p));
}

const courses = new Map(); // code -> {c,n,cr,mx,g,p,r,x,t,v}
const offered = new Map(); // code -> semesters it appeared in the schedule of classes, as YYMM numbers
const source = new Map(); // code -> the semester its details came from, so older data never overwrites newer

// Where one part of a course's fine print ends and the next begins.
const SECTION_END =
  /\s*(?:\b(?:Restrictions?|Corequisites?|Recommended|Additional information|Formerly|Also offered as)\s*:|\bCredit (?:only )?granted for|\bCross-listed with|\bJointly offered with|\bRestricted to\b|\bRepeatable\b|\bStudents must\b|\bOpen to\b)/;
const tidy = (s) => s.replace(/\s+/g, " ").trim().replace(/[\s.;,]+$/, "") || null;

// Prerequisite text, without whatever follows it: umd.io sometimes runs the course description
// on ("...CMSC330 and CMSC351 Topics include blockchains..."), and descriptions add restrictions.
function cleanPrereq(s) {
  if (!s) return null;
  let t = s.split(SECTION_END)[0];
  const runOn = /\b[A-Z]{4}\d{3}[A-Z]?\)?\s+(?=(?!And\b|Or\b|Plus\b|Must\b|Minimum\b|Permission\b)[A-Z][a-z]+\s+[a-z])/.exec(t);
  if (runOn) t = t.slice(0, runOn.index + runOn[0].trimEnd().length);
  return tidy(t);
}

// Topics courses often state their prerequisites (and restrictions) only in the description:
// "PREREQUISITES: Minimum grade C- in CMSC330 and CMSC351...; and permission of ... Department."
// Take the marked text up to the end of its sentence or the next marker.
function fromDescription(desc, label) {
  if (!desc) return null;
  const m = new RegExp(`\\b${label}\\s*:\\s*`, "i").exec(desc);
  if (!m) return null;
  const rest = desc.slice(m.index + m[0].length);
  return tidy(rest.split(SECTION_END)[0].split(/\.\s+(?=[A-Z])/)[0]);
}
const restrictionIn = (desc) =>
  fromDescription(desc, "Restrictions?") ?? (/\bRestricted to\b[^.]*/.exec(desc ?? "")?.[0].trim() || null);

// Student-run courses often open the description with unlabelled prerequisites:
// "Minimum grade of C- in CMSC216, CMSC250, CMSC320; ...; and permission of ... department. This course..."
const UNLABELLED = /^\s*(?:(?:A\s+)?minimum grade|must have (?:completed|taken)|completion of|C- or better|grade of C-)/i;
const prereqInDescription = (desc) =>
  fromDescription(desc, "PRE-?REQUISITES?") ?? (desc && UNLABELLED.test(desc) ? tidy(desc.split(SECTION_END)[0].split(/\.\s+(?=[A-Z])/)[0]) : null);

// A schedule lists upcoming topics courses before their topic is set: no description, no
// prerequisites, the bare catalog title. Such an entry says nothing about the course.
const placeholder = (desc, prereq, restriction) => !desc?.trim() && !prereq && !restriction;

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
    p: cleanPrereq(rel.prereqs) ?? prereqInDescription(c.description),
    // a restriction can also ride along at the end of the prerequisite text
    r: tidy(rel.restrictions ?? "") ?? restrictionIn(rel.prereqs) ?? restrictionIn(c.description),
    x: rel.credit_granted_for || null,
  };
};

// Topics courses reuse a code for different topics term to term (CMSC389L is one course one fall
// and another the next). Each topic's terms, title and prerequisites are kept as variants.
const variants = new Map(); // code -> Map(title -> {t: YYMM[], n, p})
function addVariant(code, term, e) {
  if (!/;/.test(e.n)) return; // only titled topics ("Selected Topics in X; Robotics")
  const byTitle = variants.get(code) ?? new Map();
  const v = byTitle.get(e.n) ?? { t: [], n: e.n, p: e.p };
  if (!v.t.includes(term)) v.t.push(term);
  if (term >= Math.max(...v.t)) v.p = e.p ?? v.p;
  byTitle.set(e.n, v);
  variants.set(code, byTitle);
}
const yymm = (sem) => Number(sem.slice(2));
const UMDIO_SEMESTERS = process.env.UMDIO === "0" ? [] : await semesters();
const fresh = new Set(UMDIO_SEMESTERS.slice(-FRESH));
console.log("umd.io semesters", UMDIO_SEMESTERS.join(" "));

// Reuse what the current file already knows about older semesters.
const current = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const previous = process.env.FULL !== "1" ? current : [];
const known = new Set(previous.flatMap((c) => c.t ?? []));
const reuse = new Set(UMDIO_SEMESTERS.filter((s) => !fresh.has(s) && known.has(yymm(s))).map(yymm));
for (const { t, v, ...c } of previous) {
  courses.set(c.c, c);
  source.set(c.c, Math.max(0, ...(t ?? [])));
  const kept = (t ?? []).filter((x) => reuse.has(x));
  if (kept.length) offered.set(c.c, kept);
  for (const variant of v ?? []) for (const term of variant.t.filter((x) => reuse.has(x))) addVariant(c.c, term, variant);
}

for (const sem of UMDIO_SEMESTERS) {
  if (reuse.has(yymm(sem))) continue;
  let list;
  try {
    list = await fetchSemester(sem);
  } catch (e) {
    // umd.io has bad hours; rather than lose the whole run, keep what the current file knew for this term
    const old = current.filter((c) => c.t?.includes(yymm(sem)));
    if (!old.length) throw e;
    console.error(`${e.message}; keeping ${old.length} courses from the current catalog for ${sem}`);
    for (const { t: _t, v: _v, ...c } of old) {
      if (!courses.has(c.c)) courses.set(c.c, c);
      offered.set(c.c, [...(offered.get(c.c) ?? []), yymm(sem)]);
    }
    continue;
  }
  for (const c of list) {
    const e = toEntry(c);
    // a placeholder only marks the course as offered; it never replaces what an earlier term said
    const known = courses.has(c.course_id);
    if (yymm(sem) >= (source.get(c.course_id) ?? 0) && !(known && placeholder(c.description, e.p, e.r))) {
      courses.set(c.course_id, e);
      source.set(c.course_id, yymm(sem));
    }
    if (!placeholder(c.description, e.p, e.r)) addVariant(c.course_id, yymm(sem), e);
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
    const pre = conds.find((s) => /^Pre-?requisites?\s*:/i.test(s));
    const res = conds.find((s) => /^Restrictions?\s*:/i.test(s));
    const cgf = conds.find((s) => s.startsWith("Credit only granted for"));
    const p = cleanPrereq(pre?.replace(/^[^:]*:\s*/, "")) ?? prereqInDescription(c.description);
    const r = tidy(res?.replace(/^[^:]*:\s*/, "") ?? "") ?? restrictionIn(pre) ?? restrictionIn(c.description);
    // an untitled placeholder keeps the topic, prerequisites and restriction an actual offering had
    const keep = prev && placeholder(c.description, p, r);
    courses.set(c.course_code, {
      c: c.course_code,
      n: keep && prev.n.startsWith(c.name) ? prev.n : c.name,
      cr: c.min_credits,
      mx: c.max_credits,
      g: prev?.g?.length ? prev.g : c.gen_eds?.length ? [c.gen_eds] : [],
      // Jupiterp sometimes lists no prerequisite or restriction that umd.io's schedule has
      p: (keep ? null : p) ?? prev?.p ?? null,
      r: (keep ? null : r) ?? prev?.r ?? null,
      x: cgf ? cgf.replace(/^Credit only granted for:\s*/, "").replace(/\.\s*$/, "").trim() : prev?.x ?? null,
    });
  }
  off += 500;
  if (d.length < 500) break;
}

const variantsOf = (code) => {
  const vs = [...(variants.get(code)?.values() ?? [])].map((v) => ({ ...v, t: v.t.sort((a, b) => a - b) }));
  return vs.length > 1 ? vs.sort((a, b) => a.t[0] - b.t[0]) : null;
};
const out = [...courses.values()]
  .map((c) => {
    const e = { ...c };
    if (!e.r) delete e.r; // most courses have none; keep the file small
    if (offered.has(c.c)) e.t = [...new Set(offered.get(c.c))].sort((a, b) => a - b);
    const v = variantsOf(c.c);
    if (v) e.v = v;
    return e;
  })
  .sort((a, b) => a.c.localeCompare(b.c));
// A partial upstream outage shouldn't silently shrink the catalog.
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).length : 0;
if (out.length < before * 0.95 && process.env.FORCE !== "1") {
  console.error(`refusing to write: ${out.length} courses vs ${before} before (FORCE=1 to override)`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(out));
console.log("total", out.length);
