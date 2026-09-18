import type { EntranceId, WordmarkTreatment } from "@wingnight/shared";

// No display utility here on purpose: the caller's box wins (a standings
// column clamps to two lines, a headline is a block), and the one treatment
// that needs a box of its own (drip's tilt) takes it in index.css.
export const base = "max-w-full [text-wrap:balance]";

// The treatment rules live in index.css — they are multi-layer gradients and
// strokes Tailwind's arbitrary values cannot carry — so each entry is the
// class that file defines. `plain` is deliberately empty.
export const treatments: Record<WordmarkTreatment, string> = {
  chrome: "team-wordmark-chrome",
  candy: "team-wordmark-candy",
  rope: "team-wordmark-rope",
  neon: "team-wordmark-neon",
  torn: "team-wordmark-torn",
  drip: "team-wordmark-drip",
  scanline: "team-wordmark-scanline",
  plain: ""
};

export const entrances: Record<EntranceId, string> = {
  slam: "team-enter team-enter-slam",
  bounce: "team-enter team-enter-bounce",
  swing: "team-enter team-enter-swing",
  spin: "team-enter team-enter-spin",
  rip: "team-enter team-enter-rip",
  drop: "team-enter team-enter-drop",
  glitch: "team-enter team-enter-glitch",
  beat: "team-enter team-enter-beat"
};
