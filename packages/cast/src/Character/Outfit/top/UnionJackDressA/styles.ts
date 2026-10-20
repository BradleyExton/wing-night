// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The jack's white: the saltire, then the upright cross under its accent.
export const saltire = "fill-none stroke-text [stroke-width:2.2]";

export const cross = "fill-none stroke-text [stroke-width:4.6]";

// The flag's accent, team on an ink field and ink on a team one: the cross's
// inner line and the waist seam.
export const accentOnInk = "fill-none stroke-current [stroke-width:2.4]";

export const accentOnTeam = "fill-none stroke-bg [stroke-width:2.4]";
