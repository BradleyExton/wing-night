export const root = "relative isolate overflow-hidden";

export const atmosphereLayer =
  "pointer-events-none absolute -inset-x-[8%] -inset-y-[18%] z-0 rounded-full bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-3xl [animation:spin_90s_linear_infinite] motion-reduce:[animation:none]";

export const heroGrid =
  "relative z-10 grid gap-[clamp(1rem,1.8vw,2rem)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-center";

export const heroCopy = "grid content-start gap-[clamp(0.65rem,1.1vh,1.2rem)]";

export const eyebrow =
  "m-0 text-[clamp(0.88rem,0.9vw,1.3rem)] font-semibold uppercase tracking-[0.18em] text-primary/90";

export const title =
  "m-0 text-[clamp(2.4rem,4.1vw,5.2rem)] font-black uppercase leading-[0.94] tracking-[0.03em] text-text";

export const summary =
  "m-0 max-w-[38ch] text-[clamp(1.05rem,1.02vw,1.55rem)] leading-[1.4] text-text/85";

export const metaGrid = "grid gap-[clamp(0.65rem,1vw,1rem)] sm:grid-cols-2";

export const metaCard =
  "rounded-[clamp(0.7rem,1vw,1rem)] border border-primary/35 bg-surface/75 px-[clamp(0.75rem,1vw,1.2rem)] py-[clamp(0.7rem,1vh,1.05rem)]";

export const metaLabel =
  "m-0 text-[clamp(0.7rem,0.75vw,1rem)] font-semibold uppercase tracking-[0.16em] text-muted";

export const metaValue =
  "mt-[clamp(0.35rem,0.6vh,0.65rem)] m-0 text-[clamp(1.35rem,1.45vw,2.3rem)] font-black uppercase leading-tight text-text";

export const heroIllustrationShell =
  "relative m-0 flex min-h-[clamp(12rem,30vh,21rem)] items-center justify-center overflow-hidden rounded-[clamp(0.75rem,1.2vw,1.2rem)] border border-primary/30 bg-surfaceAlt/55 p-[clamp(0.65rem,1.1vw,1.25rem)] shadow-2xl";

export const heroIllustrationGlow =
  "pointer-events-none absolute inset-x-[18%] bottom-[14%] h-[clamp(1.5rem,2.4vw,3.2rem)] rounded-full bg-primary/25 blur-xl [animation:pulse_8s_ease-in-out_infinite] motion-reduce:[animation:none]";

export const heroIllustration =
  "relative z-10 h-full max-h-[clamp(13rem,32vh,22rem)] w-full max-w-[clamp(18rem,35vw,40rem)] object-contain";

export const sparkField =
  "pointer-events-none absolute inset-x-[14%] bottom-[14%] z-20 h-[38%]";

export const sparkGlow =
  "absolute left-1/2 bottom-[14%] h-[clamp(0.7rem,1vw,1.25rem)] w-[clamp(3.4rem,7vw,8.2rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary/35 to-transparent blur-[2px]";

export const spark =
  "absolute rounded-full bg-primary/75 [will-change:transform,opacity] motion-reduce:[animation:none] motion-reduce:opacity-30";

export const sparkOne =
  "left-[38%] bottom-[16%] h-[clamp(0.2rem,0.3vw,0.4rem)] w-[clamp(0.2rem,0.3vw,0.4rem)] [--spark-drift:-0.35rem] [--spark-rise:3.3rem] [animation:sparkFloat_3.6s_cubic-bezier(0.24,0.66,0.25,1)_200ms_infinite]";

export const sparkTwo =
  "left-[58%] bottom-[13%] h-[clamp(0.2rem,0.3vw,0.4rem)] w-[clamp(0.2rem,0.3vw,0.4rem)] [--spark-drift:0.3rem] [--spark-rise:3.7rem] [animation:sparkFloat_3.2s_cubic-bezier(0.24,0.66,0.25,1)_900ms_infinite]";

export const sparkTrail =
  "absolute w-[2px] rounded-full bg-gradient-to-t from-primary/0 via-primary/55 to-primary/0 opacity-60 [will-change:transform,opacity] motion-reduce:[animation:none] motion-reduce:opacity-25";

export const sparkTrailOne =
  "left-[45%] bottom-[16%] h-[clamp(0.52rem,0.75vw,0.85rem)] -rotate-[14deg] [--spark-drift:0.26rem] [--spark-rise:3.75rem] [animation:sparkTrailFloat_4s_cubic-bezier(0.28,0.68,0.3,1)_300ms_infinite]";

export const sparkTrailTwo =
  "left-[55%] bottom-[14%] h-[clamp(0.52rem,0.75vw,0.85rem)] rotate-[12deg] [--spark-drift:-0.22rem] [--spark-rise:3.55rem] [animation:sparkTrailFloat_4.2s_cubic-bezier(0.28,0.68,0.3,1)_1200ms_infinite]";
