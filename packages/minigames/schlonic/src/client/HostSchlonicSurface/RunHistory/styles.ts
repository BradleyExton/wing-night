import { takeoverLabel } from "@wingnight/surface";

// The turn's runs, in the takeover's `readout` beside the running totals
// (docs/takeover-layout-api.md §5). It used to be a card in a 330px deck
// column, where a bare 1px outline was enough; floated over a bright summer
// sky it needs a ground of its own, so it takes the same glass the chrome
// chips take — `bg-bg/85` and a blur — rather than a second gold card.
export const container =
  "flex flex-col gap-1 rounded-xl border border-ember/20 bg-bg/85 px-3 py-2 backdrop-blur";

export const title = takeoverLabel;

// `gap-4`, not `gap-2`, for the reason the shared running-totals card found:
// in a deck column a row had slack and `justify-between` read fine, but a card
// that is content-width takes its width from its longest row, and the short
// rows then meet their outcome with nothing between them.
export const entry = "flex items-center justify-between gap-4 text-xs text-text";

export const entryActive = "text-gold";
