export const layer = "pointer-events-none";

export const trigger =
  "pointer-events-auto fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/70 bg-surface px-4 py-2 text-sm font-semibold text-text shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const triggerClosed = "opacity-100";

export const triggerOpen = "pointer-events-none opacity-0";

export const triggerLabel = "leading-none";

export const triggerBadge =
  "inline-flex items-center rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-xs font-semibold text-text";

export const overlay = "fixed inset-0 z-40";

export const overlayClosed = "pointer-events-none";

export const overlayOpen = "pointer-events-auto md:pointer-events-none";

export const scrim =
  "absolute inset-y-0 left-0 w-12 bg-bg/70 transition-opacity duration-200 md:hidden";

export const scrimClosed = "opacity-0";

export const scrimOpen = "opacity-100";

export const panel =
  "pointer-events-auto absolute inset-y-0 left-12 right-0 flex flex-col border-l border-text/20 bg-surface shadow-2xl transition-transform duration-200 ease-out md:bottom-4 md:left-auto md:right-0 md:top-4 md:w-[420px] md:rounded-xl md:border";

export const panelClosed = "translate-x-full";

export const panelOpen = "translate-x-0";

export const header = "flex items-start justify-between gap-3 border-b border-text/10 px-4 py-4";

export const heading = "text-2xl font-semibold text-text";

export const description = "mt-1 text-sm text-text/80";

export const closeButton =
  "min-h-11 rounded-md border border-text/20 bg-surfaceAlt px-3 text-sm font-semibold text-text transition hover:border-primary/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const content = "min-h-0 flex-1 overflow-y-auto p-4";
