// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// A neon tube: round-capped, never filled.
export const tube = "fill-none [stroke-linecap:round] [stroke-linejoin:round]";

// Team: a 2.4 team tube with a white-hot core line. White: one white tube.
export const teamGlass = "stroke-current [stroke-width:2.4]";

export const hotCore = "stroke-text [stroke-width:1.01]";

export const whiteGlass = "stroke-text [stroke-width:2.4]";

// The back sign buzzes like a tired one: `outfit-neon-buzz` (index.css), a
// 3s loop that dips twice near its end. Reduced motion holds it lit.
export const buzz = "[animation:outfit-neon-buzz_3s_linear_infinite] motion-reduce:[animation:none]";
