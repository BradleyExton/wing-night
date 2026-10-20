// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The frill's outside edge: every piece stroked first, the fills over them,
// so only the outside of the group is inked.
export const frillEdge = "fill-none stroke-bg [stroke-width:3.2] [stroke-linejoin:round]";
