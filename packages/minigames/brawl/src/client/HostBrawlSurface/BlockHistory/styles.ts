import { takeoverLabel } from "@wingnight/surface";

// The turn's blocks, in the takeover's `readout` beside the running totals
// (docs/takeover-layout-api.md §5): the same glass the chrome chips take, because it floats over
// the street rather than sitting in a panel (SCHLONIC's `RunHistory`).
export const container = "flex flex-col gap-1 rounded-xl border border-ember/20 bg-bg/85 px-3 py-2 backdrop-blur";

export const title = takeoverLabel;

// `gap-4`, so a content-width card's short rows do not meet their outcome with nothing between.
export const entry = "flex items-center justify-between gap-4 text-xs text-text";

export const entryActive = "text-gold";
