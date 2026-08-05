// PROTOTYPE (throwaway) — composes the host panel's real style tokens; the
// few new strings below follow the same idiom (clamp sizing, tracking, /15
// opacity tints). Deleted with the lab.
export {
  deckRoot,
  deckGroupRoot,
  deckGroupHead,
  deckGroupCount,
  deckRow,
  deckRowName,
  deckRowMeta,
  deckAddRow,
  deckInput,
  deckAddButton,
  deckCtrlButton,
  deckChipRow,
  deckChip,
  deckChipActive,
  stageRoot,
  stageGlow,
  stageGlowDefault,
  stageEyebrow,
  stageHeadline,
  stageHeadlineAccent,
  stageMeta,
  stageMetaStrong,
  fieldLabel,
  inputBase,
  cardBase
} from "../styleTokens";

export { container, mainSplit } from "../styles";

// --- lab chrome -------------------------------------------------------------

// Deliberately off-palette (indigo) so the switcher reads as lab tooling, not
// part of the design under test.
export const switcherBar =
  "fixed bottom-[calc(clamp(84px,10vh,112px)+1.75rem)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-indigo-300/40 bg-indigo-600 px-2 py-1.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.55)]";

export const switcherArrow =
  "flex h-9 w-9 items-center justify-center rounded-full text-lg font-black transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export const switcherLabel =
  "min-w-[16rem] px-1 text-center text-[0.72rem] font-bold uppercase tracking-[0.14em]";

export const switcherBadge =
  "rounded-full bg-white/20 px-2 py-0.5 font-mono text-[0.6rem] font-black tracking-[0.2em]";

export const lockBanner =
  "flex items-center gap-2 rounded-md border border-heat/40 bg-heat/10 px-3 py-2 text-[0.78rem] font-bold uppercase tracking-[0.2em] text-heat";

// --- shared form bits -------------------------------------------------------

export const numberInput =
  "h-11 w-24 rounded-md border border-text/10 bg-text/[0.04] px-3 text-center font-mono text-base font-bold tabular-nums text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const stepperButton =
  "flex h-11 w-11 items-center justify-center rounded-md border border-text/10 bg-text/[0.04] font-mono text-lg font-black text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

export const removeButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-text/10 text-muted transition hover:border-heat/50 hover:text-heat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heat";

export const applyPill =
  "inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-success";

export const dirtyPill =
  "inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-gold";

// --- variant A (console tabs) ----------------------------------------------

export const aStatTiles = "grid max-w-[34rem] grid-cols-2 gap-3";

export const aStatTile =
  "rounded-xl border border-text/10 bg-gradient-to-b from-surfaceAlt/60 to-surface/60 p-4";

export const aStatValue =
  "font-mono text-[clamp(2rem,3.4vw,3rem)] font-black leading-none tabular-nums text-text";

export const aStatLabel =
  "mt-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.3em] text-muted/70";

export const aPreviewStrip = "mt-2 flex max-w-[34rem] flex-wrap gap-2";

export const aPreviewCard =
  "flex min-w-[9rem] flex-1 flex-col gap-0.5 rounded-lg border border-text/10 bg-black/25 px-3 py-2.5";

export const aPreviewRound = "font-mono text-[0.65rem] font-black tracking-[0.2em] text-primary";

export const aPreviewLabel = "text-sm font-bold text-text";

export const aPreviewMeta = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted";

export const aTabRow = "flex flex-wrap gap-1.5";

export const aSaveBar =
  "mt-auto flex items-center justify-between gap-3 border-t border-text/10 pt-4";

// --- variant B (rundown) ----------------------------------------------------

export const bRoot =
  "flex min-h-0 flex-col gap-[clamp(1rem,2vh,1.5rem)] overflow-y-auto p-[clamp(1.5rem,2.5vw,2.5rem)]";

export const bTopBar = "flex flex-wrap items-end justify-between gap-4";

export const bNameInput =
  "min-w-[16rem] border-0 border-b-2 border-text/15 bg-transparent pb-1 text-[clamp(1.8rem,3vw,2.6rem)] font-black tracking-[-0.02em] text-text placeholder:text-muted/40 focus-visible:border-primary focus-visible:outline-none";

export const bGlobalsRow = "flex flex-wrap gap-2.5";

export const bGlobalTile =
  "flex flex-col gap-1 rounded-lg border border-text/10 bg-surfaceAlt/70 px-3 py-2";

export const bGlobalLabel =
  "text-[0.6rem] font-extrabold uppercase tracking-[0.26em] text-muted/70";

export const bGlobalInput =
  "w-20 border-0 bg-transparent p-0 font-mono text-xl font-black tabular-nums text-text focus-visible:outline-none";

export const bRundown = "flex flex-col";

export const bRundownRow =
  "grid grid-cols-[auto_auto_minmax(10rem,1.2fr)_minmax(9rem,1fr)_auto_auto_auto] items-center gap-x-3 gap-y-2 border-b border-text/5 py-3 max-[900px]:grid-cols-[auto_auto_1fr_auto] max-[900px]:grid-rows-2";

export const bRoundNumber =
  "font-mono text-[clamp(1.6rem,2.4vw,2.2rem)] font-black tabular-nums text-primary/80";

export const bReorderCol = "flex flex-col gap-1";

export const bInlineInput =
  "h-11 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-base font-bold text-text transition placeholder:text-muted/40 hover:border-text/10 hover:bg-text/[0.03] focus-visible:border-text/10 focus-visible:bg-text/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const bSauceInput =
  "h-11 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted transition placeholder:text-muted/40 hover:border-text/10 hover:bg-text/[0.03] focus-visible:border-text/10 focus-visible:bg-text/[0.04] focus-visible:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const bStepperGroup = "flex items-center gap-1.5";

export const bAddRoundRow =
  "mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md border border-dashed border-text/15 text-[0.8rem] font-extrabold uppercase tracking-[0.2em] text-muted transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const bFootNote =
  "flex flex-wrap items-center justify-between gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted/70";

// --- variant C (wizard) -----------------------------------------------------

export const cRoot =
  "flex min-h-0 flex-col items-center overflow-y-auto p-[clamp(1.5rem,3vw,3rem)]";

export const cInner = "flex w-full max-w-3xl flex-1 flex-col gap-[clamp(1.5rem,3vh,2.5rem)]";

export const cStepRail = "flex flex-wrap items-center gap-2";

export const cStepChip =
  "flex items-center gap-2 rounded-full border border-text/10 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-muted transition hover:border-text/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const cStepChipActive = "border-primary/60 bg-primary/15 text-primary";

export const cStepChipDone = "border-success/40 text-success";

export const cStepIndex = "font-mono tabular-nums";

export const cStepBody = "flex flex-1 flex-col gap-5";

export const cFieldGrid = "grid grid-cols-2 gap-4 max-[640px]:grid-cols-1";

export const cRoundCard =
  "flex flex-col gap-3 rounded-xl border border-text/10 bg-surfaceAlt/60 p-4";

export const cNavRow = "mt-auto flex items-center justify-between gap-3 pt-4";

export const cReviewRow =
  "flex items-baseline justify-between gap-4 border-b border-text/5 py-3 last:border-b-0";

export const cReviewKey =
  "text-[0.7rem] font-extrabold uppercase tracking-[0.26em] text-muted/70";

export const cReviewValue = "text-right text-sm font-bold text-text";

export const cApplyButton =
  "inline-flex min-h-[72px] w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 text-[clamp(1rem,1.4vw,1.3rem)] font-black uppercase tracking-[0.18em] text-bg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60";
