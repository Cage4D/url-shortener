const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function LinkIcon() {
  return (
    <svg width="18" height="18" strokeWidth="2" {...base}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg width="16" height="16" strokeWidth="2" {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" strokeWidth="2.4" {...base}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg width="16" height="16" strokeWidth="2" {...base}>
      <rect x="9" y="9" width="11" height="11" rx="3" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function ArrowUpRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} strokeWidth="2" {...base}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.4" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg width="14" height="14" strokeWidth="2" {...base}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}
