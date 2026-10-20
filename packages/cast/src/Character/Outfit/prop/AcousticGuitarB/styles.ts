// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The neck and headstock: an ink casing pass, then the white on top.
export const neckCasing = "fill-none stroke-bg [stroke-width:6] [stroke-linecap:round]";

export const headCasing = "fill-bg stroke-bg [stroke-width:3] [stroke-linejoin:round]";

export const neck = "fill-none stroke-text [stroke-width:4] [stroke-linecap:round]";

export const head = "fill-text stroke-text stroke-1 [stroke-linejoin:round]";
