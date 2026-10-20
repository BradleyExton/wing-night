import type { OutfitSlot, OutfitStyle } from "@wingnight/shared";

import type { HeadAnchors } from "../../geometry/index.js";
import type { CharacterShapes } from "../../shapes/index.js";

// Everything an item's drawing may read, which is what the harness handed its
// `draw(ctx)` (apps/client/public/mockups/cast/outfit-harness.js, `makeCtx`)
// less the hex: a cast item paints in the house tokens, so it is told the
// STYLE and picks its classes, and the team colour is `currentColor`.
export type OutfitItemContext = {
  // The bird the item is worn on: the genre's body, wing and tail paths, so a
  // Top can clip itself to the chest and a Sleeve can redraw the wing.
  shapes: CharacterShapes;
  // Where the head is. A Top starts at `head.shoulders`, which is lower under
  // a photographed head than under the drawn one.
  head: HeadAnchors;
  // The style in effect; undefined only for an item with none (a Move).
  style: OutfitStyle | undefined;
  // Boots only: the leg being drawn, by its hip.
  leg?: { x: number; y: number; far: boolean };
};

export type OutfitItemProps = { context: OutfitItemContext };

// One item as the cast draws it, keyed in `OUTFIT_DRAWINGS` by its catalogue
// id. `slot` is repeated here so the layer can refuse an item drawn for one
// slot and worn in another (a hand-edited pack), and a test holds it to the
// catalogue's.
export type OutfitDrawing = {
  slot: OutfitSlot;
  Drawing: (props: OutfitItemProps) => JSX.Element | null;
};
