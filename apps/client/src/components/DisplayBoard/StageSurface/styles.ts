export const card =
  "rounded-2xl border border-text/10 bg-surfaceAlt px-6 py-6 text-left shadow-2xl md:px-8 md:py-8";

// The lobby owns the whole stage, edge to edge: its flame, vignette and cast
// are the frame, so any inset here would read as a border around the show.
export const setupCard = "h-full max-h-full overflow-hidden text-left";

// Every other phase keeps the inset the display row used to carry, so the
// bodies below (and the context header) sit exactly where they did.
export const stageCanvas =
  "relative isolate h-full max-h-full overflow-hidden px-4 py-3 text-left md:px-8 md:py-4 [@media(max-height:850px)]:py-2";

export const stageBody =
  "relative z-10 h-full min-h-0 px-4 pb-3 pt-1 md:px-8 md:pb-4 2xl:px-12";

export const surfaceContextRow = "mb-3 flex items-center justify-between gap-3";

export const surfaceContextMeta =
  "m-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted";

export const surfaceContextBadge =
  "inline-flex rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary";

export const title = "m-0 text-4xl font-bold text-text md:text-5xl";

export const timerWrap =
  "mt-6 rounded-xl border border-primary/40 bg-primary/10 px-5 py-6 text-center";

export const timerLabel =
  "m-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary/90";

export const timerValue =
  "mt-3 font-mono text-7xl font-black leading-none tabular-nums text-primary md:text-8xl";

export const fallbackText = "mt-5 text-xl text-text/85";
