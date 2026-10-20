// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The sawdust disc, edged by the style: ink, or the team colour.
export const inkDisc = "fill-mutedWarm stroke-bg [stroke-width:2.4]";

export const teamDisc = "fill-mutedWarm stroke-current [stroke-width:2.4]";

// The barrel is always the team colour, whatever edges the disc.
export const barrel = "fill-current stroke-bg stroke-2 [stroke-linejoin:round]";

export const staves = "fill-none stroke-bg [stroke-width:1.2] [stroke-linecap:round]";

export const hoops = "fill-none stroke-bg stroke-2";

export const lid = "fill-current stroke-bg [stroke-width:1.8]";
