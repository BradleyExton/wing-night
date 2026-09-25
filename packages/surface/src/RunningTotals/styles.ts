// The round's pending points (docs/takeover-layout-api.md §8). Four host
// surfaces grew this card; three of them — JOUST, FAPPY and SONG_GUESS —
// carried it byte-identical, and this is that card.
//
// It is not byte-identical any more, and could not be. The three copies were
// written in JOUST's dusk-desert hexes (DESIGN.md §2.7): `#3a200d` is the
// arena frame's own border and `#1a0e05` → `#0a0604` its result plaque. A
// styles.ts under `packages/surface/src` is a house component's styles.ts,
// where a raw hex and a raw Tailwind palette name are both lint errors — so
// moving the card here meant re-expressing its skin in house tokens at the
// same values. That is the finding, not a liberty: the "house card" three
// games shared was a game's card, which is why it could not travel as
// written.
//
// The substitution, value for value on the app's near-black ground:
//   border #3a200d (58,32,13) → border-ember/20  (65,50,32)
//   from   #1a0e05 (26,14,5)  → from-surface     (28,28,28)
//   to     #0a0604 (10,6,4)   → to-bg            (18,18,18)
// Every other export below was already on tokens and is unchanged.
export const container =
  "rounded-xl border border-ember/20 bg-gradient-to-b from-surface to-bg p-3";

export const title =
  "mb-2 block text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

// `gap-4` is the one thing the three copies did not have and SCHLONIC's
// variant did. In a 330px deck column the card had slack and `justify-between`
// alone read fine; floated in a Canvas `readout` the card is content-width, so
// the longest row sets it and the name meets its points with nothing between
// them ("Honky Tonk Heat0 pts", measured at a gap of exactly 0px). The gap is
// the fix, not a wider card.
export const row =
  "flex items-center justify-between gap-4 border-b border-text/5 py-1.5 text-sm text-text last:border-b-0";

// The turn's team, lit. `gold` is the marquee accent the arcade surfaces share
// (DESIGN.md §2.7), scoped to framing rather than to a winner.
export const rowActive = "text-gold";

export const points = "font-score tabular-nums text-sm text-gold";

export const note = "mt-2 block text-center text-xs text-mutedWarm";
