// The loadout rides INSIDE the arena frame, over sky at top-right, the way the
// lane plate rides top-left: it is what is on the band, which is the scene's
// business, not the chrome's. `top` clears the shell's chrome row. The row
// itself takes no pointer — every pixel of the frame under it is the drag
// surface that fires the shot — and hands it back to its buttons alone, so a
// pull that starts beside a button still pulls.
export const dock =
  "pointer-events-none absolute right-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(4.4rem,8vh,5.2rem)] flex max-w-[min(60vw,34rem)] flex-wrap justify-end gap-1.5";

export const label =
  "sr-only";

const button =
  "pointer-events-auto flex min-h-14 min-w-[5.6rem] flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed";

export const kind = `${button} border-text/15 bg-bg/75 hover:border-primary/60`;

// Selection is emphasis, so `primary` — `gold` is the winner's colour (DESIGN.md §0.1).
export const kindSelected = `${button} border-primary bg-bg/90 shadow-[0_0_0_2px_theme(colors.primary/35%)]`;

export const kindSpent = `${button} border-text/10 bg-bg/50 opacity-40`;

export const icon = "block h-7 w-12";

export const name = "m-0 text-[0.68rem] font-extrabold uppercase leading-none tracking-[0.1em] text-text";

export const uses = "m-0 text-[0.62rem] leading-none text-mutedWarm";

export const usesSelected = "m-0 text-[0.62rem] leading-none text-primary";
