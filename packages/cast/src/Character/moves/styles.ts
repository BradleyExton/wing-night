import type { CharacterPart } from "../geometry/index.js";

// A part playing a Move: whatever keyframes the Move's class named for it
// (`--cast-move-<part>`, from moves.css), once, over one bar. The bar is the
// surface's to set (`--cast-move-ms`, the room's tempo); 2s is a bar at 120
// bpm, the tempo the Moves were drawn at. `both` holds the first frame through
// a delay and the last after, and both are rest. `motion-safe`: a room that
// asked for less motion gets a bird that stands its ground.
export const moveParts: Record<CharacterPart, string> = {
  tail: "motion-safe:[animation:var(--cast-move-tail,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]",
  legFar:
    "motion-safe:[animation:var(--cast-move-legFar,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]",
  body: "motion-safe:[animation:var(--cast-move-body,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]",
  legNear:
    "motion-safe:[animation:var(--cast-move-legNear,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]",
  wing: "motion-safe:[animation:var(--cast-move-wing,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]",
  head: "motion-safe:[animation:var(--cast-move-head,none)_var(--cast-move-ms,2000ms)_linear_var(--cast-move-delay,0ms)_1_both]"
};
