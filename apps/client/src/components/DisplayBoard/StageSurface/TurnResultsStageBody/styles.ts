export const container =
  "relative flex h-full flex-col items-center justify-center gap-[clamp(0.75rem,1.6vw,2rem)] overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,4vw,4rem)] text-center";

export const ambient =
  "pointer-events-none absolute inset-[-10%] bg-[radial-gradient(ellipse_at_30%_30%,rgba(249,115,22,0.10)_0%,transparent_45%),radial-gradient(ellipse_at_70%_70%,rgba(132,204,22,0.08)_0%,transparent_45%)]";

export const beatBase =
  "relative opacity-0 animate-[reveal_600ms_ease_forwards] motion-reduce:opacity-100 motion-reduce:animate-none";

export const beatDelay1 = "[animation-delay:100ms]";
export const beatDelay2 = "[animation-delay:600ms]";
export const beatDelay3 = "[animation-delay:1100ms]";
export const beatDelay4 = "[animation-delay:1500ms]";

export const eyebrow =
  "inline-flex items-center gap-[0.7em] text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.32em] text-muted";

export const eyebrowIcon =
  "h-[1.4em] w-[1.4em] text-primary [filter:drop-shadow(0_0_6px_rgba(249,115,22,0.5))]";

export const teamName =
  "relative m-0 text-[clamp(4rem,11vw,13rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-text/55 [text-shadow:0_0_60px_rgba(249,115,22,0.2)]";

export const strikethrough =
  "pointer-events-none absolute left-[8%] right-[8%] top-1/2 h-1 origin-center -translate-y-1/2 rounded-full bg-primary opacity-0 animate-[strikethrough_500ms_ease_forwards] [animation-delay:1200ms] motion-reduce:opacity-100 motion-reduce:animate-none motion-reduce:[transform:translateY(-50%)]";

export const dotsRow =
  "inline-flex items-center gap-[clamp(0.5rem,1vw,1rem)]";

export const dotBase =
  "h-[clamp(1rem,1.6vw,1.6rem)] w-[clamp(1rem,1.6vw,1.6rem)] rounded-full border-2 border-text/20";

export const dotDone = "bg-primary border-primary";

export const dotJustDone =
  "bg-primary border-primary shadow-[0_0_14px_rgba(249,115,22,0.65)]";

export const next =
  "m-0 text-[clamp(1rem,1.4vw,1.5rem)] font-bold uppercase tracking-[0.28em] text-muted";

export const nextArrow = "mr-[0.5em] text-primary";
