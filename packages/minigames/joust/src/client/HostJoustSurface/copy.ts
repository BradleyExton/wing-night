export const hostJoustSurfaceCopy = {
  railTitle: "Slingshlong",
  teamPrefix: "At the band:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Pull the champ's challenger back on the slingshot and let it fly across the desert. Three shots. Headshots are easy money, the low blow pays best, and the cactus does not care about your feelings.",
  waitingArenaLabel: "No arenas are loaded. Check minigames/joust.json.",
  arenaLabel: (arenaName: string): string => `Arena: ${arenaName}`,
  sceneLabel: (arenaName: string): string => `Slingshot arena — ${arenaName}`,
  shotCounter: (shotNumber: number, shotsTotal: number): string =>
    `Shot ${shotNumber} of ${shotsTotal}`,
  aimingHint: "Drag back on the arena and release to fire.",
  aimingLockedHint: "Waiting for the host to open the round.",
  replayingHint: "Watch the TV…",
  resultPoints: (points: number): string => `+${points}`,
  nextShotButtonLabel: "Next shot →",
  turnOverLabel: "Turn over — advance the phase when the room is ready.",
  skipShotButtonLabel: "Skip shot",
  resetTurnButtonLabel: "Reset turn",
  historyTitle: "This turn",
  historyPending: "—",
  totalsTitle: "Round so far",
  totalsPoints: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`
} as const;
