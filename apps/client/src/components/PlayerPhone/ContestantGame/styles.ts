// A contestant's own leg, on their phone (mockups/contestant-phone, frames 1–2). The game's host
// surface fills the phone frame; the shell adds one chip where the party's mini-rail would sit —
// whose leg this is — and nothing else: no hatches, no totals, no sound.
export const rail =
  "inline-flex items-center gap-2 rounded-full border border-text/10 bg-shade/60 py-1.5 pl-2.5 pr-3.5 text-sm font-bold uppercase tracking-[0.14em] text-text backdrop-blur-[3px]";

export const railDot = "h-2.5 w-2.5 flex-none rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const waiting =
  "flex h-full items-center justify-center font-voice text-xl italic text-mutedWarm";

// Over the game for one beat, and never in the way of it: the first tap lands on the game.
export const hold =
  "pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-shade/35 [animation:reveal_300ms_ease_both]";

export const holdCard =
  "flex w-[min(24rem,80vw)] flex-col items-center gap-2 rounded-2xl border border-primary bg-[linear-gradient(180deg,theme(colors.hearthGlass/90%)_0%,theme(colors.shade/95%)_100%)] p-5 text-center [box-shadow:0_0_40px_-10px_theme(colors.primary/60%)]";

export const holdEyebrow = "m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.36em] text-mutedWarm";

export const holdTitle =
  "m-0 text-[2.4rem] font-black uppercase leading-none [text-shadow:0_0_18px_theme(colors.primary/45%)]";

export const holdVoice = "m-0 font-voice text-base italic text-mutedWarm";
