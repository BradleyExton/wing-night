// The kept heads, three to a row on a phone, each on its bird. The style reference is lit (the
// lobby's lit card against its open slots); the rest offer the button that makes them it.
export const grid = "grid grid-cols-3 gap-2";

const tileBase = "flex min-w-0 flex-col items-stretch gap-1.5 rounded-xl border p-1.5 text-center";

export const tile = `${tileBase} border-ember/20 bg-bg/60`;

export const tileReference = `${tileBase} border-primary bg-primary/10 [box-shadow:0_0_18px_theme(colors.primary/30%)]`;

export const name = "truncate text-[0.8rem] font-extrabold text-text";

// Sentence case, unlike the house's caps buttons: a third of a phone is too narrow for the
// label in tracked caps, and it must stay on one line.
export const pick =
  "inline-flex min-h-[36px] items-center justify-center whitespace-nowrap rounded-lg border border-ember/30 bg-surface/60 px-1 text-[0.74rem] font-bold text-text disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const referencePill = "self-center";

export const empty = "m-0 text-[0.85rem] italic text-mutedWarmDim";
