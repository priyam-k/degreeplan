// Parses the text of a Testudo "Unofficial Transcript" (PDF text or copy-paste).
import { parseGenedString } from "./geneds";

export interface TranscriptCourse {
  code: string; // "" for GenEd-only credit (e.g. AP English Language -> FSAW)
  title: string;
  credits: number;
  grade?: string;
  geneds: string[][] | null; // null = not listed, fall back to catalog
  source: "transfer" | "completed" | "inprogress";
  term: string; // "Transfer / AP" for transfer credit
  institution?: string;
}

export interface TranscriptResult {
  courses: TranscriptCourse[];
  exemptions: string[]; // GenEd codes satisfied by "Fundamental Requirement Satisfied"
  majors: string[];
  minors: string[];
  warnings: string[];
}

const TERM_RE = /\b(Fall|Spring|Summer|Winter)\s+(\d{4})\b/;
const CODE = "[A-Z]{4}[0-9X]{3}[A-Z]{0,2}";
const NUM = "\\d+\\.\\d{2}";
const HISTORIC_RE = new RegExp(`^(${CODE})\\s+(.+?)\\s+(\\S+)\\s+(${NUM})\\s+(${NUM})\\s+(${NUM})(?:\\s+(.*))?$`);
const CURRENT_RE = new RegExp(`^(${CODE})\\s+(\\S+)\\s+(${NUM})\\s+(\\S+)\\s+([AD])\\b(.*)$`);
const TRANSFER_RE = new RegExp(`^(.*?)\\s+(${NUM})(?:\\s+(.*))?$`);
const GENED_TOKEN = /^(FS[A-Z]{2}|DS[A-Z]{2}|DV[A-Z]{2}|SCIS|I-?SERIES)$/;

export const TRANSFER_TERM = "Transfer / AP";

export function parseTranscript(text: string): TranscriptResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^https?:\/\//.test(l) && !/^\d+\/\d+\/\d+, \d+:\d+ [AP]M/.test(l));

  const res: TranscriptResult = { courses: [], exemptions: [], majors: [], minors: [], warnings: [] };
  type Section = "header" | "transfer" | "historic" | "current";
  let section: Section = "header";
  let term = "";
  let institution = "";

  for (const line of lines) {
    if (/\*\* Transfer Credit Information \*\*/i.test(line)) {
      section = "transfer";
      continue;
    }
    if (/Historic Course Information/i.test(line)) {
      section = "historic";
      continue;
    }
    if (/\*\* Current Course Information \*\*/i.test(line)) {
      section = "current";
      continue;
    }

    if (section === "header") {
      const fund = /Fundamental Requirement Satisfied\s*(.*)$/i.exec(line);
      if (fund) {
        if (/Math\s*:/i.test(fund[1])) res.exemptions.push("FSMA");
        if (/English\s*:/i.test(fund[1])) res.exemptions.push("FSAW");
      }
      const maj = /^Major:\s*(.+)$/i.exec(line);
      if (maj) res.majors.push(maj[1].trim());
      const min = /^Minor:\s*(.+)$/i.exec(line);
      if (min) res.minors.push(min[1].trim());
      continue;
    }

    if (section === "transfer") {
      if (/Credits\s*(Acceptable|Applicable)?\s*:/i.test(line) || /Transfer Credit|Equivalences/i.test(line)) continue;
      const m = TRANSFER_RE.exec(line);
      if (!m) {
        // Institution header, e.g. "Middlesex College" / "Advanced Placement Exam"
        if (!/^\d{4}\b/.test(line)) institution = line;
        continue;
      }
      let left = m[1].replace(/^\d{4}\s+/, ""); // strip term code like 2208
      const credits = Number(m[2]);
      const rest = (m[3] ?? "").trim();
      if (/^No Credit/i.test(rest) || credits === 0) continue;
      // trailing grade token on the left side (P, A, B+, ...)
      let grade: string | undefined;
      const gm = /\s+([A-F][+-]?|P|S|T|CR)$/.exec(left);
      if (gm) {
        grade = gm[1];
        left = left.slice(0, gm.index);
      }
      const cm = new RegExp(`^(${CODE})\\b\\s*(.*)$`).exec(rest);
      const code = cm ? cm[1] : "";
      const genText = (cm ? cm[2] : rest).trim();
      const geneds = genText ? parseGenedString(genText) : null;
      if (!code && !geneds) {
        res.warnings.push(`Skipped transfer line: "${line}"`);
        continue;
      }
      res.courses.push({ code, title: left.trim(), credits, grade, geneds, source: "transfer", term: TRANSFER_TERM, institution });
      continue;
    }

    const t = TERM_RE.exec(line);
    if (section === "historic") {
      if (t && line.length < 40 && !HISTORIC_RE.test(line)) {
        term = `${t[1]} ${t[2]}`;
        continue;
      }
      const m = HISTORIC_RE.exec(line);
      if (!m || !term) continue;
      const [, code, title, grade, , earned, , genText] = m;
      if (Number(earned) === 0) {
        res.warnings.push(`${code} (${term}, grade ${grade}) earned 0 credits — not imported`);
        continue;
      }
      res.courses.push({
        code,
        title,
        credits: Number(earned),
        grade,
        geneds: genText ? parseGenedString(genText) : null,
        source: "completed",
        term,
      });
      continue;
    }

    if (section === "current") {
      if (t && !CURRENT_RE.test(line)) term = `${t[1]} ${t[2]}`;
      const m = CURRENT_RE.exec(line.replace(TERM_RE, "").trim());
      if (!m || !term) continue;
      const [, code, , credits, , addDrop, tail] = m;
      if (addDrop === "D") continue; // dropped
      const genText = tail.replace(/\d\d\/\d\d\/\d\d/g, "").trim();
      res.courses.push({
        code,
        title: "",
        credits: Number(credits),
        geneds: genText ? parseGenedString(genText) : null,
        source: "inprogress",
        term,
      });
    }
  }

  // A course re-registered after a drop (e.g. section swap) shows once per "A" row; dedupe per term.
  const seen = new Set<string>();
  res.courses = res.courses.filter((c) => {
    if (!c.code) return true;
    const k = `${c.term}|${c.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return res;
}

export function isGenedToken(s: string): boolean {
  return GENED_TOKEN.test(s);
}
