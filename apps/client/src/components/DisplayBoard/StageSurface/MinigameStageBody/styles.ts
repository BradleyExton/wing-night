export { fallbackText } from "../styles";

// No `relative` any more: the only thing that needed a positioning context
// here was the turn clock pinned to the top-right corner, and the clock is a
// slot in the game's own marquee now (docs/takeover-layout-api.md §6).
export const minigameShell = "h-full";
