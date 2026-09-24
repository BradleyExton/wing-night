// Who is up after the player who is up next. The wall names the waiter first
// so "then" has something to hang off: "Caitlin, then Dan". Empty when there
// is nobody after — a two-leg relay must not promise a third player.
const onDeck = (waitingName: string | null, onDeckName: string | null): string => {
  if (onDeckName === null) {
    return "";
  }

  return waitingName === null ? `. Then ${onDeckName}.` : `. ${waitingName}, then ${onDeckName}.`;
};

export const displayFappySurfaceCopy = {
  title: "Fappy Bird",
  introTitle: "Fappy Bird",
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs, against one clock. One player per section: tap to flap, knock the eagles out of your way, land on the far cliff where the next bird is waiting, hand the tablet over. The quicker the whole team gets through, the more points.",
  waitingLabel: "Waiting for the relay to start…",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  gatesCounter: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} / ${gatesTotal} gates`,
  clockIdle: "0:00.0",
  readyPrompt: (
    playerName: string | null,
    waitingName: string | null = null,
    onDeckName: string | null = null
  ): string => {
    const head = playerName === null ? "Tap to take off" : `${playerName} is up — tap to take off`;

    return `${head}${onDeck(waitingName, onDeckName)}`;
  },
  respawnPrompt: (
    playerName: string | null,
    waitingName: string | null = null,
    onDeckName: string | null = null
  ): string => {
    const head =
      playerName === null
        ? "Back on the perch — go again"
        : `${playerName} is back on the perch — go again`;

    return `${head}${onDeck(waitingName, onDeckName)}`;
  },
  flyingPrompt: (
    playerName: string | null,
    waitingName: string | null,
    onDeckName: string | null = null
  ): string => {
    const flyer = playerName ?? "The bird";

    if (waitingName === null) {
      return `${flyer} is flying — come down on the far cliff`;
    }

    const head = `${flyer} is flying — land next to ${waitingName}`;

    return onDeckName === null ? head : `${head}. Then ${onDeckName}.`;
  },
  handoffCalloutName: (nextName: string | null): string => nextName ?? "Next player",
  handoffCalloutLine: "You're up — grab the tablet",
  // The second line of the callout: who is up after the player it just named.
  handoffCalloutThen: (onDeckName: string): string => `then ${onDeckName}`,
  handoffPrompt: (landedName: string | null, nextName: string | null): string => {
    const landed = landedName === null ? "Landed" : `${landedName} is through`;

    return nextName === null ? `${landed} — pass the tablet on` : `${landed} — ${nextName}, grab the tablet`;
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
