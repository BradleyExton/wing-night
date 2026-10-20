export * from "../../styles.js";

// An egg's 4.4u ink outline, under its fill.
export const eggOutline = "fill-bg stroke-bg [stroke-width:4.4] [stroke-linejoin:round]";

// Gold reads as metal only with a shade and a highlight: an ink crescent at
// 22% across the lower front, and a curved white glint (an arc, never a dot,
// which would be an eye's catchlight).
export const shade = "fill-bg [fill-opacity:0.22] [fill-rule:evenodd]";

export const glint = "fill-none stroke-text [stroke-width:1.2] [stroke-linecap:round] [stroke-linejoin:round]";
