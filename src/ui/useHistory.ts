// State with undo/redo. Rapid edits sharing a coalesce key (e.g. typing in one notes field)
// collapse into a single undo step.
import { useCallback, useRef, useState } from "react";

const LIMIT = 100;
const COALESCE_MS = 1200;

export interface History<T> {
  state: T;
  set: (f: (s: T) => T, opts?: { coalesce?: string }) => void;
  reset: (s: T) => void; // replace without recording (e.g. on load)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory<T>(init: () => T): History<T> {
  const [h, setH] = useState(() => ({ past: [] as T[], present: init(), future: [] as T[] }));
  const last = useRef<{ key?: string; at: number }>({ at: 0 });

  const set = useCallback((f: (s: T) => T, opts?: { coalesce?: string }) => {
    const now = Date.now();
    const merge = !!opts?.coalesce && last.current.key === opts.coalesce && now - last.current.at < COALESCE_MS;
    last.current = { key: opts?.coalesce, at: now };
    setH((h) => {
      const next = f(h.present);
      if (next === h.present) return h;
      return { past: merge ? h.past : [...h.past, h.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);
  const reset = useCallback((s: T) => setH({ past: [], present: s, future: [] }), []);
  const undo = useCallback(() => {
    last.current = { at: 0 };
    setH((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  }, []);
  const redo = useCallback(() => {
    last.current = { at: 0 };
    setH((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);
  return { state: h.present, set, reset, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}
