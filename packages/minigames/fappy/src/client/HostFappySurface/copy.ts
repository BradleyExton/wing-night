export const hostFappySurfaceCopy = {
  railTitle: "Fappy Bird",
  teamPrefix: "In the air:",
  noAssignedTeamLabel: "No team assigned",
  clockIdle: "0:00.0",
  clockLimit: (limitSeconds: number): string => `/ ${Math.floor(limitSeconds / 60)}:${String(limitSeconds % 60).padStart(2, "0")}`,
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs, against one clock. Each player flies one section on the tablet: tap anywhere to flap, then come down on the far cliff where the next bird is waiting. Bump an eagle and it just flies off; hit a champ, the sand or the cliff and you go again from the last gate you made — it only costs time. The quicker the whole team gets through, the more points.",
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  flyingLabel: (playerName: string | null): string =>
    playerName === null ? "Flying: the house hen" : `Flying: ${playerName}`,
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  readyHint: (playerName: string | null, waitingName: string | null): string => {
    const who = playerName === null ? "" : `${playerName}: `;

    return waitingName === null
      ? `${who}tap anywhere to take off, keep tapping to stay up, and come down on the far cliff.`
      : `${who}tap anywhere to take off, keep tapping to stay up, and land next to ${waitingName}.`;
  },
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player",
  handoffHint: (landedName: string | null, nextName: string | null): string => {
    const landed = landedName === null ? "Landed" : `${landedName} landed`;

    return nextName === null
      ? `${landed} — pass the tablet on. The clock is running.`
      : `${landed} — pass the tablet to ${nextName}. The clock is running.`;
  },
  respawnHint: (gatesCleared: number): string =>
    gatesCleared === 0
      ? "Back on the start cliff. Tap to go again."
      : `Back on the perch at gate ${gatesCleared}. Tap to go again.`,
  readyLockedHint: "Waiting for the host to open the round.",
  flyingHint: (waitingName: string | null): string =>
    waitingName === null
      ? "Keep tapping — then come down on the far cliff."
      : `Keep tapping — then land next to ${waitingName} and hand it over.`,
  finishedHint: "Through! Advance the phase when the room is ready.",
  timedOutHint: "Time. Advance the phase when the room is ready.",
  crashesChip: (crashes: number): string => `${crashes} crash${crashes === 1 ? "" : "es"}`,
  finishedTitle: "Through!",
  timedOutTitle: "Time!",
  finishTime: (clock: string): string => `${clock}`,
  finishPoints: (points: number): string => `+${points}`,
  progressLine: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} of ${gatesTotal} gates`,
  skipLegButtonLabel: "Skip leg",
  resetTurnButtonLabel: "Reset turn",
  historyTitle: "Legs",
  historyPending: "—",
  historyCleared: "✓",
  historyCrashes: (crashes: number): string => `${crashes}×`,
  totalsTitle: "Round so far",
  totalsPoints: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`,
  parLine: (parSeconds: number): string => `Full points under ${parSeconds}s`
} as const;
