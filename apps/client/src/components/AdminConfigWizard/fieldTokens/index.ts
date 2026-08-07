// Field-level vocabulary shared by the wizard's step surfaces. Lives beside the
// steps (not in HostControlPanel/styleTokens) because it is layout for a
// form-heavy standalone page, which the host deck has no use for.
export const fieldGrid = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export const fieldGridWide = "col-span-full";

export const field = "flex flex-col gap-1.5";

export const numberInput =
  "h-11 w-full rounded-md border border-text/30 bg-bg px-3 text-base tabular-nums text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// A field that failed validation gets a visible border, not only a message
// below it — the host may be several steps away from where they typed it.
export const inputInvalid = "border-danger ring-1 ring-danger";

export const issueText = "text-xs font-semibold text-danger";

// One numbered row of a list-shaped file — a lineup round, a roster player, a
// prompt. Named for the shape rather than for rounds, because four surfaces
// render it now.
export const entryCard =
  "flex flex-col gap-3 rounded-lg border border-text/10 bg-surfaceAlt p-4";

export const entryHead =
  "flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-muted";

export const sectionRoot = "flex flex-col gap-3";

export const sectionHint = "text-sm text-muted";

export const removeButton =
  "rounded-md border border-text/20 px-2 py-1 text-xs text-muted transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40";

export const addRowButton =
  "rounded-md border border-dashed border-text/30 px-4 py-3 text-sm font-semibold text-muted transition hover:border-primary hover:text-text disabled:cursor-not-allowed disabled:opacity-40";

export const chipRow = "inline-flex flex-wrap gap-1.5";

export const reviewRow =
  "flex flex-col gap-1 border-b border-text/10 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4";

export const reviewKey =
  "min-w-28 text-xs font-semibold uppercase tracking-wide text-muted";

export const reviewValue = "text-base text-text";

export const applyButton =
  "h-12 rounded-md border border-primary/70 bg-primary/25 px-5 text-base font-bold text-text transition hover:bg-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";
