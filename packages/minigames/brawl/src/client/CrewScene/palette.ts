// The crew scene's own colours (DESIGN.md §2.11's licence for scene art): the night street it
// stands on until the real backdrops are redrawn for the band (docs/minigames/brawl-crew-spec.md
// §0.8 step 4), and the per-player marker colours the wall and each phone's pad agree on.

/** One a slot, in the order the crew stepped out: the ring under a hen and the tint of her pad. */
export const CREW_SLOT_COLOURS = ["#f97316", "#22d3ee", "#a3e635", "#e879f9", "#facc15", "#f87171", "#93c5fd", "#fdba74"] as const;

export const resolveCrewSlotColour = (slot: number | null): string => {
  return slot === null ? crewNight.dim : (CREW_SLOT_COLOURS[slot % CREW_SLOT_COLOURS.length] ?? CREW_SLOT_COLOURS[0]);
};

export const crewNight = {
  sky: "#141021",
  far: "#1d1830",
  wall: "#2a2340",
  pane: "#f5c26b",
  kerb: "#6b6480",
  road: "#2b2a33",
  hazard: "#3b82f6",
  exit: "#f7f3ea",
  shadow: "#000000",
  wing: "#fbbf24",
  revive: "#f7f3ea",
  ink: "#f7f3ea",
  dim: "#8f8a99"
} as const;
