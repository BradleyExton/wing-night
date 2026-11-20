export const root = "fixed inset-0 overflow-hidden bg-bg text-text";

export const stage = "absolute inset-0";

// Over the controls, letting every touch through but the share button's.
export const header =
  "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-3 pt-2 text-xs tabular-nums";

export const headerBlock = "flex flex-col gap-0.5 rounded-md bg-bg/70 px-2 py-1";

export const headerName = "text-sm font-bold";

export const headerLine = "text-muted";

export const shareButton =
  "pointer-events-auto h-8 rounded-md border border-text/20 bg-surface/90 px-3 text-xs font-semibold text-text";

export const status =
  "pointer-events-none absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-text";

export const rotate = "absolute inset-0 flex items-center justify-center bg-bg/95 p-6 text-center";

export const rotateText = "m-0 text-xl font-bold text-text";

export const lobby = "flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text";

export const lobbyTitle = "m-0 font-score text-3xl font-bold";

export const lobbyText = "m-0 max-w-sm text-base text-muted";

export const lobbyButton = "h-12 rounded-lg bg-primary px-6 text-base font-bold text-bg";
