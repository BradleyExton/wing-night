import type { OutfitStyle } from "@wingnight/shared";

// The wardrobe's paint, in the house tokens and nothing else (DESIGN.md: no hex
// in the cast). An item's harness drawing named its colours as hex; ported,
// each becomes one of these. `team` is the wearer's own colour, which the bird
// already carries as `currentColor`, so a team-coloured item repaints per team
// for free.
//
// The base region of an item, by the style a guest picked.
export const styleFill: Record<OutfitStyle, string> = {
  ink: "fill-bg",
  white: "fill-text",
  team: "fill-current",
  gold: "fill-wardrobeGold"
};

export const inkFill = "fill-bg";

export const whiteFill = "fill-text";

export const teamFill = "fill-current";

export const emberFill = "fill-ember";

// The house 2-unit outline, round and mitered (spiky's corners stay sharp).
export const inkEdge = "stroke-bg stroke-2 [stroke-linejoin:round]";

export const inkEdgeMitered = "stroke-bg stroke-2 [stroke-linejoin:miter]";

// The finer edges the harness used on small parts: 1.5 and 1.2 units.
export const inkEdgeFineMitered = "stroke-bg [stroke-width:1.5] [stroke-linejoin:miter]";

export const inkEdgeThin = "stroke-bg [stroke-width:1.2] [stroke-linejoin:round]";

// A prop's merged outline: every shape stroked 4 wide in ink first, so the
// overlapping parts of one prop share a single 2-unit outline instead of
// seaming, then every fill on top.
export const mergedOutline = "fill-bg stroke-bg [stroke-width:4] [stroke-linejoin:round]";

export const unfilled = "fill-none";

// The marker group a worn item hangs in. It paints nothing of its own, and an
// item never takes a tap meant for the bird (a Prop reaches past the outline).
export const layer = "pointer-events-none";
