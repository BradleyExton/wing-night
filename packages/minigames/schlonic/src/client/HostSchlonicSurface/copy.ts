export const hostSchlonicSurfaceCopy = {
  introDescription:
    "Your chickens skate Dunlop Street Zone as a relay — out of Souldiers, down the sidewalk to the Queen's patio, one leg each, and the sidewalk is furnished. The bird rolls on its own; the tablet only jumps. Tap to ollie, hold to go higher, and grab every wing you can: the wings are the score AND they are the only thing keeping you alive. One rule for what is in your way: if it is flat on top — a handrail, a bench, a planter, a parked car — land on it and grind it. If it is not — a tent, somebody asleep on the pavers, a punk, a roadie with a bass cab, a guy weaving out of the Queen's, a goose — jump it. Roll into a kicker and it launches you. Take a hit and you drop half your wings; take one holding none and your leg is over. Get to your post and everything in your hands goes on the board, and the tablet goes to the next rider. The ghost on your stretch is the other team's rider who ran it.",
  waitingZoneLabel: "No zone is loaded. Check the round's SCHLONIC rules.",
  runCounter: (runNumber: number, runsTotal: number): string => `Leg ${runNumber} of ${runsTotal}`,
  // The one hint the tablet holder gets, on the line: how to start and how to jump, in one
  // sentence. The separate JUMP / HOLD FOR HEIGHT legend that used to sit beside it said the
  // same thing a second time in the same corner.
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "Tap to go. Hold the tap to jump higher — land on anything flat, jump anything that isn't."
      : `${playerName}: tap to go. Hold the tap to jump higher — land on anything flat, jump anything that isn't.`,
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  inHandLabel: "In hand",
  // What the tally reads before the loop has written to it: a bird on the line holds nothing.
  inHandOnTheLine: "0",
  bankedLabel: "Banked",
  // The turn to beat, whose legs are the ghosts in the zone: what it banked and whose it was.
  bestWings: (wings: number): string => `${wings}`,
  bestLabel: (teamName: string | null): string =>
    teamName === null ? "To beat" : `To beat · ${teamName}`,
  wingsTally: (banked: number, par: number): string => `${banked} / ${par}`,
  finishedTitle: "Zone clear",
  finishPoints: (points: number): string => `+${points}`,
  skipRunButtonLabel: "Skip run",
  resetTurnButtonLabel: "Reset turn",
  parLine: (par: number): string => `Full points at ${par} wings`
} as const;
