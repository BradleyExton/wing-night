export const hostSchlonicSurfaceCopy = {
  introDescription:
    "One at a time, your chickens run Kempenfelt Bay Zone — down the waterfront, and the waterfront is furnished. The bird runs on its own; the tablet only jumps. Tap to hop, hold to go higher, and grab every wing you can: the wings are the score AND they are the only thing keeping you alive. A pink one with a face is an enemy — land on it and it pops. A crimson bed of them just hurts, and so does a hole. Take a hit and you drop half your wings; take one holding none and your run is over. Get to the post and everything in your hands goes on the board.",
  waitingZoneLabel: "No zone is loaded. Check the round's SCHLONIC rules.",
  runCounter: (runNumber: number, runsTotal: number): string => `Run ${runNumber} of ${runsTotal}`,
  runningLabel: (playerName: string | null): string =>
    playerName === null ? "Running: the house hen" : `Running: ${playerName}`,
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "Tap to go. Hold the tap to jump higher, and you curl into a ball in the air."
      : `${playerName}: tap to go. Hold the tap to jump higher — in the air you're a ball, and a ball squashes things.`,
  readyLockedHint: "Waiting for the host to open the round.",
  runningHint: "Keep hold of your wings — they are the only thing between you and the end of the run.",
  handoffHint: (endedName: string | null, nextName: string | null): string => {
    const who = endedName === null ? "That's the run" : `${endedName} is done`;

    return nextName === null ? `${who} — pass the tablet on.` : `${who} — pass the tablet to ${nextName}.`;
  },
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  wingsLabel: "Wings",
  wingsTally: (banked: number, par: number): string => `${banked} / ${par}`,
  // The jump legend moved out of the zone and into the takeover's actions slot,
  // so its two words live with the surface that renders them now.
  jumpPadLabel: "Jump",
  jumpPadHint: "Hold for height",
  finishedTitle: "Zone clear",
  finishPoints: (points: number): string => `+${points}`,
  skipRunButtonLabel: "Skip run",
  resetTurnButtonLabel: "Reset turn",
  parLine: (par: number): string => `Full points at ${par} wings`
} as const;
