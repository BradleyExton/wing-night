// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The cloud's outline is painted under its fill, so the lobe roots stay white.
export const pomEdge = "stroke-bg [stroke-width:2.6] [stroke-linejoin:round] [paint-order:stroke]";

// The lit stick: a 4.4 ink line with a 2.4 mutedWarm core, so the length
// that crosses the near-ink bay still shows.
export const litStickEdge = "fill-none stroke-bg [stroke-width:4.4] [stroke-linecap:round]";

export const litStickCore = "fill-none stroke-mutedWarm [stroke-width:2.4] [stroke-linecap:round]";
