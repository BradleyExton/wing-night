import { CHARACTER_BOX } from "@wingnight/cast";

/**
 * A height as the room says it: in hens, one decimal. A hen is the bird box's own height, so
 * "3.1 hens up" is three birds and a bit stood on each other's heads (spec §0.5).
 */
export const formatHens = (height: number): string => {
  return (Math.max(0, height) / CHARACTER_BOX.height).toFixed(1);
};
