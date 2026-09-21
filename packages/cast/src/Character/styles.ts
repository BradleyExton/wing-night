// The whole bird is one colour (currentColor) so a single `text-*` class on
// the root recolours a character; the dark stroke separates it from the flame
// glow at TV distance without adding a second colour. Beak, wattle and legs
// are `primary`, the one accent a chicken gets, outlined so they hold on an
// orange team too.
export const svg = "block h-full w-auto overflow-visible";

export const defaultFill = "text-mutedWarm";

export const silhouette = "fill-current stroke-bg stroke-2 [stroke-linejoin:round]";

// The same ink with the corners left sharp, for the `spiky` silhouette. The
// house round join blunts a point by a unit, and at 76px a unit IS the point —
// this is the one place the line style bends, and it bends by one word.
export const silhouetteMitered = "fill-current stroke-bg stroke-2 [stroke-linejoin:miter]";

// The one shade the bird gets: the outline ink at a fifth, over its own
// colour, so a belly reads as round without a second hue.
export const shade = "fill-bg/20";

export const beak = "fill-primary stroke-bg stroke-2 [stroke-linejoin:round]";

export const legs =
  "fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]";

// The leg on the far side of the body, seen past the near one: dimmed so the
// two read as one behind the other rather than as four toes on one foot.
export const legFar = "opacity-70";

export const eye = "fill-text";

export const pupil = "fill-bg";

// A costume head cannot take a stroke, so a filter dilates its alpha into a
// `bg`-coloured halo the same 2 units wide as the bird's outline.
export const haloInk = "[flood-color:theme(colors.bg)]";

// A wing on its own layer turns about its shoulder root (`CHARACTER_PIVOTS.wing`,
// 47,35 of 80×72), so a rotate on the element beats it the way a rotate on the
// whole bird would not.
export const wingOrigin = "origin-[58.75%_48.6%]";
