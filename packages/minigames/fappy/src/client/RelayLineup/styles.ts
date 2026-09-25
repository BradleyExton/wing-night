// The relay's running order, as faces. Every size below is in `em`, and the
// only thing that differs between the tablet's strip and the wall's is the
// font-size on the row: 8px gives a 40px chip on the host's chrome row, 12.8px
// gives a 64px one the room reads from a sofa. One set of chip styles, two
// roots — not two copies of a chip that would drift apart.

const ROW = "flex items-center gap-[0.55em]";

// The host's chrome row (docs/takeover-layout-api.md §5, `counter`). Glass,
// like the counts beside it, and only 4px taller than the 36px chips it sits
// with, so the corridor loses nothing worth having.
export const container = `${ROW} rounded-full border border-text/10 bg-bg/85 px-[0.7em] py-[0.35em] text-[0.5rem] backdrop-blur`;

// The wall's strip, under the marquee: the same row at 60px, centred because
// the TV has no left edge to hang a row of chips off. Every pixel of height
// here costs the letterboxed corridor under it 16/9 pixels of width, which is
// why it is at the bottom of the 56–64px band rather than the top.
export const containerWall = `${ROW} justify-center text-[0.75rem]`;

export const title =
  "text-[1.2em] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

// The chip is the disc plus whatever badge its state earns; the badges hang
// off its edge, so it does not clip.
const CHIP =
  "relative inline-flex h-[5em] w-[5em] shrink-0 items-center justify-center rounded-full border-[0.25em] transition-colors";

export const chip = `${CHIP} border-text/15`;

// Cleared: still legible, deliberately out of the way of the leg in hand.
export const chipCleared = `${CHIP} border-text/20 opacity-45`;

// In hand: the team's own colour, lit. `border-current` and the glow both read
// the fill class the cast resolved for that player's bird, so the chip and the
// hen in the corridor are one colour by construction.
export const chipFlying = `${CHIP} border-current shadow-[0_0_0.9em_currentColor]`;

export const chipNext = `${CHIP} border-current`;

// The pulse rides a ring of its own rather than the chip, so a face never
// fades in and out — only the halo around it does.
export const nextRing =
  "pointer-events-none absolute -inset-[0.32em] rounded-full border-[0.22em] border-current motion-safe:animate-pulse";

// The face itself, clipped to the chip's inside edge.
export const disc = "h-full w-full overflow-hidden rounded-full";

export const tick =
  "absolute -bottom-[0.25em] -right-[0.25em] flex h-[2em] w-[2em] items-center justify-center rounded-full bg-bg text-[1.1em] font-black leading-none text-gold";

export const crashes =
  "absolute -right-[0.35em] -top-[0.35em] flex min-w-[2em] items-center justify-center rounded-full bg-bg px-[0.3em] font-score tabular-nums text-[1.1em] font-bold leading-[1.7] text-heat";

// The one word the room needs: who has the tablet next. Overlaps the chin of
// the chip it belongs to, so it costs the row no height at all.
export const nextTag =
  "absolute -bottom-[0.7em] left-1/2 -translate-x-1/2 rounded-full bg-primary px-[0.5em] text-[1.05em] font-extrabold uppercase leading-[1.5] tracking-[0.12em] text-bg";

export const name = "sr-only";
