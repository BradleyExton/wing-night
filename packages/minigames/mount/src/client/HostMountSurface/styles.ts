import { briefingCard, railCounterOverlay, takeoverLabel, takeoverSecondary } from "@wingnight/surface";

// Mount Your Hens is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the climb is evenly
// spread scenery — a pile anywhere on it is a hold — so a chip in one corner costs a corner of
// waterfront rather than a word. Nothing here positions the takeover's chrome or reserves the
// corner dock: the layout owns both, and the z-index budget.

// The intro beat renders inside the host's own control deck: the plain briefing.
export const introRoot = "flex flex-col gap-3";

export const introCard = briefingCard;

// The chrome row's read-only counts (§5, `counter`). Glass, matching the other arcade surfaces.
export const counter = `${railCounterOverlay} text-muted`;

export const counterName = "text-text";

// The climb's clock, written by the paint loop: the score face, and heat in its last ten seconds.
export const counterClock = `${railCounterOverlay} font-score tabular-nums tracking-normal text-text`;

export const clockDigits =
  "text-[1.15rem] font-extrabold tabular-nums data-[last-ten=true]:text-heat data-[last-ten=true]:text-[1.35rem]";

export const counterLabel = takeoverLabel;

// The line to beat: whose it is and how high, in gold, the score colour.
export const counterLine = `${railCounterOverlay} font-score tabular-nums tracking-normal text-gold`;

export const counterLineValue = "text-[1rem] font-extrabold";

export const waitingNote = "flex h-full w-full items-center justify-center text-sm text-muted";

// The turn's escape hatches and the one-line hint (§5, `actions`), floated bottom-left by the
// layout. Glass, because they sit over the climb, and `h-12` for a 44px target.
export const secondaryButton = `${takeoverSecondary} h-12`;

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

// The turn's result, in the `readout` above the corner dock beside the climb list and the totals.
export const finishCard = "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-score tabular-nums text-2xl font-extrabold text-text";
