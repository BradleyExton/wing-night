export const hostSchlonicSurfaceCopy = {
  railTitle: "Schlonic",
  teamPrefix: "On the shore:",
  noAssignedTeamLabel: "No team assigned",
  introDescription:
    "One at a time, your chickens run Kempenfelt Bay Zone — down the waterfront, and the waterfront is furnished. The bird runs on its own; the tablet only jumps. Tap to hop, hold to go higher, and grab every ring you can: the rings are the score AND they are the only thing keeping you alive. A pink one with a face is an enemy — land on it and it pops. A crimson bed of them just hurts, and so does a hole. Take a hit and you drop half your rings; take one holding none and your run is over. Get to the post and everything in your hands goes on the board.",
  runCounter: (runNumber: number, runsTotal: number): string => `Run ${runNumber} of ${runsTotal}`,
  runningLabel: (playerName: string | null): string =>
    playerName === null ? "Running: the house hen" : `Running: ${playerName}`,
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Kempenfelt Bay Zone" : `Kempenfelt Bay Zone — ${playerName}'s run`,
  jumpPadLabel: "Jump",
  jumpPadHint: "Hold for height",
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "Tap to go. Hold the tap to jump higher, and you curl into a ball in the air."
      : `${playerName}: tap to go. Hold the tap to jump higher — in the air you're a ball, and a ball squashes things.`,
  readyLockedHint: "Waiting for the host to open the round.",
  runningHint: "Keep hold of your rings — they are the only thing between you and the end of the run.",
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player",
  handoffHint: (endedName: string | null, nextName: string | null): string => {
    const who = endedName === null ? "That's the run" : `${endedName} is done`;

    return nextName === null ? `${who} — pass the tablet on.` : `${who} — pass the tablet to ${nextName}.`;
  },
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  ringsLabel: "Rings",
  ringsTally: (banked: number, par: number): string => `${banked} / ${par}`,
  bankedTitle: "Banked",
  runOutcome: (outcome: "cleared" | "wiped" | "fell" | null, rings: number): string => {
    if (outcome === "cleared") {
      return `Post! +${rings}`;
    }

    if (outcome === "fell") {
      return "Down a hole";
    }

    if (outcome === "wiped") {
      return "Wiped out";
    }

    return "Skipped";
  },
  finishedTitle: "Zone clear",
  finishPoints: (points: number): string => `+${points}`,
  historyTitle: "Runs",
  historyPending: "—",
  skipRunButtonLabel: "Skip run",
  resetTurnButtonLabel: "Reset turn",
  totalsTitle: "Round so far",
  totalsPoints: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`,
  parLine: (par: number): string => `Full points at ${par} rings`
} as const;
