// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The detail on the yoke, in the contrasting value: one continuous line of
// piping, white on the ink yoke and ink on the white one.
export const piping: Record<"ink" | "white", string> = {
  ink: "fill-none stroke-text stroke-2 [stroke-linejoin:round] [stroke-linecap:butt]",
  white: "fill-none stroke-bg stroke-2 [stroke-linejoin:round] [stroke-linecap:butt]"
};
