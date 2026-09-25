// The TV's minigame marquee, "Neon Heat Line" (DESIGN.md §2.2D, ADR-0006):
// no box, no border, no bulb ring. A small neon-tube kicker naming the show, the
// team's name in white light under it, the turn's readout and the shell's clock
// pill on the right, and under the whole row a glass track that the shell's
// clock lights up and burns down. Chrome made of light rather than material,
// which is what a bar with a wing night on actually has on its wall.
//
// Gold is the marquee accent, the same scoped exception to §0.1 every marquee
// held; `primary` and `heat` belong to the clock and arrive on the shell's
// pieces (`MinigameTimerChip`, `MinigameTimerLine`), not here. The glows are
// `theme()` lookups so a house path still carries no raw hex.
export const marquee =
  "grid gap-y-[clamp(0.55rem,1.1vh,1rem)] px-[clamp(0.4rem,0.8vw,0.8rem)]";

export const row = "flex items-end justify-between gap-8";

export const lead = "min-w-0";

// The tube. `signflicker` (keyframes.css) dips the whole sign for a frame or
// two every few seconds, the way a tired transformer does.
export const kicker =
  "m-0 mb-[0.25em] font-marquee-title text-[clamp(0.9rem,1.5vw,1.7rem)] uppercase leading-none tracking-[0.14em] text-text [text-shadow:0_0_5px_theme(colors.text),0_0_12px_theme(colors.gold),0_0_28px_theme(colors.gold),0_0_50px_theme(colors.gold/50%)] motion-safe:[animation:signflicker_4.2s_steps(1)_infinite]";

export const team =
  "m-0 flex items-baseline gap-[0.4em] font-marquee-name text-[clamp(2.2rem,4vw,4.4rem)] uppercase leading-[0.95] tracking-[0.04em] text-text [text-shadow:0_0_8px_theme(colors.text/50%),0_0_24px_theme(colors.text/18%)]";

export const teamName = "truncate";

export const pending =
  "shrink-0 font-score tabular-nums text-[0.4em] font-extrabold tracking-normal text-gold [text-shadow:0_0_8px_theme(colors.gold),0_0_20px_theme(colors.gold/50%)]";

export const pendingLabel = "font-sans text-[0.55em] uppercase tracking-[0.2em]";

// A ROW, not a reserve: the readout and the clock are ordinary children, so a
// game with no clock and nothing to count pays nothing here. Nothing may grow
// a padding or a min-width — that is the corner-reserve bug T5.3 abolished.
export const meta =
  "flex shrink-0 items-center gap-[clamp(1rem,2vw,2rem)] text-right";

// The turn's readout, in one label type for every game (it was `muted` on three,
// `mutedWarmDim` on three and its own size on RECREATE). A game's plain text
// inherits it; a live figure resets it with `readoutFigure`.
export const readout =
  "flex items-baseline gap-[clamp(0.8rem,1.6vw,1.6rem)] text-[clamp(0.8rem,1.05vw,1.15rem)] font-extrabold uppercase tracking-[0.24em] text-mutedWarm";

// The glass track is the marquee's; what lights it is the shell's
// `MinigameTimerLine`, in the `clockLine` slot. A host-paced game gets the
// dark track alone, which is the rule under the sign.
export const track =
  "relative h-[clamp(8px,1.1vh,12px)] rounded-full bg-text/5 shadow-[inset_0_0_0_1px_theme(colors.text/8%)]";
