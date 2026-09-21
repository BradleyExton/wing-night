export const displaySchlonicSurfaceCopy = {
  title: "Schlonic",
  zoneName: "Kempenfelt Bay Zone",
  introTitle: "Schlonic",
  introDescription:
    "One chicken, one shoreline, and a lot of rings — past everything the waterfront has standing on it. The rings are the score, and they are also the only health there is: get hit and you drop half of them, get hit holding none and the run is over. The post is the only place a handful counts.",
  waitingLabel: "Waiting for the zone…",
  runCounter: (runNumber: number, runsTotal: number): string => `Run ${runNumber} / ${runsTotal}`,
  ringsCounter: (banked: number, par: number): string => `${banked} / ${par}`,
  ringsLabel: "Rings",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Kempenfelt Bay Zone" : `Kempenfelt Bay Zone — ${playerName}'s run`,
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "On the line — tap to go" : `${playerName} is on the line — tap to go`,
  runningPrompt: (playerName: string | null): string =>
    playerName === null ? "Running!" : `${playerName} is running!`,
  handoffPrompt: (endedName: string | null, nextName: string | null): string => {
    const who = endedName === null ? "That's the run" : `${endedName} is done`;

    return nextName === null ? `${who}` : `${who} — ${nextName}, grab the tablet`;
  },
  finishedPrompt: "That's the team's zone.",
  outcomeTitle: (outcome: "cleared" | "wiped" | "fell"): string => {
    if (outcome === "cleared") {
      return "Post!";
    }

    return outcome === "fell" ? "Down a hole!" : "Wiped out!";
  },
  outcomeBlurb: (outcome: "cleared" | "wiped" | "fell", rings: number): string => {
    if (outcome === "cleared") {
      return `${rings} ring${rings === 1 ? "" : "s"} banked`;
    }

    return outcome === "fell" ? "Everything went down with it" : "Nothing left to lose";
  },
  handoffCalloutName: (nextName: string | null): string => nextName ?? "Next up",
  handoffCalloutLine: "You're up — grab the tablet",
  finishedTitle: "Zone clear",
  finishedBlurb: (banked: number, par: number): string => `${banked} of ${par} rings`,
  points: (points: number): string => `+${points}`
} as const;
