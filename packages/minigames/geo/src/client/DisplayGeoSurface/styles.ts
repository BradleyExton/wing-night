export const stage =
  "flex h-full w-full flex-col bg-surfaceAlt p-[clamp(0.75rem,1.5vw,1.5rem)]";

export const frame =
  "flex h-full min-h-0 w-full flex-col gap-[clamp(0.75rem,1.5vw,1.5rem)] border-4 border-double border-gold/50 px-[clamp(1rem,2.5vw,2.5rem)] py-[clamp(0.75rem,2vw,2rem)]";

export const header =
  "flex flex-wrap items-baseline justify-between gap-4 border-b border-gold/30 pb-[clamp(0.5rem,1vw,1rem)] font-serif";

export const headerTitle =
  "m-0 text-[clamp(1.2rem,2vw,2.2rem)] font-bold uppercase tracking-[0.3em] text-gold";

export const headerMeta =
  "m-0 text-[clamp(0.8rem,1.2vw,1.3rem)] italic text-muted";

export const idleBody = "flex flex-1 items-center justify-center";

export const idleText =
  "m-0 text-center font-serif text-[clamp(1.5rem,2.6vw,2.8rem)] italic text-muted";

export const body =
  "flex min-h-0 flex-1 items-center gap-[clamp(1.5rem,3vw,3.5rem)]";

export const postcard =
  "relative h-full min-h-0 w-[44%] shrink-0 -rotate-1 border-8 border-text bg-text shadow-2xl";

export const postcardPhoto = "h-full w-full object-cover";

export const postcardMap =
  "h-full w-full overflow-hidden [&_.leaflet-tile-pane]:sepia [&_.leaflet-tile-pane]:brightness-95";

export const postmark =
  "absolute -right-4 -top-4 z-[1100] flex h-[clamp(3rem,5vw,5rem)] w-[clamp(3rem,5vw,5rem)] rotate-12 items-center justify-center rounded-full border-2 border-dashed border-gold bg-surfaceAlt text-center font-serif text-[clamp(0.55rem,0.8vw,0.85rem)] font-bold uppercase tracking-widest text-gold";

export const notes =
  "flex min-w-0 flex-1 flex-col items-start gap-[clamp(0.75rem,1.5vw,1.5rem)] font-serif";

export const noteTitle =
  "m-0 text-balance text-[clamp(2rem,4.5vw,4.8rem)] font-bold leading-[1.05] text-text";

export const noteRule = "h-px w-[clamp(4rem,8vw,8rem)] bg-gold/50";

export const noteHint =
  "m-0 text-[clamp(1.1rem,1.9vw,2rem)] italic leading-snug text-muted";

export const noteTeam =
  "m-0 text-[clamp(0.9rem,1.4vw,1.5rem)] font-semibold uppercase tracking-[0.2em] text-gold";

export const resultRow =
  "flex flex-wrap items-center gap-[clamp(1rem,2.5vw,2.5rem)]";

export const distanceStamp =
  "inline-block -rotate-6 border-[3px] border-primary px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.4rem,0.8vw,0.8rem)] font-serif text-[clamp(1.3rem,2.6vw,2.8rem)] font-black uppercase tracking-[0.15em] text-primary opacity-90";

export const pointsSeal =
  "flex h-[clamp(4.5rem,7vw,7.5rem)] w-[clamp(4.5rem,7vw,7.5rem)] rotate-6 flex-col items-center justify-center rounded-full border-4 border-gold text-gold";

export const pointsSealValue =
  "font-serif text-[clamp(1.4rem,2.6vw,2.8rem)] font-black leading-none";

export const pointsSealLabel =
  "mt-1 text-[clamp(0.6rem,0.9vw,0.9rem)] font-bold uppercase tracking-[0.3em]";

export const legendRow = "flex flex-wrap gap-[clamp(0.75rem,1.5vw,1.5rem)]";

export const legendEntry =
  "flex items-center gap-2 font-serif text-[clamp(0.8rem,1.1vw,1.2rem)] italic text-muted";

export const legendGuessDot = "h-[0.7em] w-[0.7em] rounded-full bg-primary";

export const legendAnswerDot = "h-[0.7em] w-[0.7em] rounded-full bg-success";
