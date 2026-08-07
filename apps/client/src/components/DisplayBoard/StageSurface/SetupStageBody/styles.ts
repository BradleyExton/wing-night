export const container =
  "relative isolate flex h-full flex-col items-center justify-evenly overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(1.5rem,3vw,3rem)] text-center";

export const ambient =
  "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_80%,rgba(249,115,22,0.22)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(239,68,68,0.25)_0%,transparent_55%),radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(20,10,5,0.4)_0%,transparent_60%)]";

export const header =
  "relative z-[2] flex flex-col items-center gap-2";

export const eyebrow =
  "text-[clamp(0.85rem,1.1vw,1.2rem)] font-extrabold uppercase tracking-[0.42em] text-mutedWarm";

export const heading =
  "m-0 text-[clamp(3.5rem,9vw,12rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-text [text-shadow:0_0_40px_rgba(251,191,36,0.35),0_0_100px_rgba(249,115,22,0.25)]";

export const packName =
  "m-0 text-[clamp(0.95rem,1.3vw,1.5rem)] font-bold uppercase tracking-[0.32em] text-mutedWarm";

export const rounds =
  "relative z-[2] grid w-full max-w-[1300px] grid-cols-4 gap-y-[clamp(0.5rem,1vw,1.25rem)] gap-x-[clamp(0.6rem,1.2vw,1.5rem)]";

export const round =
  "relative flex flex-col items-center px-[clamp(0.7rem,1vw,1rem)] py-[clamp(0.85rem,1.4vw,1.4rem)] bg-[rgba(20,10,5,0.55)] border-t border-primary/35 backdrop-blur-[2px] text-center";

export const roundNum =
  "font-mono text-[clamp(0.7rem,0.95vw,1.05rem)] font-extrabold uppercase tracking-[0.32em] text-primary";

export const roundLabel =
  "mb-2 mt-1 text-[clamp(0.75rem,1vw,1.15rem)] font-bold uppercase tracking-[0.18em] text-mutedWarm";

export const sauce =
  "m-0 text-[clamp(1.2rem,2vw,2.4rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-text [text-shadow:0_0_18px_rgba(249,115,22,0.4)]";

export const sauceMuted =
  "m-0 text-[clamp(1.2rem,2vw,2.4rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-mutedWarmDim";

export const minigame =
  "mt-2 text-[clamp(0.7rem,0.95vw,1rem)] font-bold uppercase tracking-[0.22em] text-mutedWarm";

export const minigameLabel = "mr-1 text-mutedWarmDim";

export const additionalRounds =
  "relative z-[2] mt-2 text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.28em] text-mutedWarmDim";

// Dark pill keeps the status legible where it crosses the flame's bright core.
export const waiting =
  "relative z-[2] inline-flex items-center gap-[0.7em] rounded-full bg-bg/75 px-[1.4em] py-[0.6em] backdrop-blur-sm text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.32em] text-mutedWarm";

export const waitingDot =
  "h-[0.7em] w-[0.7em] rounded-full bg-primary [box-shadow:0_0_12px_theme(colors.primary),0_0_24px_rgba(249,115,22,0.6)] [animation:pulse_1.4s_ease-in-out_infinite] motion-reduce:[animation:none]";
