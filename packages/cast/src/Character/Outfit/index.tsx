import { findOutfitItem, type Outfit, type OutfitSlot } from "@wingnight/shared";

import type { OutfitItemContext } from "./context/index.js";
import { OUTFIT_DRAWINGS } from "./drawings/index.js";
import * as styles from "./styles.js";

export type { OutfitItemContext } from "./context/index.js";
export { OUTFIT_DRAWINGS } from "./drawings/index.js";

// Which side of the bird a two-sided slot is being drawn on: the far leg's
// boot or the near one, the ragdoll's far wing or its near one.
export type OutfitSide = "near" | "far";

type OutfitLayerProps = {
  slot: OutfitSlot;
  outfit: Outfit | undefined;
  context: Omit<OutfitItemContext, "style">;
  side?: OutfitSide;
};

/** Whether this slot of the outfit is something the cast can draw, for a rig that opens a layer for it. */
export const isOutfitSlotDrawn = (outfit: Outfit | undefined, slot: OutfitSlot): boolean => {
  const choice = outfit?.[slot];

  return choice !== undefined && OUTFIT_DRAWINGS[choice.item]?.slot === slot;
};

// One slot of a worn outfit, where the rig put it: nothing at all when the
// slot is empty, when the item has no drawing yet, or when the drawing is for
// another slot — so a bare bird is the markup it always was. A worn item is
// wrapped in its markers, which is what a test (or a person with devtools)
// reads to see what a bird has on without decoding paths.
export const OutfitLayer = ({ slot, outfit, context, side }: OutfitLayerProps): JSX.Element | null => {
  const choice = outfit?.[slot];
  const drawing = choice === undefined ? undefined : OUTFIT_DRAWINGS[choice.item];

  if (choice === undefined || drawing === undefined || drawing.slot !== slot) {
    return null;
  }

  // A worn outfit arrives with its style resolved (`resolveWornOutfit`); a
  // hand-built one may not, and gets the item's default.
  const style = choice.style ?? findOutfitItem(choice.item)?.styles[0];
  const { Drawing } = drawing;

  return (
    <g
      className={styles.layer}
      data-outfit-slot={slot}
      data-outfit-item={choice.item}
      data-outfit-style={style}
      data-outfit-side={side}
    >
      <Drawing context={{ ...context, style }} />
    </g>
  );
};
