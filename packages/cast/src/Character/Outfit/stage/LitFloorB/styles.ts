// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

export const slabFront = "fill-bg stroke-bg stroke-2 [stroke-linejoin:round]";

// The chase, in panel order: `outfit-lit-chase` (index.css) is six beats at
// 120 bpm lit white on beats 0 and 3, and panel i starts (6 - i) % 6 beats in,
// so two opposite panels burn at once and the pair walks round all six.
// Panels 0 and 3 rest white, so reduced motion holds that pair lit.
export const chase = [
  "fill-text stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_infinite] motion-reduce:[animation:none]",
  "fill-current stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_-2.5s_infinite] motion-reduce:[animation:none]",
  "fill-current stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_-2s_infinite] motion-reduce:[animation:none]",
  "fill-text stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_-1.5s_infinite] motion-reduce:[animation:none]",
  "fill-current stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_-1s_infinite] motion-reduce:[animation:none]",
  "fill-current stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-chase_3s_step-end_-0.5s_infinite] motion-reduce:[animation:none]"
] as const;
