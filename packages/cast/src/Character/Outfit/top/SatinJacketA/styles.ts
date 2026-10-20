// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The zip: a white strand cased in ink, or plain ink on the white jacket.
export const zipCasing = "fill-none stroke-bg [stroke-width:5] [stroke-linecap:round] [stroke-linejoin:round]";

export const zip = "fill-none stroke-text [stroke-width:2.6] [stroke-linecap:round] [stroke-linejoin:round]";

export const inkZip = "fill-none stroke-bg [stroke-width:2.6] [stroke-linecap:round]";

export const teamRib = "fill-current stroke-bg [stroke-width:1.2] [stroke-linejoin:round]";

export const inkRib = "fill-bg stroke-bg [stroke-width:1.2] [stroke-linejoin:round]";

// Round: the harness asked for a miter but wrote the join twice, and the
// browser keeps the first, so the patch Gate 1 approved has round points.
export const starPatch = "fill-current stroke-bg [stroke-width:1.2] [stroke-linejoin:round]";
