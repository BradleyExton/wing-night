import { takeoverLabel } from "@wingnight/surface";

// Frames are matte and dark (DESIGN.md §2.10): the art is the party's own
// photos, so the frame stays out of their way and a photo that does not fill
// its mat is matted, never letterboxed.

// One frame or two, splitting the column's height between them. Rows rather
// than the old `grid-cols-2` pair, because a party photo is landscape and half
// of a tall column is a better home for one than half of a wide one.
export const container = "grid h-full min-h-0 auto-rows-fr gap-3";

export const frame = "flex min-h-0 min-w-0 flex-col gap-1.5";

// No aspect ratio any more: the mat takes the height its row gives it and the
// photo is contained inside, so a frame grows with the canvas instead of
// pinning itself to 4:3 and leaving the rest of the column blank.
export const picture =
  "min-h-0 w-full flex-1 overflow-hidden rounded-sm border-[6px] border-surface bg-surface shadow-xl";

export const photo = "h-full w-full object-contain";

// The frame is never empty and never spins forever: a pulsing note while the
// model paints, plain words when it bails.
export const placeholder =
  "flex h-full w-full items-center justify-center px-4 text-center text-sm italic text-muted";

export const placeholderBusy = `${placeholder} animate-pulse`;

export const caption =
  `m-0 ${takeoverLabel}`;
