import { CONTESTANT_CONTROLLERS, type ContestantController } from "@wingnight/shared";

export const hostBordenSurfaceCopy = {
  introDescription: (handset: ContestantController): string =>
    `Your chickens run Base Borden two at a time, spraying hot sauce, and the base shoots back. ${
      handset === CONTESTANT_CONTROLLERS.PHONE
        ? "Step out on your phone; the pairs run a stretch each, and the next pair takes over at the gate."
        : "One of you runs each stretch on the tablet, and passes it on."
    } Left thumb runs and aims the sauce, down ducks; tap the right half to jump. She never stops spraying. Something flashes before it fires: jump a low shot, duck a high one. Three hearts each, and a hot bottle soaks up one hit first. Down, you're up again once your partner stands over you.`,
  waitingBaseLabel: "No base is loaded. Check the round's BORDEN rules.",
  sceneLabel: "Base Borden",
  stretchCounter: (stretchNumber: number, stretchesTotal: number): string => `Stretch ${stretchNumber} of ${stretchesTotal}`,
  tally: (banked: number, total: number): string => `${banked} / ${total}`,
  tallyLabel: "Worth",
  startCrewButtonLabel: "Start the run",
  startTabletButtonLabel: "Play it on this tablet",
  startSoloButtonLabel: "Start",
  skipStretchButtonLabel: "Skip stretch",
  resetTurnButtonLabel: "Reset turn",
  restartButtonLabel: "Restart",
  waitingOnHint: (out: number): string => (out === 0 ? "Nobody's out yet: Start plays it on this tablet." : `${out} out. Start when the room is ready.`),
  nextStretchHint: "Next stretch is on the line: the next pair's first thumb starts it, or Start does.",
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  finishedTitle: "Out the main gate",
  finishPoints: (points: number): string => `+${points}`
} as const;
