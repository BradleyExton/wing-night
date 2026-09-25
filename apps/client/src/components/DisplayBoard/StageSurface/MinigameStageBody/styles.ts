export { fallbackText } from "../styles";

// No `relative` any more: the only thing that needed a positioning context
// here was the turn clock pinned to the top-right corner, and the clock is a
// slot in the game's own marquee now (docs/takeover-layout-api.md §6).
// The stage and the marquee inset are the shell's, not the game's (DESIGN.md §2.2D).
export { minigameDisplayStage as minigameShell } from "@wingnight/surface";
