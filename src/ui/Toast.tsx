import { useEffect, useState } from "react";

export interface ToastMsg {
  id: number;
  text: string;
  undo?: boolean;
}

// Bottom-center notice with an optional Undo. Stays while hovered.
export function Toast({ toast, onUndo, onClose }: { toast: ToastMsg | null; onUndo: () => void; onClose: () => void }) {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!toast || hover) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, hover, onClose]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span>{toast.text}</span>
      {toast.undo && (
        <button
          className="toast-undo"
          onClick={() => {
            onUndo();
            onClose();
          }}
        >
          Undo
        </button>
      )}
      <button className="icon-btn" aria-label="Dismiss" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
