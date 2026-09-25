export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckGroupCount as groupCount,
  deckCtrlButton as button
} from "@wingnight/surface";

// Three equal thumb targets: the tablet is sauce-covered (DESIGN.md §2.1), so
// Back, Pause and Next each get a third of the deck's width rather than the
// timer's weighted `1.4fr 1fr 1fr`.
export const controls = "grid grid-cols-3 gap-1.5";

export const trackTitle =
  "mb-2 px-1.5 text-[clamp(0.95rem,1.15vw,1.1rem)] font-semibold text-text";

export const trackPosition =
  "mt-1 block text-[0.72rem] font-bold uppercase tracking-[0.2em] text-muted";

// The slider row sits under the transport buttons at the same min height, so
// a thumb dragging it has the same target the buttons give.
export const volumeRow =
  "mt-2 flex min-h-[56px] cursor-pointer items-center gap-3 px-1.5";

export const volumeIcon = "h-[1.05rem] w-[1.05rem] shrink-0 text-muted";

export const volumeLabel =
  "shrink-0 text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-muted";

export const volumeSlider =
  "h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-text/15 accent-primary disabled:cursor-not-allowed disabled:opacity-50";

export const volumeValue =
  "w-[3.5ch] shrink-0 text-right font-score text-[0.85rem] font-bold tabular-nums text-primary";
