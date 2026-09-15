export const layer = "pointer-events-none";

// The floating trigger only shows during the minigame takeover (the deck's
// own "⋯ Overrides" button is collapsed then), so it borrows the deck-foot
// button's look rather than reading as a second, unrelated control. It sits
// on the CTA bar itself, where it can never cover the minigame canvas.
export const trigger =
  "pointer-events-auto fixed bottom-4 right-4 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-text/10 bg-surface/95 px-3.5 text-[0.78rem] font-bold uppercase tracking-[0.22em] text-muted shadow-lg backdrop-blur transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const triggerClosed = "opacity-100";

export const triggerOpen = "pointer-events-none opacity-0";

export const triggerLabel = "leading-none";

export const triggerBadge =
  "inline-flex items-center rounded-full border border-heat/40 bg-heat/15 px-2 py-0.5 text-[0.65rem] font-extrabold tracking-[0.16em] text-heat";

export const overlay = "fixed inset-0 z-40";

export const overlayOpen = "pointer-events-auto md:pointer-events-none";

export const scrim =
  "absolute inset-y-0 left-0 w-12 bg-bg/70 transition-opacity duration-200 md:hidden";

export const scrimOpen = "opacity-100";

export const panel =
  "pointer-events-auto absolute inset-y-0 left-12 right-0 flex flex-col border-l border-text/10 bg-surface shadow-2xl transition-transform duration-200 ease-out md:bottom-4 md:left-auto md:right-4 md:top-4 md:w-[440px] md:rounded-lg md:border";

export const panelOpen = "translate-x-0";

export const header =
  "flex items-start justify-between gap-3 border-b border-text/5 px-5 py-4";

export const heading =
  "m-0 text-[1.05rem] font-black uppercase tracking-[0.22em] text-text";

export const description = "mt-1.5 text-[0.9rem] leading-[1.45] text-muted";

export const closeButton =
  "inline-flex min-h-[44px] shrink-0 items-center rounded-md border border-text/10 bg-text/[0.02] px-3.5 text-[0.78rem] font-bold uppercase tracking-[0.22em] text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const content = "min-h-0 flex-1 overflow-y-auto px-5 py-5";
