export const displayFappySurfaceCopy = {
  title: "Fappy Bird",
  introTitle: "Fappy Bird",
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs, against one clock. One player per section: tap to flap, land on the far cliff where the next bird is waiting, hand the tablet over. The quicker the whole team gets through, the more points.",
  waitingLabel: "Waiting for the relay to start…",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  gatesCounter: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} / ${gatesTotal} gates`,
  clockIdle: "0:00.0",
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "Tap to take off" : `${playerName} is up — tap to take off`,
  respawnPrompt: (playerName: string | null): string =>
    playerName === null ? "Back on the perch — go again" : `${playerName} is back on the perch — go again`,
  flyingPrompt: (playerName: string | null, waitingName: string | null): string => {
    const flyer = playerName ?? "The bird";

    return waitingName === null
      ? `${flyer} is flying — come down on the far cliff`
      : `${flyer} is flying — land next to ${waitingName}`;
  },
  finishedTitle: "Through!",
  finishedBlurb: (clock: string): string => `The whole corridor in ${clock}.`,
  timedOutTitle: "Time!",
  timedOutBlurb: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} of ${gatesTotal} gates before the clock ran out.`,
  points: (points: number): string => `+${points}`,
  finishedPrompt: "Relay over — next team when the room is ready.",
  timedOutPrompt: "Out of time — next team when the room is ready."
} as const;
