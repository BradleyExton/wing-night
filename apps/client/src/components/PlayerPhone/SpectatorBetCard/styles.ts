// The bet card (mockups/spectator-bets): the player phone's warm glass, with the one choice the
// card asks for as two big buttons under the line. The card glows while there is something to
// tap, and on a bet called; it stays plain while it only waits on the TV.
export const hot =
  "border-primary [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_0_40px_-10px_theme(colors.primary/60%)]";

// On its side the phone is 390 tall: the line and the buttons shrink so both choices stay on
// screen without a scroll.
export const line = "flex flex-col items-center gap-1 py-1 landscape:py-0";

export const lineFigure =
  "m-0 font-score text-[clamp(4.5rem,24vw,6.5rem)] landscape:text-[min(16svh,4rem)] font-black leading-[0.9] tabular-nums text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";

export const lineUnit = "text-[0.72rem] font-extrabold uppercase tracking-[0.3em] text-mutedWarm";

export const choices = "grid grid-cols-2 gap-2.5";

const choiceBase =
  "flex min-h-[7rem] landscape:min-h-[4.25rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl text-[1.6rem] font-black uppercase leading-none tracking-[0.1em] transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const choice = `${choiceBase} border border-ember/35 bg-surface/60 text-text`;

export const choiceOn = `${choiceBase} border border-primary bg-primary text-bg [box-shadow:inset_0_-4px_0_theme(colors.shade/28%),0_10px_24px_-14px_theme(colors.primary/70%)]`;

export const glyph = "text-[1.3rem] text-primary";

export const glyphOn = "text-[1.3rem] text-bg";

export const title =
  "m-0 break-words text-[clamp(2rem,10vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

const stampBase = "m-0 text-[0.95rem] font-black uppercase tracking-[0.14em]";

export const stampWon = `${stampBase} text-success`;

export const stampLost = `${stampBase} text-mutedWarm`;

export const fine = "m-0 text-center text-[0.8rem] leading-snug text-mutedWarmDim";
