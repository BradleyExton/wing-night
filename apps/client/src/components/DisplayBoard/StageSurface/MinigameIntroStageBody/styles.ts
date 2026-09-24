// The spotlight owns its own inset, and the stage canvas has none of its own
// (StageSurface/styles), so the genre texture and the glow below reach the
// screen edges. This used to be `absolute inset-0` to escape a canvas gutter
// that no longer exists; it is `relative h-full` like its sibling stages now.
export const container =
  "relative flex h-full flex-col items-center justify-center gap-[clamp(0.75rem,1.6vw,2rem)] overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,4vw,4rem)] text-center";

export const ambient =
  "pointer-events-none absolute inset-[-10%] bg-[radial-gradient(ellipse_at_20%_30%,rgba(249,115,22,0.12)_0%,transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(239,68,68,0.10)_0%,transparent_45%)]";

// z-10 lifts every beat over the genre texture (TeamAmbient, z-1).
export const beatBase =
  "relative z-10 opacity-0 animate-[reveal_600ms_ease_forwards] motion-reduce:opacity-100 motion-reduce:animate-none";

export const beatDelay1 = "[animation-delay:100ms]";
export const beatDelay2 = "[animation-delay:600ms]";
export const beatDelay3 = "[animation-delay:1100ms]";
export const beatDelay4 = "[animation-delay:1500ms]";

export const eyebrow =
  "inline-flex items-center text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.32em] text-muted";

// Crest scale: the emblem beside the eyebrow, lit by its own tint.
export const crest =
  "mr-[0.8em] h-[clamp(1.6rem,2.4vw,3rem)] [filter:drop-shadow(0_0_10px_color-mix(in_srgb,var(--tint)_50%,transparent))]";

export const eyebrowSeparator = "mx-[0.7em] text-muted/60";

// The genre reads in the team's own tint, the primary orange being the
// fallback --tint for a surface with no theme.
export const genre = "text-[var(--tint)]";

// The headline is the wordmark's entrance beat, not the reveal the other
// lines share, so the row carries no animation of its own; the wordmark's
// delay slots it where the old name used to arrive.
//
// Full width, and the wrap budget rides the wordmark's own `max-w-full`
// below: a `ch` clamp here would be measured in this row's 16px body font,
// not the display face two hundred pixels tall inside it.
export const headlineRow = "relative z-10 m-0 w-full";

// `block` is load-bearing, not decoration: TeamWordmark leaves display to the
// caller, and an inline box ignores the `max-w-full` that keeps a long name
// inside the stage, centres its overflowing lines on the box's left edge, and
// drops the transforms every `team-enter-*` entrance is built from.
export const headline =
  "block text-[clamp(3.5rem,9.5vw,11rem)] leading-[0.95] [--enter-delay:600ms]";

// The `none` kit's headline is what shipped before the kit: primary, black,
// upper, with the flame glow.
export const headlinePlain =
  "block text-[clamp(4.5rem,12vw,14rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-primary [text-shadow:0_0_80px_rgba(249,115,22,0.4)] [--enter-delay:600ms]";

export const teamName =
  "m-0 text-[clamp(4.5rem,12vw,14rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-primary [text-shadow:0_0_80px_rgba(249,115,22,0.4)]";

export const lineup = "h-[clamp(6rem,16vh,13.75rem)]";

export const post =
  "m-0 text-[clamp(1.2rem,2.2vw,2.4rem)] font-extrabold uppercase leading-none tracking-[0.16em] text-text";

export const postLabel = "mr-[0.6em] text-muted";
