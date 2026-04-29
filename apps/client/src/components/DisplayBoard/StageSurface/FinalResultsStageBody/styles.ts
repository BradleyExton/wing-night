export const container =
  "relative flex h-full flex-col items-center justify-center gap-[clamp(0.75rem,1.6vw,2rem)] overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,4vw,4rem)] text-center";

export const ambient =
  "pointer-events-none absolute inset-[-10%] bg-[radial-gradient(ellipse_at_20%_30%,rgba(251,191,36,0.14)_0%,transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(249,115,22,0.12)_0%,transparent_45%)]";

export const beatBase =
  "relative opacity-0 animate-[reveal_600ms_ease_forwards] motion-reduce:opacity-100 motion-reduce:animate-none";

export const beatDelay1 = "[animation-delay:100ms]";
export const beatDelay2 = "[animation-delay:700ms]";
export const beatDelay3 = "[animation-delay:1500ms]";
export const beatDelay4 = "[animation-delay:2400ms]";

export const gameOver =
  "text-[clamp(1rem,1.4vw,1.6rem)] font-extrabold uppercase tracking-[0.42em] text-muted";

export const champion =
  "inline-flex items-center gap-[0.7em] text-[clamp(1rem,1.4vw,1.6rem)] font-extrabold uppercase tracking-[0.42em] text-gold";

export const championIcon =
  "h-[1.4em] w-[1.4em] [filter:drop-shadow(0_0_12px_rgba(251,191,36,0.7))]";

export const teamName =
  "m-0 text-[clamp(5rem,14vw,18rem)] font-black uppercase leading-[0.85] tracking-[-0.03em] text-gold [text-shadow:0_0_100px_rgba(251,191,36,0.55),0_0_240px_rgba(251,191,36,0.3)]";

export const score =
  "m-0 inline-flex items-baseline gap-[0.4em]";

export const scoreNum =
  "font-mono text-[clamp(2.5rem,6vw,7rem)] font-black tabular-nums leading-none tracking-[-0.05em] text-text";

export const scoreUnit =
  "text-[clamp(1.1rem,1.8vw,2.2rem)] font-extrabold uppercase tracking-[0.16em] text-muted";
