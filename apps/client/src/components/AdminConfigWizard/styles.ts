// The wizard is a standalone full-takeover surface, so it composes the host
// panel's token vocabulary rather than re-inventing one — same inputs, chips
// and cards as the deck the host already knows.
export {
  cardBase as card,
  deckCtrlButton as backButton,
  deckAddButton as continueButton,
  stageEyebrow as eyebrow,
  stageMeta as meta
} from "../HostControlPanel/styleTokens";

export const root =
  "min-h-screen bg-bg px-[clamp(1.25rem,4vw,3rem)] py-[clamp(1.5rem,4vh,3rem)]";

export const inner = "mx-auto flex w-full max-w-4xl flex-col gap-6";

export const headline =
  "m-0 text-[clamp(2.2rem,4vw,3.4rem)] font-black leading-[0.95] tracking-[-0.03em] text-text";

export const stepRail = "flex flex-wrap gap-2";

export const stepChip =
  "inline-flex items-center gap-2 rounded-full border border-text/20 px-3.5 py-1.5 text-sm font-semibold text-muted transition hover:border-text/40";

export const stepChipActive = "border-primary/70 bg-primary/15 text-text";

export const stepChipDone = "border-success/50 text-text";

export const stepIndex =
  "inline-flex h-5 w-5 items-center justify-center rounded-full bg-text/10 font-mono text-xs";

export const stepBody = "flex flex-col gap-5";

export const lockBanner =
  "rounded-md border border-danger/60 bg-danger/15 px-4 py-3 text-sm font-semibold text-text";

export const lockBannerHint = "mt-1 block font-normal text-text/80";

export const coexistenceWarning =
  "rounded-md border border-heat/50 bg-heat/10 px-4 py-3 text-sm text-text/90";

export const errorBanner =
  "rounded-md border border-danger/60 bg-danger/15 px-4 py-3 text-sm text-text";

export const navRow = "mt-2 flex justify-between gap-3";

export const status = "text-sm text-muted";
