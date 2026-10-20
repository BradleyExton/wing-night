// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// One rope: a 3 core on a casing 2 wider, and a 1.6 tassel on a 3.6 casing.
// The ink rope's casing is mutedWarm, so it shows on the orange plume and on
// the dark hearth; the white rope's casing is ink.
export const ropeCasing: Record<"ink" | "white", string> = {
  ink: "fill-none stroke-mutedWarm [stroke-width:5] [stroke-linecap:round] [stroke-linejoin:round]",
  white: "fill-none stroke-bg [stroke-width:5] [stroke-linecap:round] [stroke-linejoin:round]"
};

export const ropeCore: Record<"ink" | "white", string> = {
  ink: "fill-none stroke-bg [stroke-width:3] [stroke-linecap:round] [stroke-linejoin:round]",
  white: "fill-none stroke-text [stroke-width:3] [stroke-linecap:round] [stroke-linejoin:round]"
};

export const tasselCasing: Record<"ink" | "white", string> = {
  ink: "fill-none stroke-mutedWarm [stroke-width:3.6] [stroke-linecap:round] [stroke-linejoin:round]",
  white: "fill-none stroke-bg [stroke-width:3.6] [stroke-linecap:round] [stroke-linejoin:round]"
};

export const tasselCore: Record<"ink" | "white", string> = {
  ink: "fill-none stroke-bg [stroke-width:1.6] [stroke-linecap:round] [stroke-linejoin:round]",
  white: "fill-none stroke-text [stroke-width:1.6] [stroke-linecap:round] [stroke-linejoin:round]"
};

// The knot: a block in the rope's colour, edged in its casing.
export const ropeKnot: Record<"ink" | "white", string> = {
  ink: "fill-bg stroke-mutedWarm [stroke-width:1.4] [stroke-linejoin:round]",
  white: "fill-text stroke-bg [stroke-width:1.4] [stroke-linejoin:round]"
};
