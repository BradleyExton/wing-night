// Forgery Studio, TV side: a gallery wall. Two matte frames up top, the
// appraisal underneath. Primary is the studio's accent, success is the tick;
// nothing else is coloured, per the two-accent budget.
export const stage =
  "flex h-full w-full flex-col bg-surfaceAlt p-[clamp(0.75rem,1.5vw,1.5rem)]";

export const frameWall =
  "flex h-full min-h-0 w-full flex-col gap-[clamp(0.75rem,1.4vw,1.4rem)] px-[clamp(1rem,2.5vw,2.5rem)] py-[clamp(0.75rem,1.6vw,1.6rem)]";

// The masthead is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D),
// the same sign every other game hangs; the studio's subtitle rides in its
// readout slot. RECREATE is `timerKey: null`, so the sign's clock and its
// track stay dark.
export const headerMeta =
  "m-0 text-[clamp(0.8rem,1.2vw,1.3rem)] font-semibold uppercase tracking-[0.2em] text-muted";

export const idleBody = "flex flex-1 items-center justify-center";

export const idleText =
  "m-0 text-center text-[clamp(1.5rem,2.6vw,2.8rem)] font-semibold uppercase tracking-[0.18em] text-muted";

// Capped so the appraisal underneath keeps TV-legible room once the chips,
// the prompt and the seal are all on the wall.
export const pictures =
  "flex max-h-[58%] min-h-0 flex-1 items-stretch justify-center gap-[clamp(1.25rem,3vw,3.5rem)]";

// Capped so a lone target (nothing to compare with yet) hangs centred at a
// sensible size rather than stretching wall to wall.
export const picture =
  "flex min-h-0 min-w-0 max-w-[56%] flex-1 flex-col items-center gap-[clamp(0.5rem,0.9vw,0.9rem)]";

// Frame and mat are one colour, so a photo that does not fill the frame
// reads as matted rather than letterboxed.
export const pictureFrame =
  "min-h-0 w-full flex-1 overflow-hidden rounded-sm border-[clamp(6px,0.7vw,12px)] border-surface bg-surface shadow-2xl";

export const picturePhoto = "h-full w-full object-contain";

export const picturePlaceholder =
  "flex h-full w-full items-center justify-center px-[clamp(1rem,2vw,2rem)] text-center text-[clamp(1.2rem,2vw,2.4rem)] italic text-muted";

export const picturePlaceholderBusy = `${picturePlaceholder} animate-pulse text-primary`;

export const pictureCaption =
  "m-0 text-[clamp(0.8rem,1.1vw,1.2rem)] font-semibold uppercase tracking-[0.25em] text-muted";

export const appraisal =
  "flex shrink-0 flex-col gap-[clamp(0.5rem,1vw,1rem)] border-t border-text/10 pt-[clamp(0.6rem,1.2vw,1.2rem)]";

export const appraisalRow =
  "flex flex-wrap items-center justify-between gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-2";

export const title =
  "m-0 text-balance text-[clamp(1.6rem,3vw,3.4rem)] font-black leading-[1.05] text-text";

export const status =
  "m-0 text-[clamp(0.9rem,1.4vw,1.5rem)] font-semibold uppercase tracking-[0.2em] text-primary";

export const sealed =
  "m-0 text-[clamp(0.85rem,1.2vw,1.3rem)] italic text-muted";

export const sectionLabel =
  "m-0 text-[clamp(0.7rem,1vw,1.05rem)] font-semibold uppercase tracking-[0.25em] text-muted";

export const teamPrompt =
  "m-0 line-clamp-2 text-balance text-[clamp(1.2rem,2.2vw,2.6rem)] italic leading-snug text-text";

export const ingredients = "m-0 flex list-none flex-wrap gap-[clamp(0.5rem,1vw,1rem)] p-0";

const ingredientBase =
  "flex items-center gap-[0.6em] rounded-full border-2 px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.35rem,0.6vw,0.65rem)] text-[clamp(0.95rem,1.5vw,1.7rem)] font-bold";

export const ingredient = `${ingredientBase} border-text/15 text-text/80`;

export const ingredientChecked = `${ingredientBase} border-success bg-success/15 text-text`;

export const ingredientMark =
  "flex h-[1.3em] w-[1.3em] items-center justify-center rounded-full border-2 border-current text-[0.75em] font-black";

export const scoredRow = "flex flex-wrap items-center gap-[clamp(1rem,2.5vw,2.5rem)]";

export const reveal = "flex min-w-0 flex-1 flex-col gap-1";

export const revealPrompt =
  "m-0 line-clamp-2 text-[clamp(1rem,1.7vw,2rem)] italic leading-snug text-text";
