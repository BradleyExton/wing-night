export const zoneTrackCopy = {
  // The strip is a picture; this is the same fact in words, for a screen reader and for the
  // e2e suite's benefit.
  label: (hazards: number, rails: number, pits: number): string =>
    `Dunlop Street Zone, start line to post: ${hazards} hazard${hazards === 1 ? "" : "s"}, ${rails} rail${
      rails === 1 ? "" : "s"
    } and ${pits} trench${pits === 1 ? "" : "es"}`,
  runnerAlt: (playerName: string): string => `${playerName}, running`,
  ghostAlt: (playerName: string | null): string =>
    playerName === null ? "The run to beat" : `${playerName}'s run, the one to beat`,
  pinTitle: (playerName: string | null, outcome: "cleared" | "wiped" | "fell"): string => {
    const who = playerName ?? "A run";

    if (outcome === "cleared") {
      return `${who} made the post`;
    }

    return outcome === "fell" ? `${who} went into the roadworks here` : `${who} wiped out here`;
  }
} as const;
