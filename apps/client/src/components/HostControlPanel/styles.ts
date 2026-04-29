// Stage shell — the controller occupies the full viewport, no max-width or rounded card.
// Top-level grid: main split (1fr) + CTA area (auto).
export const container =
  "grid h-[100dvh] grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-bg text-text";

// Minigame takeover collapses the shell — minigame package owns the canvas.
export const takeoverContainer =
  "grid h-[100dvh] grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-bg text-text";

// Main split — asymmetric 65/35 (stage on left, deck on right).
export const mainSplit =
  "grid min-h-0 grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]";

// During minigame takeover, the deck collapses and minigame fills the canvas.
export const takeoverMain = "flex min-h-0 flex-col";

// Override panel content layout (inside the floating dock — unchanged).
export const overridePanelContent = "space-y-4";
