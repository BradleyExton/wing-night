import { takeoverLabel, takeoverLabelAccent, verdictButtonDanger, verdictButtonSuccess, verdictIcon } from "@wingnight/surface";

// The reveal beat's ruling pad. It used to be the third card down a 330px
// deck column; it is now an item in the takeover's foot row, so it lays its
// two rulings out side by side and takes the row's height rather than setting
// a column's.
export const card =
  "flex shrink-0 flex-col justify-center rounded-xl border border-text/15 bg-gradient-to-b from-surface to-bg px-3 py-2";

export const title =
  `mb-1.5 block ${takeoverLabelAccent}`;

export const rows = "flex items-center gap-3";

export const row = "flex items-center gap-2";

export const rowLabel =
  takeoverLabel;

// The house verdict (DESIGN.md §2.0B, "Takeover controls") as a toggle: tinted
// until the host rules, then solid through `aria-pressed`, which the component
// already sets — so the ruled state is the attribute, not a third class string.
const markSize = "h-[52px] px-3";

export const markButtonCorrect = `${verdictButtonSuccess} ${markSize}`;

export const markButtonIncorrect = `${verdictButtonDanger} ${markSize}`;

export { verdictIcon as markIcon };
