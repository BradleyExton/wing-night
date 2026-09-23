// Lounge Set (DESIGN.md §2.13): the marquee row the rest of the show wears,
// and under it a near-empty stage — there is nothing to look at while a song
// plays, and pretending otherwise is how a listening game gets loud.
export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] p-[clamp(0.8rem,1.4vw,1.6rem)]";

export {
  marqueeBulbs,
  marqueeMeta,
  marqueeTeamName,
  marqueeTitle
} from "@wingnight/surface";

// The grand bulb marquee DRAWING built (DESIGN.md §2.5): team left, show title
// centre, the set's position right.
export const marquee =
  "relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.8rem,1.4vh,1.3rem)] shadow-[inset_0_0_36px_rgba(251,191,36,0.2),0_8px_20px_rgba(0,0,0,0.55)]";

export const marqueeCounter =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

const bodyBase =
  "flex min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

// The intro and the not-yet-arrived fallback are the whole surface, so they
// take the height themselves; the play body is a row under the marquee.
export const container = `${bodyBase} h-full`;

export const body = `${bodyBase} flex-1`;

export const prompt =
  "m-0 font-serif text-5xl font-bold italic leading-tight text-text [text-shadow:0_0_24px_rgba(251,191,36,0.35)]";

export const hint = "m-0 text-lg text-mutedWarm";

export const introTitle =
  "m-0 font-serif text-6xl font-bold italic leading-none text-text [text-shadow:0_0_28px_rgba(249,115,22,0.45)]";

export const introDescription =
  "m-0 max-w-3xl text-2xl leading-relaxed text-mutedWarm";

export const equalizer = "flex items-end justify-center gap-2 h-16";

export const equalizerBar =
  "w-3 rounded-full bg-primary shadow-[0_0_14px_#f97316] motion-safe:animate-pulse";

export const revealLabel =
  "text-xs font-extrabold uppercase tracking-[0.36em] text-mutedWarmDim";

export const revealTitle =
  "m-0 font-serif text-6xl font-bold leading-tight text-gold [text-shadow:0_0_30px_rgba(251,191,36,0.5)]";

export const revealArtist = "m-0 text-3xl font-semibold text-text";

export const revealArtistPrefix = "pr-2 text-2xl font-normal italic text-mutedWarm";

export const doneTitle =
  "m-0 font-serif text-5xl font-bold italic leading-tight text-text";
