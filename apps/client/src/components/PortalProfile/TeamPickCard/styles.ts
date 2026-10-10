// The team card: one tile per team, two across on a phone, each the lobby's lit card washed in
// its team's colour (the colour variant's own class, handed in by the tile) with the members'
// birds standing over the wordmark and the seats in the score face. The picked tile is ringed
// `primary`; a full one is dimmed and says so; under closed picks every tile is inert.
export const tiles = "grid grid-cols-2 gap-2.5";

const tileBase =
  "relative isolate flex min-h-[9.5rem] flex-col items-center justify-end gap-1 overflow-hidden rounded-2xl border px-2 pb-2 pt-3 text-center transition-transform [box-shadow:inset_0_1px_0_theme(colors.glow/14%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow disabled:cursor-not-allowed";

export const tile = `${tileBase} border-primary/25 active:scale-[0.98]`;

export const tilePicked = `${tileBase} border-primary ring-2 ring-primary [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_0_22px_theme(colors.primary/35%)]`;

export const tileFull = `${tileBase} border-primary/15 opacity-45`;

// The team's colour, pooled at the foot of the tile under the birds.
export const tileWash = "pointer-events-none absolute inset-0 -z-10";

export const members = "flex h-[3rem] max-w-full items-end justify-center -space-x-4";

export const member = "block flex-none";

// An empty team: the same height, so every wordmark sits on one line across the row.
export const membersEmpty = "h-[3rem]";

// TeamWordmark is inline by design; the box is the tile's to give.
export const teamName = "block max-w-full truncate text-[clamp(1rem,5vw,1.3rem)] leading-none";

export const teamNamePlain = "block max-w-full truncate text-base font-black uppercase text-text";

export const seats = "font-score text-[1.05rem] font-extrabold leading-none tabular-nums text-text";

export const fullPill = "absolute right-2 top-2";

export const statusLine = "min-h-[1.2em]";
