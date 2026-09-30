// The lobby's lit round card (SetupStageBody/styles `round`) as a row: the game's symbol in a
// lit badge, its name and a line of what you do beside it, and the pill that says whether you
// can play it on the end. A locked game is the lobby's open slot: same footprint, dashed and dim.
const cardBase =
  "relative isolate flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-[clamp(0.55rem,1.2vh,0.85rem)] text-left no-underline";

export const card = `${cardBase} border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] text-text transition-transform [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)] before:absolute before:inset-x-[12%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-ember before:to-transparent before:content-[''] active:scale-[0.98]`;

export const cardLocked = `${cardBase} border border-dashed border-mutedWarmDim/50 bg-bg/80 text-mutedWarm opacity-80`;

// The symbol's badge: the same lit disc the lobby's beacon sits in, big enough to read the
// lines at arm's length, and a thumb's width from the row's edge.
const badgeBase =
  "relative z-[1] flex h-[clamp(2.6rem,5.5vh,3rem)] w-[clamp(2.6rem,5.5vh,3rem)] flex-none items-center justify-center rounded-xl border p-[0.45rem]";

export const badge = `${badgeBase} border-primary/35 bg-primary/12 text-primary [box-shadow:0_0_16px_theme(colors.primary/28%),inset_0_1px_0_theme(colors.glow/14%)]`;

export const badgeLocked = `${badgeBase} border-text/10 bg-text/[0.05] text-mutedWarmDim`;

export const body = "relative z-[1] flex min-w-0 flex-1 flex-col gap-[0.2rem]";

export const title =
  "m-0 text-[clamp(1.05rem,min(4.6vw,2.3vh),1.3rem)] font-black uppercase leading-none tracking-[-0.005em] [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

export const summary =
  "m-0 text-[clamp(0.76rem,min(3.4vw,1.75vh),0.9rem)] font-medium leading-snug text-mutedWarm";

const pillBase =
  "relative z-[1] inline-flex flex-none items-center gap-[0.5em] rounded-full px-[0.85em] py-[0.45em] text-[0.68rem] font-bold uppercase tracking-[0.2em]";

export const pill = `${pillBase} border border-primary/50 bg-primary/15 text-text`;

export const pillLocked = `${pillBase} border border-text/10 bg-text/[0.05] text-mutedWarmDim`;

export const pillDot =
  "h-[0.5em] w-[0.5em] rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const pillDotLocked = "h-[0.5em] w-[0.5em] rounded-full bg-mutedWarmDim";
