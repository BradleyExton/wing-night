export const displayJoustSurfaceCopy = {
  introTitle: "Slingshlong",
  introDescription:
    "One slingshot, one very floppy projectile, and everyone who isn't on your team up on the scaffolding down the lane. Every player on the team gets one shot. Knock down as many of the rest of the room as you can.",
  title: "Desert Lanes",
  shotCounter: (shotNumber: number, shotsTotal: number): string =>
    `Shot ${shotNumber} of ${shotsTotal}`,
  pendingPoints: (points: number): string => `+${points}`,
  standing: (standingCount: number, rackSize: number): string =>
    `${standingCount}/${rackSize} standing`,
  sceneLabel: (arenaName: string): string => `Slingshot lane — ${arenaName}`,
  shooterPrompt: (name: string): string => `${name} — pull back and let it fly`,
  aimingPrompt: "Pull back… and let it fly",
  aimingDrawnPrompt: "Steady…",
  flyingPrompt: "It's away!",
  resultPoints: (points: number): string => `+${points}`,
  toppledNames: (names: string[]): string => names.join(" · "),
  donePrompt: "That's the turn",
  doneHint: "Scores go up at the end of the round.",
  noArenaLabel: "The lane is missing. The host is on it.",
  emptyRackLabel: "Nobody left to knock over.",
  waitingLabel: "Waiting for the host…"
} as const;
