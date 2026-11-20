// The turn's awards: three rows at most, each a label, whoever holds it, and the number. On the
// wall it rides in the house result card's footer, sized in `vw`; on the tablet it is a small
// card in the takeover's readout.
const list = "m-0 flex list-none flex-col p-0 text-left";

export const listWall = `${list} gap-[clamp(0.4rem,0.9vh,0.9rem)] text-[clamp(1rem,1.5vw,1.8rem)]`;

export const listTablet = `${list} gap-1.5 rounded-xl bg-bg/80 px-3 py-2 text-[0.82rem]`;

export const row = "grid grid-cols-[minmax(0,10em)_minmax(0,1fr)_auto] items-center gap-[0.8em]";

export const label = "text-[0.62em] font-extrabold uppercase tracking-[0.2em] text-mutedWarm";

export const winners = "flex min-w-0 flex-wrap items-center gap-x-[0.7em] gap-y-[0.2em]";

export const winner = "flex min-w-0 items-center gap-[0.35em]";

export const head = "block h-[1.7em] w-[1.7em] shrink-0 overflow-hidden rounded-full bg-surface";

export const name = "truncate font-voice font-bold italic leading-none text-text";

export const value = "font-score text-[0.8em] font-extrabold tabular-nums text-gold";
