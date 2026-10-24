// Caustic themes: a ground (eggshell or charcoal, or follow the system) and one accent.
// The stylesheet keys off <html data-theme="eggshell-red">; index.html sets it before first paint.
import { useEffect, useState } from "react";

export type Ground = "auto" | "eggshell" | "charcoal";
export type Accent = "red" | "blue" | "forest" | "royal";
export interface Theme {
  ground: Ground;
  accent: Accent;
}

export const GROUNDS: { id: Ground; label: string }[] = [
  { id: "eggshell", label: "Light" },
  { id: "charcoal", label: "Dark" },
  { id: "auto", label: "Auto" },
];
export const ACCENTS: Accent[] = ["red", "blue", "forest", "royal"];

const KEY = "degreeplan.theme";
const DEFAULT: Theme = { ground: "auto", accent: "red" };
const prefersDark = () => matchMedia("(prefers-color-scheme: dark)");

function loadTheme(): Theme {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULT;
  }
}

function applyTheme(t: Theme) {
  const ground = t.ground === "auto" ? (prefersDark().matches ? "charcoal" : "eggshell") : t.ground;
  document.documentElement.dataset.theme = `${ground}-${t.accent}`;
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState(loadTheme);
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, JSON.stringify(theme));
    } catch {
      // private mode: the theme just won't persist
    }
    if (theme.ground !== "auto") return;
    const mq = prefersDark();
    const follow = () => applyTheme(theme);
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, [theme]);
  return [theme, setTheme];
}
