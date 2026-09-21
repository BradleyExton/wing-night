// Forgery Studio, host side: a dim gallery back room. Matte frames on the
// pictures, primary for the one thing to press, success for the ticks.
export const container =
  "flex h-full min-h-0 flex-col gap-[clamp(0.75rem,1.6vh,1.25rem)] bg-surfaceAlt p-5";

// Right padding keeps the header meta clear of the shell's absolute timer chip.
export const header =
  "flex flex-wrap items-baseline justify-between gap-2 border-b border-text/10 pb-3 pr-[clamp(9rem,15vw,12rem)]";

export const headerTitle =
  "m-0 text-xl font-black uppercase tracking-[0.25em] text-primary";

export const headerMeta = "m-0 text-sm font-semibold uppercase tracking-[0.16em] text-muted";

export const teamLine = "m-0 text-sm font-semibold uppercase tracking-[0.18em] text-text";

export const teamName = "ml-2 text-primary";

export const statusNote =
  "rounded-md border border-text/10 bg-surface px-4 py-3 text-sm italic text-text/85";

// Writing: the target on the left, the composer beside it. Judging: both
// pictures small on the left, the grading bench on the right — the tablet is
// landscape and the bench has to be reachable without scrolling.
export const stageRow = "grid gap-4 md:grid-cols-[2fr_3fr] md:items-start";

export const frames = "grid gap-3";

export const framesPair = "grid grid-cols-2 gap-3";

export const frame = "flex min-w-0 flex-col gap-1.5";

export const framePicture =
  "aspect-[4/3] w-full overflow-hidden rounded-sm border-[6px] border-surface bg-surface shadow-xl";

export const framePhoto = "h-full w-full object-contain";

export const framePlaceholder =
  "flex h-full w-full items-center justify-center px-4 text-center text-sm italic text-muted";

export const framePlaceholderBusy = `${framePlaceholder} animate-pulse`;

export const frameCaption =
  "m-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted";

export const scoredRow = "flex flex-wrap items-center gap-4";

export const pointsSeal =
  "flex h-20 w-20 rotate-6 flex-col items-center justify-center rounded-full border-4 border-primary text-primary";

export const pointsSealValue = "text-2xl font-black leading-none";

export const pointsSealLabel = "mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.3em]";

export const reveal = "flex min-w-0 flex-1 flex-col gap-1";

export const revealLabel = "m-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted";

export const revealPrompt = "m-0 text-lg italic leading-snug text-text";

// Right reserve keeps the button clear of the shell's bottom-right takeover dock.
export const nextTargetButton =
  "min-h-14 w-[calc(100%-4.5rem)] rounded-md border-2 border-primary bg-primary/15 px-5 text-base font-black uppercase tracking-[0.2em] text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40";
