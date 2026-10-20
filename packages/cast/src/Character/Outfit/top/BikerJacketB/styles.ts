// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The jacket is body minus wing, so its base paint cuts with evenodd.
export const evenodd = "[fill-rule:evenodd]";

export const emberBand = "fill-ember stroke-bg [stroke-width:1.5] [stroke-linejoin:miter]";
