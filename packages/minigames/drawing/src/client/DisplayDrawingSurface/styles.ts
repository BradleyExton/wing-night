import { stageStatusLine } from "@wingnight/surface";

export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D);
// this surface only says what it reads.

export const canvasArea = "relative flex min-h-0 flex-1";

export const idleOverlay =
  "absolute inset-0 z-10 grid place-items-center px-[10%] text-center";

export const idleText =
  "m-0 font-serif text-[clamp(1.4rem,2.4vw,2.6rem)] italic text-text/70";

export const revealOverlay =
  "absolute inset-0 z-20 grid place-items-center px-[8%]";

export const spark =
  "absolute z-10 motion-safe:animate-pulse text-[clamp(1.2rem,1.6vw,1.9rem)] text-gold";

export const sparkOne = "left-[12%] top-[10%]";

export const sparkTwo = "right-[14%] top-[18%] [animation-delay:0.3s]";

export const sparkThree = "bottom-[20%] left-[22%] [animation-delay:0.6s]";

export const sparkFour = "bottom-[14%] right-[28%] [animation-delay:0.9s]";

export const statusLine = stageStatusLine;
