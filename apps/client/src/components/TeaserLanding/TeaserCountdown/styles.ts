export const container = "relative z-[2] flex flex-col items-center gap-3";

export const tiles = "flex items-stretch gap-[clamp(0.4rem,1.6vw,1rem)]";

// The lobby's lit round card, cut down to a scoreboard tile.
export const tile =
  "relative flex min-w-[clamp(3.8rem,15vw,6.5rem)] flex-col items-center rounded-xl border border-primary/20 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] px-2 py-[clamp(0.5rem,1.6vw,0.9rem)] backdrop-blur-[3px] [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)]";

export const value =
  "font-score text-[clamp(2rem,9vw,3.6rem)] font-bold leading-none tabular-nums text-text [text-shadow:0_0_18px_theme(colors.primary/45%)]";

export const unit =
  "mt-1 text-[clamp(0.6rem,2.4vw,0.8rem)] font-bold uppercase tracking-[0.24em] text-mutedWarm";

export const caption =
  "m-0 font-voice text-[clamp(1rem,3.8vw,1.35rem)] italic text-mutedWarm";
