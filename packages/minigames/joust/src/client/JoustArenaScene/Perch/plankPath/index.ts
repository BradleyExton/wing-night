import type { JoustVec2 } from "@wingnight/shared";
import { JOUST_PERCH_THICKNESS } from "@wingnight/shared";

/** A plank of `JOUST_PERCH_THICKNESS` laid along the segment between two points. */
export const plankPath = (from: JoustVec2, to: JoustVec2): string => {
  const alongX = to.x - from.x;
  const alongY = to.y - from.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY) || 1;
  // The slab sits ON the leg tops, so it is offset upward along the plank's own normal.
  const normalX = (alongY / length) * JOUST_PERCH_THICKNESS;
  const normalY = (-alongX / length) * JOUST_PERCH_THICKNESS;

  return [
    `M${from.x} ${from.y}`,
    `L${to.x} ${to.y}`,
    `L${to.x + normalX} ${to.y + normalY}`,
    `L${from.x + normalX} ${from.y + normalY}`,
    "Z"
  ].join(" ");
};
