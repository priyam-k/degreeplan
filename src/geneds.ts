// GenEd strings as Testudo prints them: "DSHS or DSHU, DVUP".
// Commas separate independent categories; "or" offers a choice within one slot,
// so "DSHS or DSHU, DVUP" = (DSHS or DSHU) + DVUP. Returned as alternatives:
// [["DSHS","DVUP"],["DSHU","DVUP"]].
export function parseGenedString(s: string): string[][] | null {
  const parts = s
    .toUpperCase()
    .split(",")
    .map((p) =>
      p
        .split(/\bOR\b/)
        .map((t) => t.trim())
        .filter((t) => /^[A-Z]{4}$/.test(t)),
    )
    .filter((p) => p.length);
  if (!parts.length) return null;
  let alts: string[][] = [[]];
  for (const opts of parts) alts = alts.flatMap((a) => opts.map((o) => [...a, o]));
  return alts.map((a) => [...new Set(a)]);
}

// umd.io splits Testudo's string on " or " first, then ", " — undo that and re-parse with
// the precedence above.
export function fromUmdIo(g: string[][]): string[][] {
  if (g.length <= 1) return g;
  return parseGenedString(g.map((a) => a.join(", ")).join(" or ")) ?? [];
}

export function formatGeneds(g: string[][]): string {
  if (!g.length) return "";
  if (g.length === 1) return g[0].join(", ");
  // factor out codes common to every alternative
  const common = g[0].filter((c) => g.every((a) => a.includes(c)));
  const rest = g.map((a) => a.filter((c) => !common.includes(c)).join("+") || "—");
  return [rest.join(" or "), ...common].join(", ");
}
