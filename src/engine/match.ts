import type { Matcher } from "../types";

const CODE_RE = /^([A-Z]{4})(\d{3})([A-Z]*)$/;

export function parseCode(code: string): { dept: string; num: number; suffix: string } | null {
  const m = CODE_RE.exec(code);
  return m ? { dept: m[1], num: Number(m[2]), suffix: m[3] } : null;
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]+/g, "");
}

// Exact course codes. A listed code also matches its honors version ("MATH140" matches "MATH140H").
// List a suffixed code (e.g. "CMSC498A") to match only that topic.
export function codes(...list: string[]): Matcher {
  const set = new Set(list.map(normalizeCode));
  return (code) => set.has(code) || (code.endsWith("H") && set.has(code.slice(0, -1)));
}

// Any course in `dept` numbered lo..hi inclusive, any suffix.
export function range(dept: string, lo: number, hi: number): Matcher {
  return (code) => {
    const p = parseCode(code);
    return !!p && p.dept === dept && p.num >= lo && p.num <= hi;
  };
}

// Any course numbered lo..hi in any department.
export function level(lo: number, hi: number): Matcher {
  return (code) => {
    const p = parseCode(code);
    return !!p && p.num >= lo && p.num <= hi;
  };
}

// A topics course that only counts when taken in one of `terms` ("Fall 2025", ...).
export function topic(code: string, terms: string[]): Matcher {
  const set = new Set(terms);
  return (c, ctx) => c === code && set.has(ctx.term);
}

export const atUMD: Matcher = (_c, ctx) => !ctx.transfer;
export const apCredit: Matcher = (_c, ctx) => ctx.ap;

export function anyOf(...ms: Matcher[]): Matcher {
  return (code, ctx) => ms.some((m) => m(code, ctx));
}

export function allOf(...ms: Matcher[]): Matcher {
  return (code, ctx) => ms.every((m) => m(code, ctx));
}

export function except(m: Matcher, ...excluded: Matcher[]): Matcher {
  return (code, ctx) => m(code, ctx) && !excluded.some((e) => e(code, ctx));
}

export const anything: Matcher = () => true;
