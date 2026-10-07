// The phones' way in, where the "Waiting for teams" pill sits (DESIGN.md
// §2.2B): the top-left corner, in the same warm glass and the same reveal, so
// the top line still reads as one with the now-playing pill across the screen.
// It is a card rather than a pill because a QR has to be big enough to read
// from the couch — the symbol about 220px at 1080p, 16cm on a 65" panel — and
// it lies on its side because the corner it may have is the strip beside the
// wordmark: tall enough for the code, never tall enough to reach the round
// cards. Every width is in `vw` so the card keeps clear of the wordmark (9vw
// type, ~23.5vw in from the edge) at any panel size; the caps only bite on a
// panel wide enough that the wordmark has stopped growing.
export const card = `pointer-events-none absolute left-[max(0.75rem,1vw)] top-[max(0.5rem,0.85vw)] z-[3] flex items-stretch gap-[0.6vw] rounded-[clamp(0.7rem,0.9vw,1.6rem)] border border-primary/30 bg-[linear-gradient(120deg,theme(colors.hearthGlass/90%)_0%,theme(colors.bg/88%)_78%)] p-[0.45vw] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%),0_0_22px_-8px_theme(colors.primary/35%),inset_0_1px_0_theme(colors.glow/14%)] [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_900ms_both] motion-reduce:[animation:none]`;

// A scanner wants dark modules on light with a quiet zone round them, whatever
// the hearth behind it. The code draws its own four-module zone, so the white
// plate is exactly the code and needs no padding.
export const plate =
  "block aspect-square w-[min(14.4vw,36rem)] flex-none overflow-hidden rounded-[clamp(0.35rem,0.5vw,0.9rem)] bg-text text-bg [&>svg]:h-full [&>svg]:w-full";

export const text =
  "flex w-[min(5.4vw,14rem)] flex-col justify-between gap-[0.6em] py-[0.35vw] pr-[0.2vw] text-left";

export const kicker =
  "text-[clamp(0.55rem,0.62vw,1.3rem)] font-extrabold uppercase leading-[1.35] tracking-[0.22em] text-mutedWarm";

export const instruction =
  "text-[clamp(0.7rem,0.92vw,2rem)] font-black uppercase leading-[1.05] tracking-[0.01em] text-text";

export const count =
  "font-score text-[clamp(0.85rem,1.25vw,2.6rem)] font-extrabold tabular-nums leading-none text-primary";
