export {
  deckGroupRoot as group,
  deckGroupHead as groupHead
} from "@wingnight/surface";

export const description =
  "px-1.5 text-[clamp(0.85rem,1.05vw,1rem)] leading-[1.4] text-muted";

// No forced minimum height: the intro deck holds a short briefing card, and
// padding it out to 40dvh just left a hollow gap above the overrides button.
export const body = "mt-3";

// Takeover canvas — minigame fills the available space.
export const takeoverCanvas =
  "flex min-h-0 w-full flex-1 flex-col";

// Column flex so the minigame's own container stretches to the full canvas
// width and can resolve h-full/flex-1 against a real height.
// Children fill the canvas but may grow beyond it, in which case the takeover
// scrolls instead of bleeding under the CTA bar.
export const takeoverInner =
  "flex min-h-0 flex-1 flex-col overflow-y-auto [&>*]:min-h-full";
