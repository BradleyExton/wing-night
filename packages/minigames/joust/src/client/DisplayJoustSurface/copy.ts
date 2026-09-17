export const displayJoustSurfaceCopy = {
  introTitle: "Slingshlong",
  introDescription:
    "One slingshot, one champ, one very floppy challenger. Pull back, let it fly, and pray it lands somewhere that counts.",
  title: "Desert Duel",
  shotCounter: (shotNumber: number, shotsTotal: number): string =>
    `Shot ${shotNumber} of ${shotsTotal}`,
  pendingPoints: (points: number): string => `+${points}`,
  sceneLabel: (arenaName: string): string => `Slingshot arena — ${arenaName}`,
  aimingPrompt: "Pull back… and let it fly",
  aimingDrawnPrompt: "Steady…",
  flyingPrompt: "It's away!",
  resultPoints: (points: number): string => `+${points}`,
  donePrompt: "That's the turn",
  doneHint: "Scores go up at the end of the round.",
  noArenaLabel: "The arena is missing. The host is on it.",
  waitingLabel: "Waiting for the host…"
} as const;
