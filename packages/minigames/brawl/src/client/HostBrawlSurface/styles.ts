import { briefingCard, railCounterOverlay, takeoverLabel, takeoverPrimary, takeoverSecondary } from "@wingnight/surface";

// BRAWL is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the street is evenly spread
// scenery, so a chip in one corner costs a corner of Barrie rather than a word the host has to
// read. Nothing here positions the takeover's chrome or reserves the corner dock — the layout
// owns both, and the z-index budget.

// Intro phase renders inside the host's own control deck, where a full-bleed street would be
// nonsense — it gets the plain briefing instead.
export const introRoot = "flex flex-col gap-3";

export const introCard = briefingCard;

// The body: the street, with the two thumbs laid over it when this screen is the one playing.
export const street = "relative h-full w-full overflow-hidden bg-bg";

// The chrome row's read-only counts (§5, `counter`). Glass, matching the other arcade surfaces'.
export const counter = `${railCounterOverlay} text-muted`;

// The worth banked over what the street holds: the score, in the score face and gold.
export const counterTally = `${railCounterOverlay} font-score tabular-nums tracking-normal text-gold`;

export const counterTallyValue = "text-[1.05rem] font-extrabold tabular-nums";

export const counterLabel = takeoverLabel;

// The turn to beat, dimmer than the team's own gold because it is the target, not the score.
export const counterBest = `${railCounterOverlay} font-score tabular-nums tracking-normal text-text/70`;

export const waitingNote = "flex h-full w-full items-center justify-center text-sm text-muted";

// The host's Start, the turn's escape hatches and the one-line hint (§5, `actions`), floated
// bottom-left by the layout. `h-12` for a 44px target.
export const primaryButton = `${takeoverPrimary} h-12`;

export const secondaryButton = `${takeoverSecondary} h-12`;

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

// The turn's result, in the `readout` above the corner dock with the running totals beside it.
export const finishCard = "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-score tabular-nums text-2xl font-extrabold text-text";
