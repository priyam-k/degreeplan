// Turns a program file (YAML in this folder, parsed to plain data at build time by the plugin in
// vite.config.ts) into Program objects for the solver. README.md in this folder describes the format.
// Every field is checked so a typo fails the build and the tests with its location, rather than
// quietly matching nothing.
import type { Bucket, Group, Matcher, Program, ProgramConstraint, SetOption, SetSlot } from "../types";
import { allOf, anyOf, anything, apCredit, atUMD, codes, except, level, range, topic } from "../engine/match";

type Obj = Record<string, unknown>;

const CODE = /^[A-Z]{4}\d{3}[A-Z]*$/;
const RANGE = /^([A-Z]{4}|\*)(\d{3})-(\d{3})$/;
const ID = /^[A-Za-z0-9_-]+$/;
const DEPT_GLOB = /^[A-Z*]{1,4}$/;
const KINDS = ["major", "minor", "gened", "university"] as const;
const PROGRAM_KEYS = ["id", "name", "short", "kind", "family", "college", "aliases", "buckets", "patch", "constraints", "notes", "sources"];
const BUCKET_KEYS = ["id", "label", "match", "courses", "credits", "choose", "maxCourses", "useGroup", "gened", "noShare", "discipline", "note"];
const CONSTRAINT_KEYS: Record<string, string[]> = {
  minFrom: ["buckets", "match", "courses", "credits"],
  maxFrom: ["buckets", "match", "courses", "credits"],
  maxEach: ["buckets", "groups", "omit", "courses", "credits"],
  distinct: ["buckets", "groups", "omit", "min"],
  anySet: ["buckets", "options"],
  within: ["bucket", "of"],
  outsideMajors: ["buckets", "min"],
};

export class ProgramFileError extends Error {}

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const show = (v: unknown) => (v === undefined ? "nothing" : JSON.stringify(v).slice(0, 60));

export function loadProgramFile(file: string, data: unknown): Program[] {
  const stem = file.replace(/^.*\//, "").replace(/\.\w+$/, "");

  function fail(path: string, msg: string): never {
    path = path.replace(/^\./, ""); // fields at the top of a single-program file
    throw new ProgramFileError(`${file}${path ? ` at ${path}` : ""}: ${msg}`);
  }
  function obj(v: unknown, path: string, keys: string[]): Obj {
    if (!isObj(v)) fail(path, `expected a mapping, got ${show(v)}`);
    for (const k of Object.keys(v)) if (!keys.includes(k)) fail(`${path}.${k}`, `unknown field (expected ${keys.join(", ")})`);
    return v;
  }
  function dict(v: unknown, path: string): Obj {
    if (!isObj(v)) fail(path, `expected a mapping, got ${show(v)}`);
    return v;
  }
  function list(v: unknown, path: string): unknown[] {
    if (!Array.isArray(v)) fail(path, `expected a list, got ${show(v)}`);
    return v;
  }
  function str(v: unknown, path: string): string {
    if (typeof v !== "string" || !v) fail(path, `expected text, got ${show(v)}`);
    return v;
  }
  const strs = (v: unknown, path: string) => list(v, path).map((x, i) => str(x, `${path}[${i}]`));
  function ident(v: unknown, path: string): string {
    const s = str(v, path);
    if (!ID.test(s)) fail(path, `"${s}" may only use letters, digits, - and _`);
    return s;
  }
  function count(v: unknown, path: string, whole = true): number {
    if (typeof v !== "number" || v < 0 || (whole && !Number.isInteger(v))) fail(path, `expected a ${whole ? "whole " : ""}number ≥ 0, got ${show(v)}`);
    return v;
  }
  function flag(v: unknown, path: string): boolean {
    if (typeof v !== "boolean") fail(path, `expected true or false, got ${show(v)}`);
    return v;
  }
  // Copy only the optional fields that are present, so compiled objects carry no undefined keys.
  const opt = <T,>(o: Obj, key: string, f: (v: unknown, path: string) => T, path: string) =>
    o[key] === undefined ? {} : { [key]: f(o[key], `${path}.${key}`) };

  // --- $references --------------------------------------------------------------------------------
  const doc = obj(data, "", [...PROGRAM_KEYS, "defs", "programs"]);
  const defs = doc.defs === undefined ? {} : dict(doc.defs, "defs");
  for (const k of Object.keys(defs)) if (!/^[A-Za-z_]\w*$/.test(k)) fail(`defs.${k}`, "names may only use letters, digits and _");

  // "$NAME" anywhere is replaced by defs.NAME; "...$NAME" inside a list splices that list in.
  function resolve(v: unknown, path: string, seen: string[] = []): unknown {
    if (typeof v === "string" && v.startsWith("$")) {
      const name = v.slice(1);
      if (!Object.hasOwn(defs, name)) fail(path, `unknown reference ${v}`);
      if (seen.includes(name)) fail(path, `circular reference ${[...seen, name].map((n) => `$${n}`).join(" → ")}`);
      return resolve(defs[name], path, [...seen, name]);
    }
    if (Array.isArray(v))
      return v.flatMap((x, i) => {
        const p = `${path}[${i}]`;
        if (typeof x === "string" && x.startsWith("...$")) {
          const spread = resolve(x.slice(3), p, seen);
          if (!Array.isArray(spread)) fail(p, `${x.slice(3)} is not a list, so it can't be spread with ...`);
          return spread;
        }
        return [resolve(x, p, seen)];
      });
    if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, `${path}.${k}`, seen)]));
    return v;
  }

  // --- matchers ------------------------------------------------------------------------------------
  function matcher(v: unknown, path: string): Matcher {
    if (typeof v === "string") {
      if (v === "*") return anything;
      if (v === "@umd") return atUMD;
      if (v === "@ap") return apCredit;
      if (CODE.test(v)) return codes(v);
      const r = RANGE.exec(v);
      if (r) {
        const [lo, hi] = [Number(r[2]), Number(r[3])];
        if (lo > hi) fail(path, `range ${v} runs backwards`);
        return r[1] === "*" ? level(lo, hi) : range(r[1], lo, hi);
      }
      fail(path, `"${v}" is not a course code (CMSC131), a range (CMSC300-499 or *300-499), "*", "@umd" or "@ap"`);
    }
    if (Array.isArray(v)) {
      if (!v.length) fail(path, "an empty list matches nothing");
      const isCode = (x: unknown): x is string => typeof x === "string" && CODE.test(x);
      const plain = v.filter(isCode);
      const rest = v.flatMap((x, i) => (isCode(x) ? [] : [matcher(x, `${path}[${i}]`)]));
      const ms = [...(plain.length ? [codes(...plain)] : []), ...rest];
      return ms.length === 1 ? ms[0] : anyOf(...ms);
    }
    const o = obj(v, path, ["any", "all", "topic", "terms", "slotOf", "except"]);
    const base = ["any", "all", "topic", "slotOf"].filter((k) => k in o);
    if (base.length !== 1) fail(path, "use exactly one of any, all, topic or slotOf");
    if ("terms" in o && !("topic" in o)) fail(`${path}.terms`, "terms only goes with topic");
    let m: Matcher;
    if (base[0] === "any") m = anyOf(...list(o.any, `${path}.any`).map((x, i) => matcher(x, `${path}.any[${i}]`)));
    else if (base[0] === "all") m = allOf(...list(o.all, `${path}.all`).map((x, i) => matcher(x, `${path}.all[${i}]`)));
    else if (base[0] === "topic") {
      const code = str(o.topic, `${path}.topic`);
      if (!CODE.test(code)) fail(`${path}.topic`, `"${code}" is not a course code`);
      m = topic(code, strs(o.terms, `${path}.terms`));
    } else m = anyOf(...options(o.slotOf, `${path}.slotOf`).flatMap((op) => op.slots.map((s) => s.match)));
    return "except" in o ? except(m, matcher(o.except, `${path}.except`)) : m;
  }

  function slotLabel(v: unknown, path: string): string {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.join("/");
    fail(path, "this slot needs a label");
  }
  function slot(v: unknown, path: string): SetSlot {
    if (!isObj(v)) return { label: slotLabel(v, path), match: matcher(v, path) };
    const o = obj(v, path, ["label", "match", "count"]);
    return {
      label: o.label === undefined ? slotLabel(o.match, `${path}.match`) : str(o.label, `${path}.label`),
      match: matcher(o.match, `${path}.match`),
      ...opt(o, "count", count, path),
    };
  }
  function options(v: unknown, path: string): SetOption[] {
    return list(v, path).map((x, i) => {
      const p = `${path}[${i}]`;
      const o = obj(x, p, ["label", "slots"]);
      const slots = list(o.slots, `${p}.slots`).map((s, j) => slot(s, `${p}.slots[${j}]`));
      return { label: o.label === undefined ? slots.map((s) => s.label).join(" + ") : str(o.label, `${p}.label`), slots };
    });
  }

  // --- buckets -------------------------------------------------------------------------------------
  // dept -> discipline key, or null when the department can't be used at all.
  function discipline(v: unknown, path: string): (code: string) => string | null {
    const o = obj(v, path, ["exclude", "merge"]);
    const exclude = strs(o.exclude ?? [], `${path}.exclude`).map((g, i) => {
      if (!DEPT_GLOB.test(g)) fail(`${path}.exclude[${i}]`, `"${g}" is not a department like CMSC or CP*`);
      return new RegExp(`^${g.replace(/\*/g, "[A-Z]*")}$`);
    });
    const merged = new Map<string, string>();
    if (o.merge !== undefined) {
      for (const [key, depts] of Object.entries(dict(o.merge, `${path}.merge`))) for (const d of strs(depts, `${path}.merge.${key}`)) merged.set(d, key);
    }
    return (code) => {
      const dept = code.slice(0, 4);
      return exclude.some((r) => r.test(dept)) ? null : (merged.get(dept) ?? dept);
    };
  }

  // A bare course code is shorthand for a single required course.
  const bucketObj = (v: unknown, path: string): Obj =>
    typeof v === "string" && CODE.test(v) ? { id: v.toLowerCase(), label: v, match: v, courses: 1 } : obj(v, path, BUCKET_KEYS);

  function bucket(o: Obj, path: string): Bucket {
    const gened = o.gened === undefined ? undefined : strs(o.gened, `${path}.gened`);
    if (o.match === undefined && !gened) fail(path, "missing match");
    if (o.choose !== undefined && (o.courses !== undefined || o.maxCourses !== undefined))
      fail(`${path}.choose`, "choose already sets courses and maxCourses");
    const b: Bucket = {
      id: ident(o.id, `${path}.id`),
      label: str(o.label, `${path}.label`),
      match: o.match === undefined ? anything : matcher(o.match, `${path}.match`),
      ...opt(o, "courses", count, path),
      ...opt(o, "credits", (v, p) => count(v, p, false), path),
      ...opt(o, "maxCourses", count, path),
      ...opt(o, "useGroup", ident, path),
      ...(gened && { gened }),
      ...opt(o, "noShare", flag, path),
      ...opt(o, "note", str, path),
    };
    if (o.choose !== undefined) b.courses = b.maxCourses = count(o.choose, `${path}.choose`);
    if (o.discipline !== undefined) {
      const d = discipline(o.discipline, `${path}.discipline`);
      const m = b.match;
      b.discipline = d;
      b.match = (code, ctx) => d(code) !== null && m(code, ctx);
    }
    return b;
  }

  // --- constraints ---------------------------------------------------------------------------------
  function groups(o: Obj, path: string): Group[] {
    const all = list(o.groups, `${path}.groups`).map((x, i) => {
      const p = `${path}.groups[${i}]`;
      const g = obj(x, p, ["id", "label", "match"]);
      return { id: ident(g.id, `${p}.id`), label: str(g.label, `${p}.label`), match: matcher(g.match, `${p}.match`) };
    });
    const omit = o.omit === undefined ? [] : strs(o.omit, `${path}.omit`);
    for (const id of omit) if (!all.some((g) => g.id === id)) fail(`${path}.omit`, `no group "${id}"`);
    return all.filter((g) => !omit.includes(g.id));
  }

  function constraint(x: unknown, path: string, bucketIds: string[]): ProgramConstraint[] {
    const kind = isObj(x) ? x.kind : undefined;
    if (typeof kind !== "string" || !CONSTRAINT_KEYS[kind])
      fail(`${path}.kind`, `expected one of ${Object.keys(CONSTRAINT_KEYS).join(", ")}, got ${show(kind)}`);
    const o = obj(x, path, ["kind", "id", "label", ...CONSTRAINT_KEYS[kind]]);
    const own = (v: unknown, p: string) => {
      const id = str(v, p);
      if (!bucketIds.includes(id)) fail(p, `no bucket "${id}" in this program`);
      return id;
    };
    const buckets = () => list(o.buckets, `${path}.buckets`).map((b, i) => own(b, `${path}.buckets[${i}]`));
    const limits = () => {
      if (o.courses === undefined && o.credits === undefined) fail(path, "needs courses or credits");
      return { ...opt(o, "courses", count, path), ...opt(o, "credits", (v, p) => count(v, p, false), path) };
    };
    const label = str(o.label, `${path}.label`);
    if (kind === "maxEach") {
      // One maxFrom per group; {id} and {label} in this rule's id and label are filled from the group.
      const fill = (t: string, g: Group) => t.replace(/\{id\}/g, g.id).replace(/\{label\}/g, g.label);
      const idTemplate = str(o.id, `${path}.id`);
      return groups(o, path).map((g) => ({
        kind: "maxFrom",
        id: ident(fill(idTemplate, g), `${path}.id`),
        label: fill(label, g),
        buckets: buckets(),
        match: g.match,
        ...limits(),
      }));
    }
    const id = ident(o.id, `${path}.id`);
    const match = () => matcher(o.match, `${path}.match`);
    const min = () => count(o.min, `${path}.min`);
    switch (kind) {
      case "minFrom":
        return [{ kind, id, label, buckets: buckets(), match: match(), ...limits() }];
      case "maxFrom":
        return [{ kind, id, label, buckets: buckets(), match: match(), ...limits() }];
      case "distinct":
        return [{ kind, id, label, buckets: buckets(), groups: groups(o, path), min: min() }];
      case "anySet":
        return [{ kind, id, label, buckets: buckets(), options: options(o.options, `${path}.options`) }];
      case "within":
        return [{ kind, id, label, bucket: own(o.bucket, `${path}.bucket`), of: list(o.of, `${path}.of`).map((b, i) => own(b, `${path}.of[${i}]`)) }];
      default:
        return [{ kind: "outsideMajors", id, label, buckets: buckets(), min: min() }];
    }
  }

  // --- programs ------------------------------------------------------------------------------------
  function program(raw: Obj, path: string): Program {
    const o = obj(raw, path, PROGRAM_KEYS);
    const kind = o.kind as Program["kind"];
    if (!KINDS.includes(kind)) fail(`${path}.kind`, `expected one of ${KINDS.join(", ")}, got ${show(kind)}`);
    let raws = list(o.buckets, `${path}.buckets`).map((b, i) => bucketObj(b, `${path}.buckets[${i}]`));
    if (o.patch !== undefined) {
      // patch: { bucketId: { field: value } } adjusts buckets brought in from a shared list.
      const patch = obj(o.patch, `${path}.patch`, raws.map((b) => String(b.id)));
      raws = raws.map((b) => (patch[String(b.id)] === undefined ? b : { ...b, ...obj(patch[String(b.id)], `${path}.patch.${b.id}`, BUCKET_KEYS) }));
    }
    const buckets = raws.map((b, i) => bucket(b, `${path}.buckets[${i}]`));
    const ids = buckets.map((b) => b.id);
    const constraints =
      o.constraints === undefined ? undefined : list(o.constraints, `${path}.constraints`).flatMap((c, i) => constraint(c, `${path}.constraints[${i}]`, ids));
    // Waivers are keyed "program/id", so buckets and constraints share one namespace.
    const seen = new Set<string>();
    for (const id of [...ids, ...(constraints ?? []).map((c) => c.id)]) {
      if (seen.has(id)) fail(path, `two requirements share the id "${id}"`);
      seen.add(id);
    }
    return {
      id: ident(o.id, `${path}.id`),
      name: str(o.name, `${path}.name`),
      ...opt(o, "short", str, path),
      kind,
      // Tracks of one major are mutually exclusive; by default a major's family is its file.
      ...(o.family !== undefined ? { family: ident(o.family, `${path}.family`) } : kind === "major" ? { family: stem } : {}),
      ...opt(o, "college", str, path),
      ...opt(o, "aliases", strs, path),
      buckets,
      ...(constraints && { constraints }),
      ...opt(o, "notes", strs, path),
      ...opt(o, "sources", strs, path),
    };
  }

  // Fields at the top of a file are defaults for every program listed under `programs`;
  // a file without `programs` is a single program.
  const { defs: _defs, programs, ...shared } = doc;
  const base = resolve(shared, "") as Obj;
  if (programs === undefined) return [program(base, "")];
  return list(resolve(programs, "programs"), "programs").map((p, i) => program({ ...base, ...obj(p, `programs[${i}]`, PROGRAM_KEYS) }, `programs[${i}]`));
}
