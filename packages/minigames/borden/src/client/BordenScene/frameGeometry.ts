import { BORDEN_WORLD } from "@wingnight/shared";

// The window the base is drawn in: the sim's own 160 by 90, with the ground line this far down.
// The sim's `y` is height above the ground, up positive, so a screen turns it over here.
export const BORDEN_VIEW = { width: BORDEN_WORLD.width, height: BORDEN_WORLD.height } as const;

export const BORDEN_GROUND_Y = 76;

/** A height above the ground as a y in the window. */
export const toScreenY = (y: number): number => Math.round((BORDEN_GROUND_Y - y) * 100) / 100;

export const round2 = (value: number): number => Math.round(value * 100) / 100;
