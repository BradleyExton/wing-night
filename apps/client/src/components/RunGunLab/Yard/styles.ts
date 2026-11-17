export const root = "relative h-[100dvh] w-full overflow-hidden bg-bg text-text";

export const stage = "absolute inset-0";

export const roster = "absolute left-3 top-3 m-0 flex list-none flex-col gap-2 p-0";

export const rosterEmpty = "rounded-md bg-surface/80 px-3 py-2 text-sm text-muted";

export const chip = "flex items-start gap-2 rounded-md bg-surface/80 px-3 py-2";

export const chipDot = "mt-1 h-3 w-3 shrink-0";

export const chipText = "flex flex-col";

export const chipName = "text-sm font-bold text-text";

export const chipLine = "text-xs tabular-nums text-muted";

export const panel =
  "absolute right-3 top-3 max-h-[calc(100dvh-1.5rem)] w-72 space-y-3 overflow-y-auto rounded-xl border border-text/10 bg-surface/95 p-4 shadow-xl";

export const title = "m-0 text-sm font-bold leading-snug text-text";

export const buttonRow = "flex gap-2";

export const button =
  "h-9 flex-1 rounded-md border border-text/15 bg-surfaceAlt px-2 text-xs font-medium text-text outline-none hover:border-primary/60";

export const panelToggle =
  "absolute right-3 top-3 h-9 rounded-md border border-text/15 bg-surface/80 px-3 text-xs font-medium text-text";

export const join = "flex flex-col items-start gap-3 border-t border-text/10 pt-3";

// The code is its own size (`QrCode`: 9rem square); the plate is the light margin a scanner needs.
export const joinPlate = "block shrink-0 rounded-md bg-text p-1.5 text-bg";

export const joinText = "flex min-w-0 flex-col gap-1";

export const joinKicker = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export const joinAddress = "break-all text-xs text-text";

export const joinHint = "text-xs leading-snug text-muted";
