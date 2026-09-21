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
// width and can resolve h-full/flex-1 against a real height; `min-h-full` on
// the child so a short body still fills the tablet rather than sitting at
// content height.
//
// It does NOT scroll. `overflow-y-auto` was here to stop an overgrown minigame
// bleeding under the CTA bar — but there is no CTA bar on this phase, and a
// takeover that scrolls is a takeover whose layout is wrong
// (docs/takeover-layout-api.md §10, P4). A body taller than the tablet now
// breaks visibly in the sandbox instead of scrolling quietly, which is the
// feedback a nine-game migration wants.
export const takeoverInner = "flex min-h-0 flex-1 flex-col [&>*]:min-h-full";
