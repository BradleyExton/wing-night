import { MINIGAME_DEFINITIONS, CONTESTANT_CONTROLLERS, type ContestantController } from "@wingnight/shared";

export const displaySchlonicSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.SCHLONIC.displayName,
  // The venue, not the show: it hangs on a plaque inside the zone, never on the marquee.
  zoneName: "Dunlop Street Zone",
  introDescription:
    "One street, one skateboard, one leg each, and a lot of wings nobody is asking about. The wings are the score, and they are also the only health there is: get hit and you drop half of them, get hit holding none and your leg is over. Your post is the only place a handful counts — and it is the next rider's start line.",
  waitingLabel: "Waiting for the zone…",
  runCounter: (runNumber: number, runsTotal: number): string => `Leg ${runNumber} / ${runsTotal}`,
  // The banked figure stands in its own span, so the post's count-up can write it; this is
  // what follows it.
  wingsParSuffix: (par: number): string => ` / ${par}`,
  inHandLabel: "In hand",
  // What the tally reads before the loop has written to it: a bird on the line holds nothing.
  inHandOnTheLine: "0",
  bankedLabel: "Banked",
  // The turn to beat, whose legs are the ghosts in the zone: what it banked and whose it was.
  bestWings: (wings: number): string => `${wings}`,
  bestLabel: (teamName: string | null): string =>
    teamName === null ? "To beat" : `To beat · ${teamName}`,
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Dunlop Street Zone" : `Dunlop Street Zone — ${playerName}'s leg`,
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "On the line — tap to go" : `${playerName} is on the line — tap to go`,
  runningPrompt: (playerName: string | null): string =>
    playerName === null ? "Running!" : `${playerName} is running!`,
  // The plaque over the zone names who is next; this line only says who just finished.
  handoffPrompt: (endedName: string | null): string =>
    endedName === null ? "That's the run" : `${endedName} is done`,
  finishedPrompt: "That's the team's street.",
  outcomeTitle: (outcome: "cleared" | "wiped" | "fell"): string => {
    if (outcome === "cleared") {
      return "Post!";
    }

    return outcome === "fell" ? "Into the roadworks!" : "Wiped out!";
  },
  outcomeBlurb: (outcome: "cleared" | "wiped" | "fell", wings: number): string => {
    if (outcome === "cleared") {
      return `${wings} wing${wings === 1 ? "" : "s"} banked`;
    }

    return outcome === "fell" ? "Everything went down with it" : "Nothing left to lose";
  },
  handoffCalloutName: (nextName: string | null): string => nextName ?? "Next up",
  // On a phones turn nobody grabs anything: the next rider's phone has just come alive.
  handoffCalloutLine: (handset: ContestantController): string =>
    handset === CONTESTANT_CONTROLLERS.PHONE ? "You're up — your phone is live" : "You're up — grab the tablet",
  finishedTitle: "Zone clear",
  finishedBlurb: (banked: number, par: number): string => `${banked} of ${par} wings`,
  points: (points: number): string => `+${points}`
} as const;
