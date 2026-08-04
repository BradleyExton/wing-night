export {
  deckGroupRoot as group,
  deckGroupHead as groupHead
} from "../styleTokens";

export const description =
  "px-1.5 text-[clamp(0.85rem,1.05vw,1rem)] leading-[1.4] text-muted";

export const body = "mt-3 min-h-[40dvh]";

// Takeover canvas — minigame fills the available space.
export const takeoverCanvas =
  "flex min-h-0 w-full flex-1 flex-col";

// Column flex so the minigame's own container stretches to the full canvas
// width and can resolve h-full/flex-1 against a real height.
// Children fill the canvas but may grow beyond it (e.g. GEO's journal page),
// in which case the takeover scrolls instead of bleeding under the CTA bar.
export const takeoverInner =
  "flex min-h-0 flex-1 flex-col overflow-y-auto [&>*]:min-h-full";
