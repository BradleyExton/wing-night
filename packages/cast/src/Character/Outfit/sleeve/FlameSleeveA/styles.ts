// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The stock wing painted out in the body colour, outline and all (a 3.2
// stroke covers the 2-unit ink), so a sleeve that redraws the trailing edge
// higher shows the body there.
export const eraseWing = "fill-current stroke-current [stroke-width:3.2] [stroke-linejoin:round]";

export const flameOutline = "fill-none stroke-bg stroke-2 [stroke-linejoin:miter]";
