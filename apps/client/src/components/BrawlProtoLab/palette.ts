// PROTOTYPE — throwaway. Drawing colours for the four-at-once BRAWL controls lab: scene art,
// which is licensed to carry its own palette (DESIGN.md §2.11), and the per-player marker colours
// the pad and the street have to agree on.

/** One per pad, in the order they join: the ring under the hen and the tint of the phone. */
export const SLOT_COLOURS = ["#f97316", "#22d3ee", "#a3e635", "#e879f9", "#facc15", "#f87171"] as const;

export const resolveSlotColour = (slot: number): string =>
  SLOT_COLOURS[slot % SLOT_COLOURS.length] ?? SLOT_COLOURS[0];

export const streetNight = {
  sky: "#141021",
  far: "#1d1830",
  wall: "#2a2340",
  pane: "#f5c26b",
  kerb: "#6b6480",
  road: "#2b2a33",
  lane: "#4a4856",
  shadow: "#000000",
  tag: "#f7f3ea"
} as const;

export const gooseInk = {
  body: "#8a7a66",
  back: "#6f6253",
  neck: "#1c1b1f",
  chin: "#f3efe6",
  alarm: "#ff5a3c"
} as const;

export const padInk = {
  ring: "#f7f3ea",
  knob: "#f7f3ea",
  text: "#f7f3ea",
  dim: "#8f8a99"
} as const;
