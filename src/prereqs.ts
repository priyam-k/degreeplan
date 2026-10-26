// Parse UMD catalog prerequisite text (the `p` field in courses.json) into a
// requirement tree, and query it.
//
// Heuristics (see prereqs.test.ts for real examples):
// - Text after "Restriction:", "Credit only granted for", "Corequisite:",
//   "Recommended:", "Jointly offered with", etc. is ignored.
// - Sentences and ";"-separated clauses are combined with their leading
//   conjunction ("; or", ". And"); unmarked clauses are AND. OR binds tighter
//   than AND: "A; or B; and C" = (A or B) and C.
// - Within a clause, items are separated by ",", "and", "or". A comma takes the
//   meaning of the next explicit conjunction to its right ("A, B, or C"); a
//   comma-only list is OR inside parentheses / after "1 course from", else AND.
//   OR binds tighter than AND ("A and B or C" = A and (B or C)).
// - Alternatives and conjuncts that mention no course codes (permission,
//   program membership, placement, "or equivalent", ...) are dropped, as are
//   clauses about math eligibility or "students who have taken comparable
//   content", and "(not including ...)" parentheticals.

export type Req =
  | { kind: "course"; code: string }
  | { kind: "all"; of: Req[] }
  | { kind: "any"; of: Req[]; k?: number };

type Have = (code: string) => boolean;
type Conj = "and" | "or";

// ---------------------------------------------------------------------------
// Constructors / simplification

const course = (code: string): Req => ({ kind: "course", code });

function key(r: Req): string {
  return JSON.stringify(r);
}

function dedupe(rs: Req[]): Req[] {
  const seen = new Set<string>();
  return rs.filter((r) => {
    const k = key(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function simplify(r: Req | null): Req | null {
  if (!r) return null;
  if (r.kind === "course") return r;
  const kids = r.of.map(simplify).filter((x): x is Req => x !== null);
  if (r.kind === "all") {
    let of = dedupe(kids.flatMap((c) => (c.kind === "all" ? c.of : [c])));
    // Absorption: A and (A or B) -> A
    const direct = new Set(of.filter((c) => c.kind === "course").map(key));
    of = of.filter(
      (c) => !(c.kind === "any" && (c.k ?? 1) === 1 && c.of.some((x) => direct.has(key(x)))),
    );
    if (of.length === 0) return null;
    if (of.length === 1) return of[0];
    return { kind: "all", of };
  }
  let k = r.k ?? 1;
  let of = k === 1 ? kids.flatMap((c) => (c.kind === "any" && (c.k ?? 1) === 1 ? c.of : [c])) : kids;
  of = dedupe(of);
  if (k === 1) {
    // Absorption: A or (A and B) -> A
    const direct = new Set(of.filter((c) => c.kind === "course").map(key));
    of = of.filter((c) => !(c.kind === "all" && c.of.some((x) => direct.has(key(x)))));
  }
  if (of.length === 0) return null;
  if (k >= of.length) {
    if (of.length === 1) return of[0];
    if (k > 1) return simplify({ kind: "all", of });
    k = 1;
  }
  if (of.length === 1) return of[0];
  return k > 1 ? { kind: "any", of, k } : { kind: "any", of };
}

function allOf(rs: (Req | null)[]): Req | null {
  return simplify({ kind: "all", of: rs.filter((x): x is Req => x !== null) });
}

// Alternatives with no course content are ignored (null children dropped).
function anyOf(rs: (Req | null)[], k = 1): Req | null {
  return simplify({ kind: "any", of: rs.filter((x): x is Req => x !== null), k });
}

function withK(r: Req | null, k: number): Req | null {
  if (!r || k === 1) return r;
  if (r.kind === "course") return r;
  return simplify({ kind: "any", of: r.of, k });
}

// ---------------------------------------------------------------------------
// Text cleanup and splitting

const TAIL =
  /\b(?:Restrictions?\s*:|Recommended\s*:|Co-?requisites?\s*:|Additional information\s*:|Formerly\s*:|Also offered as\b|Cross-listed with\b|Jointly offered with\b|Credit only granted for\b|Shared with\b)/i;
const TAIL_CASED = /\bThis course\b/;

function clean(text: string): string {
  let t = text.replace(/\s+/g, " ");
  for (const re of [TAIL, TAIL_CASED]) {
    const m = re.exec(t);
    if (m) t = t.slice(0, m.index);
  }
  return t
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    // "CMSC131/CMSC133", "CHEM271/272" -> or
    .replace(/(?<=[A-Z]{4}\s?\d{3}[A-Z]?)\s*\/\s*(?=(?:[A-Z]{4}\s?)?\d{3})/g, " or ")
    // "orPLSC112" -> "or PLSC112"
    .replace(/\b(and|or)(?=[A-Z]{4}\s?\d{3})/g, "$1 ")
    .replace(/\((?:not|excluding|except)\b[^)]*\)/gi, " ")
    .replace(/\band\/or\b/gi, "or")
    .replace(/(?<![A-Za-z0-9])"?[A-F][+-]?"?\s+or\s+(?:better|higher|above)\b/g, " ")
    .replace(
      /\bcompleted\s+(?:with\s+a\s+minimum\s+grade\s+of\s+[A-F][+-]?\s+)?or\s+be\s+concurrently\s+enrolled\s+in\b/gi,
      "concurrently enrolled in",
    );
}

/** Split at depth-0 ";" (kind "semi") or sentence-ending "." (kind "dot"). */
function splitTop(s: string, kind: "semi" | "dot"): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const hit = kind === "semi" ? ch === ";" : ch === "." && (i + 1 === s.length || /\s/.test(s[i + 1]));
      if (hit) {
        out.push(s.slice(start, i));
        start = i + 1;
      }
    }
  }
  out.push(s.slice(start));
  return out;
}

const LEAD_CONJ = /^\s*(and|or)\b[\s,:]*/i;
const DROP_CLAUSE = /eligib|students who|comparable content/i;

function splitConj(part: string): { conj: Conj | null; body: string } {
  const m = LEAD_CONJ.exec(part);
  if (!m) return { conj: null, body: part };
  return { conj: m[1].toLowerCase() as Conj, body: part.slice(m[0].length) };
}

/** Combine conjunction-led parts: OR binds tighter than AND. */
function combineParts(parts: { conj: Conj | null; req: Req | null }[]): Req | null {
  if (parts.length === 0) return null;
  const conjs = parts.map((p, i) => (i === 0 ? null : p.conj));
  // "A; B; C; or D" (no explicit "and") reads as a list of alternatives.
  const allOr =
    parts.length >= 3 && !conjs.includes("and") && conjs[conjs.length - 1] === "or";
  const groups: (Req | null)[][] = [[]];
  parts.forEach((p, i) => {
    const c = i === 0 ? null : (conjs[i] ?? (allOr ? "or" : "and"));
    if (c === "and") groups.push([]);
    groups[groups.length - 1].push(p.req);
  });
  return allOf(groups.map((g) => anyOf(g)));
}

function nonEmpty(s: string): boolean {
  return /[A-Za-z0-9]/.test(s);
}

/** Parse a full requirement text: sentences, then ";" clauses, then items. */
function parseText(s: string, defaultComma: Conj): Req | null {
  const sentences = splitTop(s, "dot")
    .filter(nonEmpty)
    .map((sent) => {
      const { conj, body } = splitConj(sent);
      const clauses = splitTop(body, "semi")
        .filter(nonEmpty)
        .map((cl) => {
          const { conj: c, body: b } = splitConj(cl);
          const dropped = DROP_CLAUSE.test(b.replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, " "));
          return { conj: c, req: dropped ? null : parseClause(b, defaultComma) };
        });
      return { conj, req: combineParts(clauses) };
    });
  return combineParts(sentences);
}

// ---------------------------------------------------------------------------
// Clause (item list) parser

const NUMWORD: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
const K_PATTERNS = [
  /(one|two|three|four|[1-9])\s+courses?\b[^;()]{0,60}?\bfrom\b/iy,
  /(one|two|three|four|[1-9])\s+of\s+the\s+following\b[^:;()]{0,50}:/iy,
  /(one|two|three|four|[1-9])\s+of(?=\s*\()/iy,
];
const CODE_STICKY = /([A-Z]{4})\s?(\d{3}[A-Z]?)(?![A-Za-z0-9])/y;
const NUM_STICKY = /(\d{3}[A-Z]?)(?![A-Za-z0-9'-])/y;
const CONJ_STICKY = /(and|or)\b/iy;
const WORD_STICKY = /[^\s(),]+/y;
const HAS_CODE = /[A-Z]{4}\s?\d{3}/;

function sticky(re: RegExp, s: string, pos: number): RegExpExecArray | null {
  re.lastIndex = pos;
  return re.exec(s);
}

function matchParen(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")" && --depth === 0) return i;
  }
  return s.length;
}

type Slot = { items: (Req | null)[]; junk: boolean };

function parseClause(s: string, defaultComma: Conj): Req | null {
  const slots: Slot[] = [];
  const seps: (Conj | ",")[] = [];
  let cur: Slot = { items: [], junk: false };
  const isEmpty = (sl: Slot) => sl.items.length === 0 && !sl.junk;

  const pushSep = (sep: Conj | ",") => {
    if (isEmpty(cur)) {
      if (slots.length === 0) return; // leading conjunction
      const prev = seps.length ? seps[seps.length - 1] : null;
      // ", or" / ", and": the explicit conjunction wins.
      if (seps.length === slots.length && prev !== null) {
        if (prev === "," && sep !== ",") seps[seps.length - 1] = sep;
        return;
      }
    }
    if (!isEmpty(cur)) slots.push(cur);
    cur = { items: [], junk: false };
    seps.push(sep);
  };

  let pos = 0;
  while (pos < s.length) {
    const ch = s[pos];
    if (/\s/.test(ch) || ch === ")") {
      pos++;
      continue;
    }
    if (ch === "(") {
      const end = matchParen(s, pos);
      const sub = parseText(s.slice(pos + 1, end), "or");
      if (sub) cur.items.push(sub);
      else cur.junk = true;
      pos = end + 1;
      continue;
    }
    if (ch === ",") {
      pushSep(",");
      pos++;
      continue;
    }
    let m = sticky(CONJ_STICKY, s, pos);
    if (m) {
      pushSep(m[1].toLowerCase() as Conj);
      pos += m[0].length;
      continue;
    }
    let km: RegExpExecArray | null = null;
    for (const re of K_PATTERNS) {
      km = sticky(re, s, pos);
      if (km && !HAS_CODE.test(km[0])) break;
      km = null;
    }
    if (km) {
      const w = km[1].toLowerCase();
      const k = NUMWORD[w] ?? Number(w);
      let p = pos + km[0].length;
      while (p < s.length && /\s/.test(s[p])) p++;
      if (s[p] === "(") {
        const end = matchParen(s, p);
        const sub = withK(parseText(s.slice(p + 1, end), "or"), k);
        if (sub) cur.items.push(sub);
        else cur.junk = true;
        pos = end + 1;
      } else {
        // The rest of the clause is the list to choose from.
        const sub = withK(parseClause(s.slice(p), "or"), k);
        if (sub) cur.items.push(sub);
        else cur.junk = true;
        pos = s.length;
      }
      continue;
    }
    m = sticky(CODE_STICKY, s, pos);
    if (m) {
      cur.items.push(course(m[1] + m[2]));
      pos += m[0].length;
      continue;
    }
    m = sticky(NUM_STICKY, s, pos);
    if (m && isEmpty(cur) && slots.length > 0 && seps.length === slots.length) {
      // "PHYS131 and 132" -> PHYS132
      const prev = slots[slots.length - 1].items;
      const last = prev[prev.length - 1];
      if (last && last.kind === "course") {
        cur.items.push(course(last.code.slice(0, 4) + m[1]));
        pos += m[0].length;
        continue;
      }
    }
    m = sticky(WORD_STICKY, s, pos);
    if (m) {
      cur.junk = true;
      pos += m[0].length;
      continue;
    }
    pos++;
  }
  if (!isEmpty(cur)) slots.push(cur);
  else if (seps.length > slots.length - 1) seps.length = Math.max(0, slots.length - 1);

  const items = slots.map((sl) => (sl.items.length ? allOf(sl.items) : null));
  if (items.length === 0) return null;

  // Resolve commas to the next explicit conjunction (else the previous one,
  // else the context default).
  const resolved: Conj[] = seps.map((sep, i) => {
    if (sep !== ",") return sep;
    for (let j = i + 1; j < seps.length; j++) if (seps[j] !== ",") return seps[j] as Conj;
    for (let j = i - 1; j >= 0; j--) if (seps[j] !== ",") return seps[j] as Conj;
    return defaultComma;
  });
  const groups: (Req | null)[][] = [[items[0]]];
  for (let i = 1; i < items.length; i++) {
    if (resolved[i - 1] === "and") groups.push([]);
    groups[groups.length - 1].push(items[i]);
  }
  return allOf(groups.map((g) => anyOf(g)));
}

// ---------------------------------------------------------------------------
// Public API

/** Parse prerequisite text into a requirement tree; null = no course prerequisites. */
export function parsePrereq(text: string | null | undefined): Req | null {
  if (!text || !text.trim()) return null;
  return parseText(clean(text), "and");
}

export function isSatisfied(req: Req | null, have: Have): boolean {
  if (!req) return true;
  switch (req.kind) {
    case "course":
      return have(req.code);
    case "all":
      return req.of.every((r) => isSatisfied(r, have));
    case "any": {
      const k = req.k ?? 1;
      let n = 0;
      for (const r of req.of) if (isSatisfied(r, have) && ++n >= k) return true;
      return false;
    }
  }
}

/** The unsatisfied remainder of `req`, simplified; null if satisfied. */
export function missingReq(req: Req | null, have: Have): Req | null {
  if (!req) return null;
  switch (req.kind) {
    case "course":
      return have(req.code) ? null : req;
    case "all":
      return allOf(req.of.map((r) => missingReq(r, have)));
    case "any": {
      const k = req.k ?? 1;
      const unmet = req.of.map((r) => missingReq(r, have)).filter((x): x is Req => x !== null);
      const met = req.of.length - unmet.length;
      if (met >= k) return null;
      return anyOf(unmet, k - met);
    }
  }
}

/** All distinct course codes mentioned, in first-appearance order. */
export function reqCodes(req: Req | null): string[] {
  const out = new Set<string>();
  const walk = (r: Req) => {
    if (r.kind === "course") out.add(r.code);
    else r.of.forEach(walk);
  };
  if (req) walk(req);
  return [...out];
}

/** Human-readable form, e.g. "(MATH240 or MATH461) and MATH141". "" for null. */
export function formatReq(req: Req | null): string {
  if (!req) return "";
  const inner = (r: Req): string =>
    r.kind === "course" || (r.kind === "any" && (r.k ?? 1) > 1) ? formatReq(r) : `(${formatReq(r)})`;
  switch (req.kind) {
    case "course":
      return req.code;
    case "all":
      return req.of.map(inner).join(" and ");
    case "any": {
      const k = req.k ?? 1;
      if (k > 1) return `${k} of (${req.of.map(inner).join(", ")})`;
      return req.of.map(inner).join(" or ");
    }
  }
}

/**
 * Codes the text allows to be taken concurrently ("must have completed or be
 * concurrently enrolled in X"). The tree from parsePrereq still lists them as
 * ordinary requirements; callers checking a term can treat these as satisfied
 * by same-term enrollment.
 */
export function concurrentCodes(text: string | null | undefined): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const sent of splitTop(clean(text), "dot"))
    for (const cl of splitTop(sent, "semi")) {
      const i = cl.search(/concurrently enrolled in/i);
      if (i < 0) continue;
      for (const m of cl.slice(i).matchAll(/([A-Z]{4})\s?(\d{3}[A-Z]?)(?![A-Za-z0-9])/g)) out.add(m[1] + m[2]);
    }
  return [...out];
}

export interface PermissionNotes {
  required: string[]; // e.g. "Permission of CMNS-Computer Science department"
  alternatives: string[]; // ways around the course prerequisites, e.g. "permission of instructor"
}

const PERMISSION = /\b(?:(?:departmental|department|instructor)\s+(?:permission|approval|consent)|(?:permission|consent|approval)\s+(?:of|from)\s+(?:the\s+)?[^;,.()]+?(?=\s*(?:[;,.()]|\b(?:and|or)\s+(?:[A-Z]{4}\s?\d{3}|permission|consent|must|minimum|completion|a|an|one|two)\b|$)))/i;
const COMPARABLE = /comparable content may contact the department|contact the department/i;

const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * What the prerequisite and restriction text say about permission, which parsePrereq leaves out
 * because it can't be checked: whether some permission is required on top of the courses, or
 * offered as an alternative to them ("...; or permission of instructor"), and whether students
 * with comparable coursework may ask the department.
 */
export function permissionNotes(prereq: string | null | undefined, restriction?: string | null): PermissionNotes {
  const out: PermissionNotes = { required: [], alternatives: [] };
  const add = (list: string[], s: string) => {
    const t = sentenceCase(s.replace(/\s+/g, " ").trim());
    if (!list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
  };
  if (prereq) {
    const parts = splitTop(prereq.replace(/\s+/g, " "), "dot").flatMap((sent) => splitTop(sent, "semi"));
    for (const part of parts) {
      const { conj, body } = splitConj(part);
      if (COMPARABLE.test(body)) add(out.alternatives, "comparable coursework elsewhere (ask the department)");
      const m = PERMISSION.exec(body);
      if (!m) continue;
      // "A or permission of X" inside a clause, or a clause led by "or", is an alternative
      const before = body.slice(0, m.index);
      const alt = conj === "or" || /\bor\s*$/i.test(before);
      add(alt ? out.alternatives : out.required, m[0]);
    }
  }
  if (restriction) {
    const m = PERMISSION.exec(restriction);
    if (m) add(out.required, m[0]);
  }
  out.alternatives = out.alternatives.filter((a) => !out.required.some((r) => r.toLowerCase() === a.toLowerCase()));
  return out;
}
