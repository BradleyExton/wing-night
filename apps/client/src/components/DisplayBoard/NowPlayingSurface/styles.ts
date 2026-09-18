// Full-bleed row directly above the fixed standings footer (DESIGN.md §2.2:
// the footer stays, the display never scrolls). It shares the footer's
// hairline top edge so the two read as one bottom band, but the row itself is
// warm glass like the setup cards: heat pools at the left, behind the
// equalizer, and fades out under the title.
export const container =
  "relative z-10 flex shrink-0 items-center gap-[clamp(0.9rem,1.5vw,1.5rem)] overflow-hidden border-t border-primary/15 bg-[linear-gradient(90deg,rgba(46,22,9,0.75)_0%,rgba(18,18,18,0.9)_45%,rgba(18,18,18,0.9)_100%)] px-[clamp(1.2rem,2vw,2.5rem)] py-[clamp(0.7rem,1.1vh,1.1rem)] [animation:reveal_500ms_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:[animation:none] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-ember/70 before:via-primary/25 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-[30%] after:bg-[radial-gradient(ellipse_at_left,rgba(249,115,22,0.22),transparent_70%)] after:content-['']";

// The equalizer sits in a lit badge so the moving bars have an edge to move
// against from across the room.
export const equalizer =
  "relative z-[1] flex h-[clamp(1.7rem,1.9vw,2.6rem)] flex-none items-end gap-[3px] rounded-[0.55rem] border border-primary/30 bg-primary/10 px-[0.5rem] pb-[0.4rem] pt-[0.35rem] [box-shadow:0_0_18px_rgba(249,115,22,0.25),inset_0_1px_0_rgba(255,214,170,0.12)]";

// Authored constants per bar, like the embers' particle list: each bar's
// height and period is a static utility class rather than a computed style
// prop. The periods differ so the bars never fall into lockstep, which is what
// a shared period plus per-bar delays used to do (the shorthand resets the
// delay, see Embers/styles.ts).
const barBase =
  "w-[clamp(3px,0.2vw,5px)] origin-bottom rounded-full bg-primary [box-shadow:0_0_6px_rgba(249,115,22,0.8)] motion-reduce:[animation:none] motion-reduce:scale-y-[0.4]";

export const bars: readonly string[] = [
  `${barBase} h-[45%] [animation:equalize_900ms_ease-in-out_infinite]`,
  `${barBase} h-full [animation:equalize_1100ms_ease-in-out_infinite]`,
  `${barBase} h-[65%] [animation:equalize_760ms_ease-in-out_infinite]`,
  `${barBase} h-[85%] [animation:equalize_980ms_ease-in-out_infinite]`,
  `${barBase} h-[55%] [animation:equalize_840ms_ease-in-out_infinite]`
];

// Paused is the same row gone quiet: bars frozen and dropped to muted, title
// dimmed. Hiding the row instead would flicker the TV on every host tap.
const pausedBarBase =
  "w-[clamp(3px,0.2vw,5px)] origin-bottom rounded-full bg-mutedWarmDim scale-y-[0.4]";

export const pausedBars: readonly string[] = [
  `${pausedBarBase} h-[45%]`,
  `${pausedBarBase} h-full`,
  `${pausedBarBase} h-[65%]`,
  `${pausedBarBase} h-[85%]`,
  `${pausedBarBase} h-[55%]`
];

export const equalizerPaused =
  "relative z-[1] flex h-[clamp(1.7rem,1.9vw,2.6rem)] flex-none items-end gap-[3px] rounded-[0.55rem] border border-text/10 bg-text/[0.04] px-[0.5rem] pb-[0.4rem] pt-[0.35rem]";

export const label =
  "relative z-[1] inline-flex flex-none items-center gap-[0.55em] text-[clamp(0.68rem,0.8vw,0.95rem)] font-extrabold uppercase tracking-[0.3em] text-mutedWarm";

export const labelDot =
  "h-[0.5em] w-[0.5em] rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary)]";

export const labelDotPaused = "h-[0.5em] w-[0.5em] rounded-full bg-mutedWarmDim";

export const title =
  "relative z-[1] min-w-0 flex-1 truncate text-[clamp(1rem,1.3vw,1.9rem)] font-bold tracking-[0.01em] text-text";

export const titlePaused =
  "relative z-[1] min-w-0 flex-1 truncate text-[clamp(1rem,1.3vw,1.9rem)] font-bold tracking-[0.01em] text-mutedWarm";

export const trackCount =
  "relative z-[1] flex-none rounded-full border border-text/10 bg-text/[0.05] px-[0.85em] py-[0.32em] font-mono text-[clamp(0.68rem,0.8vw,0.95rem)] font-bold tracking-[0.18em] tabular-nums text-mutedWarm";
