// Course picker: type a code ("cmsc4", "MATH 410") or words from the title ("deep learning").
// Keyboard: ↑/↓ to move, Enter to pick, Escape to cancel.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Catalog } from "../catalog";
import type { CatalogCourse } from "../types";
import { normalizeCode } from "../engine/match";
import { formatGeneds } from "../geneds";

interface Props {
  catalog: Catalog;
  onPick: (code: string) => void;
  onCancel?: () => void;
  initial?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  allowUnknown?: boolean; // accept a code that isn't in the catalog
  hint?: (c: CatalogCourse) => string | undefined; // extra right-hand text per result
}

const indexCache = new WeakMap<Catalog, { c: CatalogCourse; title: string }[]>();
function index(catalog: Catalog) {
  let ix = indexCache.get(catalog);
  if (!ix) indexCache.set(catalog, (ix = [...catalog.values()].map((c) => ({ c, title: c.n.toLowerCase() }))));
  return ix;
}

export function searchCatalog(catalog: Catalog, q: string, limit = 40): CatalogCourse[] {
  const raw = q.trim();
  if (!raw) return [];
  const code = normalizeCode(raw);
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: { c: CatalogCourse; s: number }[] = [];
  for (const { c, title } of index(catalog)) {
    let s = -1;
    if (c.c === code) s = 0;
    else if (code.length >= 2 && c.c.startsWith(code)) s = 1 + (c.c.length - code.length) / 10;
    else if (words.every((w) => title.includes(w))) s = 3 + (title.startsWith(words[0]) ? 0 : 0.5);
    if (s < 0) continue;
    // undergraduate and recently offered courses first
    if (s > 0) s += (Number(c.c.slice(4, 7)) >= 500 ? 2 : 0) + (c.t?.length ? 0 : 1);
    scored.push({ c, s });
  }
  return scored
    .sort((a, b) => a.s - b.s || a.c.c.localeCompare(b.c.c))
    .slice(0, limit)
    .map((x) => x.c);
}

export function CourseSearch({ catalog, onPick, onCancel, initial = "", placeholder = "Add a class: code or title", autoFocus, className, allowUnknown, hint }: Props) {
  const [q, setQ] = useState(initial);
  const [hi, setHi] = useState(0);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const results = useMemo(() => (open ? searchCatalog(catalog, q) : []), [catalog, q, open]);

  useEffect(() => {
    if (autoFocus) {
      input.current?.focus();
      input.current?.select();
    }
  }, [autoFocus]);
  useLayoutEffect(() => {
    if (!open) return;
    const upd = () => input.current && setRect(input.current.getBoundingClientRect());
    upd();
    window.addEventListener("scroll", upd, true);
    window.addEventListener("resize", upd);
    return () => {
      window.removeEventListener("scroll", upd, true);
      window.removeEventListener("resize", upd);
    };
  }, [open, q]);
  useEffect(() => setHi(0), [q]);
  useEffect(() => {
    list.current?.querySelector(".hi")?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const pick = (code: string) => {
    setOpen(false);
    setQ("");
    onPick(code);
  };
  const commitTyped = () => {
    const code = normalizeCode(q);
    if (results[hi]) pick(results[hi].c);
    else if (code && (allowUnknown || catalog.has(code))) pick(code);
  };

  const below = rect ? window.innerHeight - rect.bottom : 0;
  const up = rect && below < 260 && rect.top > below;
  return (
    <>
      <input
        ref={input}
        className={`course-search ${className ?? ""}`}
        value={q}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onBlur={() =>
          setTimeout(() => {
            setOpen(false);
            onCancel?.();
          }, 120)
        }
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            commitTyped();
          } else if (e.key === "Escape") {
            setOpen(false);
            setQ("");
            onCancel?.();
            input.current?.blur();
          }
        }}
      />
      {open &&
        rect &&
        q.trim() &&
        createPortal(
          <div
            ref={list}
            className="search-results popover"
            style={{
              left: Math.min(rect.left, window.innerWidth - 428),
              width: 420,
              ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {results.length === 0 && (
              <div className="sr-empty">
                No matches.{allowUnknown && normalizeCode(q) ? ` Press Enter to use “${normalizeCode(q)}” anyway.` : ""}
              </div>
            )}
            {results.map((c, i) => (
              <button key={c.c} className={`sr-item ${i === hi ? "hi" : ""}`} onMouseEnter={() => setHi(i)} onClick={() => pick(c.c)}>
                <span className="sr-code">{c.c}</span>
                <span className="sr-title">{c.n}</span>
                <span className="sr-meta">
                  {hint?.(c) ?? ""}
                  {c.g.length ? <span className="sr-gened">{formatGeneds(c.g)}</span> : null}
                  <span>{c.mx ? `${c.cr}–${c.mx}` : c.cr} cr</span>
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
