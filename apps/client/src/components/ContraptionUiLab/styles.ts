// TV-distance reading per DESIGN.md: 100dvh, no page scroll, fluid clamp typography, high contrast.
export const container =
  "flex h-[100dvh] w-full flex-col overflow-hidden bg-bg px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.5rem,1.5vh,1.25rem)] text-text";

export const heading =
  "m-0 font-bold text-text [font-size:clamp(1.25rem,2.4vw,2.25rem)] [line-height:1.1]";

export const description =
  "mt-1 max-w-[110ch] text-muted [font-size:clamp(0.75rem,1vw,1rem)]";

export const stageRow = "mt-3 flex min-h-0 flex-1 gap-3";

export const stage =
  "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-text/10 bg-black shadow-xl";

// Holds the scene at its own aspect ratio so a tall pane letterboxes symmetrically instead of
// stranding the floor mid-frame with dead black beneath it.
export const stageInner = "aspect-video max-h-full w-full";

export const sidePanel =
  "flex w-[clamp(15rem,22vw,22rem)] shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border border-text/10 bg-surface p-3";

export const panelBlock = "space-y-1.5";

export const legend =
  "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted";

export const buttonRow = "flex flex-wrap gap-1.5";

export const button =
  "rounded-lg border border-text/15 bg-surfaceAlt px-2.5 py-1.5 text-left text-[0.8rem] font-medium text-text transition-colors hover:border-text/35";

export const buttonActive =
  "rounded-lg border border-primary bg-primary/20 px-2.5 py-1.5 text-left text-[0.8rem] font-semibold text-text";

export const axisList = "space-y-1 text-[0.72rem] text-muted";

export const axisTerm = "font-semibold uppercase tracking-[0.1em] text-text/70";

export const beatList = "flex flex-wrap gap-1";

export const beatChip =
  "rounded-md border border-text/10 bg-surfaceAlt px-1.5 py-0.5 text-[0.66rem] text-muted";

export const beatChipActive =
  "rounded-md border border-primary bg-primary/25 px-1.5 py-0.5 text-[0.66rem] font-semibold text-text";

export const note = "text-[0.7rem] leading-snug text-muted";

export const observation = "text-[0.74rem] leading-snug text-text/85";

export const implicationWarn =
  "rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[0.7rem] font-medium text-amber-200";

export const implicationOk =
  "rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[0.7rem] font-medium text-emerald-200";

// The floating switcher the prototype skill asks for — always reachable, never in the scene.
export const floatingSwitcher =
  "absolute left-3 top-3 z-10 flex gap-1.5 rounded-full border border-text/15 bg-black/70 px-2 py-1.5 backdrop-blur";

export const floatingButton =
  "rounded-full px-2.5 py-1 text-[0.72rem] font-medium text-text/70 transition-colors hover:text-text";

export const floatingButtonActive =
  "rounded-full bg-primary/80 px-2.5 py-1 text-[0.72rem] font-bold text-text";
