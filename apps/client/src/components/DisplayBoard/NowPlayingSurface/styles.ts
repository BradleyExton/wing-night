// Full-bleed row directly above the fixed standings footer (DESIGN.md §2.2:
// the footer stays, the display never scrolls). It borrows the footer's own
// border + tint so the two read as one bottom edge rather than two stacked
// bars competing for the same strip of screen.
export const container =
  "relative z-10 flex shrink-0 items-center gap-[clamp(0.75rem,1.4vw,1.25rem)] border-t border-text/[0.06] bg-text/[0.04] px-[clamp(1rem,1.8vw,2rem)] py-[clamp(0.6rem,1vh,0.95rem)]";

export const equalizer = "flex h-[1.15em] flex-none items-end gap-[3px]";

// Authored constants per bar, like the embers' particle list: each bar's height
// and delay is a static utility class rather than a computed style prop.
const barBase =
  "w-[3px] origin-bottom rounded-[1px] bg-primary [animation:equalize_900ms_ease-in-out_infinite] motion-reduce:[animation:none] motion-reduce:scale-y-[0.4]";

export const bars: readonly string[] = [
  `${barBase} h-[45%] [animation-delay:0ms]`,
  `${barBase} h-full [animation-delay:150ms]`,
  `${barBase} h-[65%] [animation-delay:300ms]`,
  `${barBase} h-[85%] [animation-delay:450ms]`
];

// Paused is the same row gone quiet: bars frozen and dropped to muted, title
// dimmed. Hiding the row instead would flicker the TV on every host tap.
const pausedBarBase =
  "w-[3px] origin-bottom rounded-[1px] bg-muted scale-y-[0.4]";

export const pausedBars: readonly string[] = [
  `${pausedBarBase} h-[45%]`,
  `${pausedBarBase} h-full`,
  `${pausedBarBase} h-[65%]`,
  `${pausedBarBase} h-[85%]`
];

export const label =
  "flex-none text-[clamp(0.62rem,0.72vw,0.8rem)] font-extrabold uppercase tracking-[0.3em] text-muted";

export const title =
  "min-w-0 flex-1 truncate text-[clamp(0.95rem,1.15vw,1.6rem)] font-semibold text-text";

export const titlePaused =
  "min-w-0 flex-1 truncate text-[clamp(0.95rem,1.15vw,1.6rem)] font-semibold text-muted";

export const trackCount =
  "flex-none text-[clamp(0.62rem,0.72vw,0.8rem)] font-bold uppercase tracking-[0.22em] tabular-nums text-muted";
