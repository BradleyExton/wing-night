export const container = "min-h-[100dvh] bg-bg px-4 py-5 text-text md:px-6 md:py-6";

export const headingBlock = "mx-auto w-full max-w-[1600px]";

export const heading = "m-0 text-3xl font-bold text-text md:text-4xl";

export const description = "mt-2 text-sm text-muted md:text-base";

export const layout =
  "mx-auto mt-5 grid w-full max-w-[1600px] gap-4 lg:grid-cols-[minmax(0,1fr)_360px]";

export const stageColumn = "flex flex-col gap-4";

export const card = "overflow-hidden rounded-xl border border-text/10 bg-surfaceAlt shadow-xl";

export const cardHeader =
  "flex items-center justify-between border-b border-text/10 bg-surface px-4 py-3";

export const cardHeaderLabel = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";

export const cardHeaderMeta = "text-xs text-muted";

export const stageViewport = "aspect-video w-full bg-black";

export const canvas = "block h-full w-full touch-none";

export const controlsCard =
  "rounded-xl border border-text/10 bg-surface p-4 shadow-lg lg:sticky lg:top-4";

export const controlsList = "space-y-4";

export const controlBlock = "space-y-1.5";

export const controlLabel = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export const controlHint = "text-xs leading-snug text-muted/70";

export const controlValue = "text-xs font-mono text-text";

export const controlRow = "flex items-center justify-between gap-2";

export const slider = "h-2 w-full cursor-pointer appearance-none rounded-full bg-text/15";

export const segmented = "flex gap-1 rounded-md bg-surfaceAlt p-1";

export const segmentedOption =
  "flex-1 rounded px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text";

export const segmentedOptionActive = "bg-primary/20 text-text";

export const input =
  "h-9 w-full rounded-md border border-text/15 bg-surfaceAlt px-3 text-sm text-text outline-none focus:border-primary/60";

export const button =
  "h-9 rounded-md border border-text/15 bg-surfaceAlt px-3 text-xs font-medium text-text outline-none hover:border-primary/60";

export const buttonRow = "flex gap-2";

export const telemetryGrid = "grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono text-text";

export const telemetryKey = "text-muted";

// ─── Outcome banner ───────────────────────────────────────────────────────
// The readability question's headline. Loud on purpose: if the room needs to read a number to
// know what happened, the run did not read.
export const outcomeBanner =
  "flex items-center justify-between gap-3 border-b border-text/10 px-4 py-2 text-sm font-semibold";

export const outcomeBannerLanded = "bg-emerald-500/15 text-emerald-300";

export const outcomeBannerMissed = "bg-amber-500/15 text-amber-200";

export const outcomeBannerUngraded = "bg-text/10 text-muted";

// ─── Attempt strip ────────────────────────────────────────────────────────
export const attemptStrip = "flex flex-wrap gap-2 px-4 py-3";

export const attemptChip =
  "flex flex-col gap-0.5 rounded-lg border border-text/15 bg-surface px-3 py-2 text-xs";

export const attemptChipBest = "border-primary/60 bg-primary/10";

export const attemptChipLabel = "font-semibold text-text";

export const attemptChipMeta = "font-mono text-[11px] text-muted";

export const varianceNote = "px-4 pb-3 text-xs text-muted";

export const varianceNoteWarning = "px-4 pb-3 text-xs font-medium text-amber-300";

export const noteBlock =
  "mt-3 rounded-md border border-text/10 bg-surfaceAlt px-3 py-2 text-xs leading-snug text-muted";
