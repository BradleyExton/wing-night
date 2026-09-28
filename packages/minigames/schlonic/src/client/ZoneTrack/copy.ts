export const zoneTrackCopy = {
  // The strip is a picture; this is the same fact in words, for a screen reader and for the
  // e2e suite's benefit.
  label: (hazards: number, pits: number): string =>
    `Kempenfelt Bay Zone, start line to post: ${hazards} hazard${hazards === 1 ? "" : "s"} and ${pits} hole${pits === 1 ? "" : "s"}`,
  runnerAlt: (playerName: string): string => `${playerName}, running`,
  pinTitle: (playerName: string | null, outcome: "cleared" | "wiped" | "fell"): string => {
    const who = playerName ?? "A run";

    if (outcome === "cleared") {
      return `${who} made the post`;
    }

    return outcome === "fell" ? `${who} went down a hole here` : `${who} wiped out here`;
  }
} as const;
