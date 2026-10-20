// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// Every tile flips on the beat (120 bpm, the lobby's tempo): `outfit-lit-flip`
// (index.css) steps white to team and back over two beats, and the team tiles
// start a beat in, so the chequer swaps whole on every beat. Reduced motion
// holds the lit chequer.
export const whiteTile =
  "fill-text stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-flip_1s_step-end_infinite] motion-reduce:[animation:none]";

export const teamTile =
  "fill-current stroke-bg stroke-2 [stroke-linejoin:round] [animation:outfit-lit-flip_1s_step-end_-0.5s_infinite] motion-reduce:[animation:none]";
