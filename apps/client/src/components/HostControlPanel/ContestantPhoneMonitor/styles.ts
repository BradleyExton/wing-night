// The tablet while a contestant's phone plays the leg (mockups/contestant-phone, frames 6–7): a
// `<TakeoverStage>`, because the actions row carries three controls and the mirror is
// concentrated in one box. The body is the TV's own picture, read-only, at the TV's own size
// scaled down — so the host sees what the room sees, not a second rendering of it.
export {
  railCounter as status,
  takeoverPrimary as primaryButton,
  takeoverSecondary as secondaryButton
} from "@wingnight/surface";

export const statusLive =
  "before:mr-2 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-primary before:align-middle before:[box-shadow:0_0_8px_theme(colors.primary)] before:content-[''] text-primary";

export const statusDropped = "text-heat";

// The stage's actions slot is a plain row; the controls lay themselves out in it.
export const actions = "flex flex-wrap items-center gap-3";

export const mirrorArea = "relative flex h-full min-h-0 w-full items-center justify-center";

// The frame's width follows the height the stage gives it, so the 16:9 TV fits the body.
export const mirrorFrame =
  "relative aspect-video h-full max-w-full overflow-hidden rounded-xl border border-text/10 bg-bg";

export const mirrorShell = "h-full w-full overflow-hidden bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

export const waiting = "m-0 text-[clamp(0.85rem,1.05vw,1rem)] text-muted";

export const hint = "text-[clamp(0.8rem,1vw,0.95rem)] leading-snug text-muted";

export const dropOverlay =
  "absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-shade/60 backdrop-blur-[2px]";

export const dropCard =
  "flex max-w-[30rem] flex-col items-center gap-3 rounded-2xl border border-heat bg-surface px-7 py-6 text-center";

export const dropTitle = "m-0 text-[clamp(1.4rem,2.2vw,1.9rem)] font-black leading-tight text-text";
