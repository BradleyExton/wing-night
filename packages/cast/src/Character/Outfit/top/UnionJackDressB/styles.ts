// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The jack's white: the saltire, then the upright cross under its accent.
export const saltire = "fill-none stroke-text [stroke-width:3]";

export const cross = "fill-none stroke-text [stroke-width:5.6]";

// The cross's inner line: team on an ink field, ink on a team one.
export const accentOnInk = "fill-none stroke-current [stroke-width:2.6]";

export const accentOnTeam = "fill-none stroke-bg [stroke-width:2.6]";
