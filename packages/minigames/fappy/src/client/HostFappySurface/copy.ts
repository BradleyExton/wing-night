// Who is up after the handoff, appended to the sentence that just named who
// is up next. Empty when there is nobody after: a relay with two legs left
// must not promise a third player.
const onDeck = (onDeckName: string | null): string =>
  onDeckName === null ? "" : ` Then ${onDeckName}.`;

export const hostFappySurfaceCopy = {
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs, against one clock. Each player flies one section on the tablet: tap anywhere to flap, then come down on the far cliff where the next bird is waiting. Bump an eagle and it just flies off; hit a champ, the sand or the cliff and you go again from the last gate you made — it only costs time. The quicker the whole team gets through, the more points.",
  waitingRelayLabel: "No relay is loaded. Check the round's FAPPY rules.",
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  flyingLabel: (playerName: string | null): string =>
    playerName === null ? "Flying: the house hen" : `Flying: ${playerName}`,
  readyHint: (
    playerName: string | null,
    waitingName: string | null,
    onDeckName: string | null = null
  ): string => {
    const who = playerName === null ? "" : `${playerName}: `;

    return waitingName === null
      ? `${who}tap anywhere to take off, keep tapping to stay up, and come down on the far cliff.`
      : `${who}tap anywhere to take off, keep tapping to stay up, and land next to ${waitingName}.${onDeck(onDeckName)}`;
  },
  handoffHint: (landedName: string | null, nextName: string | null): string => {
    const landed = landedName === null ? "Landed" : `${landedName} landed`;

    return nextName === null
      ? `${landed} — pass the tablet on. The clock is running.`
      : `${landed} — pass the tablet to ${nextName}. The clock is running.`;
  },
  respawnHint: (gatesCleared: number, onDeckName: string | null = null): string =>
    gatesCleared === 0
      ? `Back on the start cliff. Tap to go again.${onDeck(onDeckName)}`
      : `Back on the perch at gate ${gatesCleared}. Tap to go again.${onDeck(onDeckName)}`,
  readyLockedHint: "Waiting for the host to open the round.",
  flyingHint: (waitingName: string | null, onDeckName: string | null = null): string =>
    waitingName === null
      ? "Keep tapping — then come down on the far cliff."
      : `Keep tapping — then land next to ${waitingName} and hand it over.${onDeck(onDeckName)}`,
  finishedHint: "Through! Advance the phase when the room is ready.",
  timedOutHint: "Time. Advance the phase when the room is ready.",
  finishedTitle: "Through!",
  timedOutTitle: "Time!",
  finishTime: (clock: string): string => `${clock}`,
  finishPoints: (points: number): string => `+${points}`,
  progressLine: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} of ${gatesTotal} gates`,
  skipLegButtonLabel: "Skip leg",
  resetTurnButtonLabel: "Reset turn",
  parLine: (parSeconds: number): string => `Full points under ${parSeconds}s`
} as const;
