export const displayFappySurfaceCopy = {
  title: "Fappy Bird",
  introTitle: "Fappy Bird",
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs, against one clock. One player per section: tap to flap, crash and go again from your last gate, hand the tablet on fast. The quicker the whole team gets through, the more points.",
  waitingLabel: "Waiting for the relay to start…",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  gatesCounter: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} / ${gatesTotal} gates`,
  clockIdle: "0:00.0",
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "Tap to launch" : `${playerName} is up — tap to launch`,
  handoffPrompt: (playerName: string | null): string =>
    playerName === null ? "Hand it on!" : `Hand it to ${playerName}!`,
  respawnPrompt: (playerName: string | null): string =>
    playerName === null ? "Back on the perch — go again" : `${playerName} is back on the perch — go again`,
  flyingPrompt: (playerName: string | null): string =>
    playerName === null ? "In the air" : `${playerName} is flying`,
  finishedTitle: "Through!",
  finishedBlurb: (clock: string): string => `The whole corridor in ${clock}.`,
  timedOutTitle: "Time!",
  timedOutBlurb: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} of ${gatesTotal} gates before the clock ran out.`,
  points: (points: number): string => `+${points}`,
  finishedPrompt: "Relay over — next team when the room is ready.",
  timedOutPrompt: "Out of time — next team when the room is ready."
} as const;
