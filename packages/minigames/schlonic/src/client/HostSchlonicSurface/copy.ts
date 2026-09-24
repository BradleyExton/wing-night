export const hostSchlonicSurfaceCopy = {
  introDescription:
    "One at a time, your chickens run Kempenfelt Bay Zone — down the waterfront, and the waterfront is furnished. The bird runs on its own; the tablet only jumps. Tap to hop, hold to go higher, and grab every wing you can: the wings are the score AND they are the only thing keeping you alive. A pink one with a face is an enemy — land on it and it pops. A crimson bed of them just hurts, and so does a hole. Take a hit and you drop half your wings; take one holding none and your run is over. Get to the post and everything in your hands goes on the board.",
  waitingZoneLabel: "No zone is loaded. Check the round's SCHLONIC rules.",
  runCounter: (runNumber: number, runsTotal: number): string => `Run ${runNumber} of ${runsTotal}`,
  // The one hint the tablet holder gets, on the line: how to start and how to jump, in one
  // sentence. The separate JUMP / HOLD FOR HEIGHT legend that used to sit beside it said the
  // same thing a second time in the same corner.
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "Tap to go. Hold the tap to jump higher — in the air you're a ball, and a ball squashes things."
      : `${playerName}: tap to go. Hold the tap to jump higher — in the air you're a ball, and a ball squashes things.`,
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  inHandLabel: "In hand",
  // What the tally reads before the loop has written to it: a bird on the line holds nothing.
  inHandOnTheLine: "0",
  bankedLabel: "Banked",
  wingsTally: (banked: number, par: number): string => `${banked} / ${par}`,
  finishedTitle: "Zone clear",
  finishPoints: (points: number): string => `+${points}`,
  skipRunButtonLabel: "Skip run",
  resetTurnButtonLabel: "Reset turn",
  parLine: (par: number): string => `Full points at ${par} wings`
} as const;
