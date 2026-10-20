// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The steer's merged outline: the whole shape stroked 2.8 wide in ink under
// its fill, so the horns, bar and face share one outline.
export const steerOutline = "fill-bg stroke-bg [stroke-width:2.8] [stroke-linejoin:round]";
