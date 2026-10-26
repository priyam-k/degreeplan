// A selection highlight that glides between items, like Liquid Glass tabs. The items are elements
// inside `container` with data-key attributes; the highlight follows the one whose key is `activeKey`.
// Position and size follow an underdamped spring, so it overshoots a little and wobbles into place.
// While it moves it stretches along the direction of travel and thins (keeping roughly its area),
// it squashes against the container's padding instead of poking out, and pressing squishes it.
// Everything is written straight to the element's style from requestAnimationFrame, so React doesn't
// re-render per frame. With reduced motion it jumps.
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

const spring = (): Spring => ({ v: 0, vel: 0, to: 0 });
const step = (s: Spring, k: number, c: number, dt: number) => {
  s.vel += (k * (s.to - s.v) - c * s.vel) * dt;
  s.v += s.vel * dt;
};
const settled = (s: Spring, eps: number) => Math.abs(s.to - s.v) < eps && Math.abs(s.vel) < eps * 10;
const snap = (s: Spring) => Object.assign(s, { v: s.to, vel: 0 });

export interface SpringIndicatorOptions {
  // Called when the highlight heads for a new item, e.g. to pick up that item's colour.
  onTarget?: (item: HTMLElement, indicator: HTMLElement) => void;
  // How much a press squishes it (0 = not at all). Default 1.
  press?: number;
}

export function useSpringIndicator(container: RefObject<HTMLElement>, activeKey: string, opts: SpringIndicatorOptions = {}): RefObject<HTMLSpanElement> {
  const el = useRef<HTMLSpanElement>(null);
  const s = useRef({ x: spring(), y: spring(), w: spring(), h: spring(), press: spring() });
  const frame = useRef(0); // non-zero while animating
  const placed = useRef(false);
  const key = useRef(activeKey);
  key.current = activeKey;
  const options = useRef(opts);
  options.current = opts;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Size is drawn with real width/height rather than scale(), so rounded ends stay round.
  const paint = () => {
    const node = el.current;
    const box = container.current;
    if (!node || !box) return;
    const { x, y, w, h, press } = s.current;
    // stretch with speed (px/s) along each axis, capped; the other axis thins to keep the area
    const sx = Math.min(Math.abs(x.vel) / 2600, 0.28);
    const sy = Math.min(Math.abs(y.vel) / 2600, 0.28);
    const p = Math.max(-0.5, Math.min(1.5, press.v)) * (options.current.press ?? 1);
    const halfW = (Math.max(0, w.v) * (1 + sx) * (1 - sy * 0.45) * (1 + 0.05 * p)) / 2;
    const halfH = (Math.max(0, h.v) * (1 + sy) * (1 - sx * 0.45) * (1 - 0.09 * p)) / 2;
    const cx = x.v + w.v / 2;
    const cy = y.v + h.v / 2;
    // the container's padding is a wall: an overshoot squashes against it
    const cs = getComputedStyle(box);
    const left = Math.max(parseFloat(cs.paddingLeft), cx - halfW);
    const right = Math.min(box.scrollWidth - parseFloat(cs.paddingRight), cx + halfW);
    const top = Math.max(parseFloat(cs.paddingTop), cy - halfH);
    const bottom = Math.min(box.scrollHeight - parseFloat(cs.paddingBottom), cy + halfH);
    node.style.width = `${Math.max(0, right - left)}px`;
    node.style.height = `${Math.max(0, bottom - top)}px`;
    node.style.transform = `translate(${left}px, ${top}px)`;
  };

  const run = () => {
    cancelAnimationFrame(frame.current);
    let last = performance.now();
    const tick = (now: number) => {
      // fixed small substeps keep the spring stable even if a frame is late
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { x, y, w, h, press } = s.current;
      while (dt > 0) {
        const sub = Math.min(dt, 1 / 240);
        for (const v of [x, y, w, h]) step(v, STIFFNESS, DAMPING, sub);
        step(press, PRESS_STIFFNESS, PRESS_DAMPING, sub);
        dt -= sub;
      }
      paint();
      if ([x, y, w, h].every((v) => settled(v, 0.1)) && settled(press, 0.002)) {
        [x, y, w, h, press].forEach(snap);
        paint();
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  // Measure the active item and animate there; jump on first paint and with reduced motion. A layout
  // change (`relayout`) re-aims a running animation, or jumps when the highlight is at rest.
  const target = (relayout: boolean) => {
    const item = container.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key.current)}"]`);
    const node = el.current;
    if (!item || !node) return;
    const { x, y, w, h } = s.current;
    x.to = item.offsetLeft;
    y.to = item.offsetTop;
    w.to = item.offsetWidth;
    h.to = item.offsetHeight;
    options.current.onTarget?.(item, node);
    if (relayout && frame.current) return;
    if (relayout || !placed.current || reduced()) {
      [x, y, w, h].forEach(snap);
      placed.current = true;
      paint();
    } else run();
  };

  useLayoutEffect(() => target(false), [activeKey]);

  useEffect(() => {
    const box = container.current;
    if (!box) return;
    // re-measure without animating when the layout changes or items come and go
    const ro = new ResizeObserver(() => target(true));
    const watch = () => {
      ro.disconnect();
      ro.observe(box);
      for (const child of box.children) ro.observe(child);
    };
    watch();
    const mo = new MutationObserver(() => {
      watch();
      target(true);
    });
    mo.observe(box, { childList: true });
    document.fonts?.ready.then(() => target(true));
    const down = () => {
      if (reduced() || options.current.press === 0) return;
      s.current.press.to = 1;
      run();
    };
    const up = () => {
      if (s.current.press.to === 0) return;
      s.current.press.to = 0;
      run();
    };
    box.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      ro.disconnect();
      mo.disconnect();
      box.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return el;
}
