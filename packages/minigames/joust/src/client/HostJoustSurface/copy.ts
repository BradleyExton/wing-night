export const hostJoustSurfaceCopy = {
  railTitle: "Slingshlong",
  teamPrefix: "At the band:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Everyone who isn't on your team is up on the scaffolding down the lane. Pass the tablet round: every player on the team gets one pull of the band. Whoever you knock off stays off, so clear what you can — a hard flat shot ploughs the sand, a lob drops on the top shelf, and a shelf pays double. Or aim low and hard at a tower's legs: fold one and everyone on it comes down at once. The last shot's arc stays on the lane for the next shooter to adjust off.",
  waitingArenaLabel: "No lanes are loaded. Check minigames/joust.json.",
  arenaLabel: (arenaName: string): string => `Lane: ${arenaName}`,
  sceneLabel: (arenaName: string): string => `Slingshot lane — ${arenaName}`,
  shotCounter: (shotNumber: number, shotsTotal: number): string =>
    `Shot ${shotNumber} of ${shotsTotal}`,
  shooterLabel: (name: string): string => `${name} is up`,
  nextShooterLabel: (name: string): string => `Next: ${name}`,
  aimingHint: "Drag back on the lane and release to fire.",
  standingLabel: (standingCount: number, rackSize: number): string =>
    `${standingCount} of ${rackSize} still standing`,
  toppledNames: (names: string[]): string => names.join(", "),
  emptyRackLabel: "Rack cleared — nobody left standing.",
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
