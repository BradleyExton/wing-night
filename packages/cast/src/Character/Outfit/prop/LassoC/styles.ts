// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// A rope is two passes, a casing 1 unit wider each side and the core: ink rope
// on a mutedWarm casing (so it shows on the dark hearth), or white rope in ink.
// The slack and the spoke are 2.4, the loop 2.6; the white core is 0.4 finer.
export const inkRope = {
  thinCasing: "fill-none stroke-mutedWarm [stroke-width:4.4] [stroke-linecap:round] [stroke-linejoin:round]",
  thinCore: "fill-none stroke-bg [stroke-width:2.4] [stroke-linecap:round] [stroke-linejoin:round]",
  loopCasing: "fill-none stroke-mutedWarm [stroke-width:4.6] [stroke-linecap:round] [stroke-linejoin:round]",
  loopCore: "fill-none stroke-bg [stroke-width:2.6] [stroke-linecap:round] [stroke-linejoin:round]",
  honda: "fill-bg stroke-mutedWarm [stroke-width:1.2] [stroke-linejoin:round]"
};

export const whiteRope = {
  thinCasing: "fill-none stroke-bg [stroke-width:4.4] [stroke-linecap:round] [stroke-linejoin:round]",
  thinCore: "fill-none stroke-text stroke-2 [stroke-linecap:round] [stroke-linejoin:round]",
  loopCasing: "fill-none stroke-bg [stroke-width:4.6] [stroke-linecap:round] [stroke-linejoin:round]",
  loopCore: "fill-none stroke-text [stroke-width:2.2] [stroke-linecap:round] [stroke-linejoin:round]",
  honda: "fill-bg stroke-bg [stroke-width:1.2] [stroke-linejoin:round]"
};
