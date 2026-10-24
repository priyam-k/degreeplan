// Builds public/courses.json: Jupiterp (primary) merged with umd.io (past semesters,
// structured "X or Y" GenEds). Run: node scripts/fetch-courses.mjs
import { writeFileSync } from "node:fs";

const UMDIO_SEMESTERS = process.env.UMDIO === "0" ? [] : ["202308", "202401", "202408", "202501", "202505", "202508", "202601", "202605", "202608", "202701"];

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

const courses = new Map(); // code -> {c,n,cr,mx,g,p,x,t}
const offered = new Map(); // code -> semesters it appeared in the schedule of classes, as YYMM numbers

// umd.io first (oldest -> newest so newer semesters overwrite)
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
for (const sem of UMDIO_SEMESTERS) {
  const pages = new Map();
  let next = 1;
  let done = false;
  const worker = async () => {
    while (!done) {
      const page = next++;
      let d;
      try {
        d = await getJson(`https://api.umd.io/v1/courses?per_page=100&semester=${sem}&page=${page}`);
      } catch (e) {
        console.error("umd.io failed (skipping page)", sem, page, e.message);
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
  let n = 0;
  for (const page of [...pages.keys()].sort((a, b) => a - b))
    for (const c of pages.get(page)) {
      courses.set(c.course_id, toEntry(c));
      offered.set(c.course_id, [...(offered.get(c.course_id) ?? []), Number(sem.slice(2))]);
      n++;
    }
  console.log("umd.io", sem, n);
}

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
  .map((c) => (offered.has(c.c) ? { ...c, t: [...new Set(offered.get(c.c))] } : c))
  .sort((a, b) => a.c.localeCompare(b.c));
writeFileSync(new URL("../public/courses.json", import.meta.url), JSON.stringify(out));
console.log("total", out.length);
