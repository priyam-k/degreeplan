// Pointer-based drag with a floating label. A drag only starts after the pointer moves a few
// pixels, so a plain click on the handle still works as a click.
export interface DragOpts {
  label: string;
  sub?: string;
  onStart?: () => void;
  onMove?: (x: number, y: number, under: Element | null) => void;
  onDrop: (x: number, y: number, under: Element | null) => void;
  onEnd?: () => void; // after drop or cancel
}

export function startDrag(e: React.PointerEvent, o: DragOpts) {
  if (e.button !== 0) return;
  const x0 = e.clientX;
  const y0 = e.clientY;
  let ghost: HTMLDivElement | null = null;

  const under = (x: number, y: number) => document.elementFromPoint(x, y);
  const move = (ev: PointerEvent) => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      ghost = document.createElement("div");
      ghost.className = "drag-ghost";
      ghost.innerHTML = `<b></b>${o.sub ? "<span></span>" : ""}`;
      ghost.querySelector("b")!.textContent = o.label;
      if (o.sub) ghost.querySelector("span")!.textContent = o.sub;
      document.body.appendChild(ghost);
      document.body.classList.add("is-dragging");
      o.onStart?.();
    }
    ghost.style.transform = `translate(${ev.clientX + 12}px, ${ev.clientY + 8}px)`;
    o.onMove?.(ev.clientX, ev.clientY, under(ev.clientX, ev.clientY));
  };
  const finish = (ev: PointerEvent | null) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("keydown", key);
    if (ghost) {
      ghost.remove();
      document.body.classList.remove("is-dragging");
      if (ev) o.onDrop(ev.clientX, ev.clientY, under(ev.clientX, ev.clientY));
      o.onEnd?.();
    }
  };
  const up = (ev: PointerEvent) => finish(ev);
  const key = (ev: KeyboardEvent) => ev.key === "Escape" && finish(null);
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  document.addEventListener("keydown", key);
}
