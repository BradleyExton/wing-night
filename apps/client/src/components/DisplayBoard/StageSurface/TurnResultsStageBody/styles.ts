export const container =
  "relative flex h-full flex-col items-center justify-center gap-[clamp(0.75rem,1.6vw,2rem)] overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,4vw,4rem)] text-center";

export const ambient =
  "pointer-events-none absolute inset-[-10%] bg-[radial-gradient(ellipse_at_30%_30%,theme(colors.primary/10%)_0%,transparent_45%),radial-gradient(ellipse_at_70%_70%,theme(colors.ember/8%)_0%,transparent_45%)]";

// z-10 lifts every beat over the genre texture (TeamAmbient, z-1).
export const beatBase =
  "relative z-10 opacity-0 animate-[reveal_600ms_ease_forwards] motion-reduce:opacity-100 motion-reduce:animate-none";

export const beatDelay1 = "[animation-delay:100ms]";
export const beatDelay2 = "[animation-delay:600ms]";
export const beatDelay3 = "[animation-delay:1100ms]";
export const beatDelay4 = "[animation-delay:1500ms]";

export const eyebrow =
  "inline-flex items-center gap-[0.7em] text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.32em] text-muted";

export const eyebrowIcon =
  "h-[1.4em] w-[1.4em] text-primary [filter:drop-shadow(0_0_6px_theme(colors.primary/50%))]";

export const teamName =
  "relative m-0 text-[clamp(4rem,11vw,13rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-text/55 [text-shadow:0_0_60px_theme(colors.primary/20%)]";

// The wordmark inherits the row's dimmed type; a treatment that owns its
// colour shows through at full strength under the strike, which is the point.
export const teamWordmark = "text-[clamp(4rem,11vw,13rem)] leading-[0.9]";

// The team is struck through, one stroke per line of its name. It used to be a
// single bar across the middle of the box, which on a two-line wordmark
// (DISCO / INFERNO) ran through the gap between the lines and crossed out
// nothing. A text decoration follows the lines; `strike-in` fades it in on the
// beat the bar used to draw on (index.css).
export const struck =
  "line-through decoration-primary decoration-[0.07em] [text-decoration-skip-ink:none] motion-safe:[animation:strike-in_500ms_ease_1200ms_both]";

export const dotsRow =
  "inline-flex items-center gap-[clamp(0.5rem,1vw,1rem)]";

export const dotBase =
  "h-[clamp(1rem,1.6vw,1.6rem)] w-[clamp(1rem,1.6vw,1.6rem)] rounded-full border-2 border-text/20";

export const dotDone = "bg-primary border-primary";

export const dotJustDone =
  "bg-primary border-primary shadow-[0_0_14px_theme(colors.primary/65%)]";

export const next =
  "m-0 text-[clamp(1rem,1.4vw,1.5rem)] font-bold uppercase tracking-[0.28em] text-muted";

export const nextArrow = "mr-[0.5em] text-primary";
