// A highlight that glides between the buttons of a segmented control, like Liquid Glass tabs.
// Position and width follow an underdamped spring, so the highlight overshoots a little and wobbles
// into place. While it moves it stretches along the direction of travel and thins (keeping roughly
// its area), and pressing the control squishes it. Everything is written straight to the element's
// style from requestAnimationFrame, so React doesn't re-render per frame. Reduced motion jumps.
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const STIFFNESS = 380; // spring constant (per unit mass)
const DAMPING = 21; // ζ ≈ 0.54: one visible overshoot, then a small wobble
const PRESS_STIFFNESS = 520;
const PRESS_DAMPING = 18;

interface Spring {
  v: number; // value
  vel: number;
  to: number;
}

const step = (s: Spring, k: number, c: number, dt: number) => {
  s.vel += (k * (s.to - s.v) - c * s.vel) * dt;
  s.v += s.vel * dt;
};
const settled = (s: Spring, eps: number) => Math.abs(s.to - s.v) < eps && Math.abs(s.vel) < eps * 10;

export function useSpringIndicator(nav: RefObject<HTMLElement>, activeKey: string): RefObject<HTMLSpanElement> {
  const el = useRef<HTMLSpanElement>(null);
  const x = useRef<Spring>({ v: 0, vel: 0, to: 0 });
  const w = useRef<Spring>({ v: 0, vel: 0, to: 0 });
  const press = useRef<Spring>({ v: 0, vel: 0, to: 0 });
  const frame = useRef(0);
  const placed = useRef(false);
  const key = useRef(activeKey);
  key.current = activeKey;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Size is drawn with real width/height rather than scale(), so the rounded ends stay round.
  const paint = () => {
    const node = el.current;
    const box = nav.current;
    if (!node || !box) return;
    // stretch with speed (px/s), capped; thin vertically to keep the blob's area about the same
    const speed = Math.abs(x.current.vel);
    const stretch = Math.min(speed / 2600, 0.28);
    const p = Math.max(-0.5, Math.min(1.5, press.current.v));
    const half = (Math.max(0, w.current.v) * (1 + stretch) * (1 + 0.05 * p)) / 2;
    const center = x.current.v + w.current.v / 2;
    // the control's padding acts as a wall: an overshoot squashes against it instead of poking out
    const inset = node.offsetTop;
    const left = Math.max(inset, center - half);
    const right = Math.min(box.clientWidth - inset, center + half);
    const full = box.clientHeight - 2 * inset;
    const height = full * (1 - stretch * 0.45) * (1 - 0.09 * p);
    node.style.width = `${Math.max(0, right - left)}px`;
    node.style.height = `${height}px`;
    node.style.transform = `translate(${left}px, ${(full - height) / 2}px)`;
  };

  const run = () => {
    cancelAnimationFrame(frame.current);
    let last = performance.now();
    const tick = (now: number) => {
      // fixed small substeps keep the spring stable even if a frame is late
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      while (dt > 0) {
        const h = Math.min(dt, 1 / 240);
        step(x.current, STIFFNESS, DAMPING, h);
        step(w.current, STIFFNESS, DAMPING, h);
        step(press.current, PRESS_STIFFNESS, PRESS_DAMPING, h);
        dt -= h;
      }
      paint();
      if (settled(x.current, 0.1) && settled(w.current, 0.1) && settled(press.current, 0.002)) {
        for (const s of [x.current, w.current, press.current]) Object.assign(s, { v: s.to, vel: 0 });
        paint();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  // Measure the active button; animate there, or jump on first paint, on resize and with reduced motion.
  const target = (jump: boolean) => {
    const btn = nav.current?.querySelector<HTMLElement>(`[data-key="${key.current}"]`);
    if (!btn) return;
    x.current.to = btn.offsetLeft;
    w.current.to = btn.offsetWidth;
    if (jump || !placed.current || reduced()) {
      for (const s of [x.current, w.current]) Object.assign(s, { v: s.to, vel: 0 });
      placed.current = true;
      paint();
    } else run();
  };

  useLayoutEffect(() => target(false), [activeKey]);

  useEffect(() => {
    const n = nav.current;
    if (!n) return;
    const ro = new ResizeObserver(() => target(true));
    ro.observe(n);
    document.fonts?.ready.then(() => target(true));
    const down = () => {
      if (reduced()) return;
      press.current.to = 1;
      run();
    };
    const up = () => {
      if (press.current.to === 0) return;
      press.current.to = 0;
      run();
    };
    n.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      ro.disconnect();
      n.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return el;
}
