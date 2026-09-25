import { stageStatusLine } from "@wingnight/surface";

export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D);
// this surface only says what it reads.

export const canvasArea = "relative flex min-h-0 flex-1";

export const idleOverlay =
  "absolute inset-0 z-10 grid place-items-center px-[10%] text-center";

export const idleText =
  "m-0 font-voice text-[clamp(1.4rem,2.4vw,2.6rem)] italic text-text/70";

export const revealOverlay =
  "absolute inset-0 z-20 grid place-items-center px-[8%]";

// Each spark carries its whole animation, delay folded into the shorthand: a
// separate `animation-delay` beside `animate-pulse` is overwritten by the
// shorthand and the four sparks pulsed in lockstep.
export const spark = "absolute z-10 text-[clamp(1.2rem,1.6vw,1.9rem)] text-gold";

// Written out in full rather than built by a helper: Tailwind only generates a
// class it can read literally in the source.
export const sparkOne =
  "left-[12%] top-[10%] motion-safe:[animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_0s_infinite]";

export const sparkTwo =
  "right-[14%] top-[18%] motion-safe:[animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_0.3s_infinite]";

export const sparkThree =
  "bottom-[20%] left-[22%] motion-safe:[animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_0.6s_infinite]";

export const sparkFour =
  "bottom-[14%] right-[28%] motion-safe:[animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_0.9s_infinite]";

export const statusLine = stageStatusLine;
