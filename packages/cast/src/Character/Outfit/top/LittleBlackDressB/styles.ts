// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The rim: the body's edge stroked 5.6 wide in the team colour, so 2.8 of it
// shows inside the outline all round the dress.
export const rim = "fill-none stroke-current [stroke-width:5.6] [stroke-linejoin:round]";

// The bow's outside edge: drawn under the fill, so only its silhouette inks.
export const bowEdge = "fill-current stroke-bg [stroke-width:4] [stroke-linejoin:round]";
