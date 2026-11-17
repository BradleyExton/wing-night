// The ready plate hangs where the wave meter will, over the street's sky: who is out, who is not.
// The same dark plate as the meter (never frosted, for the meter's reason), so the room's eyes are already there when the fight starts.
export const plate =
  "pointer-events-none absolute left-1/2 top-[clamp(0.6rem,1.4vh,1.4rem)] z-10 flex max-w-[92%] -translate-x-1/2 flex-col items-center gap-[clamp(0.3rem,0.8vh,0.8rem)] rounded-3xl bg-bg/80 px-[clamp(1.2rem,2.2vw,2.6rem)] py-[clamp(0.7rem,1.6vh,1.6rem)] text-center";

export const lead = "text-[clamp(1.1rem,1.9vw,2.3rem)] font-extrabold uppercase tracking-[0.2em] text-primary";

export const line = "m-0 font-voice text-[clamp(2rem,4vw,4.6rem)] font-bold italic leading-none text-text";

export const names = "m-0 flex list-none flex-wrap items-center justify-center gap-x-[clamp(0.9rem,1.6vw,2rem)] gap-y-[0.3em] p-0";

// A player who is out is in white beside her slot's colour; one who is not is dim beside an empty ring.
export const name =
  "flex items-center gap-[0.35em] font-score text-[clamp(1.1rem,1.8vw,2.2rem)] font-bold leading-none text-text data-[out=false]:text-muted";

export const dot = "block h-[0.85em] w-[0.85em]";

export const hint = "text-[clamp(0.9rem,1.25vw,1.5rem)] italic text-text/75";
