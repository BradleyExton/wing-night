// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The bare chest in the V.
export const opening = "fill-current stroke-bg stroke-2 [stroke-linejoin:round]";

// Edged under the fill, so the thin rays keep their width.
export const sequin = "fill-ember stroke-bg stroke-1 [stroke-linejoin:round] [paint-order:stroke]";
