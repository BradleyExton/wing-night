// Lounge Set (DESIGN.md §2.13): the marquee row the rest of the show wears,
// and under it a near-empty stage — there is nothing to look at while a song
// plays, and pretending otherwise is how a listening game gets loud.
export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] p-[clamp(0.8rem,1.4vw,1.6rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

export const marqueeCounter =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

const bodyBase =
  "flex min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

// The intro and the not-yet-arrived fallback are the whole surface, so they
// take the height themselves; the play body is a row under the marquee.
export const container = `${bodyBase} h-full`;

export const body = `${bodyBase} flex-1`;

export const prompt =
  "m-0 font-serif text-5xl font-bold italic leading-tight text-text [text-shadow:0_0_24px_theme(colors.gold/35%)]";

export const hint = "m-0 text-lg text-mutedWarm";

export const introTitle =
  "m-0 font-serif text-6xl font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

export const introDescription =
  "m-0 max-w-3xl text-2xl leading-relaxed text-mutedWarm";

export const equalizer = "flex items-end justify-center gap-2 h-16";

export const equalizerBar =
  "w-3 rounded-full bg-primary shadow-[0_0_14px_theme(colors.primary)] motion-safe:animate-pulse";

export const doneTitle =
  "m-0 font-serif text-5xl font-bold italic leading-tight text-text";

// The reveal card's ruling row, under the plaque's rule: one chip per half, in
// the plaque's own success/danger pair.
export const verdictRow = "flex flex-wrap items-center gap-[clamp(0.8rem,1.6vw,1.6rem)]";

const verdictChipBase =
  "flex items-center gap-3 rounded-2xl border-[3px] bg-surface px-[clamp(1.2rem,2vw,2rem)] py-[clamp(0.6rem,1.2vh,1.1rem)]";

export const verdictChipHit = `${verdictChipBase} border-success/60 shadow-[0_0_40px_theme(colors.success/25%)]`;

export const verdictChipMiss = `${verdictChipBase} border-danger/60 shadow-[0_0_40px_theme(colors.danger/25%)]`;

export const verdictField =
  "text-[clamp(0.72rem,1vw,1rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarm";

export const verdictGlyphHit =
  "text-[clamp(1.8rem,3vw,3rem)] font-black leading-none text-success";

export const verdictGlyphMiss =
  "text-[clamp(1.8rem,3vw,3rem)] font-black leading-none text-danger";

export const verdictWordHit =
  "text-[clamp(1rem,1.5vw,1.5rem)] font-extrabold uppercase tracking-[0.2em] text-success";

export const verdictWordMiss =
  "text-[clamp(1rem,1.5vw,1.5rem)] font-extrabold uppercase tracking-[0.2em] text-danger";

export const pointsNone = "m-0 text-lg text-mutedWarm";
