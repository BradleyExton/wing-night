// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The pool's light, by style: the gradient's stops take the colour the
// guest picked.
export const stopColor = {
  ink: "[stop-color:theme(colors.bg)]",
  white: "[stop-color:theme(colors.text)]",
  team: "[stop-color:currentColor]",
  gold: "[stop-color:theme(colors.wardrobeGold)]"
};

export const fade = "[stop-opacity:0]";

export const peak = "[stop-opacity:0.8]";

export const mid = "[stop-opacity:0.45]";

// The glints' 2-unit ink edge under the fill, so a 1-unit rim shows.
export const glintEdge = "stroke-bg stroke-2 [stroke-linejoin:round] [paint-order:stroke]";
