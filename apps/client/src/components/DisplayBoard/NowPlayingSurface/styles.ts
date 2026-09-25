// A pill in the top-right corner of the display, not a full-bleed row: music
// runs underneath whatever the stage is doing, so it gets the quietest corner
// on screen rather than a band of its own. It balances the brand cluster the
// StageContextHeader puts in the top-left and shares that header's insets, so
// the two read as one top line. Floating over the stage is safe — the only
// other thing that claims this corner is the MINIGAME countdown, and music
// never plays during a minigame (lobby is SETUP, the anthem is MINIGAME_INTRO).
const containerBase =
  "pointer-events-none absolute right-4 top-2 z-30 flex max-w-[min(42vw,34rem)] items-center gap-[clamp(0.5rem,0.85vw,0.95rem)] rounded-full py-[clamp(0.3rem,0.55vh,0.5rem)] pl-[clamp(0.4rem,0.55vw,0.6rem)] pr-[clamp(0.9rem,1.3vw,1.4rem)] backdrop-blur-[6px] [animation:reveal_500ms_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:[animation:none] md:right-8 md:top-4 2xl:right-12";

export const container = `${containerBase} border border-primary/30 bg-[linear-gradient(120deg,theme(colors.hearthGlass/88%)_0%,theme(colors.bg/86%)_72%)] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%),0_0_22px_-8px_theme(colors.primary/35%),inset_0_1px_0_theme(colors.glow/14%)]`;

// Paused is the same pill gone cold: the ember glow and warm fill drop out,
// bars freeze, text drops to muted. Hiding it would flicker the TV on every
// host tap.
export const containerPaused = `${containerBase} border border-text/10 bg-[linear-gradient(120deg,theme(colors.surface/88%)_0%,theme(colors.bg/86%)_72%)] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%)]`;

// The equalizer sits in a lit badge so the moving bars have an edge to move
// against from across the room.
export const equalizer =
  "flex h-[clamp(1.5rem,1.7vw,2.3rem)] w-[clamp(1.5rem,1.7vw,2.3rem)] flex-none items-end justify-center gap-[3px] rounded-full border border-primary/35 bg-primary/12 pb-[0.42em] pt-[0.3em] [box-shadow:0_0_16px_theme(colors.primary/28%),inset_0_1px_0_theme(colors.glow/14%)]";

export const equalizerPaused =
  "flex h-[clamp(1.5rem,1.7vw,2.3rem)] w-[clamp(1.5rem,1.7vw,2.3rem)] flex-none items-end justify-center gap-[3px] rounded-full border border-text/10 bg-text/[0.04] pb-[0.42em] pt-[0.3em]";

// Authored constants per bar, like the embers' particle list: each bar's
// height and period is a static utility class rather than a computed style
// prop. The periods differ so the bars never fall into lockstep, which is what
// a shared period plus per-bar delays used to do (the shorthand resets the
// delay, see Embers/styles.ts). Four bars, not five: the pill is narrow and
// the round badge wants a squarer cluster than the old row did.
const barBase =
  "w-[clamp(2.5px,0.18vw,4px)] origin-bottom rounded-full bg-primary [box-shadow:0_0_6px_theme(colors.primary/80%)] motion-reduce:[animation:none] motion-reduce:scale-y-[0.4]";

export const bars: readonly string[] = [
  `${barBase} h-[45%] [animation:equalize_900ms_ease-in-out_infinite]`,
  `${barBase} h-full [animation:equalize_1100ms_ease-in-out_infinite]`,
  `${barBase} h-[65%] [animation:equalize_760ms_ease-in-out_infinite]`,
  `${barBase} h-[85%] [animation:equalize_980ms_ease-in-out_infinite]`
];

const pausedBarBase =
  "w-[clamp(2.5px,0.18vw,4px)] origin-bottom rounded-full bg-mutedWarmDim scale-y-[0.4]";

export const pausedBars: readonly string[] = [
  `${pausedBarBase} h-[45%]`,
  `${pausedBarBase} h-full`,
  `${pausedBarBase} h-[65%]`,
  `${pausedBarBase} h-[85%]`
];

// Label over title, because a pill has far less width than the old row: the
// two stack into one column so the title keeps the width it needs to be
// readable from the couch.
export const textColumn = "flex min-w-0 flex-col gap-[0.12em]";

export const label =
  "inline-flex items-center gap-[0.5em] truncate text-[clamp(0.72rem,0.75vw,1.05rem)] font-extrabold uppercase leading-none tracking-[0.26em] text-mutedWarm";

export const labelDot =
  "h-[0.5em] w-[0.5em] flex-none rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary)]";

export const labelDotPaused =
  "h-[0.5em] w-[0.5em] flex-none rounded-full bg-mutedWarmDim";

export const title =
  "truncate text-[clamp(0.85rem,1vw,1.4rem)] font-bold leading-tight tracking-[0.01em] text-text";

export const titlePaused =
  "truncate text-[clamp(0.85rem,1vw,1.4rem)] font-bold leading-tight tracking-[0.01em] text-mutedWarm";
