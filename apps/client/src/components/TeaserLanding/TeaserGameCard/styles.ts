// The lobby's lit round card (SetupStageBody/styles `round`), as a link. A locked game is the
// lobby's open slot: same footprint, dashed and dim.
const cardBase =
  "relative isolate flex flex-col items-center overflow-hidden rounded-2xl px-4 py-4 text-center no-underline";

export const card = `${cardBase} border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] text-text backdrop-blur-[3px] transition-transform [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)] before:absolute before:inset-x-[12%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-ember before:to-transparent before:content-[''] active:scale-[0.98]`;

export const cardLocked = `${cardBase} border border-dashed border-mutedWarmDim/50 bg-bg/80 text-mutedWarm opacity-80 backdrop-blur-[2px]`;

export const title =
  "relative z-[1] m-0 text-[clamp(1.4rem,5.5vw,2rem)] font-black uppercase leading-[0.95] [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

export const summary = "relative z-[1] mb-0 mt-2 text-sm font-medium leading-snug text-mutedWarm";

const pillBase =
  "relative z-[1] mt-3 inline-flex items-center gap-[0.55em] rounded-full px-[0.95em] py-[0.4em] text-xs font-bold uppercase tracking-[0.2em]";

export const pill = `${pillBase} border border-primary/50 bg-primary/15 text-text`;

export const pillLocked = `${pillBase} border border-text/10 bg-text/[0.05] text-mutedWarmDim`;

export const pillDot =
  "h-[0.5em] w-[0.5em] rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const pillDotLocked = "h-[0.5em] w-[0.5em] rounded-full bg-mutedWarmDim";
