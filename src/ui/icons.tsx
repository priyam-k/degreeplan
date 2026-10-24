// Small inline icons (stroke = currentColor) so buttons don't depend on emoji rendering.
const P = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icon = {
  undo: () => (
    <svg {...P}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  ),
  redo: () => (
    <svg {...P}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  ),
  more: () => (
    <svg {...P}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  chevron: () => (
    <svg {...P} width={14} height={14}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  grip: () => (
    <svg {...P} width={12} height={14} strokeWidth={0} fill="currentColor" viewBox="0 0 12 16">
      <circle cx="3" cy="3" r="1.4" />
      <circle cx="9" cy="3" r="1.4" />
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="9" cy="8" r="1.4" />
      <circle cx="3" cy="13" r="1.4" />
      <circle cx="9" cy="13" r="1.4" />
    </svg>
  ),
  x: () => (
    <svg {...P} width={14} height={14}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  plus: () => (
    <svg {...P} width={14} height={14}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  info: () => (
    <svg {...P} width={14} height={14}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  warn: () => (
    <svg {...P} width={14} height={14}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  check: () => (
    <svg {...P} width={14} height={14}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  pencil: () => (
    <svg {...P} width={14} height={14}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  ),
  trash: () => (
    <svg {...P} width={14} height={14}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  copy: () => (
    <svg {...P} width={14} height={14}>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  arrowLeft: () => (
    <svg {...P} width={14} height={14}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  arrowRight: () => (
    <svg {...P} width={14} height={14}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  zoomIn: () => (
    <svg {...P} width={14} height={14}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  ),
  zoomOut: () => (
    <svg {...P} width={14} height={14}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </svg>
  ),
};
