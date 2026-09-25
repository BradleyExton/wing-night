// Question Card (DESIGN.md §2.12): the marquee row the rest of the show wears,
// and under it one question at the largest size the TV can carry.
export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

// The marquee sets the readout's type (DESIGN.md §2.2D); a spent turn only
// lights it `primary`, the one thing the room has to notice.
export const marqueeCounterComplete = "text-primary";

export const container =
  "flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1.5rem,3vw,3rem)] px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,2vw,2rem)] text-center";

export const question =
  "m-0 max-w-[22ch] text-balance text-[clamp(2.8rem,6.5vw,8rem)] font-black leading-[1.05] tracking-[-0.02em] text-text";

export const underline =
  "block h-[6px] w-[clamp(120px,14vw,240px)] rounded-full bg-primary";

export const introContainer =
  "flex h-full flex-col items-center justify-center gap-[clamp(1rem,2vw,2rem)] px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,2vw,2rem)] text-center";

export const introText =
  "m-0 text-[clamp(1.4rem,2.4vw,2.6rem)] font-semibold uppercase tracking-[0.18em] text-muted";

export const fallbackTitle =
  "m-0 text-[clamp(1.4rem,2.4vw,2.6rem)] font-semibold uppercase tracking-[0.18em] text-muted";
