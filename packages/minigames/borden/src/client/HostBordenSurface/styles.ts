import { briefingCard, railCounterOverlay, takeoverLabel, takeoverPrimary, takeoverSecondary } from "@wingnight/surface";

// Base Borden is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3), like Streets of Barrie:
// the base is spread scenery, and the layout owns the chrome, the z-index and the corner dock.
export const introRoot = "flex flex-col gap-3";

export const introCard = briefingCard;

// The body: the base, with the two thumbs laid over it when this screen is the one playing.
export const base = "relative h-full w-full overflow-hidden bg-bg";

export const counter = `${railCounterOverlay} text-muted`;

export const counterTally = `${railCounterOverlay} font-score tabular-nums tracking-normal text-gold`;

export const counterTallyValue = "text-[1.05rem] font-extrabold tabular-nums";

export const counterLabel = takeoverLabel;

export const waitingNote = "flex h-full w-full items-center justify-center text-sm text-muted";

// `h-12` for a 44px target.
export const primaryButton = `${takeoverPrimary} h-12`;

export const secondaryButton = `${takeoverSecondary} h-12`;

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

export const finishCard = "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-score tabular-nums text-2xl font-extrabold text-text";
