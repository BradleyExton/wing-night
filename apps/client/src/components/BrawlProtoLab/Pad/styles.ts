// The whole page is the controller: no scroll, no zoom, no selection, no long-press sheet.
export const root =
  "fixed inset-0 touch-none select-none overflow-hidden bg-bg text-text [-webkit-touch-callout:none] [-webkit-user-select:none]";

export const overlay = "pointer-events-none absolute inset-0 block";

export const header = "fill-bg font-score text-lg font-bold";

export const zoneLabel = "font-score text-4xl font-bold tracking-[0.08em]";

export const zoneHint = "text-sm";

export const rotate = "pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/90";

export const rotateText = "m-0 text-xl font-bold text-text";
