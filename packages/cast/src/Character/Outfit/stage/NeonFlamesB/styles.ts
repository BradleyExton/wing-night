// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// A neon tube: round-capped, never filled.
export const tube = "fill-none [stroke-linecap:round] [stroke-linejoin:round]";

// The floor line is the 2.4 tube; the two signs are a bolder 2.8, each a team
// tube with a white core, or one white tube.
export const teamGlass = "stroke-current [stroke-width:2.4]";

export const hotCore = "stroke-text [stroke-width:1.01]";

export const whiteGlass = "stroke-text [stroke-width:2.4]";

export const bigTeamGlass = "stroke-current [stroke-width:2.8]";

export const bigHotCore = "stroke-text [stroke-width:1.18]";

export const bigWhiteGlass = "stroke-text [stroke-width:2.8]";

// The signs light alternately on the beat, four beats at 120 bpm (index.css):
// both, the star alone, both, the flame alone. Reduced motion holds both lit.
export const flameBeat = "[animation:outfit-neon-flame-beat_2s_step-end_infinite] motion-reduce:[animation:none]";

export const starBeat = "[animation:outfit-neon-star-beat_2s_step-end_infinite] motion-reduce:[animation:none]";
