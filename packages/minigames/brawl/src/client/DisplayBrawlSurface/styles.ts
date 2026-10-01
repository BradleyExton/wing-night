import { stageStatusLine } from "@wingnight/surface";

export const container = "flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-10 text-center";

export const introTitle =
  "m-0 font-voice text-[clamp(2.4rem,6vw,5rem)] font-bold italic leading-none text-text";

export const introDescription =
  "m-0 max-w-[46ch] text-[clamp(1rem,1.6vw,1.6rem)] leading-relaxed text-text/90";

export const stage = "relative flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

// The street's place on the wall until it is drawn: the arena's own rounded edge, no frame.
export const arenaArea =
  "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-surface";

export const statusLine = stageStatusLine;
