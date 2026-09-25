export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).
export const marqueeShot =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-muted";


// Scene art, licensed by DESIGN.md §2.7: the lane's dusk sky and sand. Not chrome, so no token.
const sceneDusk =
  "bg-[linear-gradient(180deg,#160c2a_0%,#4a1f3f_54%,#c2582c_86.6%,#d6ac63_86.7%,#b58a45_100%)]";

export const arenaArea = `relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-ember/20 ${sceneDusk} shadow-[inset_0_0_40px_theme(colors.shade/55%)]`;

// The venue, named where it is rather than on the marquee (which names the show, §2.2D): a small
// plaque hung in the scene's top-left corner, the way a beach carries its own sign.
export const venuePlaque =
  "pointer-events-none absolute left-[clamp(0.8rem,1.4vw,1.6rem)] top-[clamp(0.6rem,1.2vh,1.2rem)] z-10 rounded-md bg-bg/70 px-[0.9em] py-[0.35em] text-[clamp(0.9rem,1.1vw,1.4rem)] font-extrabold uppercase tracking-[0.22em] text-text/85";

export const resultOverlay =
  "pointer-events-none absolute inset-x-0 top-[6%] z-20 flex justify-center px-[8%]";

export const resultPlaque =
  "flex items-center gap-[clamp(1rem,2vw,2rem)] rounded-2xl border-[3px] border-gold bg-gradient-to-b from-surface to-bg px-[clamp(1.6rem,2.8vw,2.8rem)] py-[clamp(0.8rem,1.4vh,1.4rem)] shadow-[0_0_70px_theme(colors.gold/35%),0_14px_32px_theme(colors.shade/60%)]";

export const resultPlaqueMiss = "border-text/25 shadow-[0_14px_32px_theme(colors.shade/60%)]";

export const resultTitle =
  "m-0 text-[clamp(2rem,3.6vw,3.8rem)] font-black uppercase leading-none tracking-[0.06em] text-gold [text-shadow:0_0_24px_theme(colors.gold/50%)]";

export const resultTitleMiss = "text-text";

export const resultBlurb =
  "m-0 mt-1 font-serif text-[clamp(0.9rem,1.5vw,1.6rem)] italic text-mutedWarm";

export const resultPoints =
  "font-mono text-[clamp(2.4rem,4vw,4.2rem)] font-black leading-none text-gold [text-shadow:0_0_18px_theme(colors.gold/50%)]";

export const statusLine =
  "m-0 text-center text-[clamp(0.85rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.26em] text-primary";

export const container =
  "flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

export const hint = "m-0 text-lg text-mutedWarm";

export const introTitle =
  "m-0 font-serif text-6xl font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

export const introDescription = "m-0 max-w-3xl text-2xl leading-relaxed text-mutedWarm";

export const doneTitle =
  "m-0 font-serif text-5xl font-bold italic leading-tight text-text";
