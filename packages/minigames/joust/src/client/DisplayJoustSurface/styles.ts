import { stageStatusLine } from "@wingnight/surface";

export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

// Scene art, licensed by DESIGN.md §2.7: the lane's dusk sky and sand. Not chrome, so no token.
const sceneDusk =
  "bg-[linear-gradient(180deg,#160c2a_0%,#4a1f3f_54%,#c2582c_86.6%,#d6ac63_86.7%,#b58a45_100%)]";

export const arenaArea = `relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-ember/20 ${sceneDusk} shadow-[inset_0_0_40px_theme(colors.shade/55%)]`;

// The venue, named where it is rather than on the marquee (which names the show, §2.2D): a small
// plaque hung in the scene's top-left corner, the way a beach carries its own sign.
export const venuePlaque =
  "pointer-events-none absolute left-[clamp(0.8rem,1.4vw,1.6rem)] top-[clamp(0.6rem,1.2vh,1.2rem)] z-10 rounded-md bg-bg/70 px-[0.9em] py-[0.35em] text-[clamp(0.9rem,1.1vw,1.4rem)] font-extrabold uppercase tracking-[0.22em] text-text/85";

// Where the shot's `<ResultPlaque>` (DESIGN.md §2.2E) hangs: over the top of the
// lane, so the pile it describes stays in view under it.
export const resultOverlay =
  "pointer-events-none absolute inset-x-0 top-[6%] z-20 flex justify-center px-[8%]";

export const statusLine = stageStatusLine;

export const container =
  "flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

export const hint = "m-0 text-[clamp(1.1rem,1.4vw,1.6rem)] text-mutedWarm";

export const introTitle =
  "m-0 font-voice text-[clamp(2.8rem,5vw,5.6rem)] font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

export const introDescription = "m-0 max-w-3xl text-[clamp(1.3rem,1.8vw,2.2rem)] leading-relaxed text-mutedWarm";

export const doneTitle =
  "m-0 font-voice text-[clamp(2.4rem,4vw,4.6rem)] font-bold italic leading-tight text-text";
