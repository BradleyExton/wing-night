// PROTOTYPE — throwaway. Drawing colours for the run-and-gun jump lab: scene art, which is
// licensed to carry its own palette (DESIGN.md §2.11), and the per-player marker colours the pad
// and the yard have to agree on.

/** One per pad, in the order they join: the ring under the hen and the tint of the phone. */
export const SLOT_COLOURS = ["#f97316", "#22d3ee", "#a3e635", "#e879f9", "#facc15", "#f87171"] as const;

export const resolveSlotColour = (slot: number): string =>
  SLOT_COLOURS[slot % SLOT_COLOURS.length] ?? SLOT_COLOURS[0];

export const yardNight = {
  sky: "#10151c",
  hangar: "#1a222d",
  hangarLine: "#263242",
  wall: "#3a4656",
  wallDark: "#2a3340",
  ground: "#2b2a26",
  groundLine: "#57503f",
  shadow: "#000000",
  barrel: "#8b97a8",
  out: "#4a5361",
  alarm: "#ff5a3c",
  shot: "#b7f24a",
  sauce: "#ff3b2f",
  box: "#f7f3ea"
} as const;

export const padInk = {
  ring: "#f7f3ea",
  text: "#f7f3ea",
  dim: "#8f8a99",
  // The labels over the online lab's yard: there to find the halves, not to read.
  faint: "#5a5763"
} as const;
