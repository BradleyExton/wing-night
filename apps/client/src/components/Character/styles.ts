// The whole bird is one colour (currentColor) so a single `text-*` class on
// the root recolours a character; the dark stroke separates it from the flame
// glow at TV distance without adding a second colour. Beak and legs are
// `primary`, the one accent a chicken gets, outlined so they hold on an
// orange team too.
export const svg = "block h-full w-auto overflow-visible";

export const defaultFill = "text-mutedWarm";

export const silhouette = "fill-current stroke-bg stroke-2";

export const beak = "fill-primary stroke-bg stroke-2";

export const legs =
  "fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]";

export const eye = "fill-text";

export const pupil = "fill-bg";
