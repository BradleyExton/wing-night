import { readoutFigure } from "@wingnight/surface";

export const container = "flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-10 text-center";

export const introTitle = "m-0 font-voice text-[clamp(2.4rem,6vw,5rem)] font-bold italic leading-none text-text";

export const introDescription = "m-0 max-w-[46ch] text-[clamp(1rem,1.6vw,1.6rem)] leading-relaxed text-text/90";

export const hint = "m-auto text-[clamp(1rem,1.6vw,1.6rem)] italic text-muted";

export const stage = "relative flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)]";

export const counts = "flex flex-col items-end gap-[0.35em] whitespace-nowrap";

export const tally = `${readoutFigure} flex items-baseline gap-[0.4em] text-gold`;

export const tallyLabel = "font-sans text-[0.36em] font-extrabold uppercase tracking-[0.2em] text-muted";

// The base fills the arena edge to edge, as the street does for Streets of Barrie.
export const arenaArea = "relative flex min-h-0 flex-1 overflow-hidden rounded-2xl bg-bg";
