// Click-to-open popover anchored to its trigger. Rendered in a portal with fixed positioning so it
// is never clipped by scrolling containers or table cells; closes on outside click or Escape.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  button: ReactNode;
  buttonClassName?: string;
  buttonTitle?: string;
  className?: string;
  align?: "start" | "end";
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode | ((close: () => void) => ReactNode);
}

export function Popover({ button, buttonClassName, buttonTitle, className, align = "start", width, open: controlled, onOpenChange, disabled, children }: Props) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlled ?? uncontrolled;
  const setOpen = (v: boolean) => {
    setUncontrolled(v);
    onOpenChange?.(v);
  };
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null);

  const place = () => {
    const b = btn.current?.getBoundingClientRect();
    const p = panel.current;
    if (!b || !p) return;
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = align === "end" ? b.right - w : b.left;
    left = Math.max(8, Math.min(left, vw - w - 8));
    const below = vh - b.bottom - 12;
    const above = b.top - 12;
    const flip = h > below && above > below;
    const maxH = Math.max(160, flip ? above : below);
    const top = flip ? Math.max(8, b.top - 6 - Math.min(h, maxH)) : b.bottom + 6;
    setPos({ top, left, maxH });
  };

  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || btn.current?.contains(t)) return;
      // clicks inside another popover opened from this one (portals) shouldn't close it
      if ((t as Element).closest?.(".popover")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    const ro = new ResizeObserver(onMove);
    if (panel.current) ro.observe(panel.current);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      ro.disconnect();
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`${buttonClassName ?? ""} ${open ? "is-open" : ""}`}
        title={buttonTitle}
        aria-expanded={open}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {button}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            className={`popover ${className ?? ""}`}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, maxHeight: pos?.maxH, visibility: pos ? "visible" : "hidden" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )}
    </>
  );
}

// A popover whose content asks for confirmation before running `onConfirm`.
export function ConfirmButton({
  children,
  className,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Popover button={children} buttonClassName={className} buttonTitle={title} width={260}>
      {(close) => (
        <div className="confirm">
          <div>{message}</div>
          <div className="confirm-actions">
            <button className="btn" onClick={close}>
              Cancel
            </button>
            <button
              className="btn danger"
              autoFocus
              onClick={() => {
                close();
                onConfirm();
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
